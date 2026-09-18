import amqp from "amqplib";
import { processPurchaseOrderApprovedEvent } from "./processPurchaseOrderApprovedEvent.js";

const rabbitmqUrl = process.env.RABBITMQ_URL ?? "amqp://localhost:5672";

const exchangeName = "mms.events";
const queueName = "inventory-service";

export async function startInventoryEventConsumer() {
  const connection = await amqp.connect(rabbitmqUrl);
  const channel = await connection.createChannel();

  await channel.assertExchange(exchangeName, "topic", {
    durable: true,
  });

  const queue = await channel.assertQueue(queueName, {
    durable: true,
  });

  await channel.bindQueue(queue.queue, exchangeName, "PurchaseOrderApproved");

  await channel.consume(queue.queue, async (message) => {
    if (!message) {
      return;
    }

    try {
      const event = JSON.parse(message.content.toString());

      await processPurchaseOrderApprovedEvent(event);

      channel.ack(message);
    } catch (error) {
      console.error("Failed to process PurchaseOrderApproved event", error);

      channel.nack(message, false, true);
    }
  });

  console.log("Inventory event consumer listening for PurchaseOrderApproved");
}