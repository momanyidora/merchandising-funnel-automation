import { and, eq, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import {
  inventoryItems,
  inventoryLocations,
  inventoryLocationStock,
  inventoryMovements,
} from "../db/schema.js";
import {
  InventoryLocationNotFoundError,
  InsufficientLocationInventoryError,
  InsufficientInventoryError,
  InvalidMovementQuantityError,
} from "../errors/inventoryErrors.js";

export async function applyInventoryMovement(data: {
  inventoryItemId: string;
  locationId: string;
  type: string;
  quantity: number;
  reason?: string;
  idempotencyKey?: string;
}) {
  return db.transaction(async (tx) => {
    const [item] = await tx
      .select()
      .from(inventoryItems)
      .where(eq(inventoryItems.id, data.inventoryItemId))
      .for("update");

    if (!item) {
      return null;
    }

    if (data.idempotencyKey) {
      const [prior] = await tx.select().from(inventoryMovements).where(eq(inventoryMovements.idempotencyKey, data.idempotencyKey)).limit(1);
      if (prior) {
        const [priorStock] = await tx.select().from(inventoryLocationStock).where(and(eq(inventoryLocationStock.inventoryItemId, data.inventoryItemId), eq(inventoryLocationStock.locationId, data.locationId)));
        return { inventory: item, locationStock: priorStock ?? null, movement: prior };
      }
    }

    const [location] = await tx
      .select()
      .from(inventoryLocations)
      .where(eq(inventoryLocations.id, data.locationId));
    if (!location) {
      throw new InventoryLocationNotFoundError();
    }

    const [locationStock] = await tx
      .select()
      .from(inventoryLocationStock)
      .where(
        and(
          eq(inventoryLocationStock.inventoryItemId, data.inventoryItemId),
          eq(inventoryLocationStock.locationId, data.locationId),
        ),
      );

    const currentLocationQuantity = locationStock?.quantity ?? 0;
    const newLocationQuantity = currentLocationQuantity + data.quantity;
    if (newLocationQuantity < 0) {
      throw new InsufficientLocationInventoryError();
    }

    const newOnHand = item.onHand + data.quantity;

    if (newOnHand < 0) {
      throw new InsufficientInventoryError();
    }

    const [updatedItem] = await tx
      .update(inventoryItems)
      .set({
        onHand: newOnHand,
        updatedAt: new Date(),
      })
      .where(eq(inventoryItems.id, data.inventoryItemId))
      .returning();

    const [updatedLocationStock] = await tx
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

    const [movement] = await tx
      .insert(inventoryMovements)
      .values({
        inventoryItemId: data.inventoryItemId,
        locationId: data.locationId,
        type: data.type,
        quantity: data.quantity,
        reason: data.reason,
        idempotencyKey: data.idempotencyKey,
      })
      .returning();

    return {
      inventory: updatedItem,
      locationStock: updatedLocationStock,
      movement,
    };
  });
}
export async function getInventoryMovements(inventoryItemId: string) {
  return db
    .select({
      id: inventoryMovements.id,
      inventoryItemId: inventoryMovements.inventoryItemId,
      locationId: inventoryMovements.locationId,
      locationName: inventoryLocations.name,
      locationCode: inventoryLocations.code,
      type: inventoryMovements.type,
      quantity: inventoryMovements.quantity,
      reason: inventoryMovements.reason,
      createdAt: inventoryMovements.createdAt,
    })
    .from(inventoryMovements)
    .innerJoin(
      inventoryLocations,
      eq(inventoryMovements.locationId, inventoryLocations.id),
    )
    .where(eq(inventoryMovements.inventoryItemId, inventoryItemId));
}

export async function transferInventory(data: { inventoryItemId: string; sourceLocationId: string; destinationLocationId: string; quantity: number; reason?: string; idempotencyKey: string }) {
  if (!Number.isSafeInteger(data.quantity) || data.quantity <= 0 || data.sourceLocationId === data.destinationLocationId || !data.idempotencyKey) throw new InvalidMovementQuantityError();
  return db.transaction(async (tx) => {
    const [item] = await tx.select().from(inventoryItems).where(eq(inventoryItems.id, data.inventoryItemId)).for("update");
    if (!item) return null;
    const sourceKey = `${data.idempotencyKey}:source`, destinationKey = `${data.idempotencyKey}:destination`;
    const prior = await tx.select().from(inventoryMovements).where(sql`${inventoryMovements.idempotencyKey} in (${sourceKey}, ${destinationKey})`);
    if (prior.length === 2) return { alreadyApplied: true, movements: prior };
    if (prior.length) throw new Error("Transfer is incomplete; reconcile Inventory movement records");
    const locations = await tx.select().from(inventoryLocations).where(sql`${inventoryLocations.id} in (${data.sourceLocationId}::uuid, ${data.destinationLocationId}::uuid)`);
    if (locations.length !== 2) throw new InventoryLocationNotFoundError();
    const [source] = await tx.select().from(inventoryLocationStock).where(and(eq(inventoryLocationStock.inventoryItemId, data.inventoryItemId), eq(inventoryLocationStock.locationId, data.sourceLocationId))).for("update");
    if (!source || source.quantity < data.quantity) throw new InsufficientLocationInventoryError();
    await tx.update(inventoryLocationStock).set({ quantity: source.quantity - data.quantity, updatedAt: new Date() }).where(eq(inventoryLocationStock.id, source.id));
    await tx.insert(inventoryLocationStock).values({ inventoryItemId: data.inventoryItemId, locationId: data.destinationLocationId, quantity: data.quantity }).onConflictDoUpdate({ target: [inventoryLocationStock.inventoryItemId, inventoryLocationStock.locationId], set: { quantity: sql`${inventoryLocationStock.quantity} + ${data.quantity}`, updatedAt: new Date() } });
    const movements = await tx.insert(inventoryMovements).values([
      { inventoryItemId: data.inventoryItemId, locationId: data.sourceLocationId, type: "WAREHOUSE_TRANSFER", quantity: -data.quantity, reason: data.reason, idempotencyKey: sourceKey },
      { inventoryItemId: data.inventoryItemId, locationId: data.destinationLocationId, type: "WAREHOUSE_TRANSFER", quantity: data.quantity, reason: data.reason, idempotencyKey: destinationKey },
    ]).returning();
    return { alreadyApplied: false, movements };
  });
}
