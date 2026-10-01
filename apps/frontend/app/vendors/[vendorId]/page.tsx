"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Package, Plus, Truck } from "lucide-react";
import { useParams } from "next/navigation";

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
      const response = await fetch(
        `/api/vendor/vendors/${vendorId}/products`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            productId: productForm.productId,
            supplierCost: Number(productForm.supplierCost),
          }),
        },
      );

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
        error instanceof Error
          ? error.message
          : "Failed to approve product",
      );
    }
  }

  async function addReliability(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      const response = await fetch(
        `/api/vendor/vendors/${vendorId}/reliability`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            purchaseOrderId:
              reliabilityForm.purchaseOrderId || undefined,
            expectedDeliveryDate: reliabilityForm.expectedDeliveryDate,
            actualDeliveryDate:
              reliabilityForm.actualDeliveryDate || undefined,
            expectedQuantity: Number(reliabilityForm.expectedQuantity),
            receivedQuantity: Number(reliabilityForm.receivedQuantity),
            status: reliabilityForm.status,
            notes: reliabilityForm.notes || undefined,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ?? "Failed to record reliability",
        );
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
        error instanceof Error
          ? error.message
          : "Failed to record reliability",
      );
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-8">
        <div className="mx-auto max-w-7xl text-sm text-slate-500">
          Loading vendor...
        </div>
      </main>
    );
  }

  if (!vendor) {
    return (
      <main className="min-h-screen bg-slate-50 p-8">
        <div className="mx-auto max-w-7xl">
          <Link
            href="/vendors"
            className="flex items-center gap-2 text-sm text-blue-600"
          >
            <ArrowLeft size={16} />
            Back to Vendors
          </Link>

          <p className="mt-6 text-red-600">{error || "Vendor not found"}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/vendors"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-blue-600"
        >
          <ArrowLeft size={16} />
          Back to Vendors
        </Link>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Truck size={24} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {vendor.name}
              </h1>
              <p className="text-sm text-slate-500">
                {vendor.email} • {vendor.phone}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {vendor.paymentTerms} • {vendor.leadTimeDays} day lead time
              </p>
            </div>
          </div>
        </section>

        <div className="grid gap-8 lg:grid-cols-2">
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <Package className="text-blue-600" size={20} />
              <h2 className="text-lg font-semibold text-slate-900">
                Approved Products
              </h2>
            </div>

            <form onSubmit={addProduct} className="mb-6 space-y-3">
              <input
                required
                placeholder="Product ID"
                value={productForm.productId}
                onChange={(event) =>
                  setProductForm({
                    ...productForm,
                    productId: event.target.value,
                  })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm placeholder:text-slate-500"
              />

              <input
                required
                type="number"
                min="0"
                placeholder="Supplier cost"
                value={productForm.supplierCost}
                onChange={(event) =>
                  setProductForm({
                    ...productForm,
                    supplierCost: event.target.value,
                  })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm placeholder:text-slate-500"
              />

              <button
                type="submit"
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white"
              >
                <Plus size={16} />
                Approve Product
              </button>
            </form>

            <div className="divide-y divide-slate-200">
              {products.length === 0 ? (
                <p className="text-sm text-slate-500">No approved products.</p>
              ) : (
                products.map((product) => (
                  <div key={product.id} className="py-4">
                    <p className="font-medium text-slate-900">
                      Product: {product.productId}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Supplier cost: {product.supplierCost}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-slate-900">
                Reliability History
              </h2>
            </div>

            <form onSubmit={addReliability} className="mb-6 space-y-3">
              <input
                type="date"
                required
                value={reliabilityForm.expectedDeliveryDate}
                onChange={(event) =>
                  setReliabilityForm({
                    ...reliabilityForm,
                    expectedDeliveryDate: event.target.value,
                  })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />

              <input
                type="date"
                value={reliabilityForm.actualDeliveryDate}
                onChange={(event) =>
                  setReliabilityForm({
                    ...reliabilityForm,
                    actualDeliveryDate: event.target.value,
                  })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />

              <div className="grid grid-cols-2 gap-3">
                <input
                  required
                  type="number"
                  min="1"
                  placeholder="Expected quantity"
                  value={reliabilityForm.expectedQuantity}
                  onChange={(event) =>
                    setReliabilityForm({
                      ...reliabilityForm,
                      expectedQuantity: event.target.value,
                    })
                  }
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />

                <input
                  required
                  type="number"
                  min="0"
                  placeholder="Received quantity"
                  value={reliabilityForm.receivedQuantity}
                  onChange={(event) =>
                    setReliabilityForm({
                      ...reliabilityForm,
                      receivedQuantity: event.target.value,
                    })
                  }
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <select
                value={reliabilityForm.status}
                onChange={(event) =>
                  setReliabilityForm({
                    ...reliabilityForm,
                    status: event.target.value,
                  })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="ON_TIME">On Time</option>
                <option value="LATE">Late</option>
                <option value="SHORT">Short</option>
                <option value="OVERAGE">Overage</option>
                <option value="DAMAGED">Damaged</option>
              </select>

              <textarea
                placeholder="Notes"
                value={reliabilityForm.notes}
                onChange={(event) =>
                  setReliabilityForm({
                    ...reliabilityForm,
                    notes: event.target.value,
                  })
                }
                className="min-h-20 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />

              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white"
              >
                Record Reliability
              </button>
            </form>

            <div className="divide-y divide-slate-200">
              {reliability.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No reliability records.
                </p>
              ) : (
                reliability.map((record) => (
                  <div key={record.id} className="py-4">
                    <p className="font-medium text-slate-900">
                      {record.status}
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      Expected: {record.expectedQuantity} • Received:{" "}
                      {record.receivedQuantity}
                    </p>

                    {record.notes && (
                      <p className="mt-1 text-sm text-slate-500">
                        {record.notes}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
