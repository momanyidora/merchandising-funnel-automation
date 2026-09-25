CREATE TABLE "event_audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" varchar(100) NOT NULL,
	"event_type" varchar(100) NOT NULL,
	"status" varchar(50) NOT NULL,
	"payload" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone
);
