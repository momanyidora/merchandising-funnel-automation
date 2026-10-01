"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Package,
  Plus,
  Truck,
} from "lucide-react";
import { useParams } from "next/navigation";
import Sidebar from "../../components/Sidebar";
import ProductPicker from "../../components/ProductPicker";

type Vendor = {
  id: string;
  name: string;
  email: string;
  phone: string;
  paymentTerms: string;
  leadTimeDays: number;
};

type VendorProduct = {
  id: string;
  vendorId: string;
  productId: string;
  supplierCost: number;
};

type ReliabilityRecord = {
  id: string;
  vendorId: string;
  purchaseOrderId?: string;
  expectedDeliveryDate: string;
  actualDeliveryDate?: string;
  expectedQuantity: number;
  receivedQuantity: number;
  status: string;
  notes?: string;
};

export default function VendorDetailPage() {
  const params = useParams<{ vendorId: string }>();
  const vendorId = params.vendorId;

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [products, setProducts] = useState<VendorProduct[]>([]);
  const [productNames, setProductNames] = useState<Record<string,string>>({});
  const [reliability, setReliability] = useState<ReliabilityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [productForm, setProductForm] = useState({
    productId: "",
    supplierCost: "",
  });

  const [reliabilityForm, setReliabilityForm] = useState({
    purchaseOrderId: "",
    expectedDeliveryDate: "",
    actualDeliveryDate: "",
    expectedQuantity: "",
    receivedQuantity: "",
    status: "ON_TIME",
    notes: "",
  });

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      fetch(`/api/vendor/vendors/${vendorId}`),
      fetch(`/api/vendor/vendors/${vendorId}/products`),
      fetch(`/api/vendor/vendors/${vendorId}/reliability`),
    ])
      .then(async ([vendorResponse, productResponse, reliabilityResponse]) => {
        if (!vendorResponse.ok) {
          throw new Error("Vendor not found");
        }

        if (!productResponse.ok || !reliabilityResponse.ok) {
          throw new Error("Failed to load vendor information");
        }

        return {
          vendor: await vendorResponse.json(),
          products: await productResponse.json(),
          reliability: await reliabilityResponse.json(),
        };
      })
      .then((data) => {
        if (!cancelled) {
          setVendor(data.vendor);
          setProducts(data.products);
          setReliability(data.reliability);
          if (data.products.length) {
            fetch(`/api/inventory/products?ids=${encodeURIComponent(data.products.map((p: VendorProduct) => p.productId).join(","))}`).then(r=>r.ok?r.json():[]).then((catalog: {productId:string;productName:string}[])=>setProductNames(Object.fromEntries(catalog.map(p=>[p.productId,p.productName])))).catch(()=>{});
          }
          setLoading(false);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setError(
            error instanceof Error
              ? error.message
              : "Failed to load vendor information",
          );
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [vendorId]);

  async function addProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setError("");
      if (!Number.isSafeInteger(Number(productForm.supplierCost)) || Number(productForm.supplierCost) < 0) throw new Error("Supplier cost must be a non-negative whole number.");

      const response = await fetch(`/api/vendor/vendors/${vendorId}/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: productForm.productId,
          supplierCost: Number(productForm.supplierCost),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to approve product");
      }

      setProducts((current) => [data, ...current]);

      setProductForm({
        productId: "",
        supplierCost: "",
      });
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to approve product",
      );
    }
  }

  async function addReliability(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setError("");

      const response = await fetch(
        `/api/vendor/vendors/${vendorId}/reliability`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            purchaseOrderId: reliabilityForm.purchaseOrderId || undefined,
            expectedDeliveryDate: reliabilityForm.expectedDeliveryDate,
            actualDeliveryDate: reliabilityForm.actualDeliveryDate || undefined,
            expectedQuantity: Number(reliabilityForm.expectedQuantity),
            receivedQuantity: Number(reliabilityForm.receivedQuantity),
            status: reliabilityForm.status,
            notes: reliabilityForm.notes || undefined,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to record reliability");
      }

      setReliability((current) => [data, ...current]);

      setReliabilityForm({
        purchaseOrderId: "",
        expectedDeliveryDate: "",
        actualDeliveryDate: "",
        expectedQuantity: "",
        receivedQuantity: "",
        status: "ON_TIME",
        notes: "",
      });
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to record reliability",
      );
    }
  }

  function getStatusClasses(status: string) {
    switch (status) {
      case "ON_TIME":
        return "bg-emerald-50 text-emerald-700";

      case "LATE":
        return "bg-amber-50 text-amber-700";

      case "SHORT":
        return "bg-red-50 text-red-700";

      case "OVERAGE":
        return "bg-blue-50 text-blue-700";

      case "DAMAGED":
        return "bg-purple-50 text-purple-700";

      default:
        return "bg-slate-100 text-slate-700";
    }
  }

  function formatStatus(status: string) {
    return status.replace("_", " ");
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />

        <main className="flex-1">
          <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
            <p className="text-sm text-slate-500">Loading vendor...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />

        <main className="flex-1">
          <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
            <Link
              href="/vendors"
              className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              <ArrowLeft size={16} />
              Back to Vendors
            </Link>

            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error || "Vendor not found"}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
          <Link
            href="/vendors"
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            <ArrowLeft size={16} />
            Back to Vendors
          </Link>

          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Vendor Header */}
          <section className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="p-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-lg font-bold text-blue-700">
                    {vendor.name
                      .split(" ")
                      .map((part) => part[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-blue-600">
                      Vendor Details
                    </p>

                    <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                      {vendor.name}
                    </h1>

                    <p className="mt-1 text-sm text-slate-500">
                      {vendor.email} • {vendor.phone}
                    </p>
                  </div>
                </div>

                <div className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                  Active Vendor
                </div>
              </div>
            </div>

            <div className="grid border-t border-slate-200 sm:grid-cols-2 lg:grid-cols-4">
              <div className="border-b border-slate-200 p-5 sm:border-r">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Payment Terms
                </p>
                <p className="mt-2 font-semibold text-slate-900">
                  {vendor.paymentTerms}
                </p>
              </div>

              <div className="border-b border-slate-200 p-5 lg:border-r">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Lead Time
                </p>
                <p className="mt-2 font-semibold text-slate-900">
                  {vendor.leadTimeDays} days
                </p>
              </div>

              <div className="border-b border-slate-200 p-5 sm:border-r lg:border-b-0">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Approved Products
                </p>
                <p className="mt-2 font-semibold text-slate-900">
                  {products.length}
                </p>
              </div>

              <div className="p-5">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Reliability Records
                </p>
                <p className="mt-2 font-semibold text-slate-900">
                  {reliability.length}
                </p>
              </div>
            </div>
          </section>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Approved Products */}
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Package size={20} />
                  </div>

                  <div>
                    <h2 className="font-semibold text-slate-900">
                      Approved Products
                    </h2>
                    <p className="text-sm text-slate-500">
                      Products supplied by this vendor
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <form
                  onSubmit={addProduct}
                  className="mb-6 rounded-xl bg-slate-50 p-4"
                >
                  <p className="mb-3 text-sm font-semibold text-slate-800">
                    Approve a Product
                  </p>

                  <div className="space-y-3">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">Product</label>
                      <ProductPicker value={productForm.productId} onChange={(productId) => setProductForm({...productForm, productId})} />
                    </div>

                    <div>
                      <label
                        htmlFor="supplier-cost"
                        className="mb-1.5 block text-sm font-medium text-slate-700"
                      >
                        Supplier cost
                      </label>

                      <input
                        id="supplier-cost"
                        required
                        type="number"
                        min="0"
                        step="1"
                        inputMode="numeric"
                        placeholder="Enter supplier cost in whole KES"
                        value={productForm.supplierCost}
                        onChange={(event) =>
                          setProductForm({
                            ...productForm,
                            supplierCost: event.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500"
                      />
                    </div>

                    <button
                      type="submit"
                      className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
                    >
                      <Plus size={16} />
                      Approve Product
                    </button>
                  </div>
                </form>

                <div className="divide-y divide-slate-200">
                  {products.length === 0 ? (
                    <p className="py-4 text-sm text-slate-500">
                      No approved products.
                    </p>
                  ) : (
                    products.map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between gap-4 py-4"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                            <Package size={17} className="text-slate-500" />
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900">
                              {productNames[product.productId] ?? "Product name unavailable"}
                            </p>
                          </div>
                        </div>

                        <p className="shrink-0 text-sm font-semibold text-slate-900">
                          KES {product.supplierCost.toLocaleString("en-KE", { maximumFractionDigits: 0 })}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>

            {/* Reliability */}
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <Truck size={20} />
                  </div>

                  <div>
                    <h2 className="font-semibold text-slate-900">
                      Reliability History
                    </h2>
                    <p className="text-sm text-slate-500">
                      Track supplier delivery performance
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <form
                  onSubmit={addReliability}
                  className="mb-6 rounded-xl bg-slate-50 p-4"
                >
                  <p className="mb-3 text-sm font-semibold text-slate-800">
                    Record Delivery
                  </p>

                  <div className="space-y-3">
                    <div>
                      <label
                        htmlFor="purchase-order-id"
                        className="mb-1.5 block text-sm font-medium text-slate-700"
                      >
                        Purchase Order ID
                      </label>

                      <input
                        id="purchase-order-id"
                        placeholder="Optional purchase order UUID"
                        value={reliabilityForm.purchaseOrderId}
                        onChange={(event) =>
                          setReliabilityForm({
                            ...reliabilityForm,
                            purchaseOrderId: event.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500"
                      />
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label
                          htmlFor="expected-date"
                          className="mb-1.5 block text-sm font-medium text-slate-700"
                        >
                          Expected date
                        </label>

                        <input
                          id="expected-date"
                          type="date"
                          required
                          value={reliabilityForm.expectedDeliveryDate}
                          onChange={(event) =>
                            setReliabilityForm({
                              ...reliabilityForm,
                              expectedDeliveryDate: event.target.value,
                            })
                          }
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="actual-date"
                          className="mb-1.5 block text-sm font-medium text-slate-700"
                        >
                          Actual date
                        </label>

                        <input
                          id="actual-date"
                          type="date"
                          value={reliabilityForm.actualDeliveryDate}
                          onChange={(event) =>
                            setReliabilityForm({
                              ...reliabilityForm,
                              actualDeliveryDate: event.target.value,
                            })
                          }
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label
                          htmlFor="expected-quantity"
                          className="mb-1.5 block text-sm font-medium text-slate-700"
                        >
                          Expected quantity
                        </label>

                        <input
                          id="expected-quantity"
                          required
                          type="number"
                          min="1"
                          step="1"
                          inputMode="numeric"
                          value={reliabilityForm.expectedQuantity}
                          onChange={(event) =>
                            setReliabilityForm({
                              ...reliabilityForm,
                              expectedQuantity: event.target.value,
                            })
                          }
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="received-quantity"
                          className="mb-1.5 block text-sm font-medium text-slate-700"
                        >
                          Received quantity
                        </label>

                        <input
                          id="received-quantity"
                          required
                          type="number"
                          min="0"
                          step="1"
                          inputMode="numeric"
                          value={reliabilityForm.receivedQuantity}
                          onChange={(event) =>
                            setReliabilityForm({
                              ...reliabilityForm,
                              receivedQuantity: event.target.value,
                            })
                          }
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="reliability-status"
                        className="mb-1.5 block text-sm font-medium text-slate-700"
                      >
                        Delivery status
                      </label>

                      <select
                        id="reliability-status"
                        value={reliabilityForm.status}
                        onChange={(event) =>
                          setReliabilityForm({
                            ...reliabilityForm,
                            status: event.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                      >
                        <option value="ON_TIME">On Time</option>
                        <option value="LATE">Late</option>
                        <option value="SHORT">Short</option>
                        <option value="OVERAGE">Overage</option>
                        <option value="DAMAGED">Damaged</option>
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="reliability-notes"
                        className="mb-1.5 block text-sm font-medium text-slate-700"
                      >
                        Notes
                      </label>

                      <textarea
                        id="reliability-notes"
                        placeholder="Add delivery notes"
                        value={reliabilityForm.notes}
                        onChange={(event) =>
                          setReliabilityForm({
                            ...reliabilityForm,
                            notes: event.target.value,
                          })
                        }
                        className="min-h-20 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500"
                      />
                    </div>

                    <button
                      type="submit"
                      className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
                    >
                      Record Reliability
                    </button>
                  </div>
                </form>

                <div className="divide-y divide-slate-200">
                  {reliability.length === 0 ? (
                    <p className="py-4 text-sm text-slate-500">
                      No reliability records.
                    </p>
                  ) : (
                    reliability.map((record) => (
                      <div key={record.id} className="py-4">
                        <div className="flex items-center justify-between gap-3">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
                              record.status,
                            )}`}
                          >
                            {formatStatus(record.status)}
                          </span>

                          <div className="flex items-center gap-1 text-xs text-slate-400">
                            <CalendarDays size={13} />
                            {record.expectedDeliveryDate}
                          </div>
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-3">
                          <div className="rounded-lg bg-slate-50 p-3">
                            <p className="text-xs text-slate-500">Expected</p>
                            <p className="mt-1 font-semibold text-slate-900">
                              {record.expectedQuantity}
                            </p>
                          </div>

                          <div className="rounded-lg bg-slate-50 p-3">
                            <p className="text-xs text-slate-500">Received</p>
                            <p className="mt-1 font-semibold text-slate-900">
                              {record.receivedQuantity}
                            </p>
                          </div>
                        </div>

                        {record.notes && (
                          <p className="mt-3 text-sm leading-5 text-slate-500">
                            {record.notes}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
