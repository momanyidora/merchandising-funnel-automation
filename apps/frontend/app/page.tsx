import {
  ArrowRight,
  Boxes,
  ClipboardList,
  PackageCheck,
  Plus,
  Truck,
  Activity,
} from "lucide-react";
import Link from "next/link";
import Sidebar from "./components/Sidebar";

const modules = [
  {
    name: "Vendors",
    description:
      "Manage suppliers, vendor details, products, pricing and reliability.",
    href: "/vendors",
    icon: Truck,
    label: "Supplier management",
  },
  {
    name: "Procurement",
    description:
      "Create purchase orders, manage items and track approval status.",
    href: "/purchase-orders",
    icon: ClipboardList,
    label: "Purchase workflow",
  },
  {
    name: "Inventory",
    description:
      "Monitor stock levels, inventory movements and product quantities.",
    href: "/inventory",
    icon: Boxes,
    label: "Stock management",
  },
];

const stats = [
  {
    label: "Vendors",
    value: "—",
    description: "Supplier records",
    icon: Truck,
  },
  {
    label: "Purchase Orders",
    value: "—",
    description: "Procurement activity",
    icon: ClipboardList,
  },
  {
    label: "Inventory",
    value: "—",
    description: "Stock overview",
    icon: PackageCheck,
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-7xl px-5 py-6 sm:px-8 lg:px-10">
          {/* Top bar */}
          <header className="mb-7 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Workspace
              </p>
              <h1 className="mt-1 text-xl font-bold tracking-tight text-slate-900">
                Dashboard
              </h1>
            </div>

            <div className="hidden items-center gap-3 sm:flex">
              <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 shadow-sm">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                System operational
              </div>
            </div>
          </header>

          {/* Hero */}
          <section className="relative overflow-hidden rounded-2xl bg-slate-900 px-7 py-8 shadow-sm sm:px-9 sm:py-10">
            <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />
            <div className="absolute -bottom-32 right-32 h-56 w-56 rounded-full bg-indigo-500/10 blur-3xl" />

            <div className="relative max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-blue-200">
                <Activity size={13} />
                Phase 1 • Foundation
              </div>

              <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Manage your merchandise operations in one place.
              </h2>

              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
                Manage vendors, procurement and inventory from a single
                workspace built for the merchandise management workflow.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/vendors"
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500"
                >
                  Manage vendors
                  <ArrowRight size={16} />
                </Link>

                <Link
                  href="/purchase-orders/new"
                  className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15"
                >
                  <Plus size={16} />
                  Create purchase order
                </Link>
              </div>
            </div>
          </section>

          {/* Stats */}
          <section className="mt-7 grid gap-4 sm:grid-cols-3">
            {stats.map((stat) => {
              const Icon = stat.icon;

              return (
                <div
                  key={stat.label}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-500">
                        {stat.label}
                      </p>
                      <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                        {stat.value}
                      </p>
                    </div>

                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <Icon size={19} />
                    </div>
                  </div>

                  <p className="mt-3 text-xs text-slate-400">
                    {stat.description}
                  </p>
                </div>
              );
            })}
          </section>

          {/* Modules */}
          <section className="mt-9">
            <div className="mb-5 flex items-end justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                  Available now
                </p>
                <h2 className="mt-1 text-lg font-bold text-slate-900">
                  Core modules
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Access the active areas of your merchandise workflow.
                </p>
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
              {modules.map((module) => {
                const Icon = module.icon;

                return (
                  <Link
                    key={module.href}
                    href={module.href}
                    className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg hover:shadow-slate-200/60"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
                        <Icon size={21} />
                      </div>

                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition group-hover:bg-blue-50 group-hover:text-blue-600">
                        <ArrowRight
                          size={16}
                          className="transition group-hover:translate-x-0.5"
                        />
                      </div>
                    </div>

                    <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      {module.label}
                    </p>

                    <h3 className="mt-1 text-lg font-bold text-slate-900">
                      {module.name}
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {module.description}
                    </p>

                    <div className="mt-5 flex items-center gap-1 text-sm font-semibold text-blue-600">
                      Open module
                      <ArrowRight
                        size={15}
                        className="transition group-hover:translate-x-1"
                      />
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* Coming soon */}
          <section className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white/70 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Roadmap
                </p>
                <h2 className="mt-1 text-base font-bold text-slate-900">
                  More operations are coming
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Receiving, warehouse operations, retail sales, sales audit and
                  financials will be added in later phases.
                </p>
              </div>

              <div className="shrink-0 rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-500">
                Later phases
              </div>
            </div>
          </section>

          {/* Footer status */}
          <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-5 text-xs text-slate-400">
            <span>MMS • Phase 1 Foundation</span>
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Operational
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
