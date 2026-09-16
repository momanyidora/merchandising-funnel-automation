import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { inventoryLocations } from "../db/schema.js";

export async function createInventoryLocation(data: {
  name: string;
  code: string;
}) {
  const [location] = await db
    .insert(inventoryLocations)
    .values(data)
    .returning();

  return location;
}

export async function getInventoryLocationById(id: string) {
  const [location] = await db
    .select()
    .from(inventoryLocations)
    .where(eq(inventoryLocations.id, id));

  return location ?? null;
}
