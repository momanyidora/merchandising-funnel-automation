"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  RefreshCw,
  Truck,
  XCircle,
} from "lucide-react";
import Sidebar from "../../components/Sidebar";

type Vendor = { id: string; name: string };
type Order = {
  id: string;
  vendorId: string;
  status: string;
  createdAt: string;
};

type ReliabilityForm = {
  purchaseOrderId: string;
  expectedDate: string;
  actualDate: string;
  expectedQuantity: string;
  receivedQuantity: string;
  status: "ON_TIME" | "LATE" | "SHORT" | "OVERAGE" | "DAMAGED";
  notes: string;
};

export default function ReliabilityPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [form, setForm] = useState<ReliabilityForm>({
    purchaseOrderId: "",
    expectedDate: "",
    actualDate: "",
    expectedQuantity: "",
    receivedQuantity: "",
    status: "ON_TIME",
    notes: "",
  });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/procurement/purchase-orders").then((r) => r.json()),
      fetch("/api/vendor/vendors?page=1&pageSize=200").then((r) => r.json()),
    ])
      .then(([po, v]) => {
        setOrders(po);
        setVendors(v.items ?? v);
      })
      .catch(() => setError("Unable to load purchase orders or vendors."))
      .finally(() => setLoading(false));
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");

    const expectedQuantity = Number(form.expectedQuantity);
    const receivedQuantity = Number(form.receivedQuantity);

    if (
      !form.purchaseOrderId ||
      !form.expectedDate ||
      !form.actualDate ||
      !Number.isSafeInteger(expectedQuantity) ||
      expectedQuantity < 0 ||
      !Number.isSafeInteger(receivedQuantity) ||
      receivedQuantity < 0
    ) {
      setError(
        "Choose a purchase order, enter both delivery dates, and enter whole-number quantities.",
      );
      return;
    }

    const selectedOrder = orders.find((o) => o.id === form.purchaseOrderId);
    if (!selectedOrder) {
      setError("Selected purchase order could not be found.");
      return;
    }

    setBusy(true);
    try {
      const r = await fetch(
        `/api/vendor/vendors/${selectedOrder.vendorId}/reliability`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            purchaseOrderId: form.purchaseOrderId,
            expectedDeliveryDate: form.expectedDate,
            actualDeliveryDate: form.actualDate,
            expectedQuantity,
            receivedQuantity,
            status: form.status,
            notes: form.notes.trim(),
          }),
        },
      );
      const data = await r.json();
      if (!r.ok)
        throw new Error(data.error || "Reliability record could not be saved.");

      setMessage("Supplier reliability record saved.");
      setForm({
        purchaseOrderId: "",
        expectedDate: "",
        actualDate: "",
        expectedQuantity: "",
        receivedQuantity: "",
        status: "ON_TIME",
        notes: "",
      });
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Reliability record could not be saved.",
      );
    } finally {
      setBusy(false);
    }
  }

  const selectedOrder = orders.find((o) => o.id === form.purchaseOrderId);
  const selectedVendor = selectedOrder
    ? vendors.find((v) => v.id === selectedOrder.vendorId)
    : undefined;

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <Sidebar />
      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
          <Link
            href="/receiving"
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600"
          >
            <ArrowLeft size={16} /> Back to Receiving
          </Link>

          <div className="mb-8">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-blue-600">
              <ClipboardCheck size={16} /> Supplier Performance
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              Reliability History
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-500 sm:text-base">
              Record how a supplier performed against the expected delivery for
              a purchase order.
            </p>
          </div>

          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <XCircle size={16} className="mt-0.5 shrink-0" /> {error}
            </div>
          )}
          {message && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> {message}
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <form
              onSubmit={submit}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="border-b border-slate-200 px-6 py-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Truck size={20} />
                  </div>
                  <div>
                    <h2 className="font-semibold text-slate-950">
                      Delivery Record
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Provide the details of the delivery you&apos;re evaluating.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-5 p-6">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Purchase Order
                  </label>
                  <select
                    required
                    value={form.purchaseOrderId}
                    onChange={(e) =>
                      setForm({ ...form, purchaseOrderId: e.target.value })
                    }
                    disabled={loading}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">
                      {loading
                        ? "Loading purchase orders…"
                        : "Select purchase order"}
                    </option>
                    {orders.map((order) => {
                      const vendor = vendors.find(
                        (v) => v.id === order.vendorId,
                      );
                      return (
                        <option key={order.id} value={order.id}>
                          {vendor?.name ?? "Unknown vendor"} · PO{" "}
                          {order.id.slice(0, 8)}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Supplier
                  </label>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm">
                    {selectedVendor ? (
                      <span className="font-medium text-slate-900">
                        {selectedVendor.name}
                      </span>
                    ) : (
                      <span className="text-slate-400">
                        Select a purchase order first
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Expected delivery date
                    </label>
                    <input
                      required
                      type="date"
                      value={form.expectedDate}
                      onChange={(e) =>
                        setForm({ ...form, expectedDate: e.target.value })
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Actual delivery date
                    </label>
                    <input
                      required
                      type="date"
                      value={form.actualDate}
                      onChange={(e) =>
                        setForm({ ...form, actualDate: e.target.value })
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Expected quantity
                    </label>
                    <input
                      required
                      type="number"
                      min="0"
                      step="1"
                      value={form.expectedQuantity}
                      onChange={(e) =>
                        setForm({ ...form, expectedQuantity: e.target.value })
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Received quantity
                    </label>
                    <input
                      required
                      type="number"
                      min="0"
                      step="1"
                      value={form.receivedQuantity}
                      onChange={(e) =>
                        setForm({ ...form, receivedQuantity: e.target.value })
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Delivery status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        status: e.target.value as ReliabilityForm["status"],
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="ON_TIME">On time</option>
                    <option value="LATE">Late</option>
                    <option value="SHORT">Short delivery</option>
                    <option value="OVERAGE">Overage</option>
                    <option value="DAMAGED">Damaged</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Notes
                  </label>
                  <textarea
                    value={form.notes}
                    onChange={(e) =>
                      setForm({ ...form, notes: e.target.value })
                    }
                    rows={4}
                    placeholder="Add any notes about the supplier delivery…"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
                <Link
                  href="/receiving"
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 text-center"
                >
                  Cancel
                </Link>
                <button
                  disabled={busy}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {busy && <RefreshCw size={14} className="animate-spin" />}
                  {busy ? "Saving…" : "Record Reliability"}
                </button>
              </div>
            </form>

            <aside className="h-fit overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-5 py-4">
                <h2 className="font-semibold text-slate-950">
                  Why record this?
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Supplier reliability helps Procurement pick the best
                  suppliers.
                </p>
              </div>
              <div className="space-y-4 p-5 text-sm text-slate-600">
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-700">
                    1
                  </div>
                  <p>
                    Compare promised vs actual delivery dates to track
                    punctuality.
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-700">
                    2
                  </div>
                  <p>
                    Log shortages and overages to identify unreliable suppliers.
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-700">
                    3
                  </div>
                  <p>
                    Track damaged goods to negotiate better terms next time.
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
