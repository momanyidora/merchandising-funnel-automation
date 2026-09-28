import express, { type Request, type Response } from "express";
import pg from "pg";
import amqp from "amqplib";
import dotenv from "dotenv";
import { isFeatureEnabled } from "@mms/feature-flags";
import { movementPlan } from "./domain/movementPlan.js";
dotenv.config({ path: new URL("../../../.env", import.meta.url) });

const app = express();
app.use(express.json());
const pool = new pg.Pool({ connectionString: process.env.WAREHOUSE_DATABASE_URL });
const inventoryUrl = process.env.INVENTORY_SERVICE_URL ?? "http://localhost:3003";
app.get("/health", (_req, res) => res.json({ service: "warehouse-operations", status: "ok" }));

if (isFeatureEnabled("warehouse-operations")) {
  app.get("/warehouse/locations", async (_req, res) => {
    try { const result = await pool.query("select * from storage_locations order by code"); res.json(result.rows); }
    catch { res.status(500).json({ error: "Failed to list warehouse locations" }); }
  });

  app.post("/warehouse/locations", async (req: Request, res: Response) => {
    const { code, name, capacity, inventoryLocationId, defaultPutaway = false } = req.body;
    if (!code?.trim() || !name?.trim() || !Number.isSafeInteger(capacity) || capacity < 1 || !inventoryLocationId)
      return res.status(400).json({ error: "Location name, code, positive integer capacity, and linked Inventory location are required" });
    try {
      const check = await fetch(`${inventoryUrl}/inventory/locations/${inventoryLocationId}`);
      if (!check.ok) return res.status(check.status === 404 ? 400 : 503).json({ error: check.status === 404 ? "Select a valid Inventory location" : "Inventory service unavailable" });
      const client = await pool.connect();
      try {
        await client.query("begin");
        if (defaultPutaway) await client.query("update storage_locations set default_putaway=false");
        const created = await client.query("insert into storage_locations(code,name,capacity,inventory_location_id,default_putaway) values($1,$2,$3,$4,$5) returning *", [code.trim(), name.trim(), capacity, inventoryLocationId, defaultPutaway]);
        await client.query("commit"); res.status(201).json(created.rows[0]);
      } catch (error) { await client.query("rollback"); if ((error as { code?: string }).code === "23505") return res.status(409).json({ error: "Location code or linked Inventory location already exists" }); throw error; }
      finally { client.release(); }
    } catch { res.status(500).json({ error: "Failed to create warehouse location" }); }
  });

  app.get("/warehouse/tasks", async (_req, res) => {
    try { const result = await pool.query(`select t.*,src.name as source_location_name,dst.name as destination_location_name from warehouse_tasks t left join storage_locations src on src.id=t.source_location_id join storage_locations dst on dst.id=t.destination_location_id order by t.created_at desc`); res.json(result.rows); }
    catch { res.status(500).json({ error: "Failed to list warehouse tasks" }); }
  });

  app.post("/warehouse/tasks", async (req, res) => {
    const { taskType, productId, quantity, sourceLocationId, destinationLocationId, referenceId } = req.body;
    if (!["PUTAWAY", "PICK", "TRANSFER"].includes(taskType) || !productId || !Number.isSafeInteger(quantity) || quantity < 1 || !sourceLocationId || !destinationLocationId || sourceLocationId === destinationLocationId)
      return res.status(400).json({ error: "Task type, product, positive integer quantity, and different source and destination locations are required" });
    try {
      const inventoryItemResponse = await fetch(`${inventoryUrl}/inventory/product/${productId}`);
      if (!inventoryItemResponse.ok) return res.status(inventoryItemResponse.status === 404 ? 400 : 503).json({error: "Product is missing from Inventory or Inventory is unavailable"});
      const inventoryItem = await inventoryItemResponse.json() as {id:string};
      const sourceLocation = await pool.query("select inventory_location_id from storage_locations where id=$1",[sourceLocationId]);
      if (!sourceLocation.rowCount) return res.status(400).json({error: "Source location not found"});
      const stockResponse = await fetch(`${inventoryUrl}/inventory/locations/${sourceLocation.rows[0].inventory_location_id}/stock`);
      if (!stockResponse.ok) return res.status(503).json({error: "Unable to check source stock in Inventory"});
      const stockRows = await stockResponse.json() as Array<{inventoryItemId:string;quantity:number}>;
      if (Number(stockRows.find(x=>x.inventoryItemId===inventoryItem.id)?.quantity??0) < quantity) return res.status(409).json({error: "Insufficient source stock in Inventory"});
      const result = await pool.query("insert into warehouse_tasks(task_type,product_id,quantity,source_location_id,destination_location_id,reference_id,status) values($1,$2,$3,$4,$5,$6,'OPEN') returning *", [taskType, productId, quantity, sourceLocationId, destinationLocationId, referenceId ?? null]);
      res.status(201).json(result.rows[0]);
    } catch (error) { res.status((error as { code?: string }).code === "23503" ? 400 : 500).json({ error: "Unable to create task; verify both locations exist" }); }
  });

  app.patch("/warehouse/tasks/:id/complete", async (req, res) => {
    const client = await pool.connect();
    try {
      await client.query("begin");
      const found = await client.query("select t.*,src.inventory_location_id as source_inventory_location_id,dst.inventory_location_id as destination_inventory_location_id,dst.capacity as destination_capacity from warehouse_tasks t join storage_locations src on src.id=t.source_location_id join storage_locations dst on dst.id=t.destination_location_id where t.id=$1 for update of t", [req.params.id]);
      if (!found.rowCount) { await client.query("rollback"); return res.status(404).json({ error: "Task not found" }); }
      const task = found.rows[0];
      if (task.status !== "OPEN") { await client.query("rollback"); return res.status(409).json({ error: "Task is not open" }); }
      const destinationStockResponse = await fetch(`${inventoryUrl}/inventory/locations/${task.destination_inventory_location_id}/stock`);
      if (!destinationStockResponse.ok) throw new Error("Inventory service unavailable");
      const destinationStock = await destinationStockResponse.json() as Array<{quantity:number}>;
      const occupied = destinationStock.reduce((n,row)=>n+row.quantity,0);
      if (occupied + task.quantity > task.destination_capacity) { await client.query("rollback"); return res.status(409).json({ error: "Destination location capacity would be exceeded" }); }

      const productResponse = await fetch(`${inventoryUrl}/inventory/product/${task.product_id}`);
      if (!productResponse.ok) throw new Error(productResponse.status === 404 ? "Product is not registered in Inventory" : "Inventory service unavailable");
      const product = await productResponse.json() as { id: string; productName: string };
      const movements = movementPlan(task.id, product.id, task.quantity, task.source_inventory_location_id, task.destination_inventory_location_id);
      const response = await fetch(`${inventoryUrl}/inventory/movements/transfer`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ inventoryItemId: product.id, sourceLocationId: movements[0].locationId, destinationLocationId: movements[1].locationId, quantity: task.quantity, reason: `Warehouse task ${task.id}`, idempotencyKey: task.id }) });
      if (!response.ok) { const body = await response.json().catch(() => ({})) as { error?: string }; throw new Error(body.error || "Inventory transfer failed"); }

      await client.query("update location_inventory set quantity=quantity-$3 where product_id=$1 and location_id=$2", [task.product_id, task.source_location_id, task.quantity]);
      await client.query("insert into location_inventory(product_id,location_id,quantity) values($1,$2,$3) on conflict(product_id,location_id) do update set quantity=location_inventory.quantity+excluded.quantity", [task.product_id, task.destination_location_id, task.quantity]);
      if (task.task_type === "TRANSFER") await client.query("insert into warehouse_transfers(task_id,product_id,quantity,source_location_id,destination_location_id) values($1,$2,$3,$4,$5) on conflict(task_id) do nothing", [task.id, task.product_id, task.quantity, task.source_location_id, task.destination_location_id]);
      const completed = await client.query("update warehouse_tasks set status='COMPLETED',completed_at=now() where id=$1 returning *", [task.id]);
      await client.query("commit"); res.json({ ...completed.rows[0], productName: product.productName });
    } catch (error) {
      await client.query("rollback").catch(() => undefined);
      const message = error instanceof Error ? error.message : "Unable to complete task";
      res.status(/unavailable/i.test(message) ? 503 : /Insufficient|capacity/i.test(message) ? 409 : 500).json({ error: message });
    } finally { client.release(); }
  });

  app.get("/warehouse/utilization", async (_req, res) => {
    try { const result = await pool.query(`select l.id,l.code,l.name,l.capacity,coalesce(sum(i.quantity),0)::int as occupied,round(100.0*coalesce(sum(i.quantity),0)/l.capacity,1) as utilization_percent from storage_locations l left join location_inventory i on i.location_id=l.id group by l.id order by l.code`); res.json(result.rows); }
    catch { res.status(500).json({ error: "Failed to read warehouse utilization" }); }
  });
}

