"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Boxes,
  ClipboardList,
  LayoutDashboard,
  Truck,
  Warehouse,
  ShoppingCart,
  ClipboardCheck,
  Wallet,
  ChevronRight,
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

const phase2Modules = [
  { name: "Receiving", href: "/receiving", icon: Truck },
  { name: "Warehouse Operations", href: "/warehouse", icon: Warehouse },
];
const phase3Modules = [
  { name: "Retail Sales", href: "/sales", icon: ShoppingCart },
  { name: "Sales Audit", href: "/sales-audit", icon: ClipboardCheck },
];
const phase4Modules = [{ name: "Financials", href: "/financials", icon: Wallet }];

type FeatureMap = Record<string, boolean>;
export default function Sidebar() {
  const pathname = usePathname();
  const [features, setFeatures] = useState<FeatureMap>({});
  useEffect(() => { fetch("/api/features").then(r => r.json()).then(setFeatures).catch(() => setFeatures({})); }, []);

  return (
    <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
      {/* Brand */}
      <div className="border-b border-slate-100 px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white shadow-sm shadow-blue-200">
            MMS
          </div>

          <div className="min-w-0">
            <h1 className="text-[15px] font-bold tracking-tight text-slate-900">
              Merchandise
            </h1>
            <p className="text-xs text-slate-500">Management System</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-6">
        <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
          Main Menu
        </p>

        <div className="space-y-1">
          {phase1Modules.map((module) => {
            const Icon = module.icon;
            const isActive =
              module.href === "/"
                ? pathname === "/"
                : pathname.startsWith(module.href);

            return (
              <Link
                key={module.href}
                href={module.href}
                className={`group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-blue-50 text-blue-700 shadow-sm"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon
                    size={18}
                    strokeWidth={isActive ? 2.3 : 2}
                    className={
                      isActive
                        ? "text-blue-600"
                        : "text-slate-400 group-hover:text-slate-600"
                    }
                  />
                  <span>{module.name}</span>
                </span>

                {isActive && (
                  <ChevronRight size={15} className="text-blue-400" />
                )}
              </Link>
            );
          })}
        </div>

        {[
          {label:"Warehouse",items:phase2Modules,flags:["receiving","warehouse-operations"]},
          {label:"Retail",items:phase3Modules,flags:["retail-sales","sales-audit"]},
          {label:"Accounting",items:phase4Modules,flags:["financials"]},
        ].map((group) => {
          const visible = group.items.filter((module, index) => features[group.flags[index]] === true);
          if (!visible.length) return null;
          return (
          <section key={group.label} className="mt-6 border-t border-slate-100 pt-5">
            <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">{group.label}</p>
            <div className="space-y-1">{visible.map((module) => { const Icon=module.icon; const active=pathname.startsWith(module.href); return <Link key={module.href} href={module.href} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${active?"bg-blue-50 text-blue-700":"text-slate-600 hover:bg-slate-50"}`}><Icon size={17}/><span>{module.name}</span></Link> })}</div>
          </section>
          );
        })}
      </nav>

      {/* User */}
      <div className="border-t border-slate-100 p-4">
        <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
            DM
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900">
              Dorah
            </p>
            <p className="text-xs text-slate-500">Administrator</p>
          </div>

          <div className="h-2 w-2 rounded-full bg-emerald-500" title="Online" />
        </div>
      </div>
    </aside>
  );
}
