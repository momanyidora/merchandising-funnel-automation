"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Receipt, RefreshCw } from "lucide-react";
import Sidebar from "../../components/Sidebar";

type Sale = {
  id: string;
  store_id: string;
  register_id: string;
  cashier_id: string;
  total: number;
  currency: string;
  status: string;
  created_at: string;
};

export default function SalesHistoryPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    try {
      setLoading(true);
      const r = await fetch("/api/sales");
      if (!r.ok) throw new Error("Failed to load sales");
      const data = await r.json();
      setSales(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load sales");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <Sidebar />
      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <Link
            href="/sales"
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600"
          >
            <ArrowLeft size={16} /> Back to POS
          </Link>

          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-blue-600">
                <Receipt size={16} /> Retail Sales
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                Sales History
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Every completed transaction across all stores.
              </p>
            </div>
            <button
              onClick={load}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />{" "}
              Refresh
            </button>
          </div>

          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {loading ? (
              <div className="flex min-h-64 items-center justify-center">
                <RefreshCw size={20} className="animate-spin text-blue-600" />
              </div>
            ) : sales.length === 0 ? (
              <div className="flex min-h-64 flex-col items-center justify-center p-12 text-center">
                <Receipt size={32} className="text-slate-300" />
                <h3 className="mt-4 font-semibold text-slate-900">
                  No sales yet
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Complete your first sale from the POS to see it here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-6 py-3 font-semibold">Sale ID</th>
                      <th className="px-6 py-3 font-semibold">Store</th>
                      <th className="px-6 py-3 font-semibold">Register</th>
                      <th className="px-6 py-3 font-semibold">Cashier</th>
                      <th className="px-6 py-3 font-semibold text-right">
                        Total
                      </th>
                      <th className="px-6 py-3 font-semibold">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sales.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 font-mono text-xs text-slate-900">
                          #{s.id.slice(0, 8)}
                        </td>
                        <td className="px-6 py-4 text-slate-700">
                          {s.store_id}
                        </td>
                        <td className="px-6 py-4 text-slate-700">
                          {s.register_id}
                        </td>
                        <td className="px-6 py-4 text-slate-700">
                          {s.cashier_id}
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-slate-900">
                          {s.currency} {Number(s.total).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-slate-500">
                          {new Date(s.created_at).toLocaleString("en-KE", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
