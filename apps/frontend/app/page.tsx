import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Boxes,
  ClipboardCheck,
  ClipboardList,
  PackageCheck,
  ShoppingCart,
  Truck,
  Wallet,
  Warehouse,
} from "lucide-react";
import Sidebar from "./components/Sidebar";

const modules = [
  {
    name: "Vendors",
    description:
      "Manage approved suppliers, products, prices, terms, and reliability.",
    href: "/vendors",
    icon: Truck,
  },
  {
    name: "Procurement",
    description:
      "Create purchase orders, lock supplier terms, and route approvals.",
    href: "/purchase-orders",
    icon: ClipboardList,
  },
  {
    name: "Inventory",
    description:
      "Maintain stock, locations, reservations, movements, and valuation.",
    href: "/inventory",
    icon: Boxes,
  },
  {
    name: "Receiving",
    description:
      "Record GRNs, delivery discrepancies, and damaged-goods quarantine.",
    href: "/receiving",
    icon: PackageCheck,
  },
  {
    name: "Warehouse Operations",
    description:
      "Create putaway, pick, and transfer tasks with capacity controls.",
    href: "/warehouse",
    icon: Warehouse,
  },
  {
    name: "Retail Sales",
    description:
      "Reserve store stock, capture payment, and complete point-of-sale sales.",
    href: "/sales",
    icon: ShoppingCart,
  },
  {
    name: "Sales Audit",
    description:
      "Reconcile register tenders and record manager-approved closeouts.",
    href: "/sales-audit",
    icon: ClipboardCheck,
  },
  {
    name: "Financials",
    description:
      "Review the ledger, accounts payable, revenue, COGS, and gross profit.",
    href: "/financials",
    icon: Wallet,
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="min-w-0 flex-1">
        <div className="w-full px-5 py-5 sm:px-7 lg:px-8">
          <header className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Workspace
              </p>
              <h1 className="mt-1 text-xl font-bold tracking-tight text-slate-900">
                Dashboard
              </h1>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 py-2 text-xs font-medium text-emerald-700 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              All System Operational
            </div>
          </header>

          <section className="relative isolate overflow-hidden rounded-2xl bg-slate-900 px-7 py-6 text-white shadow-sm sm:px-8 sm:py-7">
            <div
              aria-hidden="true"
              className="absolute inset-y-0 right-0 hidden w-[43%] lg:block"
            >
              <Image
                src="/warehouse-boxes-hero-small.jpg"
                alt=""
                fill
                priority
                sizes="43vw"
                className="object-cover object-center opacity-85"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/55 to-slate-900/10" />
              <div className="absolute inset-0 bg-blue-950/20" />
            </div>
            <div className="relative z-10 max-w-2xl">
              <p className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-blue-200">
                 Full merchandise lifecycle
              </p>
              <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
                From supplier setup to sales, reconciliation, and accounting.
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Use the modules below to follow goods and money through the
                business: order, receive, store, sell, audit, and report.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="/receiving"
                  className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold transition hover:bg-blue-500"
                >
                  Receive goods
                </Link>
                <Link
                  href="/sales"
                  className="rounded-lg border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold transition hover:bg-white/15"
                >
                  Open POS
                </Link>
                <Link
                  href="/financials"
                  className="rounded-lg border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold transition hover:bg-white/15"
                >
                  View financials
                </Link>
              </div>
            </div>
          </section>

          <section className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
              Operational modules
            </p>
            <h2 className="mt-1 text-lg font-bold text-slate-900">
              Everything is ready to use
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {modules.map((module) => {
                const Icon = module.icon;
                return (
                  <Link
                    key={module.href}
                    href={module.href}
                    className="group flex min-h-[205px] flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                        <Icon size={21} />
                      </div>
                      <ArrowRight
                        size={18}
                        className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-600"
                      />
                    </div>

                    <h3 className="mt-1 text-lg font-bold text-slate-900">
                      {module.name}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {module.description}
                    </p>
                    <p className="mt-auto pt-4 text-sm font-semibold text-blue-600">
                      Open module
                    </p>
                  </Link>
                );
              })}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
