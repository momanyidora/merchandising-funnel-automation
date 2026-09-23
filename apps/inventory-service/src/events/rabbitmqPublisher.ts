import amqp from "amqplib";
import { randomUUID } from "node:crypto";

const rabbitmqUrl = process.env.RABBITMQ_URL ?? "amqp://localhost:5672";

const exchangeName = "mms.events";

export async function publishEvent(eventName: string, payload: unknown) {
  try {
    const connection = await amqp.connect(rabbitmqUrl);
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

    await channel.close();
    await connection.close();
  } catch (error) {
    console.error(`Failed to publish event: ${eventName}`, error);
  }
}
