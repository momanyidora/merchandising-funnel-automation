# Warehouse Operations Service

Warehouse Operations manages storage locations and the work needed to move products through a warehouse. It creates and completes putaway, pick, and transfer tasks, while Inventory remains the source of truth for stock quantities.

## Responsibilities

- Maintain warehouse storage locations, capacities, and their linked Inventory locations.
- Create warehouse tasks and report location utilization.
- Consume `GoodsReceived` events and create putaway tasks for received goods.
- On task completion, request an idempotent stock transfer from Inventory and update warehouse task state.

The service owns its PostgreSQL database and communicates with Inventory through its HTTP API. It consumes RabbitMQ events from the durable `mms.events` exchange.

## Development

Configure `WAREHOUSE_DATABASE_URL`, `INVENTORY_SERVICE_URL`, and `RABBITMQ_URL` in the root `.env`, start PostgreSQL and RabbitMQ, and run:

```bash
npm run dev --workspace=@mms/warehouse-operations-service
```

The service defaults to port `3005`; its API is mounted under `/warehouse` when the `warehouse-operations` feature flag is enabled. The contract is `contracts/openapi/warehouse-operations-service.yaml`.

## Commands

```bash
npm run build --workspace=@mms/warehouse-operations-service
npm run test --workspace=@mms/warehouse-operations-service
```
