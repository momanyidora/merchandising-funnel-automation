"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Package,
  RefreshCw,
  Truck,
  X,
} from "lucide-react";
import Sidebar from "../components/Sidebar";

type Order = {
  id: string;
  vendorId: string;
  status: string;
  createdAt: string;
};

type ReceivableItem = {
  productId: string;
  originalQuantity: number;
  receivedToDate: number;
  remainingQuantity: number;
  lockedUnitCost: number;
};

type Receivable = {
  purchaseOrder: Order;
  items: ReceivableItem[];
};

type Location = { id: string; name: string; code: string };
type Product = { productId: string; productName: string };

type LineItem = ReceivableItem & {
  productName: string;
  receivedQuantity: string;
  condition: "GOOD" | "DAMAGED";
  locationId: string;
};

type Discrepancy = "NONE" | "SHORTAGE" | "OVERAGE" | "DAMAGED";

export default function ReceivingPage() {
  const [pending, setPending] = useState<Receivable[]>([]);
  const [vendorNames, setVendorNames] = useState<Record<string, string>>({});
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [activePO, setActivePO] = useState<string | null>(null);
  const [lines, setLines] = useState<LineItem[]>([]);
  const [lineLoading, setLineLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function loadPending() {
    try {
      setLoading(true);
      setError("");

      const [poRes, vRes, lRes] = await Promise.all([
        fetch("/api/procurement/purchase-orders"),
        fetch("/api/vendor/vendors?page=1&pageSize=200"),
        fetch("/api/inventory/locations"),
      ]);

      if (!poRes.ok) throw new Error("Failed to load purchase orders");

      const poData = (await poRes.json()) as Order[];
      const approved = poData.filter((o) => o.status === "APPROVED");

      if (vRes.ok) {
        const vData = await vRes.json();
        const list = vData.items ?? vData;
        setVendorNames(
          Object.fromEntries(
            list.map((v: { id: string; name: string }) => [v.id, v.name]),
          ),
        );
      }

      if (lRes.ok) setLocations(await lRes.json());

      const details = await Promise.all(
        approved.map(async (o) => {
          try {
            const r = await fetch(`/api/receiving/receivable/${o.id}`);
            if (!r.ok) return null;
            return (await r.json()) as Receivable;
          } catch {
            return null;
          }
        }),
      );

      setPending(
        details.filter(
          (r): r is Receivable =>
            r !== null && r.items.some((i) => i.remainingQuantity > 0),
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void loadPending(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function openReceive(poId: string) {
    setActivePO(poId);
    setLineLoading(true);
    setSuccess("");
    setError("");
    try {
      const r = await fetch(`/api/receiving/receivable/${poId}`);
      if (!r.ok) throw new Error("Failed to load receivable");
      const data = (await r.json()) as Receivable;

      const ids = data.items.map((i) => i.productId);
      const pr = await fetch(
        `/api/inventory/products?ids=${encodeURIComponent(ids.join(","))}`,
      );
      const products: Product[] = pr.ok ? await pr.json() : [];
      const map: Record<string, string> = {};
      products.forEach((p) => {
        map[p.productId] = p.productName;
      });
      ids.forEach((id) => {
        if (!map[id]) map[id] = `Product ${id.slice(0, 8)}`;
      });

      setLines(
        data.items
          .filter((i) => i.remainingQuantity > 0)
          .map((i) => ({
            ...i,
            productName: map[i.productId] ?? "Unknown product",
            receivedQuantity: String(i.remainingQuantity),
            condition: "GOOD" as const,
            locationId: locations[0]?.id ?? "",
          })),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
      setActivePO(null);
    } finally {
      setLineLoading(false);
    }
  }

  function closeModal() {
    setActivePO(null);
    setLines([]);
  }

  function predictDiscrepancy(line: LineItem): Discrepancy {
    const received = Number(line.receivedQuantity);
    if (line.condition === "DAMAGED" && received > 0) return "DAMAGED";
    if (!Number.isFinite(received) || received < 0) return "NONE";
    if (received < line.remainingQuantity) return "SHORTAGE";
    if (received > line.remainingQuantity) return "OVERAGE";
    return "NONE";
  }

  async function submitReceipt() {
    if (!activePO) return;
    setSubmitting(true);
    setError("");
    try {
      const payload = {
        purchaseOrderId: activePO,
        items: lines
          .filter((l) => Number(l.receivedQuantity) > 0)
          .map((l) => ({
            productId: l.productId,
            productName: l.productName,
            receivedQuantity: Number(l.receivedQuantity),
            condition: l.condition,
            locationId: l.locationId,
          })),
      };

      if (payload.items.length === 0) {
        throw new Error("Enter at least one quantity to receive.");
      }

      const res = await fetch("/api/receiving", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to record receipt");

      const discCount = data.items.filter(
        (i: { discrepancyType: string }) => i.discrepancyType !== "NONE",
      ).length;

      setSuccess(
        `GRN ${data.receipt.grnNumber} recorded (${data.receipt.status})${
          discCount > 0 ? ` · ${discCount} discrepancies` : ""
        }. Inventory and Warehouse have been notified.`,
      );
      closeModal();
      await loadPending();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record receipt");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <Sidebar />
      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-blue-600">
                <Truck size={16} /> Receiving
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                Goods Receiving
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-slate-500 sm:text-base">
                Receive deliveries against approved purchase orders, record
                discrepancies, and generate GRNs.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                onClick={loadPending}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
              >
                <RefreshCw
                  size={16}
                  className={loading ? "animate-spin" : ""}
                />{" "}
                Refresh
              </button>
              <Link
                href="/receiving/reliability"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
              >
                <ClipboardCheck size={16} /> Supplier Reliability
              </Link>
            </div>
          </div>

          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" /> {error}
            </div>
          )}

          {success && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> {success}
            </div>
          )}

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Package size={20} />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-950">
                    Pending Deliveries
                  </h2>
                  <p className="text-sm text-slate-500">
                    {pending.length} purchase order
                    {pending.length === 1 ? "" : "s"} waiting to be received
                  </p>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex min-h-64 flex-col items-center justify-center py-12">
                <RefreshCw
                  size={24}
                  className="mb-3 animate-spin text-blue-600"
                />
                <p className="text-sm text-slate-500">
                  Loading pending deliveries…
                </p>
              </div>
            ) : pending.length === 0 ? (
              <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
                <Package size={32} className="text-slate-300" />
                <h3 className="mt-4 font-semibold text-slate-900">
                  No pending deliveries
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Approved purchase orders with outstanding items will appear
                  here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {pending.map((r) => {
                  const itemCount = r.items.filter(
                    (i) => i.remainingQuantity > 0,
                  ).length;
                  const units = r.items.reduce(
                    (s, i) => s + i.remainingQuantity,
                    0,
                  );
                  return (
                    <div
                      key={r.purchaseOrder.id}
                      className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex min-w-0 items-start gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                          <Truck size={19} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-950">
                            {vendorNames[r.purchaseOrder.vendorId] ??
                              "Unknown vendor"}
                          </p>
                          <p className="text-sm text-slate-500">
                            PO {r.purchaseOrder.id.slice(0, 8)} · {itemCount}{" "}
                            item{itemCount === 1 ? "" : "s"} · {units} unit
                            {units === 1 ? "" : "s"} expected
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => openReceive(r.purchaseOrder.id)}
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
                      >
                        Receive
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>

      {activePO && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4">
          <div
            className="absolute inset-0 bg-slate-900/40"
            onClick={closeModal}
          />
          <div className="relative my-8 w-full max-w-4xl rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 flex items-start justify-between border-b border-slate-200 bg-white px-6 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                  Receiving
                </p>
                <h2 className="mt-1 text-xl font-bold text-slate-950">
                  PO {activePO.slice(0, 8)}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Enter received quantities. Discrepancies are flagged
                  automatically.
                </p>
              </div>
              <button
                onClick={closeModal}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            {lineLoading ? (
              <div className="flex items-center justify-center py-16">
                <RefreshCw size={20} className="animate-spin text-blue-600" />
              </div>
            ) : (
              <div className="space-y-4 p-6">
                {lines.map((line, i) => {
                  const disc = predictDiscrepancy(line);
                  return (
                    <div
                      key={line.productId}
                      className="rounded-xl border border-slate-200 bg-white p-4"
                    >
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-slate-900">
                          {line.productName}
                        </p>
                        {disc !== "NONE" && (
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                              disc === "SHORTAGE"
                                ? "bg-amber-50 text-amber-700"
                                : disc === "OVERAGE"
                                  ? "bg-orange-50 text-orange-700"
                                  : "bg-red-50 text-red-700"
                            }`}
                          >
                            {disc}
                          </span>
                        )}
                      </div>
                      <div className="grid gap-3 sm:grid-cols-4">
                        <div>
                          <p className="text-xs text-slate-500">Remaining</p>
                          <p className="text-sm font-semibold text-slate-900">
                            {line.remainingQuantity}
                          </p>
                        </div>
                        <label className="text-xs font-medium text-slate-700">
                          Received
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={line.receivedQuantity}
                            onChange={(e) =>
                              setLines(
                                lines.map((l, idx) =>
                                  idx === i
                                    ? { ...l, receivedQuantity: e.target.value }
                                    : l,
                                ),
                              )
                            }
                            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                          />
                        </label>
                        <label className="text-xs font-medium text-slate-700">
                          Condition
                          <select
                            value={line.condition}
                            onChange={(e) =>
                              setLines(
                                lines.map((l, idx) =>
                                  idx === i
                                    ? {
                                        ...l,
                                        condition: e.target.value as
                                          | "GOOD"
                                          | "DAMAGED",
                                      }
                                    : l,
                                ),
                              )
                            }
                            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                          >
                            <option value="GOOD">Good</option>
                            <option value="DAMAGED">Damaged</option>
                          </select>
                        </label>
                        <label className="text-xs font-medium text-slate-700">
                          Location
                          <select
                            value={line.locationId}
                            onChange={(e) =>
                              setLines(
                                lines.map((l, idx) =>
                                  idx === i
                                    ? { ...l, locationId: e.target.value }
                                    : l,
                                ),
                              )
                            }
                            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                          >
                            {locations.map((loc) => (
                              <option key={loc.id} value={loc.id}>
                                {loc.name} ({loc.code})
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="sticky bottom-0 flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4">
              <button
                onClick={closeModal}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={submitReceipt}
                disabled={submitting || lineLoading}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
              >
                {submitting && <RefreshCw size={14} className="animate-spin" />}
                {submitting ? "Submitting…" : "Complete Receipt"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
