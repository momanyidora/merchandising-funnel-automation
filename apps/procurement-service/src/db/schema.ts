import {
  pgTable,
  uuid,
  varchar,
  integer,
  timestamp,
  unique,
  boolean,
} from "drizzle-orm/pg-core";

export const purchaseOrders = pgTable("purchase_orders", {
  id: uuid("id").defaultRandom().primaryKey(),

  vendorId: uuid("vendor_id").notNull(),

  status: varchar("status", { length: 50 }).notNull(),

  paymentTerms: varchar("payment_terms", { length: 100 }).notNull(),

  currency: varchar("currency", { length: 3 }).notNull(),

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

export const purchaseOrderItems = pgTable(
  "purchase_order_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    purchaseOrderId: uuid("purchase_order_id")
      .notNull()
      .references(() => purchaseOrders.id, {
        onDelete: "cascade",
      }),

    productId: uuid("product_id").notNull(),

    quantity: integer("quantity").notNull(),

    lockedUnitCost: integer("locked_unit_cost").notNull(),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("purchase_order_product_unique").on(
      table.purchaseOrderId,
      table.productId,
    ),
  ],
);

export const purchaseOrderApprovals = pgTable("purchase_order_approvals", {
  id: uuid("id").defaultRandom().primaryKey(),

  purchaseOrderId: uuid("purchase_order_id")
    .notNull()
    .references(() => purchaseOrders.id, {
      onDelete: "cascade",
    }),

  approverId: uuid("approver_id").notNull(),

  approvedAt: timestamp("approved_at", {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),
});
export const purchaseOrderApprovers = pgTable("purchase_order_approvers", {
  id: uuid("id").defaultRandom().primaryKey(),

  userId: uuid("user_id").notNull().unique(),

  role: varchar("role", { length: 50 }).notNull(),

  active: boolean("active").notNull().default(true),
});