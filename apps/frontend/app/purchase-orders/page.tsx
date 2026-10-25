"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ClipboardList,
  FilePlus2,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";
import Sidebar from "../components/Sidebar";

type PurchaseOrder = {
  id: string;
  vendorId: string;
  status: string;
  paymentTerms: string;
  currency: string;
  createdAt: string;
};

const STATUS_TABS = ["ALL", "DRAFT", "PENDING_APPROVAL", "APPROVED"] as const;

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [vendorNames, setVendorNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // New State for filtering/pagination
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  async function loadOrders() {
    try {
      setLoading(true);
      setError("");

      const [poResponse, vendorResponse] = await Promise.all([
        fetch("/api/procurement/purchase-orders"),
        fetch("/api/vendor/vendors?page=1&pageSize=200"), // Fetch paginated vendors correctly
      ]);

      if (!poResponse.ok) throw new Error("Failed to load purchase orders");

      const poData = (await poResponse.json()) as PurchaseOrder[];
      setOrders(poData);

      if (vendorResponse.ok) {
        const vendorData = await vendorResponse.json();
        const vendors = vendorData.items ?? vendorData; // Handle both formats safely

        setVendorNames(
          Object.fromEntries(
            vendors.map((v: { id: string; name: string }) => [v.id, v.name]),
          ),
        );
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load purchase orders",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void loadOrders(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  // --- Filtering & Pagination Logic ---
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesTab =
        activeTab === "ALL" || order.status.toUpperCase() === activeTab;
      const searchLower = search.toLowerCase().trim();
      const matchesSearch =
        !searchLower ||
        order.id.toLowerCase().includes(searchLower) ||
        (vendorNames[order.vendorId] ?? "").toLowerCase().includes(searchLower);

      return matchesTab && matchesSearch;
    });
  }, [orders, activeTab, search, vendorNames]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const paginatedOrders = filteredOrders.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

  // --- Stats ---
  const draftCount = orders.filter(
    (o) => o.status.toUpperCase() === "DRAFT",
  ).length;
  const pendingApprovalCount = orders.filter(
    (o) => o.status.toUpperCase() === "PENDING_APPROVAL",
  ).length;
  const approvedCount = orders.filter(
    (o) => o.status.toUpperCase() === "APPROVED",
  ).length;

  // --- Formatting Helpers ---
  function getStatusClasses(status: string) {
    switch (status.toUpperCase()) {
      case "DRAFT":
        return "bg-slate-100 text-slate-700";
      case "PENDING_APPROVAL":
        return "bg-amber-50 text-amber-700 border border-amber-200";
      case "APPROVED":
        return "bg-emerald-50 text-emerald-700 border border-emerald-200";
      case "REJECTED":
        return "bg-red-50 text-red-700";
      case "CANCELLED":
        return "bg-slate-100 text-slate-700";
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

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <Sidebar />

      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-blue-600">
                <ClipboardList size={16} /> Procurement
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
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
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
                <Plus size={16} /> Create PO
              </Link>
            </div>
          </div>

          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-red-500" />
              <p>{error}</p>
            </div>
          )}

          {/* Stats Summary */}
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-slate-500">Total Orders</p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                {orders.length}
              </p>
              <p className="mt-1 text-xs text-slate-500">Purchase orders</p>
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

          {/* List Section */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {/* Toolbar: Tabs & Search */}
            <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                {STATUS_TABS.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      setActiveTab(tab);
                      setPage(1);
                    }}
                    className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                      activeTab === tab
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {tab === "ALL" ? "All Orders" : formatStatus(tab)}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-72">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Search PO ID or vendor..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            {/* Table/List Body */}
            {loading ? (
              <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12">
                <RefreshCw
                  size={24}
                  className="mb-3 animate-spin text-blue-600"
                />
                <p className="text-sm font-medium text-slate-700">
                  Loading purchase orders...
                </p>
              </div>
            ) : paginatedOrders.length === 0 ? (
              <div className="flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                  <FilePlus2 size={22} />
                </div>
                <h3 className="mt-4 font-semibold text-slate-900">
                  No purchase orders found
                </h3>
                <p className="mt-1 max-w-sm text-sm text-slate-500">
                  {search || activeTab !== "ALL"
                    ? "Try adjusting your search or filters."
                    : "Create your first purchase order to start managing procurement."}
                </p>
                {!search && activeTab === "ALL" && (
                  <Link
                    href="/purchase-orders/new"
                    className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                  >
                    <Plus size={16} /> Create Purchase Order
                  </Link>
                )}
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {paginatedOrders.map((order) => (
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
                              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClasses(order.status)}`}
                            >
                              {formatStatus(order.status)}
                            </span>
                          </div>

                          <p className="mt-1 truncate text-sm text-slate-500">
                            Vendor:{" "}
                            <span className="font-medium text-slate-700">
                              {vendorNames[order.vendorId] ?? "Loading..."}
                            </span>
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
                        View order <span aria-hidden="true">→</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Pagination */}
            {filteredOrders.length > 0 && (
              <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
                <p className="text-sm text-slate-500">
                  Showing{" "}
                  <span className="font-medium text-slate-900">
                    {(page - 1) * pageSize + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-medium text-slate-900">
                    {Math.min(page * pageSize, filteredOrders.length)}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium text-slate-900">
                    {filteredOrders.length}
                  </span>{" "}
                  orders
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={page <= 1 || loading}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={page >= totalPages || loading}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
