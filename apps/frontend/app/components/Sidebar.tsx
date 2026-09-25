"use client";

import Link from "next/link";
import {
  Boxes,
  ClipboardList,
  LayoutDashboard,
  Truck,
} from "lucide-react";

const phase1Modules = [
  {
    name: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    name: "Vendors",
    href: "/vendors",
    icon: Truck,
  },
  {
    name: "Procurement",
    href: "/purchase-orders",
    icon: ClipboardList,
  },
  {
    name: "Inventory",
    href: "/inventory",
    icon: Boxes,
  },
];

export default function Sidebar() {
  return (
    <aside className="flex min-h-screen w-64 flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-6 py-5">
        <h1 className="text-xl font-bold text-slate-900">MMS</h1>
        <p className="text-sm text-slate-500">Merchandise Management System</p>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {phase1Modules.map((module) => {
          const Icon = module.icon;

          return (
            <Link
              key={module.href}
              href={module.href}
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              <Icon size={18} />
              {module.name}
            </Link>
          );
        })}

        <div className="mt-6 border-t border-slate-200 pt-4">
          <p className="px-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Coming Soon
          </p>

          <div className="mt-2 space-y-1">
            {[
              "Receiving",
              "Warehouse Operations",
              "Retail Sales",
              "Sales Audit",
              "Financials",
            ].map((name) => (
              <div
                key={name}
                className="flex items-center justify-between px-4 py-3 text-sm text-slate-400"
              >
                <span>{name}</span>
                <span className="text-xs">Soon</span>
              </div>
            ))}
          </div>
        </div>
      </nav>
    </aside>
  );
}
