# Vendor Service

Part of the **Merchandising Funnel Automation** capstone — this is Module 1.

## What this is

This service is the single source of truth for supplier information. Before this existed, supplier details for the retail business lived across emails, spreadsheets, and whoever happened to remember them. If you needed to know who supplies a product, how long they take to deliver, or what payment terms you agreed on, there was no single place to check.

Vendor Service answers one question, and only one question:

> Who supplies our goods, and under what terms?

It doesn't decide when to place an order (that's Procurement's job), and it doesn't track individual purchase orders. It just knows the suppliers and what they offer.

## Why it's its own service

The capstone brief is explicit about this: no giant monolith, no shared database between modules, and every domain gets its own isolated island. So instead of a `suppliers` table living inside some bigger app, Vendor Service is a completely independent backend with its own database. Procurement (and eventually other modules) can only get at vendor data by calling this service's API — never by touching its database directly.

## What it does

- Stores a complete profile for every approved supplier: name, email, phone, payment terms, and lead time (how many days they take to deliver after an order is placed).
- Validates everything on the way in — no empty names, no garbage emails, no negative lead times.
- Exposes that data over REST so Procurement can pull it when building a purchase order.

## What it deliberately does NOT do

- It does not know about purchase orders.
- It does not track whether an order was received on time.
- It does not touch inventory, sales, or accounting in any way.

Those boundaries aren't accidental — the whole point of this architecture is that each service owns one problem and nothing else.

## Tech stack

- **Node.js + Express** — kept the backend framework simple and something I already knew well, rather than reaching for something unfamiliar mid-capstone.
- **TypeScript** — strict mode on.
- **PostgreSQL** — its own dedicated database (`vendor_db`), running in its own Docker container, isolated from every other service's database.
- **Drizzle ORM** — for schema definition and migrations.
- **Vitest** — for unit/integration tests.

## Project structure

```
apps/vendor-service/
├── src/
│   ├── db/
│   │   ├── schema.ts       # Drizzle schema for the vendors table
│   │   ├── index.ts        # DB connection / pool
│   │   └── migrations/     # generated SQL migrations
│   ├── repositories/
│   │   └── vendorRepository.ts   # raw DB access, nothing else
│   ├── services/
│   │   └── vendorService.ts      # business rules & validation
│   ├── routes/
│   │   └── vendorRoutes.ts       # HTTP layer
│   └── server.ts
├── tests/
├── drizzle.config.ts
└── package.json
```

I kept a strict layering here on purpose: routes never talk to the database directly, they go through the service layer, and the service layer is the only thing that talks to the repository. It made it a lot easier to reason about where validation should live once things started growing.

## Data model

A vendor record looks like this:

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | primary key, auto-generated |
| `name` | string | required |
| `email` | string | required, unique, validated |
| `phone` | string | required |
| `paymentTerms` | string | e.g. `"Net 30"` |
| `leadTimeDays` | integer | how many days the supplier takes to deliver, must be ≥ 0 |
| `createdAt` / `updatedAt` | timestamp | managed automatically |

## API

Full contract lives in `contracts/openapi/vendor-service.yaml` — written before any of the business logic, per the capstone's "contract-first" requirement.

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/vendors` | Create a vendor |
| `GET` | `/vendors` | List all vendors |
| `GET` | `/vendors/:vendorId` | Get a single vendor |
| `PATCH` | `/vendors/:vendorId` | Update a vendor |
| `DELETE` | `/vendors/:vendorId` | Delete a vendor |
| `GET` | `/health` | Health check |

### Validation rules

- Name can't be empty.
- Email has to look like an email, and has to be unique across vendors.
- Phone can't be empty.
- Payment terms can't be empty.
- Lead time can't be negative.

Bad input never reaches the database — it gets rejected at the service layer with a `400` and a plain-English error message.

## Running it locally

Spin up the vendor database:

```bash
docker compose -f infrastructure/docker/docker-compose.yml up -d
```

Copy the environment file and fill in the DB URL (see `.env.example` at the repo root):

```bash
cp .env.example .env
```

Generate and run the migration:

```bash
npm run db:generate --workspace=@mms/vendor-service
npm run db:migrate --workspace=@mms/vendor-service
```

Start the service:

```bash
npm run dev --workspace=@mms/vendor-service
```

It comes up on port `3001` by default (`VENDOR_SERVICE_PORT` in `.env`).

## Testing

```bash
npm run test --workspace=@mms/vendor-service
```

Covers the validation rules in the service layer as well as the repository/route behavior — creating, listing, fetching, updating, deleting, and the expected `400`/`404` responses.

## Feature flag

This module is gated behind `vendor-management` in `config/features.json`, as required for Phase 1 of the rollout:

```json
{
  "vendor-management": true
}
```

## Status

This module is functionally complete for Phase 1: schema, migrations, repository, service-layer validation, full CRUD API, OpenAPI contract, tests, and feature flag are all in place. Procurement already talks to this service over REST to pull supplier data when a purchase order is created.

Next up on my end: Receiving, then the rest of Phase 2.