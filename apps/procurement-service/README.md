# Procurement Service

Part of the **Merchandising Funnel Automation** capstone — this is Module 2.

## What this is

Before this service existed, purchase orders for this retail business were created in spreadsheets, or on paper, with approvals happening through hallway conversations or a forwarded email. Nobody had a clear view of what had actually been ordered, what was waiting on a sign-off, or what was still in transit.

Procurement Service is the decision-and-commitment engine for the business. It exists to answer:

> What are we committing to buy, how much will it cost us, and who approved it?

## Why it needs Vendor Service, but doesn't own vendor data

A purchase order needs a supplier, and it needs that supplier's current pricing and terms. But Procurement doesn't get to reach into Vendor Service's database to grab that — that would break the whole point of having separate services with private data stores.

Instead, when a PO is being put together, Procurement calls Vendor Service over REST to ask "who supplies this, and on what terms?" Once it has an answer, it **locks in** the unit cost and payment terms onto the purchase order at that exact moment. If the vendor changes their price tomorrow, this PO doesn't care — it already committed to what it committed to. That price/terms snapshot is one of the more subtle but important business rules in this whole module.

## What it does

- Creates purchase orders against a specific vendor, with a currency and payment terms.
- Adds line items to a PO — each item locks in a `productId`, `quantity`, and `lockedUnitCost` at creation time.
- Enforces a proper approval workflow instead of letting a PO's status be edited freely.
- Publishes a `PurchaseOrderApproved` event once a PO is approved, so Receiving, Inventory, and Financials can react without Procurement needing to know or care who's listening.

## What it deliberately does NOT do

- It doesn't touch what physically shows up at the loading dock — that's Receiving's job.
- It doesn't check warehouse stock.
- It only knows what the business *intends* to buy and what it *expects* to pay — reality is somebody else's problem.

## PO lifecycle

```
DRAFT
  ↓  (submit)
PENDING_APPROVAL
  ↓  (approve)
APPROVED
```

Status changes only happen through the dedicated workflow endpoints below — not through the generic `PATCH`. Early on I actually had this as a gap (`PATCH` could sneak a `status` field through), and closed it once I noticed a client could technically hand-craft an `APPROVED` status without going through submit/approve. Now the generic update endpoint only touches fields like `paymentTerms`; the lifecycle endpoints are the only way to move a PO forward.

## Tech stack

Same core stack as Vendor Service, kept consistent across the monorepo:

- **Node.js + Express + TypeScript** (strict mode)
- **PostgreSQL** — its own dedicated `procurement_db`, completely separate from Vendor's database
- **Drizzle ORM** for schema + migrations
- **RabbitMQ** for publishing domain events
- **Vitest** for tests

## Project structure

```
apps/procurement-service/
├── src/
│   ├── db/
│   │   ├── schema.ts        # purchase_orders + purchase_order_items
│   │   └── migrations/
│   ├── repositories/
│   ├── services/
│   │   ├── purchaseOrderService.ts
│   │   └── purchaseOrderItemService.ts
│   ├── routes/
│   │   ├── purchaseOrderRoutes.ts
│   │   └── purchaseOrderItemRoutes.ts
│   ├── events/              # RabbitMQ publisher
│   └── server.ts
├── tests/
└── package.json
```

Same layering as Vendor: routes → service → repository → database. Nothing skips a layer.

## Data model

**Purchase Order**

| Field | Notes |
|---|---|
| `id` | UUID |
| `vendorId` | which supplier this PO is against |
| `status` | `DRAFT` / `PENDING_APPROVAL` / `APPROVED` |
| `paymentTerms` | locked in from Vendor at creation |
| `currency` | e.g. `KES` |
| `createdAt` / `updatedAt` | |

**Purchase Order Item**

| Field | Notes |
|---|---|
| `id` | UUID |
| `purchaseOrderId` | parent PO |
| `productId` | |
| `quantity` | |
| `lockedUnitCost` | price frozen at the moment the item was added |
| `createdAt` | |

## API

Contract lives in `contracts/openapi/procurement-service.yaml`, written before implementation.

**Purchase Orders**

| Method | Endpoint | Notes |
|---|---|---|
| `POST` | `/purchase-orders` | Create a PO (starts as `DRAFT`) |
| `GET` | `/purchase-orders` | List all POs |
| `GET` | `/purchase-orders/:id` | Get one PO |
| `PATCH` | `/purchase-orders/:id` | Update non-status fields |
| `DELETE` | `/purchase-orders/:id` | Delete a PO |
| `POST` | `/purchase-orders/:id/submit` | `DRAFT` → `PENDING_APPROVAL` |
| `POST` | `/purchase-orders/:id/approve` | `PENDING_APPROVAL` → `APPROVED`, fires `PurchaseOrderApproved` |

**Purchase Order Items**

| Method | Endpoint | Notes |
|---|---|---|
| `POST` | `/purchase-orders/:purchaseOrderId/items` | Add a line item |
| `GET` | `/purchase-orders/:purchaseOrderId/items` | List items on a PO |
| `GET` | `/items/:id` | Get a single item |
| `PATCH` | `/items/:id` | Update an item |
| `DELETE` | `/items/:id` | Remove an item |

All the response codes (`201` on create, `200` on read/update, `204` on delete) are checked against the OpenAPI contract, not just against what "felt right" while coding.

## Events

On approval, Procurement publishes a `PurchaseOrderApproved` event to RabbitMQ. It doesn't know or check who's consuming it — that's the entire point of an event bus. In the full system, this is what Receiving listens for to know a delivery is coming, what Inventory listens for to bump its "on order" figures, and what Financials listens for to anticipate an upcoming liability.

## Running it locally

```bash
docker compose -f infrastructure/docker/docker-compose.yml up -d
cp .env.example .env
npm run db:generate --workspace=@mms/procurement-service
npm run db:migrate --workspace=@mms/procurement-service
npm run dev --workspace=@mms/procurement-service
```

Runs on port `3002` by default (`PROCUREMENT_SERVICE_PORT`). Needs Vendor Service running too, since it calls out to it when building a PO.

## Testing

```bash
npm run test --workspace=@mms/procurement-service
```

12/12 passing at the moment — covering the CRUD paths, the item locking behavior, and the lifecycle transitions (including that a PO can't skip straight to `APPROVED`, and that `PATCH` can no longer be used to fake a status change).

## Feature flag

Gated behind `procurement` in `config/features.json`:

```json
{
  "procurement": true
}
```

## Status

Functionally complete for Phase 1: schema, migrations, price/terms locking, the full DRAFT → PENDING_APPROVAL → APPROVED workflow, item management, RabbitMQ event publishing, REST communication with Vendor Service, OpenAPI contract, tests, and feature flag are all in.

Moving on to Inventory next.