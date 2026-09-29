# Inventory Service

Inventory owns the system’s view of product stock, stock movements, reservations, on-order quantities, and valuation. It exposes REST endpoints for inventory items, locations, location stock, movements, reservations, and valuation, and integrates with the other services through RabbitMQ domain events.

## Responsibilities

- Track on-hand stock by product and location, plus inventory cost information.
- Reserve and release stock for retail checkout.
- Record stock movements and support idempotent transfer requests.
- Maintain on-order quantities from purchase order events.
- Update inventory from goods-received and item-sold events, with event processing records to prevent duplicate application.
- Provide stock valuation and low-stock functionality.

Inventory owns its PostgreSQL database. Other services use its HTTP API or events rather than accessing its tables directly.

## Development

Start the shared infrastructure and configure the root `.env` with `INVENTORY_DATABASE_URL` and `RABBITMQ_URL`. Then run:

```bash
npm run db:generate --workspace=@mms/inventory-service
npm run db:migrate --workspace=@mms/inventory-service
npm run dev --workspace=@mms/inventory-service
```

The service defaults to port `3003` and is gated by the `inventory` flag in `config/features.json`. Its health endpoint is `/health`; inventory endpoints are mounted under `/inventory` when enabled.

## Commands

```bash
npm run build --workspace=@mms/inventory-service
npm run test --workspace=@mms/inventory-service
npm run lint --workspace=@mms/inventory-service
```

The service uses Express, TypeScript, PostgreSQL, Drizzle ORM, Zod, and Vitest. See the root README for the overall event flow and infrastructure setup.
