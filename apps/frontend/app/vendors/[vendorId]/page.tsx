"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { ArrowLeft, Package, Plus } from "lucide-react";
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

export default function VendorDetailPage() {
  const params = useParams<{ vendorId: string }>();
  const vendorId = params.vendorId;

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [products, setProducts] = useState<VendorProduct[]>([]);
  const [productNames, setProductNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [productForm, setProductForm] = useState({
    productId: "",
    supplierCost: "",
  });

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      fetch(`/api/vendor/vendors/${vendorId}`),
      fetch(`/api/vendor/vendors/${vendorId}/products`),
    ])
      .then(async ([vendorResponse, productResponse]) => {
        if (!vendorResponse.ok) {
          throw new Error("Vendor not found");
        }

        if (!productResponse.ok) {
          throw new Error("Failed to load vendor information");
        }

        return {
          vendor: await vendorResponse.json(),
          products: await productResponse.json(),
        };
      })
      .then((data) => {
        if (!cancelled) {
          setVendor(data.vendor);
          setProducts(data.products);

          if (data.products.length) {
            fetch(
              `/api/inventory/products?ids=${encodeURIComponent(
                data.products.map((p: VendorProduct) => p.productId).join(","),
              )}`,
            )
              .then((response) => (response.ok ? response.json() : []))
              .then(
                (
                  catalog: {
                    productId: string;
                    productName: string;
                  }[],
                ) =>
                  setProductNames(
                    Object.fromEntries(
                      catalog.map((product) => [
                        product.productId,
                        product.productName,
                      ]),
                    ),
                  ),
              )
              .catch(() => {});
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

      const supplierCost = Number(productForm.supplierCost);

      if (!Number.isFinite(supplierCost) || supplierCost < 0) {
        throw new Error("Supplier cost must be a non-negative amount.");
      }

      const response = await fetch(`/api/vendor/vendors/${vendorId}/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: productForm.productId,
          supplierCost,
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

            <div className="grid border-t border-slate-200 sm:grid-cols-3">
              <div className="border-b border-slate-200 p-5 sm:border-r sm:border-b-0">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Payment Terms
                </p>

                <p className="mt-2 font-semibold text-slate-900">
                  {vendor.paymentTerms}
                </p>
              </div>

              <div className="border-b border-slate-200 p-5 sm:border-r sm:border-b-0">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Lead Time
                </p>

                <p className="mt-2 font-semibold text-slate-900">
                  {vendor.leadTimeDays} days
                </p>
              </div>

              <div className="p-5">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Approved Products
                </p>

                <p className="mt-2 font-semibold text-slate-900">
                  {products.length}
                </p>
              </div>
            </div>
          </section>

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
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Product
                    </label>

                    <ProductPicker
                      value={productForm.productId}
                      onChange={(productId) =>
                        setProductForm({
                          ...productForm,
                          productId,
                        })
                      }
                    />
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
                      step="0.01"
                      inputMode="decimal"
                      placeholder="Enter supplier cost in KES"
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
                            {productNames[product.productId] ??
                              "Product name unavailable"}
                          </p>
                        </div>
                      </div>

                      <p className="shrink-0 text-sm font-semibold text-slate-900">
                        KES{" "}
                        {product.supplierCost.toLocaleString("en-KE", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
