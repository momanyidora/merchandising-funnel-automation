import {
  pgTable,
  uuid,
  varchar,
  integer,
  timestamp,
  unique,
  jsonb,
} from "drizzle-orm/pg-core";

export const goodsReceipts = pgTable(
  "goods_receipts",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    purchaseOrderId: uuid("purchase_order_id").notNull(),

    grnNumber: varchar("grn_number", {
      length: 50,
    }).notNull(),

    status: varchar("status", {
      length: 50,
    }).notNull(),

    receivedAt: timestamp("received_at", {
      withTimezone: true,
    }),

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
  },
  (table) => [
    unique("goods_receipt_grn_number_unique").on(table.grnNumber),
  ],
);

export const goodsReceiptItems = pgTable("goods_receipt_items", {
  id: uuid("id").defaultRandom().primaryKey(),

  goodsReceiptId: uuid("goods_receipt_id")
    .notNull()
    .references(() => goodsReceipts.id, {
      onDelete: "cascade",
    }),

  productId: uuid("product_id").notNull(),

  expectedQuantity: integer("expected_quantity").notNull(),

  receivedQuantity: integer("received_quantity").notNull(),

  condition: varchar("condition", {
    length: 50,
  }).notNull(),

  discrepancyType: varchar("discrepancy_type", { length: 30 }).notNull().default("NONE"),

  createdAt: timestamp("created_at", {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),
});

export const processedEvents = pgTable("processed_events", {
  id: uuid("id").defaultRandom().primaryKey(),

  eventId: varchar("event_id", {
    length: 100,
  })
    .notNull()
    .unique(),

  processedAt: timestamp("processed_at", {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),
});

export const eventOutbox = pgTable("event_outbox", {
  eventId: uuid("event_id").primaryKey(),
  eventType: varchar("event_type", { length: 100 }).notNull(),
  payload: jsonb("payload").notNull(),
  attempts: integer("attempts").notNull().default(0),
  lastError: varchar("last_error", { length: 1000 }),
  nextAttemptAt: timestamp("next_attempt_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  publishedAt: timestamp("published_at", { withTimezone: true }),
});
