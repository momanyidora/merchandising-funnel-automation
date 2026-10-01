import { and, eq, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { inventoryLocationStock } from "../db/schema.js";

export async function getLocationStock(
  inventoryItemId: string,
  locationId: string,
) {
  const [stock] = await db
    .select()
    .from(inventoryLocationStock)
    .where(
      and(
        eq(inventoryLocationStock.inventoryItemId, inventoryItemId),
        eq(inventoryLocationStock.locationId, locationId),
      ),
    )
    .limit(1);

  return stock ?? null;
}

export async function createLocationStock(data: {
  inventoryItemId: string;
  locationId: string;
  quantity?: number;
}) {
  const [stock] = await db
    .insert(inventoryLocationStock)
    .values({
      inventoryItemId: data.inventoryItemId,
      locationId: data.locationId,
      quantity: data.quantity ?? 0,
    })
    .returning();

  return stock;
}

export async function adjustLocationStock(data: {
  inventoryItemId: string;
  locationId: string;
  quantity: number;
}) {
  const [stock] = await db
    .insert(inventoryLocationStock)
    .values({
      inventoryItemId: data.inventoryItemId,
      locationId: data.locationId,
      quantity: data.quantity,
    })
    .onConflictDoUpdate({
      target: [
        inventoryLocationStock.inventoryItemId,
        inventoryLocationStock.locationId,
      ],
      set: {
        quantity: sql`${inventoryLocationStock.quantity} + ${data.quantity}`,
        updatedAt: new Date(),
      },
    })
    .returning();

  return stock;
}
