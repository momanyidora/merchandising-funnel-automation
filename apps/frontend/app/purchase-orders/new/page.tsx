"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, FilePlus2, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Sidebar from "../../components/Sidebar";

type Vendor = {
  id: string;
  name: string;
};

export default function NewPurchaseOrderPage() {
  const router = useRouter();

  const [vendorId, setVendorId] = useState("");
  const [vendorName, setVendorName] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("NET_30");
  const [currency, setCurrency] = useState("KES");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loadingVendors, setLoadingVendors] = useState(true);

  useEffect(() => {
    async function loadVendors() {
      try {
        const response = await fetch("/api/vendor/vendors");

        if (!response.ok) {
          throw new Error("Failed to load vendors");
        }

        const data = await response.json();
        setVendors(data);
      } catch {
        setError("Failed to load vendors");
      } finally {
        setLoadingVendors(false);
      }
    }

    loadVendors();
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");
      if (!vendorId) throw new Error("Choose a vendor from the suggestions.");

      const response = await fetch("/api/procurement/purchase-orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          vendorId,
          paymentTerms,
          currency,
        }),
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
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Sidebar />

      <main className="ml-0 min-h-screen lg:ml-64">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          {/* Back navigation */}
          <Link
            href="/purchase-orders"
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-blue-600"
          >
            <ArrowLeft size={16} />
            Back to Purchase Orders
          </Link>

          {/* Header */}
          <div className="mb-8">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-blue-600">
              <FilePlus2 size={16} />
              Procurement
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              Create Purchase Order
            </h1>

            <p className="mt-1 max-w-2xl text-sm text-slate-500 sm:text-base">
              Create a new purchase order for a vendor. You can add products and
              quantities after the order is created.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-red-500" />
              <p>{error}</p>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            {/* Form */}
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
                {/* Vendor */}
                <div>
                  <label
                    htmlFor="vendor"
                    className="mb-1.5 block text-sm font-semibold text-slate-700"
                  >
                    Vendor
                  </label>

                  <input id="vendor" list="vendor-options" value={vendorName} onChange={(event) => { const name=event.target.value; setVendorName(name); setVendorId(vendors.find(v=>v.name===name)?.id ?? ""); }} disabled={loadingVendors} autoComplete="off" placeholder={loadingVendors?"Loading vendors…":"Search or select a vendor"} required className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm" />
                  <datalist id="vendor-options">{vendors.map(vendor=><option key={vendor.id} value={vendor.name}/>)}</datalist>

                  <p className="mt-1.5 text-xs text-slate-500">
                    Select the supplier providing the goods.
                  </p>
                </div>

                {/* Payment terms */}
                <div>
                  <label
                    htmlFor="payment-terms"
                    className="mb-1.5 block text-sm font-semibold text-slate-700"
                  >
                    Payment Terms
                  </label>

                  <select
                    id="payment-terms"
                    value={paymentTerms}
                    onChange={(event) => setPaymentTerms(event.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="NET_30">Net 30</option>
                    <option value="NET_45">Net 45</option>
                    <option value="NET_60">Net 60</option>
                    <option value="COD">Cash on Delivery</option>
                  </select>

                  <p className="mt-1.5 text-xs text-slate-500">
                    Choose when payment for the order is due.
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
                    onChange={(event) => setCurrency(event.target.value)}
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

              {/* Actions */}
              <div className="flex flex-col-reverse gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => router.push("/purchase-orders")}
                  disabled={loading}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={loading || loadingVendors}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading && <RefreshCw size={16} className="animate-spin" />}

                  {loading ? "Creating..." : "Create Purchase Order"}
                </button>
              </div>
            </form>

            {/* Workflow sidebar */}
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
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-700">
                      1
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        Create the order
                      </p>

                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        The purchase order starts in Draft status.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-700">
                      2
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        Add items
                      </p>

                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Add the products, quantities, and prices required from
                        the vendor.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-700">
                      3
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        Submit for approval
                      </p>

                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Once the order is complete, submit it for approval.
                      </p>
                    </div>
                  </div>
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
