import express from "express";
import pg from "pg";
import { randomUUID } from "node:crypto";
import dotenv from "dotenv";
import { startOutboxWorker } from "@mms/event-outbox";
import { isFeatureEnabled } from "@mms/feature-flags";
import { validateSaleAmounts } from "./domain/saleValidation.js";

dotenv.config({ path: new URL("../../../.env", import.meta.url) });

const app = express();
app.use(express.json());

const pool = new pg.Pool({ connectionString: process.env.RETAIL_DATABASE_URL });
const inventoryUrl =
  process.env.INVENTORY_SERVICE_URL || "http://localhost:3003";

app.get("/health", (_req, res) =>
  res.json({ service: "retail-sales", status: "ok" }),
);

if (isFeatureEnabled("retail-sales")) {
  // ── GET /sales — list recent sales ────────────────────
  app.get("/sales", async (req, res) => {
    try {
      const dateParam = req.query.date ? String(req.query.date) : null;
      const result = await pool.query(
        `SELECT s.*
         FROM sales s
         WHERE ($1::date IS NULL OR s.created_at::date = $1)
         ORDER BY s.created_at DESC
         LIMIT 50`,
        [dateParam],
      );
      res.json(result.rows);
    } catch (e) {
      console.error("GET /sales failed", e);
      res.status(500).json({ error: "Failed to list sales" });
    }
  });

  // ── GET /sales/:id — single sale ──────────────────────
  app.get("/sales/:id", async (req, res) => {
    try {
      const saleRes = await pool.query("SELECT * FROM sales WHERE id = $1", [
        req.params.id,
      ]);
      if (saleRes.rowCount === 0)
        return res.status(404).json({ error: "Sale not found" });
      const [itemsRes, paymentsRes] = await Promise.all([
        pool.query("SELECT * FROM sale_items WHERE sale_id = $1", [
          req.params.id,
        ]),
        pool.query("SELECT * FROM sale_payments WHERE sale_id = $1", [
          req.params.id,
        ]),
      ]);
      res.json({
        ...saleRes.rows[0],
        items: itemsRes.rows,
        payments: paymentsRes.rows,
      });
    } catch (e) {
      console.error("GET /sales/:id failed", e);
      res.status(500).json({ error: "Failed to retrieve sale" });
    }
  });

  // ── GET /prices?ids=... — bulk retail prices ─────────
  app.get("/prices", async (req, res) => {
    try {
      const ids = String(req.query.ids ?? "")
        .split(",")
        .filter(Boolean);
      if (ids.length === 0) return res.json([]);
      const result = await pool.query(
        `SELECT product_id AS "productId", retail_price AS "retailPrice", tax_rate AS "taxRate"
         FROM product_prices
         WHERE product_id = ANY($1::uuid[])`,
        [ids],
      );
      res.json(result.rows);
    } catch {
      res.status(500).json({ error: "Failed to fetch prices" });
    }
  });

  // ── POST /sales — complete a sale ────────────────────
  app.post("/sales", async (req, res) => {
    const {
      storeName,
      registerName,
      cashierName,
      payments,
      items,
      currency = "KES",
      businessDate,
    } = req.body;

    if (
      !storeName ||
      !registerName ||
      !cashierName ||
      !Array.isArray(items) ||
      !items.length ||
      !Array.isArray(payments) ||
      !payments.length
    ) {
      return res
        .status(400)
        .json({
          error: "Store, register, cashier, items and payments are required",
        });
    }

    let total: number;
    try {
      total = validateSaleAmounts(items, payments);
    } catch (e) {
      return res
        .status(400)
        .json({ error: e instanceof Error ? e.message : "Invalid sale" });
    }

    const reserved: Array<{
      inventoryItemId: string;
      quantity: number;
      productId: string;
      unitCost: number;
    }> = [];
    const releaseReservations = async () => {
      for (const r of reserved) {
        await fetch(
          `${inventoryUrl}/inventory/reservations/${r.inventoryItemId}/release`,
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ quantity: r.quantity }),
          },
        ).catch(() => undefined);
      }
    };

    try {
      for (const item of items) {
        const itemRes = await fetch(
          `${inventoryUrl}/inventory/product/${item.productId}`,
        );
        if (itemRes.status === 404) {
          await releaseReservations();
          return res
            .status(409)
            .json({ error: `Unknown product ${item.productId}` });
        }
        if (!itemRes.ok) {
          await releaseReservations();
          return res.status(503).json({ error: "Inventory is unavailable" });
        }
        const invItem = await itemRes.json();

        const locRes = await fetch(
          `${inventoryUrl}/inventory/stock/${invItem.id}`,
        );
        if (!locRes.ok) {
          await releaseReservations();
          return res
            .status(503)
            .json({ error: "Inventory location availability is unavailable" });
        }
        const locStocks = (await locRes.json()) as Array<{
          locationId: string;
          quantity: number;
        }>;
        if (
          Number(
            locStocks.find((s) => s.locationId === item.locationId)?.quantity ??
              0,
          ) < item.quantity
        ) {
          await releaseReservations();
          return res.status(409).json({
            error: `Insufficient stock at the selected location for product ${invItem.productName ?? item.productId}`,
          });
        }

        const reserveRes = await fetch(
          `${inventoryUrl}/inventory/reservations`,
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              inventoryItemId: invItem.id,
              quantity: item.quantity,
            }),
          },
        );
        if (!reserveRes.ok) {
          await releaseReservations();
          return res
            .status(409)
            .json({ error: `Insufficient stock for ${item.productId}` });
        }

        reserved.push({
          productId: item.productId,
          inventoryItemId: invItem.id,
          quantity: item.quantity,
          unitCost: invItem.unitCost,
        });
      }
    } catch (e) {
      await releaseReservations();
      return res
        .status(503)
        .json({ error: "Inventory availability is unavailable" });
    }

    const client = await pool.connect();
    const saleId = randomUUID();
    const saleEvent = {
      eventId: saleId,
      eventType: "ItemSold",
      saleId,
      storeName,
      registerName,
      cashierName,
      currency,
      businessDate: businessDate || new Date().toISOString().slice(0, 10),
      total,
      payments,
      items: items.map(
        (i: {
          productId: string;
          quantity: number;
          unitPrice: number;
          locationId: string;
        }) => ({
          ...i,
          unitCost:
            reserved.find((r) => r.productId === i.productId)?.unitCost || 0,
        }),
      ),
    };

    try {
      await client.query("begin");
      await client.query(
        `INSERT INTO sales (id, store_id, register_id, cashier_id, total, currency, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          saleId,
          storeName,
          registerName,
          cashierName,
          total,
          currency,
          "COMPLETED",
        ],
      );
      for (const item of items) {
        await client.query(
          `INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, unit_cost, location_id)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            saleId,
            item.productId,
            item.quantity,
            item.unitPrice,
            reserved.find((r) => r.productId === item.productId)?.unitCost || 0,
            item.locationId,
          ],
        );
      }
      for (const p of payments) {
        await client.query(
          `INSERT INTO sale_payments (sale_id, method, amount) VALUES ($1, $2, $3)`,
          [saleId, p.method, p.amount],
        );
      }
      await client.query(
        `INSERT INTO event_outbox (event_id, event_type, payload) VALUES ($1, $2, $3)`,
        [saleId, "ItemSold", saleEvent],
      );
      await client.query("commit");
    } catch (e) {
      await client.query("rollback");
      await releaseReservations();
      console.error("Sale transaction failed", e);
      return res.status(500).json({ error: "Sale failed during persistence" });
    } finally {
      client.release();
    }

    res
      .status(201)
      .json({ id: saleId, status: "COMPLETED", total, eventStatus: "QUEUED" });
  });
}

if (isFeatureEnabled("retail-sales")) {
  startOutboxWorker(
    pool,
    process.env.RABBITMQ_URL || "amqp://localhost:5672",
    "retail-sales-service",
  );
}

const port = Number(process.env.RETAIL_SERVICE_PORT || 3006);
app.listen(port, () =>
  console.log(`Retail sales service running on port ${port}`),
);
