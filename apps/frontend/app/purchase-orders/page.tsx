"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ClipboardList, FilePlus2, Plus, RefreshCw } from "lucide-react";
import Sidebar from "../components/Sidebar";

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
  const [vendorNames, setVendorNames] = useState<Record<string,string>>({});
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
      const vendorResponse = await fetch("/api/vendor/vendors");
      if (vendorResponse.ok) { const vendors = await vendorResponse.json(); setVendorNames(Object.fromEntries(vendors.map((v: {id:string;name:string})=>[v.id,v.name]))); }
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
        const vendorResponse = await fetch("/api/vendor/vendors");
        const vendors = vendorResponse.ok ? await vendorResponse.json() : [];

        if (!cancelled) {
          setOrders(data);
          setVendorNames(Object.fromEntries(vendors.map((v: {id:string;name:string})=>[v.id,v.name])));
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

  function getStatusClasses(status: string) {
    switch (status.toUpperCase()) {
      case "DRAFT":
        return "bg-slate-100 text-slate-700";

      case "PENDING_APPROVAL":
        return "bg-blue-50 text-blue-700";

      case "APPROVED":
        return "bg-emerald-50 text-emerald-700";

      case "REJECTED":
        return "bg-red-50 text-red-700";

      case "CANCELLED":
        return "bg-amber-50 text-amber-700";

      default:
        return "bg-slate-100 text-slate-700";
    }
  }

  function formatStatus(status: string) {
    return status
      .toLowerCase()
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("en-KE", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  const draftCount = orders.filter(
    (order) => order.status.toUpperCase() === "DRAFT",
  ).length;

  const pendingApprovalCount = orders.filter(
    (order) => order.status.toUpperCase() === "PENDING_APPROVAL",
  ).length;

  const approvedCount = orders.filter(
    (order) => order.status.toUpperCase() === "APPROVED",
  ).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Sidebar />

      <main className="ml-0 min-h-screen lg:ml-64">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-blue-600">
                <ClipboardList size={16} />
                Procurement
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                Purchase Orders
              </h1>

              <p className="mt-1 max-w-2xl text-sm text-slate-500 sm:text-base">
                Create, review, and manage purchase orders for your vendors.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={loadOrders}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw
                  size={16}
                  className={loading ? "animate-spin" : ""}
                />
                Refresh
              </button>

              <Link
                href="/purchase-orders/new"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                <Plus size={16} />
                Create PO
              </Link>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-red-500" />
              <p>{error}</p>
            </div>
          )}

          {/* Summary */}
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Total Orders
                  </p>

                  <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                    {orders.length}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">Purchase orders</p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <ClipboardList size={21} />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-slate-500">Draft</p>

              <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                {draftCount}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Orders being prepared
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-slate-500">
                Pending Approval
              </p>

              <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                {pendingApprovalCount}
              </p>

              <p className="mt-1 text-xs text-slate-500">Awaiting approval</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-slate-500">Approved</p>

              <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                {approvedCount}
              </p>

              <p className="mt-1 text-xs text-slate-500">Approved orders</p>
            </div>
          </div>

          {/* Purchase Order List */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <FilePlus2 size={20} />
                </div>

                <div>
                  <h2 className="font-semibold text-slate-950">
                    Purchase Order List
                  </h2>

                  <p className="text-sm text-slate-500">
                    {orders.length} purchase order
                    {orders.length === 1 ? "" : "s"} registered
                  </p>
                </div>
              </div>

              <span className="w-fit rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                Procurement
              </span>
            </div>

            {loading ? (
              <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12">
                <RefreshCw
                  size={24}
                  className="mb-3 animate-spin text-blue-600"
                />

                <p className="text-sm font-medium text-slate-700">
                  Loading purchase orders...
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Please wait a moment.
                </p>
              </div>
            ) : orders.length === 0 ? (
              <div className="flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                  <ClipboardList size={22} />
                </div>

                <h3 className="mt-4 font-semibold text-slate-900">
                  No purchase orders yet
                </h3>

                <p className="mt-1 max-w-sm text-sm text-slate-500">
                  Create your first purchase order to start managing
                  procurement.
                </p>

                <Link
                  href="/purchase-orders/new"
                  className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                >
                  <Plus size={16} />
                  Create Purchase Order
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {orders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/purchase-orders/${order.id}`}
                    className="group block p-5 transition hover:bg-slate-50 sm:p-6"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-start gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                          <ClipboardList size={19} />
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-slate-950">
                              PO {order.id.slice(0, 8)}
                            </p>

                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
                                order.status,
                              )}`}
                            >
                              {formatStatus(order.status)}
                            </span>
                          </div>

                          <p className="mt-1 truncate text-sm text-slate-500">
                            Vendor: {vendorNames[order.vendorId] ?? "Vendor name unavailable"}
                          </p>

                          <div className="mt-3 flex flex-wrap gap-2">
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                              {order.paymentTerms}
                            </span>

                            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                              {order.currency}
                            </span>

                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                              Created {formatDate(order.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2 text-sm font-semibold text-blue-600 transition group-hover:translate-x-0.5">
                        View order
                        <span aria-hidden="true">→</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
