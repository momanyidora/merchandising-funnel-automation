"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, RefreshCw } from "lucide-react";

type PurchaseOrder = {
  id: string;
  vendorId: string;
  status: string;
  paymentTerms: string;
  currency: string;
  createdAt: string;
};

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadOrders() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/procurement/purchase-orders");

      if (!response.ok) {
        throw new Error("Failed to load purchase orders");
      }

      const data = (await response.json()) as PurchaseOrder[];
      setOrders(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load purchase orders",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/api/procurement/purchase-orders");

        if (!response.ok) {
          throw new Error("Failed to load purchase orders");
        }

        const data = (await response.json()) as PurchaseOrder[];

        if (!cancelled) {
          setOrders(data);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load purchase orders",
          );
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-blue-600">
            Phase 1 • Procurement
          </p>

          <h1 className="text-3xl font-bold text-slate-900">Purchase Orders</h1>

          <p className="mt-1 text-slate-600">
            Create and manage purchase orders.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={loadOrders}
            className="flex items-center gap-2 rounded-lg border px-4 py-2"
          >
            <RefreshCw size={16} />
            Refresh
          </button>

          <Link
            href="/purchase-orders/new"
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white"
          >
            <Plus size={16} />
            Create PO
          </Link>
        </div>
      </div>

      {loading && <p>Loading purchase orders...</p>}

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </p>
      )}

      {!loading && !error && (
        <section className="rounded-xl border bg-white">
          <div className="border-b p-5">
            <h2 className="text-xl font-semibold">Purchase Order List</h2>
            <p className="text-sm text-slate-500">
              {orders.length} purchase order
              {orders.length === 1 ? "" : "s"}
            </p>
          </div>

          {orders.length === 0 ? (
            <p className="p-5 text-slate-500">No purchase orders found.</p>
          ) : (
            <div className="divide-y">
              {orders.map((order) => (
                <Link
                  key={order.id}
                  href={`/purchase-orders/${order.id}`}
                  className="block p-5 hover:bg-slate-50"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">
                        PO {order.id.slice(0, 8)}
                      </p>

                      <p className="text-sm text-slate-500">
                        Vendor: {order.vendorId}
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        {order.paymentTerms} • {order.currency}
                      </p>
                    </div>

                    <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium">
                      {order.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}
    </main>
  );
}
