# Event Outbox

`@mms/event-outbox` is a shared TypeScript package for reliably publishing domain events from services to RabbitMQ. Services write event records to their own PostgreSQL outbox in the same transaction as business changes; the worker publishes pending records to the durable `mms.events` topic exchange.

## Exports

- `queueEvent(client, event)` inserts an event into `event_outbox` using the caller’s database transaction and ignores duplicate event IDs.
- `startOutboxWorker(pool, rabbitUrl, serviceName, signal?)` polls unpublished rows, publishes persistent messages with publisher confirms, marks successful rows as published, and schedules retries with capped backoff after failures.
- `DomainEvent` describes the common event fields (`eventId`, `eventType`) and allows event-specific data.

Each consuming service must create the `event_outbox` table in its own database. The package does not provide a shared database or run schema migrations for applications.

## Use

```ts
import { queueEvent, startOutboxWorker } from "@mms/event-outbox";

await queueEvent(transactionClient, {
  eventId: "...",
  eventType: "GoodsReceived",
});
startOutboxWorker(pool, process.env.RABBITMQ_URL!, "receiving-service");
```

Build and run package tests from the repository root:

```bash
npm run build --workspace=@mms/event-outbox
npm run test --workspace=@mms/event-outbox
```
