import {
  pgTable,
  uuid,
  varchar,
  integer,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

export const inventoryItems = pgTable("inventory_items", {
  id: uuid("id").defaultRandom().primaryKey(),

  productId: uuid("product_id").notNull(),

  onHand: integer("on_hand").notNull().default(0),

  reserved: integer("reserved").notNull().default(0),

  onOrder: integer("on_order").notNull().default(0),

  unitCost: integer("unit_cost").notNull(),

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

export const inventoryLocations = pgTable(
  "inventory_locations",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    name: varchar("name", {
      length: 100,
    }).notNull(),

    code: varchar("code", {
      length: 50,
    }).notNull(),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [unique("inventory_location_code_unique").on(table.code)],
);

export const inventoryMovements = pgTable("inventory_movements", {
  id: uuid("id").defaultRandom().primaryKey(),

  inventoryItemId: uuid("inventory_item_id")
    .notNull()
    .references(() => inventoryItems.id, {
      onDelete: "cascade",
    }),

  locationId: uuid("location_id")
    .notNull()
    .references(() => inventoryLocations.id, {
      onDelete: "restrict",
    }),

  type: varchar("type", {
    length: 50,
  }).notNull(),

  quantity: integer("quantity").notNull(),

  reason: varchar("reason", {
    length: 255,
  }),

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