import { eq, sum, type InferSelectModel } from "drizzle-orm";
import { db } from "../db/index.js";
import { eventOutbox, goodsReceiptItems, goodsReceipts } from "../db/schema.js";

type GoodsReceipt = InferSelectModel<typeof goodsReceipts>;
type GoodsReceiptItem = InferSelectModel<typeof goodsReceiptItems>;

export async function createGoodsReceipt(data: {
  purchaseOrderId: string;
  grnNumber: string;
  status: string;
}) {
  const [receipt] = await db.insert(goodsReceipts).values(data).returning();

  return receipt;
}

export async function createGoodsReceiptItem(data: {
  goodsReceiptId: string;
  productId: string;
  expectedQuantity: number;
  receivedQuantity: number;
  condition: string;
  discrepancyType: string;
}) {
  const [item] = await db.insert(goodsReceiptItems).values(data).returning();

  return item;
}

export async function getReceivedQuantitiesByPurchaseOrder(purchaseOrderId: string) {
  const rows = await db.select({ productId: goodsReceiptItems.productId, quantity: sum(goodsReceiptItems.receivedQuantity).mapWith(Number) })
    .from(goodsReceiptItems)
    .innerJoin(goodsReceipts, eq(goodsReceiptItems.goodsReceiptId, goodsReceipts.id))
    .where(eq(goodsReceipts.purchaseOrderId, purchaseOrderId))
    .groupBy(goodsReceiptItems.productId);
  return new Map(rows.map((row) => [row.productId, row.quantity]));
}

export async function getGoodsReceiptById(
  id: string,
): Promise<GoodsReceipt | null> {
  const [receipt] = await db
    .select()
    .from(goodsReceipts)
    .where(eq(goodsReceipts.id, id));

  return receipt ?? null;
}

export async function getGoodsReceiptItems(
  goodsReceiptId: string,
): Promise<GoodsReceiptItem[]> {
  return db
    .select()
    .from(goodsReceiptItems)
    .where(eq(goodsReceiptItems.goodsReceiptId, goodsReceiptId));
}
export async function createGoodsReceiptWithItems(data: {
  purchaseOrderId: string;
  grnNumber: string;
  status: string;
  items: Array<{
    productId: string;
    expectedQuantity: number;
    receivedQuantity: number;
    condition: string;
    discrepancyType: string;
    locationId: string;
  }>;
  event?: { eventId: string; eventType: string; payload: Record<string, unknown> };
}) {
  return db.transaction(async (tx) => {
    const [receipt] = await tx
      .insert(goodsReceipts)
      .values({
        purchaseOrderId: data.purchaseOrderId,
        grnNumber: data.grnNumber,
        status: data.status,
      })
      .returning();

    const items = [];

    for (const item of data.items) {
      const [createdItem] = await tx
        .insert(goodsReceiptItems)
        .values({
          goodsReceiptId: receipt.id,
          productId: item.productId,
          expectedQuantity: item.expectedQuantity,
          receivedQuantity: item.receivedQuantity,
          condition: item.condition,
          discrepancyType: item.discrepancyType,
        })
        .returning();

      items.push(createdItem);
    }

    if (data.event) {
      const payload = { ...data.event.payload, goodsReceiptId: receipt.id, grnNumber: receipt.grnNumber };
      await tx.insert(eventOutbox).values({ eventId: data.event.eventId, eventType: data.event.eventType, payload });
    }
    return { receipt, items };
  });
}