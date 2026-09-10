import { and, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { vendorProducts } from "../db/schema.js";

export async function addVendorProduct(data: {
  vendorId: string;
  productId: string;
  supplierCost: number;
}) {
  const [vendorProduct] = await db
    .insert(vendorProducts)
    .values({
      vendorId: data.vendorId,
      productId: data.productId,
      supplierCost: data.supplierCost,
    })
    .returning();

  return vendorProduct;
}

export async function getVendorProducts(vendorId: string) {
  return db
    .select()
    .from(vendorProducts)
    .where(eq(vendorProducts.vendorId, vendorId));
}

export async function getVendorProduct(vendorId: string, productId: string) {
  const [vendorProduct] = await db
    .select()
    .from(vendorProducts)
    .where(
      and(
        eq(vendorProducts.vendorId, vendorId),
        eq(vendorProducts.productId, productId),
      ),
    )
    .limit(1);

  return vendorProduct;
}

export async function updateVendorProduct(
  vendorId: string,
  productId: string,
  supplierCost: number,
) {
  const [vendorProduct] = await db
    .update(vendorProducts)
    .set({
      supplierCost,
    })
    .where(
      and(
        eq(vendorProducts.vendorId, vendorId),
        eq(vendorProducts.productId, productId),
      ),
    )
    .returning();

  return vendorProduct;
}

export async function removeVendorProduct(vendorId: string, productId: string) {
  const [vendorProduct] = await db
    .delete(vendorProducts)
    .where(
      and(
        eq(vendorProducts.vendorId, vendorId),
        eq(vendorProducts.productId, productId),
      ),
    )
    .returning();

  return vendorProduct;
}
