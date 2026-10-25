CREATE TABLE "purchase_order_amendments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "purchase_order_id" uuid NOT NULL,
  "requested_by" varchar(120) NOT NULL,
  "reason" varchar(500) NOT NULL,
  "change_summary" varchar(1000) NOT NULL,
  "status" varchar(30) DEFAULT 'PENDING' NOT NULL,
  "reviewed_by" varchar(120),
  "reviewed_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "purchase_order_amendments_purchase_order_id_purchase_orders_id_fk"
    FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_orders"("id") ON DELETE cascade
);