app.listen(Number(process.env.WAREHOUSE_SERVICE_PORT || 3005));
if (isFeatureEnabled("warehouse-operations")) void consumeGoodsReceived();

async function consumeGoodsReceived(): Promise<void> {
  try {
    const connection = await amqp.connect(process.env.RABBITMQ_URL || "amqp://localhost:5672");
    const channel = await connection.createChannel();
    await channel.assertExchange("mms.events", "topic", { durable: true });
    const queue = await channel.assertQueue("warehouse-operations.goods-received", { durable: true });
    await channel.bindQueue(queue.queue, "mms.events", "GoodsReceived");
    channel.prefetch(10);
    await channel.consume(queue.queue, async (message) => {
      if (!message) return;
      const event = JSON.parse(message.content.toString()) as { eventId: string; goodsReceiptId?: string; items?: Array<{productId:string;quantity:number;locationId:string;condition?:string}> };
      const client = await pool.connect();
      try {
        await client.query("begin");
        const already = await client.query("select 1 from processed_events where event_id=$1", [event.eventId]);
        if (already.rowCount) { await client.query("commit"); channel.ack(message); return; }
        for (const item of event.items ?? []) {
          if (item.quantity <= 0 || item.condition === "DAMAGED") continue;
          const locations = await client.query("select id,default_putaway,inventory_location_id from storage_locations where inventory_location_id=$1 or default_putaway=true order by default_putaway desc", [item.locationId]);
          const source = locations.rows.find((row:any) => row.inventory_location_id === item.locationId);
          const destination = locations.rows.find((row:any) => row.default_putaway && row.inventory_location_id !== item.locationId);
          if (!source || !destination) throw new Error("Create a dock location and a default putaway location before receiving GoodsReceived events");
          await client.query("insert into location_inventory(product_id,location_id,quantity) values($1,$2,$3) on conflict(product_id,location_id) do update set quantity=location_inventory.quantity+excluded.quantity", [item.productId, source.id, item.quantity]);
          await client.query("insert into warehouse_tasks(task_type,product_id,quantity,source_location_id,destination_location_id,reference_id,status) values('PUTAWAY',$1,$2,$3,$4,$5,'OPEN') on conflict(task_type,reference_id,product_id) where reference_id is not null do nothing", [item.productId,item.quantity,source.id,destination.id,event.goodsReceiptId ?? event.eventId]);
        }
        await client.query("insert into processed_events(event_id) values($1) on conflict do nothing", [event.eventId]);
        await client.query("commit"); channel.ack(message);
      } catch (error) { await client.query("rollback").catch(()=>undefined); console.error("GoodsReceived putaway event failed",error); channel.nack(message,false,true); }
      finally { client.release(); }
    });
  } catch (error) { console.error("Warehouse event consumer unavailable",error); setTimeout(()=>void consumeGoodsReceived(),3000); }
}
