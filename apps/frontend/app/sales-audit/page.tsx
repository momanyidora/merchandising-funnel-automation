"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  DollarSign,
  RefreshCw,
  Shield,
  Store,
  XCircle,
} from "lucide-react";
import Sidebar from "../components/Sidebar";

type Audit = {
  id: string;
  store_name: string;
  register_name: string;
  cashier_name: string;
  business_date: string;
  expected_total: number;
  actual_total: number;
  variance: number;
  manager_name: string;
  explanation: string;
  status: string;
};

function todayLocal() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
}

export default function SalesAuditPage() {
  const [storeName, setStoreName] = useState("");
  const [registerName, setRegisterName] = useState("");
  const [cashierName, setCashierName] = useState("");
  const [managerName, setManagerName] = useState("");
  const [businessDate, setBusinessDate] = useState(todayLocal());
  const [counts, setCounts] = useState({ CASH: "", CARD: "", GIFT_CARD: "" });
  const [explanation, setExplanation] = useState("");
  const [audits, setAudits] = useState<Audit[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    try {
      setLoading(true);
      const r = await fetch("/api/sales-audit");
      if (!r.ok) throw new Error("Unable to load audit history");
      const data = (await r.json()) as Audit[];
      setAudits(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load audits");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function closeRegister(e: FormEvent) {
    e.preventDefault();
    setError("");
    setNotice("");

    const values = Object.values(counts).map(Number);
    if (values.some((x) => !Number.isSafeInteger(x) || x < 0)) {
      return setError(
        "Each tender count must be a non-negative whole KES amount.",
      );
    }
    if (!managerName.trim() || explanation.trim().length < 8) {
      return setError(
        "A manager name and an explanation of at least 8 characters is required.",
      );
    }

    setBusy(true);
    try {
      const r = await fetch("/api/sales-audit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          storeName,
          registerName,
          cashierName,
          managerName,
          businessDate,
          currency: "KES",
          counts: Object.entries(counts).map(([method, actual]) => ({
            method,
            actual: Number(actual),
          })),
          explanation,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Could not close register");
      setNotice(
        `Register closed. Expected KES ${Number(d.expected_total).toLocaleString()} · counted KES ${Number(d.actual_total).toLocaleString()} · variance KES ${Number(d.variance).toLocaleString()} (${d.eventStatus || "queued"})`,
      );
      setCounts({ CASH: "", CARD: "", GIFT_CARD: "" });
      setExplanation("");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Audit failed");
    } finally {
      setBusy(false);
    }
  }

  // Stats
  const totals = useMemo(() => {
    const totalVariance = audits.reduce((s, a) => s + Number(a.variance), 0);
    const shortages = audits.filter((a) => Number(a.variance) < 0).length;
    const overages = audits.filter((a) => Number(a.variance) > 0).length;
    return {
      totalVariance,
      shortages,
      overages,
      count: audits.length,
    };
  }, [audits]);

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <Sidebar />
      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-blue-600">
                <Shield size={16} /> Sales Audit
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                Store Close
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-slate-500 sm:text-base">
                Compare POS tender totals to the physical drawer and card slips.
                A manager explanation is required before close.
              </p>
            </div>
            <button
              onClick={refresh}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />{" "}
              Refresh
            </button>
          </div>

          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <XCircle size={16} className="mt-0.5 shrink-0" /> {error}
            </div>
          )}
          {notice && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> {notice}
            </div>
          )}

          {/* Stats */}
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Registers Closed
                  </p>
                  <p className="mt-2 text-3xl font-bold text-slate-950">
                    {totals.count}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">All time</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Store size={21} />
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Net Variance
                  </p>
                  <p
                    className={`mt-2 text-3xl font-bold ${
                      totals.totalVariance < 0
                        ? "text-red-600"
                        : totals.totalVariance > 0
                          ? "text-emerald-600"
                          : "text-slate-950"
                    }`}
                  >
                    KES {Math.abs(totals.totalVariance).toLocaleString()}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {totals.totalVariance < 0
                      ? "Overall shortage"
                      : totals.totalVariance > 0
                        ? "Overall overage"
                        : "Balanced"}
                  </p>
                </div>
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${totals.totalVariance < 0 ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"}`}
                >
                  <DollarSign size={21} />
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Shortages
                  </p>
                  <p
                    className={`mt-2 text-3xl font-bold ${totals.shortages > 0 ? "text-red-600" : "text-slate-950"}`}
                  >
                    {totals.shortages}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Registers below expected
                  </p>
                </div>
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${totals.shortages > 0 ? "bg-red-50 text-red-600" : "bg-slate-100 text-slate-400"}`}
                >
                  <AlertTriangle size={21} />
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Overages</p>
                  <p
                    className={`mt-2 text-3xl font-bold ${totals.overages > 0 ? "text-emerald-600" : "text-slate-950"}`}
                  >
                    {totals.overages}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Registers above expected
                  </p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <ClipboardCheck size={21} />
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <form
            onSubmit={closeRegister}
            className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            <div className="border-b border-slate-200 px-6 py-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Shield size={20} />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-950">
                    Close Register
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Enter the physical counts for each tender method. The system
                    compares against POS totals.
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-5 p-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Store
                  </label>
                  <input
                    required
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="e.g. western point"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Register
                  </label>
                  <input
                    required
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    placeholder="e.g. register 2"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Cashier
                  </label>
                  <input
                    required
                    value={cashierName}
                    onChange={(e) => setCashierName(e.target.value)}
                    placeholder="e.g. jane doe"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Manager
                  </label>
                  <input
                    required
                    value={managerName}
                    onChange={(e) => setManagerName(e.target.value)}
                    placeholder="Your name"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Business date
                </label>
                <input
                  type="date"
                  value={businessDate}
                  onChange={(e) => setBusinessDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-60"
                />
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold text-slate-700">
                  Physical counts (KES)
                </p>
                <div className="grid gap-4 sm:grid-cols-3">
                  {[
                    { method: "CASH", label: "Cash counted" },
                    { method: "CARD", label: "Card slips total" },
                    { method: "GIFT_CARD", label: "Gift cards total" },
                  ].map(({ method, label }) => (
                    <div key={method}>
                      <label className="mb-1.5 block text-xs font-medium text-slate-500">
                        {label}
                      </label>
                      <input
                        required
                        type="number"
                        min="0"
                        step="1"
                        value={counts[method as keyof typeof counts]}
                        onChange={(e) =>
                          setCounts({ ...counts, [method]: e.target.value })
                        }
                        placeholder="0"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Manager explanation
                </label>
                <textarea
                  required
                  rows={3}
                  minLength={8}
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  placeholder="Explain any cash overage or shortage (required even if balanced)…"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div className="flex justify-end border-t border-slate-200 bg-slate-50 px-6 py-4">
              <button
                type="submit"
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {busy && <RefreshCw size={14} className="animate-spin" />}
                {busy ? "Reconciling…" : "Reconcile & Close Register"}
              </button>
            </div>
          </form>

          {/* History */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-5">
              <h2 className="font-semibold text-slate-950">
                Recent Reconciliations
              </h2>
              <p className="text-sm text-slate-500">
                Every closed register with its variance explanation and manager
                sign-off.
              </p>
            </div>

            {loading ? (
              <div className="flex min-h-64 items-center justify-center">
                <RefreshCw size={20} className="animate-spin text-blue-600" />
              </div>
            ) : audits.length === 0 ? (
              <div className="flex min-h-64 flex-col items-center justify-center p-12 text-center">
                <Shield size={32} className="text-slate-300" />
                <h3 className="mt-4 font-semibold text-slate-900">
                  No reconciliations recorded
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Close your first register above to start the audit log.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {audits.map((a) => {
                  const v = Number(a.variance);
                  const badgeClass =
                    v < 0
                      ? "bg-red-50 text-red-700"
                      : v > 0
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-600";
                  return (
                    <div
                      key={a.id}
                      className="grid gap-3 p-5 sm:grid-cols-[1fr_auto]"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-slate-900">
                            {a.store_name} · {a.register_name}
                          </p>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badgeClass}`}
                          >
                            {v < 0
                              ? "SHORTAGE"
                              : v > 0
                                ? "OVERAGE"
                                : "BALANCED"}
                          </span>
                          <span className="text-xs text-slate-500">
                            {new Date(a.business_date).toLocaleDateString(
                              "en-KE",
                              {
                                dateStyle: "medium",
                              },
                            )}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-slate-500">
                          Cashier: {a.cashier_name} · Manager: {a.manager_name}
                        </p>
                        <p className="mt-2 text-xs text-slate-500">
                          Expected KES{" "}
                          {Number(a.expected_total).toLocaleString()} · Counted
                          KES {Number(a.actual_total).toLocaleString()} ·
                          Variance KES {v.toLocaleString()}
                        </p>
                        <p className="mt-2 text-sm italic text-slate-600">
                          &quot;{a.explanation}&quot;
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
