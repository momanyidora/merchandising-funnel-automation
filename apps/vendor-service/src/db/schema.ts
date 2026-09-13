import {
  pgTable,
  uuid,
  varchar,
  integer,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

export const vendors = pgTable("vendors", {
  id: uuid("id").defaultRandom().primaryKey(),

  name: varchar("name", { length: 255 }).notNull(),

  email: varchar("email", { length: 255 }).notNull().unique(),

  phone: varchar("phone", { length: 50 }).notNull(),

  paymentTerms: varchar("payment_terms", { length: 100 }).notNull(),

  leadTimeDays: integer("lead_time_days").notNull(),

  createdAt: timestamp("created_at", {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),

  updatedAt: timestamp("updated_at", {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),
});
export const vendorProducts = pgTable("vendor_products", {
  id: uuid("id").defaultRandom().primaryKey(),

  vendorId: uuid("vendor_id")
    .notNull()
    .references(() => vendors.id, { onDelete: "cascade" }),

  productId: uuid("product_id").notNull(),

  supplierCost: integer("supplier_cost").notNull(),

  createdAt: timestamp("created_at", {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),
}, (table)=> [
  unique("vendor_product_unique").on(table.vendorId, table.productId)
]);
export const vendorReliabilityHistory = pgTable("vendor_reliability_history", {
  id: uuid("id").defaultRandom().primaryKey(),

  vendorId: uuid("vendor_id")
    .notNull()
    .references(() => vendors.id, { onDelete: "cascade" }),

  purchaseOrderId: uuid("purchase_order_id"),

  expectedDeliveryDate: timestamp("expected_delivery_date", {
    withTimezone: true,
  }).notNull(),

  actualDeliveryDate: timestamp("actual_delivery_date", {
    withTimezone: true,
  }),

  expectedQuantity: integer("expected_quantity").notNull(),

  receivedQuantity: integer("received_quantity").notNull(),

  status: varchar("status", { length: 50 }).notNull(),

  notes: varchar("notes", { length: 500 }),

  createdAt: timestamp("created_at", {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),
});