import { Boxes, ClipboardList, Truck } from "lucide-react";
import Sidebar from "./components/Sidebar";

const modules = [
  {
    name: "Vendors",
    description: "Manage suppliers, products and vendor reliability.",
    href: "/vendors",
    icon: Truck,
  },
  {
    name: "Procurement",
    description: "Create and manage purchase orders and approvals.",
    href: "/purchase-orders",
    icon: ClipboardList,
  },
  
  {
    name: "Inventory",
    description: "Track stock, reservations, movements and valuation.",
    href: "/inventory",
    icon: Boxes,
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <main className="flex-1 p-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <p className="text-sm font-medium text-blue-600">
              Phase 1 • Foundation
            </p>

            <h2 className="mt-2 text-3xl font-bold text-slate-900">
              Merchandise Management System
            </h2>

            <p className="mt-2 text-slate-600">
              Manage vendors, procurement and inventory from one place.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {modules.map((module) => {
              const Icon = module.icon;

              return (
                <a
                  key={module.href}
                  href={module.href}
                  className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md"
                >
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <Icon size={22} />
                  </div>

                  <h3 className="text-lg font-semibold text-slate-900">
                    {module.name}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {module.description}
                  </p>

                  <span className="mt-5 inline-block text-sm font-medium text-blue-600">
                    Open module →
                  </span>
                </a>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
