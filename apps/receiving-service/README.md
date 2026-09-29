# Receiving Service

Receiving records deliveries against approved purchase orders. It looks up purchase order details through Procurement’s HTTP API, records goods receipt notes and item conditions, and publishes a `GoodsReceived` event for downstream Inventory, Warehouse Operations, and Financials processing.

## Responsibilities

- Validate a delivery against its purchase order and record received quantities.
- Capture receipt discrepancies, including damaged goods.
- Persist receipt data in its own PostgreSQL database.
- Queue domain events through the shared event outbox for reliable RabbitMQ delivery.

The service does not own purchase order or inventory data. It obtains PO data from Procurement and communicates receipt results through events.

## Development

Configure the root `.env` with Receiving’s database URL, `PROCUREMENT_SERVICE_URL`, and `RABBITMQ_URL`. Start PostgreSQL and RabbitMQ, then run:

```bash
npm run db:generate --workspace=@mms/receiving-service
npm run db:migrate --workspace=@mms/receiving-service
npm run dev --workspace=@mms/receiving-service
```

The service defaults to port `3004`; its routes are under `/receiving` and are enabled by the `receiving` feature flag. The API contract is `contracts/openapi/receiving-service.yaml`.

## Commands

```bash
npm run build --workspace=@mms/receiving-service
npm run test --workspace=@mms/receiving-service
npm run lint --workspace=@mms/receiving-service
```
