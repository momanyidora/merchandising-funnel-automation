import { eq, ilike, count, type InferSelectModel } from "drizzle-orm";
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
type VendorRow = InferSelectModel<typeof vendors>;
export function getAllVendors(): Promise<VendorRow[]>;
export function getAllVendors(options: { page: number; pageSize: number; search?: string }): Promise<{ items: VendorRow[]; total: number; page: number; pageSize: number; totalPages: number }>;
export async function getAllVendors(options?: { page: number; pageSize: number; search?: string }) {
  if (!options) return db.select().from(vendors);
  const search = options.search?.trim();
  const where = search ? ilike(vendors.name, `%${search}%`) : undefined;
  const [items, [totalRow]] = await Promise.all([
    db.select().from(vendors).where(where).orderBy(vendors.name).limit(options.pageSize).offset((options.page - 1) * options.pageSize),
    db.select({ total: count() }).from(vendors).where(where),
  ]);
  const total = Number(totalRow.total);
  return { items, total, page: options.page, pageSize: options.pageSize, totalPages: Math.ceil(total / options.pageSize) };
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

