import amqp from "amqplib";
import type { Pool, PoolClient } from "pg";
import { setTimeout as delay } from "node:timers/promises";

export type DomainEvent = {
  eventId: string;
  eventType: string;
  [key: string]: unknown;
};

export async function queueEvent(
  client: PoolClient,
  event: DomainEvent,
): Promise<void> {
  await client.query(
    `insert into event_outbox(event_id,event_type,payload) values($1,$2,$3)
     on conflict(event_id) do nothing`,
    [event.eventId, event.eventType, event],
  );
}

export function startOutboxWorker(
  pool: Pool,
  rabbitUrl: string,
  serviceName: string,
  signal?: AbortSignal,
): void {
  void run();

  async function run() {
    while (!signal?.aborted) {
      let client: PoolClient | undefined;

      try {
        client = await pool.connect();
        await client.query("begin");

        const { rows } = await client.query(
          `select event_id,event_type,payload from event_outbox
           where published_at is null and next_attempt_at <= now()
           order by created_at for update skip locked limit 20`,
        );

        for (const row of rows) {
          try {
            const connection = await amqp.connect(rabbitUrl);
            const channel = await connection.createConfirmChannel();

            await channel.assertExchange("mms.events", "topic", {
              durable: true,
            });

            const event = {
              eventId: row.event_id,
              eventType: row.event_type,
              ...(row.payload as Record<string, unknown>),
            };

            channel.publish(
              "mms.events",
              row.event_type,
              Buffer.from(JSON.stringify(event)),
              {
                persistent: true,
                contentType: "application/json",
                messageId: row.event_id,
              },
            );

            await channel.waitForConfirms();
            await channel.close();
            await connection.close();

            await client.query(
              "update event_outbox set published_at=now(), attempts=attempts+1,last_error=null where event_id=$1",
              [row.event_id],
            );
          } catch (error) {
            await client.query(
              `update event_outbox set attempts=attempts+1,last_error=$2,
               next_attempt_at=now()+make_interval(secs => least(300,power(2,least(attempts,8))::int)) where event_id=$1`,
              [row.event_id, String(error).slice(0, 1000)],
            );
          }
        }

        await client.query("commit");

        if (!rows.length) {
          await delay(1000, undefined, signal ? { signal } : undefined).catch(
            () => undefined,
          );
        }
      } catch (error) {
        if (client) {
          await client.query("rollback").catch(() => undefined);
        }

        console.error(`[${serviceName}] outbox worker error`, error);

        await delay(2000, undefined, signal ? { signal } : undefined).catch(
          () => undefined,
        );
      } finally {
        client?.release();
      }
    }
  }
}
