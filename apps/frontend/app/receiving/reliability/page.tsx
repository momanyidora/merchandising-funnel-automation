"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ClipboardCheck } from "lucide-react";
import Sidebar from "../../components/Sidebar";

type Vendor = {
  id: string;
  name: string;
};

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

  useEffect(() => {
    Promise.all([
      fetch("/api/procurement/purchase-orders").then((r) => r.json()),
      fetch("/api/vendor/vendors").then((r) => r.json()),
    ])
      .then(([po, v]) => {
        setOrders(po);
        setVendors(v);
      })
      .catch(() => {
        setError("Unable to load purchase orders or vendors.");
      });
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

    const selectedOrder = orders.find(
      (order) => order.id === form.purchaseOrderId,
    );

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
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            purchaseOrderId: form.purchaseOrderId,
            expectedDate: form.expectedDate,
            actualDate: form.actualDate,
            expectedQuantity,
            receivedQuantity,
            status: form.status,
            notes: form.notes.trim(),
          }),
        },
      );

      const data = await r.json();

      if (!r.ok) {
        throw new Error(data.error || "Reliability record could not be saved.");
      }

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

  const selectedOrder = orders.find(
    (order) => order.id === form.purchaseOrderId,
  );

  const selectedVendor = selectedOrder
    ? vendors.find((vendor) => vendor.id === selectedOrder.vendorId)
    : undefined;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <main className="mx-auto w-full max-w-5xl space-y-6 p-6">
        <Link
          href="/receiving"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-600"
        >
          <ArrowLeft size={16} />
          Back to Receiving
        </Link>

        <header>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
            <ClipboardCheck size={16} />
            Supplier Performance
          </div>

          <h1 className="text-3xl font-bold text-slate-900">
            Reliability History
          </h1>

          <p className="mt-2 max-w-2xl text-slate-500">
            Record how a supplier performed against the expected delivery for a
            purchase order.
          </p>
        </header>

        {error && (
          <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-700">
            {error}
          </p>
        )}

        {message && (
          <p
            role="status"
            className="rounded-lg bg-emerald-50 p-3 text-emerald-700"
          >
            {message}
          </p>
        )}

        <form
          onSubmit={submit}
          className="space-y-6 rounded-2xl border bg-white p-6 shadow-sm"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <label className="space-y-1 text-sm font-medium text-slate-700">
              Purchase order
              <select
                required
                value={form.purchaseOrderId}
                onChange={(e) =>
                  setForm({
                    ...form,
                    purchaseOrderId: e.target.value,
                  })
                }
                className="w-full rounded-lg border px-3 py-2"
              >
                <option value="">Select purchase order</option>

                {orders.map((order) => {
                  const vendor = vendors.find((v) => v.id === order.vendorId);

                  return (
                    <option key={order.id} value={order.id}>
                      {vendor?.name ?? "Supplier"} · PO {order.id.slice(0, 8)}
                    </option>
                  );
                })}
              </select>
            </label>

            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Supplier
              </p>

              <p className="mt-1 font-semibold text-slate-900">
                {selectedVendor?.name ?? "Select a purchase order"}
              </p>
            </div>

            <label className="space-y-1 text-sm font-medium text-slate-700">
              Expected delivery date
              <input
                required
                type="date"
                value={form.expectedDate}
                onChange={(e) =>
                  setForm({
                    ...form,
                    expectedDate: e.target.value,
                  })
                }
                className="w-full rounded-lg border px-3 py-2"
              />
            </label>

            <label className="space-y-1 text-sm font-medium text-slate-700">
              Actual delivery date
              <input
                required
                type="date"
                value={form.actualDate}
                onChange={(e) =>
                  setForm({
                    ...form,
                    actualDate: e.target.value,
                  })
                }
                className="w-full rounded-lg border px-3 py-2"
              />
            </label>

            <label className="space-y-1 text-sm font-medium text-slate-700">
              Expected quantity
              <input
                required
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                value={form.expectedQuantity}
                onChange={(e) =>
                  setForm({
                    ...form,
                    expectedQuantity: e.target.value,
                  })
                }
                className="w-full rounded-lg border px-3 py-2"
              />
            </label>

            <label className="space-y-1 text-sm font-medium text-slate-700">
              Received quantity
              <input
                required
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                value={form.receivedQuantity}
                onChange={(e) =>
                  setForm({
                    ...form,
                    receivedQuantity: e.target.value,
                  })
                }
                className="w-full rounded-lg border px-3 py-2"
              />
            </label>

            <label className="space-y-1 text-sm font-medium text-slate-700 md:col-span-2">
              Delivery status
              <select
                value={form.status}
                onChange={(e) =>
                  setForm({
                    ...form,
                    status: e.target.value as ReliabilityForm["status"],
                  })
                }
                className="w-full rounded-lg border px-3 py-2"
              >
                <option value="ON_TIME">On time</option>
                <option value="LATE">Late</option>
                <option value="SHORT">Short delivery</option>
                <option value="OVERAGE">Overage</option>
                <option value="DAMAGED">Damaged</option>
              </select>
            </label>

            <label className="space-y-1 text-sm font-medium text-slate-700 md:col-span-2">
              Notes
              <textarea
                value={form.notes}
                onChange={(e) =>
                  setForm({
                    ...form,
                    notes: e.target.value,
                  })
                }
                rows={4}
                placeholder="Add any notes about the supplier delivery..."
                className="w-full rounded-lg border px-3 py-2"
              />
            </label>
          </div>

          <div className="flex justify-end">
            <button
              disabled={busy}
              className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white disabled:opacity-50"
            >
              {busy ? "Saving..." : "Record reliability"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
