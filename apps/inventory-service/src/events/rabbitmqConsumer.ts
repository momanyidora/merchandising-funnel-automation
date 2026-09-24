import amqp from "amqplib";
import { processPurchaseOrderApprovedEvent } from "./processPurchaseOrderApprovedEvent.js";
import { processGoodsReceivedEvent } from "./processGoodsReceivedEvent.js";
import { processItemSoldEvent } from "./processItemSoldEvent.js";
import { createEventAuditLog } from "../repositories/eventAuditLogRepository.js";

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

  await channel.bindQueue(queue.queue, exchangeName, "GoodsReceived");

  await channel.bindQueue(queue.queue, exchangeName, "ItemSold");

  await channel.consume(queue.queue, async (message) => {
    if (!message) {
      return;
    }

    try {
      const event = JSON.parse(message.content.toString());

      switch (event.eventType) {
        case "PurchaseOrderApproved":
          await processPurchaseOrderApprovedEvent(event);
          break;

        case "GoodsReceived":
          await processGoodsReceivedEvent(event);
          break;

        case "ItemSold":
          await processItemSoldEvent(event);
          break;

        default:
          console.log(`Ignoring unsupported event: ${event.eventType}`);
      }

      await createEventAuditLog({
        eventId: event.eventId,
        eventType: event.eventType,
        status: "processed",
        payload: event,
        processedAt: new Date(),
      });

      channel.ack(message);
    } catch (error) {
      console.error("Failed to process inventory event", error);

      try {
        const event = JSON.parse(message.content.toString());

        await createEventAuditLog({
          eventId: event.eventId ?? "unknown",
          eventType: event.eventType ?? "unknown",
          status: "failed",
          payload: event,
          processedAt: new Date(),
        });
      } catch (auditError) {
        console.error("Failed to persist event audit log", auditError);
      }

      channel.nack(message, false, true);
    }
  });

  console.log(
    "Inventory event consumer listening for PurchaseOrderApproved, GoodsReceived and ItemSold",
  );
}
