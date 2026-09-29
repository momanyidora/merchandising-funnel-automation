# Financials Service

Financials turns operational events into accounting records and read models. It consumes goods receipt, sale, and register close events, writes balanced journal entries, tracks open accounts payable, and exposes ledger, payables, and profitability views.

## Responsibilities

- Process `GoodsReceived`, `ItemSold`, and `DayClosed` events from RabbitMQ.
- Deduplicate processed events and create journal entries transactionally.
- Check that each event’s journal entries balance.
- Create accounts payable entries from eligible goods receipts using payment terms.
- Serve ledger, payable balance, and profitability endpoints.

The service owns its PostgreSQL database and reads from the shared `mms.events` exchange. Its routes are read-only reporting endpoints; event consumers build the accounting data.

## Development

Configure `FINANCIALS_DATABASE_URL` and `RABBITMQ_URL` in the root `.env`, start PostgreSQL and RabbitMQ, then run:

```bash
npm run dev --workspace=@mms/financials-service
```

The service defaults to port `3008`; routes under `/financials` are enabled by the `financials` flag. The contract is `contracts/openapi/financials-service.yaml`.

## Commands

```bash
npm run build --workspace=@mms/financials-service
npm run test --workspace=@mms/financials-service
```
