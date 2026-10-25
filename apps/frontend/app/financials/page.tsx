"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Building2,
  DollarSign,
  FileText,
  RefreshCw,
  TrendingUp,
  Wallet,
} from "lucide-react";
import Sidebar from "../components/Sidebar";

type LedgerEntry = {
  id: string;
  event_id: string;
  account_code: string;
  debit: number | string;
  credit: number | string;
  currency: string;
  reference: string;
  business_date: string;
  created_at: string;
};

type Payable = {
  vendor_id: string;
  currency: string;
  balance: number | string;
  next_due: string;
};

type Balance = {
  account_code: string;
  currency: string;
  debits: number | string;
  credits: number | string;
};

type Vendor = { id: string; name: string };

function fmtDate(raw: unknown) {
  const v = String(raw ?? "");
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(v);
  const d = new Date(isDateOnly ? `${v}T00:00:00Z` : v);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function fmtMoney(raw: unknown) {
  return `KES ${Number(raw || 0).toLocaleString("en-KE", {
    maximumFractionDigits: 0,
  })}`;
}

function daysUntil(raw: unknown) {
  const d = new Date(String(raw));
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export default function FinancialsPage() {
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [payables, setPayables] = useState<Payable[]>([]);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [vendors, setVendors] = useState<Record<string, string>>({});
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const q = new URLSearchParams();
      if (from) q.set("from", from);
      if (to) q.set("to", to);
      const suffix = q.size ? `?${q}` : "";

      const [l, p, b, v] = await Promise.all([
        fetch(`/api/financials/ledger${suffix}`),
        fetch("/api/financials/payables"),
        fetch(`/api/financials/profitability${suffix}`),
        fetch("/api/vendor/vendors?page=1&pageSize=200"),
      ]);

      for (const r of [l, p, b]) {
        if (!r.ok) throw new Error("Financial report service unavailable");
      }

      const [ledgerData, payablesData, balancesData] = await Promise.all([
        l.json(),
        p.json(),
        b.json(),
      ]);

      setLedger(ledgerData);
      setPayables(payablesData);
      setBalances(balancesData);

      if (v.ok) {
        const vData = await v.json();
        const list = vData.items ?? vData;
        setVendors(Object.fromEntries(list.map((x: Vendor) => [x.id, x.name])));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load reports");
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  // Totals
  const revenue = useMemo(
    () =>
      balances
        .filter((b) => b.account_code === "SALES_REVENUE")
        .reduce((s, b) => s + Number(b.credits || 0), 0),
    [balances],
  );

  const cogs = useMemo(
    () =>
      balances
        .filter((b) => b.account_code === "COST_OF_GOODS_SOLD")
        .reduce((s, b) => s + Number(b.debits || 0), 0),
    [balances],
  );

  const grossProfit = revenue - cogs;
  const margin = revenue > 0 ? Math.round((grossProfit / revenue) * 100) : 0;

  const totalPayables = useMemo(
    () => payables.reduce((s, p) => s + Number(p.balance || 0), 0),
    [payables],
  );

  const cashOverShort = useMemo(
    () =>
      balances
        .filter((b) => b.account_code === "CASH_OVER_SHORT")
        .reduce(
          (s, b) => s + Number(b.debits || 0) - Number(b.credits || 0),
          0,
        ),
    [balances],
  );

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <Sidebar />
      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-blue-600">
                <Building2 size={16} /> Finance Portal
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                Financials
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-slate-500 sm:text-base">
                Automated accounting — every sale, receipt, and day-close
                becomes a journal entry.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="From"
              />
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="To"
              />
              <button
                onClick={refresh}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
              >
                <RefreshCw
                  size={16}
                  className={loading ? "animate-spin" : ""}
                />{" "}
                Refresh
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" /> {error}
            </div>
          )}

          {/* Stat cards */}
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Sales Revenue
                  </p>
                  <p className="mt-2 text-2xl font-bold text-slate-950">
                    {fmtMoney(revenue)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    All-time earnings
                  </p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <DollarSign size={21} />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Cost of Goods
                  </p>
                  <p className="mt-2 text-2xl font-bold text-slate-950">
                    {fmtMoney(cogs)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Wholesale value of goods sold
                  </p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <FileText size={21} />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Gross Profit
                  </p>
                  <p
                    className={`mt-2 text-2xl font-bold ${
                      grossProfit >= 0 ? "text-emerald-600" : "text-red-600"
                    }`}
                  >
                    {fmtMoney(grossProfit)}
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                    {grossProfit >= 0 ? (
                      <ArrowUpRight size={12} className="text-emerald-600" />
                    ) : (
                      <ArrowDownRight size={12} className="text-red-600" />
                    )}
                    {margin}% margin
                  </p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <TrendingUp size={21} />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Cash Over/Short
                  </p>
                  <p
                    className={`mt-2 text-2xl font-bold ${
                      cashOverShort < 0
                        ? "text-red-600"
                        : cashOverShort > 0
                          ? "text-amber-600"
                          : "text-slate-950"
                    }`}
                  >
                    {fmtMoney(cashOverShort)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Cumulative variance
                  </p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                  <Wallet size={21} />
                </div>
              </div>
            </div>
          </div>

          {/* Accounts Payable */}
          <section className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="font-semibold text-slate-950">
                  Accounts Payable
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  What we owe suppliers · Total{" "}
                  <span className="font-semibold text-slate-900">
                    {fmtMoney(totalPayables)}
                  </span>
                </p>
              </div>
            </div>
            {loading ? (
              <div className="flex min-h-32 items-center justify-center">
                <RefreshCw size={20} className="animate-spin text-blue-600" />
              </div>
            ) : payables.length === 0 ? (
              <div className="px-6 py-12 text-center text-sm text-slate-500">
                No open supplier balances.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-6 py-3 font-semibold">Supplier</th>
                      <th className="px-6 py-3 font-semibold text-right">
                        Balance
                      </th>
                      <th className="px-6 py-3 font-semibold">Next Due</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {payables.map((p) => {
                      const days = daysUntil(p.next_due);
                      return (
                        <tr
                          key={`${p.vendor_id}-${p.currency}`}
                          className="hover:bg-slate-50"
                        >
                          <td className="px-6 py-4 font-medium text-slate-900">
                            {vendors[p.vendor_id] ??
                              `Vendor ${p.vendor_id.slice(0, 8)}`}
                          </td>
                          <td className="px-6 py-4 text-right font-semibold text-slate-900">
                            {fmtMoney(p.balance)}
                          </td>
                          <td className="px-6 py-4">
                            {fmtDate(p.next_due)}
                            {days !== null && (
                              <span
                                className={`ml-2 text-xs ${
                                  days < 0
                                    ? "text-red-600"
                                    : days < 7
                                      ? "text-amber-600"
                                      : "text-slate-500"
                                }`}
                              >
                                {days < 0
                                  ? `${Math.abs(days)}d overdue`
                                  : `in ${days}d`}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* General Ledger */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="font-semibold text-slate-950">General Ledger</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {ledger.length} journal line{ledger.length === 1 ? "" : "s"}
                  {from || to ? " in selected period" : " (all time)"}
                </p>
              </div>
            </div>

            {loading ? (
              <div className="flex min-h-32 items-center justify-center">
                <RefreshCw size={20} className="animate-spin text-blue-600" />
              </div>
            ) : ledger.length === 0 ? (
              <div className="px-6 py-12 text-center text-sm text-slate-500">
                No ledger entries in this date range.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-6 py-3 font-semibold">Date</th>
                      <th className="px-6 py-3 font-semibold">Account</th>
                      <th className="px-6 py-3 font-semibold text-right">
                        Debit
                      </th>
                      <th className="px-6 py-3 font-semibold text-right">
                        Credit
                      </th>
                      <th className="px-6 py-3 font-semibold">Reference</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {ledger.slice(0, 100).map((l) => {
                      const debit = Number(l.debit || 0);
                      const credit = Number(l.credit || 0);
                      return (
                        <tr key={l.id} className="hover:bg-slate-50">
                          <td className="px-6 py-3 text-slate-500">
                            {fmtDate(l.business_date)}
                          </td>
                          <td className="px-6 py-3">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                              {l.account_code.replaceAll("_", " ")}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-right font-medium text-red-700">
                            {debit > 0 ? fmtMoney(debit) : "—"}
                          </td>
                          <td className="px-6 py-3 text-right font-medium text-emerald-700">
                            {credit > 0 ? fmtMoney(credit) : "—"}
                          </td>
                          <td className="px-6 py-3 font-mono text-xs text-slate-500">
                            {l.reference?.slice(0, 8) ?? "—"}
                          </td>
                        </tr>
                      );
                    })}
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
