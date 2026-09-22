"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewPurchaseOrderPage() {
  const router = useRouter();

  const [vendorId, setVendorId] = useState("");
  const [currency, setCurrency] = useState("KES");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/procurement/purchase-orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          vendorId,
          currency,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create purchase order");
      }

      const order = await response.json();

      router.push(`/purchase-orders/${order.id}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create purchase order",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-2xl space-y-6">
      <div>
        <p className="text-sm font-semibold text-blue-700">
          Phase 1 • Procurement
        </p>

        <h1 className="text-3xl font-bold text-slate-900">
          Create Purchase Order
        </h1>

        <p className="mt-1 text-slate-700">
          Create a new purchase order for a vendor.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-xl border bg-white p-6"
      >
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-900">
            Vendor ID
          </label>

          <input
            value={vendorId}
            onChange={(event) => setVendorId(event.target.value)}
            placeholder="Enter vendor UUID"
            required
            className="w-full rounded-lg border px-4 py-3 text-slate-900 placeholder:text-slate-500 outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-900">
            Payment Terms
          </label>

        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-900">
            Currency
          </label>

          <select
            value={currency}
            onChange={(event) => setCurrency(event.target.value)}
            className="w-full rounded-lg border px-4 py-3 text-slate-900 placeholder:text-slate-500 outline-none focus:border-blue-500"
          >
            <option value="KES">KES</option>
            <option value="USD">USD</option>
          </select>
        </div>

        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.push("/purchase-orders")}
            className="rounded-lg border border-slate-300 px-4 py-2 text-slate-900 hover:bg-slate-100"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Purchase Order"}
          </button>
        </div>
      </form>
    </main>
  );
}
