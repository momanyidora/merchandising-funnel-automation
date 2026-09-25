import amqp from "amqplib";
import { randomUUID } from "node:crypto";
import { appendFile } from "node:fs/promises";
import { env } from "../config/env.js";

const exchangeName = "mms.events";
const auditLogFile = "mq_audit.log";

async function writeAuditLog(message: string) {
  await appendFile(auditLogFile, `${message}\n`);
}

export async function publishEvent(eventName: string, payload: unknown) {
  const timestamp = new Date().toISOString();

  try {
    const connection = await amqp.connect(env.RABBITMQ_URL);
    const channel = await connection.createChannel();

    await channel.assertExchange(exchangeName, "topic", {
      durable: true,
    });

    const event = {
      eventId: randomUUID(),
      eventType: eventName,
      ...(payload as object),
    };

    channel.publish(
      exchangeName,
      eventName,
      Buffer.from(JSON.stringify(event)),
      {
        persistent: true,
        contentType: "application/json",
      },
    );

    await writeAuditLog(
      `[${timestamp}] SUCCESS eventName=${eventName} exchangeName=${exchangeName}`,
    );

    await channel.close();
    await connection.close();
  } catch (error) {
    await writeAuditLog(
      `[${timestamp}] FAILED eventName=${eventName} exchangeName=${exchangeName} error=${String(error)}`,
    );

    console.error(`Failed to publish event: ${eventName}`, error);
  }
}
