# Sales Audit Service

Sales Audit reconciles register tender counts against the completed sales received from Retail Sales. It stores sales audit records, records tender variances, and emits a `DayClosed` event when a register is closed for the business day.

## Responsibilities

- Consume `ItemSold` events and maintain an auditable sales and tender ledger.
- Compare expected tender totals with cash-up counts by payment method.
- Require manager attribution and an explanation for register closeout.
- Persist the audit and queue its `DayClosed` event through the shared outbox.

The service owns its PostgreSQL database and consumes/publishes messages on the durable `mms.events` RabbitMQ exchange.

## Development

Configure `SALES_AUDIT_DATABASE_URL` and `RABBITMQ_URL` in the root `.env`, start PostgreSQL and RabbitMQ, then run:

```bash
npm run dev --workspace=@mms/sales-audit-service
```

The service defaults to port `3007`; audit routes are under `/audits` and enabled by the `sales-audit` feature flag. Its OpenAPI contract is `contracts/openapi/sales-audit-service.yaml`.

## Commands

```bash
npm run build --workspace=@mms/sales-audit-service
npm run test --workspace=@mms/sales-audit-service
```
