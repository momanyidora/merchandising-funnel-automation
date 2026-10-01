import { afterAll, describe, expect, it } from "vitest";
import pg from "pg";
import amqp from "amqplib";
import { randomUUID } from "node:crypto";
import { queueEvent, startOutboxWorker } from "../src/index.js";

const databaseUrl = process.env.OUTBOX_TEST_DATABASE_URL;
const rabbitUrl = process.env.OUTBOX_TEST_RABBITMQ_URL;
const enabled = Boolean(databaseUrl && rabbitUrl);
const pool = enabled ? new pg.Pool({ connectionString: databaseUrl }) : undefined;
const controller = new AbortController();

describe.skipIf(!enabled)("event outbox PostgreSQL and RabbitMQ integration", () => {
  afterAll(async () => { controller.abort(); await pool?.end(); });
  it("retries delivery until the durable outbox event is confirmed", async () => {
    await pool!.query(`create table if not exists event_outbox(event_id uuid primary key,event_type varchar(100) not null,payload jsonb not null,attempts integer not null default 0,last_error varchar(1000),next_attempt_at timestamptz not null default now(),created_at timestamptz not null default now(),published_at timestamptz)`);
    const eventId = randomUUID();
    const conn = await amqp.connect(rabbitUrl!); const channel = await conn.createChannel();
    await channel.assertExchange("mms.events", "topic", { durable: true });
    const queue = await channel.assertQueue("", { exclusive: true, autoDelete: true });
    await channel.bindQueue(queue.queue, "mms.events", "IntegrationProbe");
    const received = new Promise<any>((resolve, reject) => { const timeout = setTimeout(() => reject(new Error("event delivery timed out")), 15000); void channel.consume(queue.queue, (message) => { if (message) { clearTimeout(timeout); resolve(JSON.parse(message.content.toString())); } }, { noAck: true }); });
    const client = await pool!.connect(); try { await client.query("begin"); await queueEvent(client, { eventId, eventType: "IntegrationProbe", value: "persisted" }); await client.query("commit"); } finally { client.release(); }
    startOutboxWorker(pool!, rabbitUrl!, "integration-test", controller.signal);
    await expect(received).resolves.toMatchObject({ eventId, value: "persisted" });
    for (let i = 0; i < 30; i++) { const row = await pool!.query("select published_at from event_outbox where event_id=$1", [eventId]); if (row.rows[0]?.published_at) break; await new Promise((resolve) => setTimeout(resolve, 100)); }
    const status = await pool!.query("select published_at,attempts from event_outbox where event_id=$1", [eventId]);
    expect(status.rows[0].published_at).toBeTruthy(); expect(status.rows[0].attempts).toBeGreaterThan(0);
    await pool!.query("delete from event_outbox where event_id=$1", [eventId]); await channel.close(); await conn.close();
  }, 20000);
});
