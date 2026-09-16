import amqp from "amqplib";
import { env } from "../config/env.js";

const exchangeName = "mms.events";

export async function publishEvent(eventName: string, payload: unknown) {
  try {
    const connection = await amqp.connect(env.RABBITMQ_URL);
    const channel = await connection.createChannel();

    await channel.assertExchange(exchangeName, "topic", {
      durable: true,
    });

    channel.publish(
      exchangeName,
      eventName,
      Buffer.from(JSON.stringify(payload)),
      {
        persistent: true,
        contentType: "application/json",
      },
    );

    await channel.close();
    await connection.close();
  } catch (error) {
    console.error(`Failed to publish event: ${eventName}`, error);
  }
}
