# Merchandising Funnel Frontend

The web interface for the Merchandising Funnel Automation system. It is a Next.js app that brings vendor management, purchase orders, inventory, receiving, warehouse operations, retail sales, sales audit, and financial reporting into one interface.

## Development

From the repository root, install workspace dependencies and start the frontend:

```bash
npm install
npm run dev --workspace=frontend
```

The development server runs on `http://localhost:3000`. Backend services should be running for data-backed pages to work. The frontend proxies `/api/vendor`, `/api/procurement`, `/api/inventory`, `/api/receiving`, `/api/warehouse`, `/api/sales`, `/api/sales-audit`, and `/api/financials` to the corresponding local services on ports 3001–3008 through `next.config.ts`.

## Pages

Routes live under `app/`. The application includes pages for vendors, purchase orders, inventory, receiving, warehouse, sales, sales audit, and financials, with shared UI components under `app/components/`.

## Commands

```bash
npm run dev --workspace=frontend
npm run build --workspace=frontend
npm run start --workspace=frontend
npm run lint --workspace=frontend
```

The frontend uses Next.js, React, TypeScript, and Tailwind CSS. Backend API contracts and service setup are documented in the repository root README and each service README.
