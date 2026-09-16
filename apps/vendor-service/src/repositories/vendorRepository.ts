import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { vendors } from "../db/schema.js";

// --------------------
// Vendor CRUD
// --------------------

export async function createVendor(data: {
  name: string;
  email: string;
  phone: string;
  paymentTerms: string;
  leadTimeDays: number;
}) {
  const [vendor] = await db
    .insert(vendors)
    .values({
      name: data.name,
      email: data.email,
      phone: data.phone,
      paymentTerms: data.paymentTerms,
      leadTimeDays: data.leadTimeDays,
    })
    .returning();

  return vendor;
}

export async function getVendorById(id: string) {
  const [vendor] = await db
    .select()
    .from(vendors)
    .where(eq(vendors.id, id))
    .limit(1);

  return vendor;
}
export async function vendorExists(id: string): Promise<boolean> {
  const vendor = await getVendorById(id);

  return vendor !== undefined;
}
export async function getAllVendors() {
  return db.select().from(vendors);
}

export async function updateVendor(
  id: string,
  data: Partial<{
    name: string;
    email: string;
    phone: string;
    paymentTerms: string;
    leadTimeDays: number;
  }>,
) {
  const [vendor] = await db
    .update(vendors)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(vendors.id, id))
    .returning();

  return vendor;
}

export async function deleteVendor(id: string) {
  const [vendor] = await db
    .delete(vendors)
    .where(eq(vendors.id, id))
    .returning();

  return vendor;
}

