"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  CreditCard,
  DollarSign,
  Gift,
  Plus,
  Receipt,
  RefreshCw,
  ShoppingCart,
  Store,
  Trash2,
  User,
  XCircle,
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import ProductPicker from "../components/ProductPicker";

type Location = { id: string; name: string; code: string };

type Line = {
  key: string;
  productId: string;
  productName: string;
  quantity: string;
  unitPrice: string;
  locationId: string;
};

type Sale = {
  id: string;
  store_id: string;
  register_id: string;
  cashier_id: string;
  total: number;
  currency: string;
  status: string;
  created_at: string;
  items?: Array<{
    id: string;
    product_id: string;
    quantity: number;
    unit_price: number;
  }>;
};

const TAX_RATE = 16;
let lineSequence = 0;

function emptyLine(key: string): Line {
  return {
    key,
    productId: "",
    productName: "",
    quantity: "1",
    unitPrice: "",
    locationId: "",
  };
}

export default function SalesPage() {
  // Cashier session (persisted)
  const [storeName, setStoreName] = useState("");
  const [registerName, setRegisterName] = useState("");
  const [cashierName, setCashierName] = useState("");

  const [locations, setLocations] = useState<Location[]>([]);
  // Keep the initial key deterministic: this state is created during server
  // rendering too, where browser crypto APIs may not be available.
  const [lines, setLines] = useState<Line[]>([emptyLine("initial-line")]);
  const [method, setMethod] = useState("CASH");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [priceCache, setPriceCache] = useState<
    Record<string, { retailPrice: number; taxRate: number }>
  >({});

  // Load session from localStorage
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setStoreName(localStorage.getItem("pos.store") ?? "");
      setRegisterName(localStorage.getItem("pos.register") ?? "");
      setCashierName(localStorage.getItem("pos.cashier") ?? "");
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  // Persist session
  useEffect(() => {
    if (storeName) localStorage.setItem("pos.store", storeName);
    if (registerName) localStorage.setItem("pos.register", registerName);
    if (cashierName) localStorage.setItem("pos.cashier", cashierName);
  }, [storeName, registerName, cashierName]);

  // Load locations + recent sales
  useEffect(() => {
    fetch("/api/inventory/locations")
      .then((r) => (r.ok ? r.json() : []))
      .then(setLocations)
      .catch(() => setLocations([]));
  }, []);

  async function loadRecentSales() {
    try {
      const r = await fetch("/api/sales");
      if (!r.ok) return;
      const data = await r.json();
      setRecentSales(data.slice(0, 5));
    } catch {
      // silent
    }
  }
  useEffect(() => {
    const timer = window.setTimeout(() => void loadRecentSales(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  // Fetch price when a product is picked
  async function fetchPriceFor(productId: string) {
    if (!productId || priceCache[productId]) return;
    try {
      const r = await fetch(`/api/prices?ids=${encodeURIComponent(productId)}`);
      if (!r.ok) return;
      const rows = (await r.json()) as Array<{
        productId: string;
        retailPrice: number;
        taxRate: number;
      }>;
      const row = rows[0];
      if (!row) return;
      setPriceCache((prev) => ({
        ...prev,
        [productId]: { retailPrice: row.retailPrice, taxRate: row.taxRate },
      }));
      // Auto-fill unit price in matching line
      setLines((prev) =>
        prev.map((l) =>
          l.productId === productId && !l.unitPrice
            ? { ...l, unitPrice: String(row.retailPrice) }
            : l,
        ),
      );
    } catch {
      // silent
    }
  }

  function updateLine(index: number, patch: Partial<Line>) {
    setLines((prev) =>
      prev.map((l, i) => (i === index ? { ...l, ...patch } : l)),
    );
  }

  function removeLine(index: number) {
    setLines((prev) =>
      prev.length === 1
        ? [emptyLine(`line-${++lineSequence}`)]
        : prev.filter((_, i) => i !== index),
    );
  }

  function addLine() {
    setLines((prev) => [...prev, emptyLine(`line-${++lineSequence}`)]);
  }

  // Totals
  const subtotal = useMemo(() => {
    return lines.reduce((n, l) => {
      const q = Number(l.quantity) || 0;
      const p = Number(l.unitPrice) || 0;
      return n + q * p;
    }, 0);
  }, [lines]);

  const tax = Math.round((subtotal * TAX_RATE) / (100 + TAX_RATE));
  const total = subtotal;
  const tendered = Number(paymentAmount) || 0;
  const change = tendered - total;

  // Live totals for the "Complete sale" button
  const canSell =
    storeName.trim().length > 0 &&
    registerName.trim().length > 0 &&
    cashierName.trim().length > 0 &&
    lines.every(
      (l) =>
        l.productId &&
        l.locationId &&
        Number(l.quantity) > 0 &&
        Number(l.unitPrice) >= 0,
    ) &&
    tendered >= total;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!storeName.trim() || !registerName.trim() || !cashierName.trim()) {
      return setError("Enter store, register, and cashier names.");
    }
    if (
      lines.some(
        (l) =>
          !l.productId ||
          !l.locationId ||
          !Number.isSafeInteger(Number(l.quantity)) ||
          Number(l.quantity) < 1 ||
          !Number.isSafeInteger(Number(l.unitPrice)) ||
          Number(l.unitPrice) < 0,
      )
    ) {
      return setError(
        "Every line needs a product, location, whole-number quantity, and a KES price.",
      );
    }
    if (tendered < total) {
      return setError(
        `Tendered amount must be at least KES ${total.toLocaleString()}.`,
      );
    }

    setBusy(true);
    try {
      const response = await fetch("/api/sales", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          storeName: storeName.trim(),
          registerName: registerName.trim(),
          cashierName: cashierName.trim(),
          currency: "KES",
          items: lines.map((l) => ({
            productId: l.productId,
            quantity: Number(l.quantity),
            unitPrice: Number(l.unitPrice),
            locationId: l.locationId,
          })),
          payments: [{ method, amount: tendered }],
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Sale failed");

      setSuccess(
        `Sale completed · ${data.id.slice(0, 8)} · KES ${total.toLocaleString()}`,
      );
      setLines([emptyLine(`line-${++lineSequence}`)]);
      setPaymentAmount("");
      await loadRecentSales();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sale failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <Sidebar />
      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-blue-600">
                <Store size={16} /> Retail Sales · POS
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                Point of Sale
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-slate-500 sm:text-base">
                Scan products, apply pricing, tender payment, and complete the
                sale.
              </p>
            </div>
            <Link
              href="/sales/recent"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              <Receipt size={16} /> Sales History
            </Link>
          </div>

          {/* Session */}
          <div className="mb-6 grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-3">
            <div>
              <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <Store size={12} /> Store
              </label>
              <input
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="e.g. Westlands Branch"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
              />
            </div>
            <div>
              <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <BadgeCheck size={12} /> Register
              </label>
              <input
                value={registerName}
                onChange={(e) => setRegisterName(e.target.value)}
                placeholder="e.g. Register #2"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
              />
            </div>
            <div>
              <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <User size={12} /> Cashier
              </label>
              <input
                value={cashierName}
                onChange={(e) => setCashierName(e.target.value)}
                placeholder="e.g. Jane W."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
              />
            </div>
          </div>

          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <XCircle size={16} className="mt-0.5 shrink-0" /> {error}
            </div>
          )}
          {success && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> {success}
            </div>
          )}

          <form
            onSubmit={submit}
            className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]"
          >
            {/* Cart */}
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <div className="flex items-center gap-2">
                  <ShoppingCart size={18} className="text-blue-600" />
                  <h2 className="font-semibold text-slate-950">Cart</h2>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                    {lines.length} {lines.length === 1 ? "item" : "items"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={addLine}
                  className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                >
                  <Plus size={12} /> Add Item
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {lines.map((line, index) => (
                  <div
                    key={line.key}
                    className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)_70px_100px_100px_32px]"
                  >
                    <div>
                      <ProductPicker
                        value={line.productId}
                        onChange={(id) => {
                          updateLine(index, { productId: id });
                          void fetchPriceFor(id);
                        }}
                        onProduct={(
                          p: { productId: string; productName: string } | null,
                        ) =>
                          updateLine(index, {
                            productName: p?.productName ?? "",
                          })
                        }
                      />
                      {line.productName && (
                        <p className="mt-1 text-xs text-slate-500">
                          {line.productName}
                        </p>
                      )}
                    </div>
                    <select
                      value={line.locationId}
                      onChange={(e) =>
                        updateLine(index, { locationId: e.target.value })
                      }
                      required
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    >
                      <option value="">Stock location</option>
                      {locations.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={line.quantity}
                      onChange={(e) =>
                        updateLine(index, { quantity: e.target.value })
                      }
                      required
                      placeholder="Qty"
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={line.unitPrice}
                      onChange={(e) =>
                        updateLine(index, { unitPrice: e.target.value })
                      }
                      required
                      placeholder="Price KES"
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                    <p className="self-center text-right text-sm font-semibold text-slate-900">
                      KES{" "}
                      {(
                        (Number(line.quantity) || 0) *
                        (Number(line.unitPrice) || 0)
                      ).toLocaleString()}
                    </p>
                    <button
                      type="button"
                      onClick={() => removeLine(index)}
                      className="self-center text-slate-400 hover:text-red-600"
                      aria-label="Remove"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* Summary + payment */}
            <aside className="h-fit space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div>
                <h2 className="mb-3 font-semibold text-slate-950">Summary</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span>KES {subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-xs">
                      VAT ({TAX_RATE}% · included in prices)
                    </span>
                    <span className="text-xs">KES {tax.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-200 pt-2 text-base font-bold text-slate-950">
                    <span>Total</span>
                    <span>KES {total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="mb-2 font-semibold text-slate-950">
                  Payment Method
                </h2>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "CASH", label: "Cash", icon: DollarSign },
                    { value: "CARD", label: "Card", icon: CreditCard },
                    { value: "GIFT_CARD", label: "Gift", icon: Gift },
                  ].map((opt) => {
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setMethod(opt.value)}
                        className={`flex flex-col items-center gap-1 rounded-lg border px-2 py-3 text-xs font-semibold transition ${
                          method === opt.value
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <Icon size={16} />
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Amount Tendered (KES)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder={String(total)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                />
              </div>

              <div
                className={`rounded-lg px-3 py-2.5 text-sm ${
                  change >= 0
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                <div className="flex justify-between font-semibold">
                  <span>{change >= 0 ? "Change Due" : "Still Owing"}</span>
                  <span>KES {Math.abs(change).toLocaleString()}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={busy || !canSell}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <ArrowRight size={14} />
                )}
                {busy ? "Processing…" : "Complete Sale"}
              </button>
            </aside>
          </form>

          {/* Recent sales */}
          {recentSales.length > 0 && (
            <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <div className="flex items-center gap-2">
                  <Receipt size={18} className="text-blue-600" />
                  <h2 className="font-semibold text-slate-950">Recent Sales</h2>
                </div>
                <Link
                  href="/sales/recent"
                  className="text-xs font-semibold text-blue-600 hover:underline"
                >
                  View all →
                </Link>
              </div>
              <div className="divide-y divide-slate-100">
                {recentSales.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between px-5 py-3 text-sm"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">
                        #{s.id.slice(0, 8)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {s.store_id} · {s.register_id} · {s.cashier_id}
                      </p>
                    </div>
                    <p className="font-semibold text-slate-900">
                      {s.currency} {Number(s.total).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
