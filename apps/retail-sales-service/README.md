# Retail Sales Service

Retail Sales records completed point-of-sale transactions. Before accepting a sale, it checks product and location availability with Inventory and reserves the requested quantities. It stores sale, item, and tender details, then queues an `ItemSold` event for downstream processing.

## Responsibilities

- Validate sale lines, tender amounts, and sale totals.
- Check stock at the selected location and reserve items through Inventory.
- Persist completed sales, line items, and payments in its own PostgreSQL database.
- Publish `ItemSold` through the shared event outbox for Sales Audit and Financials.
- Release stock reservations when a sale cannot be completed.

## Development

Configure `RETAIL_DATABASE_URL`, `INVENTORY_SERVICE_URL`, and `RABBITMQ_URL` in the root `.env`, then run:

```bash
npm run dev --workspace=@mms/retail-sales-service
```

The service defaults to port `3006`; sale routes are under `/sales` and are enabled by the `retail-sales` feature flag. The API contract is `contracts/openapi/retail-sales-service.yaml`.

## Commands

```bash
npm run build --workspace=@mms/retail-sales-service
npm run test --workspace=@mms/retail-sales-service
```
