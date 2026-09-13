CREATE TABLE "vendor_reliability_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"purchase_order_id" uuid,
	"expected_delivery_date" timestamp with time zone NOT NULL,
	"actual_delivery_date" timestamp with time zone,
	"expected_quantity" integer NOT NULL,
	"received_quantity" integer NOT NULL,
	"status" varchar(50) NOT NULL,
	"notes" varchar(500),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "vendor_reliability_history" ADD CONSTRAINT "vendor_reliability_history_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;