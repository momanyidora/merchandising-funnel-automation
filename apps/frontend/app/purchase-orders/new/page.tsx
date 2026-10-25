"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  FilePlus2,
  RefreshCw,
  Search,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Sidebar from "../../components/Sidebar";

type Vendor = {
  id: string;
  name: string;
  paymentTerms: string;
};

export default function NewPurchaseOrderPage() {
  const router = useRouter();

  const [vendorId, setVendorId] = useState("");
  const [currency, setCurrency] = useState("KES");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loadingVendors, setLoadingVendors] = useState(true);
  const [vendorSearch, setVendorSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    async function loadVendors() {
      try {
        const response = await fetch("/api/vendor/vendors?page=1&pageSize=200");
        if (!response.ok) throw new Error("Failed to load vendors");
        const data = await response.json();
        const vendorList = data.items ?? data; // handle both shapes
        setVendors(vendorList);
      } catch {
        setError("Failed to load vendors");
      } finally {
        setLoadingVendors(false);
      }
    }
    loadVendors();
  }, []);

  // The currently selected vendor (for preview of payment terms)
  const selectedVendor = useMemo(
    () => vendors.find((v) => v.id === vendorId) ?? null,
    [vendors, vendorId],
  );

  // Filtered list for the dropdown
  const filteredVendors = useMemo(() => {
    const q = vendorSearch.toLowerCase().trim();
    if (!q) return vendors;
    return vendors.filter((v) => v.name.toLowerCase().includes(q));
  }, [vendors, vendorSearch]);

  function pickVendor(vendor: Vendor) {
    setVendorId(vendor.id);
    setVendorSearch("");
    setShowDropdown(false);
  }

  function clearVendor() {
    setVendorId("");
    setVendorSearch("");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");
      if (!vendorId) throw new Error("Please select a vendor.");

      const response = await fetch("/api/procurement/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendorId, currency }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to create purchase order");
      }
      router.push(`/purchase-orders/${data.id}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create purchase order",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <Sidebar />

      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <Link
            href="/purchase-orders"
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-blue-600"
          >
            <ArrowLeft size={16} /> Back to Purchase Orders
          </Link>

          <div className="mb-8">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-blue-600">
              <FilePlus2 size={16} /> Procurement
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              Create Purchase Order
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-500 sm:text-base">
              Select a vendor. Payment terms are pulled automatically from the
              vendor record and locked into the order.
            </p>
          </div>

          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-red-500" />
              <p>{error}</p>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <form
              onSubmit={handleSubmit}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="border-b border-slate-200 px-6 py-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <FilePlus2 size={20} />
                  </div>
                  <div>
                    <h2 className="font-semibold text-slate-950">
                      Purchase Order Information
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Enter the basic details for this order.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-6 p-6">
                {/* Vendor searchable dropdown */}
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Vendor
                  </label>

                  {selectedVendor ? (
                    <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-emerald-600" />
                        <span className="text-sm font-medium text-emerald-900">
                          {selectedVendor.name}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={clearVendor}
                        className="text-xs font-semibold text-emerald-700 hover:underline"
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <Search
                        size={16}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        type="text"
                        value={vendorSearch}
                        onChange={(e) => {
                          setVendorSearch(e.target.value);
                          setShowDropdown(true);
                        }}
                        onFocus={() => setShowDropdown(true)}
                        onBlur={() =>
                          setTimeout(() => setShowDropdown(false), 150)
                        }
                        disabled={loadingVendors}
                        placeholder={
                          loadingVendors
                            ? "Loading vendors…"
                            : "Search suppliers…"
                        }
                        className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />

                      {showDropdown && !loadingVendors && (
                        <div className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                          {filteredVendors.length === 0 ? (
                            <p className="px-4 py-3 text-sm text-slate-500">
                              No vendors match.
                            </p>
                          ) : (
                            filteredVendors.map((v) => (
                              <button
                                key={v.id}
                                type="button"
                                onMouseDown={() => pickVendor(v)}
                                className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition hover:bg-blue-50"
                              >
                                <span className="font-medium text-slate-900">
                                  {v.name}
                                </span>
                                <span className="text-xs text-slate-500">
                                  {v.paymentTerms}
                                </span>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <p className="mt-1.5 text-xs text-slate-500">
                    Select the supplier providing the goods.
                  </p>
                </div>

                {/* Payment terms (read-only, auto-filled) */}
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Payment Terms
                  </label>
                  <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm">
                    {selectedVendor ? (
                      <span className="font-medium text-slate-900">
                        {selectedVendor.paymentTerms}
                      </span>
                    ) : (
                      <span className="text-slate-400">
                        Select a vendor to see their terms
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-xs text-slate-500">
                    Locked from the vendor record and cannot be modified on the
                    order.
                  </p>
                </div>

                {/* Currency */}
                <div>
                  <label
                    htmlFor="currency"
                    className="mb-1.5 block text-sm font-semibold text-slate-700"
                  >
                    Currency
                  </label>
                  <select
                    id="currency"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="KES">KES — Kenyan Shilling</option>
                    <option value="USD">USD — US Dollar</option>
                  </select>
                  <p className="mt-1.5 text-xs text-slate-500">
                    Select the currency used for this purchase order.
                  </p>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => router.push("/purchase-orders")}
                  disabled={loading}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || loadingVendors || !vendorId}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading && <RefreshCw size={16} className="animate-spin" />}
                  {loading ? "Creating..." : "Create Purchase Order"}
                </button>
              </div>
            </form>

            <aside className="h-fit overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-5 py-4">
                <h2 className="font-semibold text-slate-950">
                  Purchase Order Workflow
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Follow these steps after creating the order.
                </p>
              </div>
              <div className="p-5">
                <div className="space-y-5">
                  {[
                    [
                      "1",
                      "Create the order",
                      "The purchase order starts in Draft status.",
                    ],
                    [
                      "2",
                      "Add items",
                      "Add the products, quantities, and prices required from the vendor.",
                    ],
                    [
                      "3",
                      "Submit for approval",
                      "Once the order is complete, submit it for approval.",
                    ],
                  ].map(([num, title, body]) => (
                    <div key={num} className="flex gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-700">
                        {num}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {title}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          {body}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex items-start gap-2 rounded-lg bg-emerald-50 px-3 py-3 text-xs text-emerald-700">
                  <CheckCircle2 size={15} className="mt-0.5 shrink-0" />
                  <p>
                    You can review and manage the order after it has been
                    created.
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
