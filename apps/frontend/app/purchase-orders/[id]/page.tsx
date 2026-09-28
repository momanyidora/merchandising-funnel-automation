"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import ProductPicker from "../../components/ProductPicker";
import {
  ArrowLeft,
  CheckCircle2,
  CircleDollarSign,
  Package,
  Plus,
  RefreshCw,
  Send,
} from "lucide-react";

type PurchaseOrder = {
  id: string;
  vendorId: string;
  status: string;
  paymentTerms: string;
  currency: string;
  createdAt: string;
  updatedAt: string;
};

type VendorProduct = {
  id: string;
  vendorId: string;
  productId: string;
  supplierCost: number;
};

type PurchaseOrderItem = {
  id: string;
  purchaseOrderId: string;
  productId: string;
  quantity: number;
  lockedUnitCost: number;
  createdAt: string;
};

function formatStatus(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getStatusClasses(status: string) {
  switch (status) {
    case "DRAFT":
      return "bg-slate-100 text-slate-700";
    case "PENDING_APPROVAL":
      return "bg-amber-50 text-amber-700";
    case "APPROVED":
      return "bg-emerald-50 text-emerald-700";
    case "REJECTED":
      return "bg-red-50 text-red-700";
    case "CANCELLED":
      return "bg-slate-100 text-slate-500";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export default function PurchaseOrderDetailPage() {
  const params = useParams();

  const id = params.id as string;

  const [order, setOrder] = useState<PurchaseOrder | null>(null);
  const [items, setItems] = useState<PurchaseOrderItem[]>([]);
  const [vendorName, setVendorName] = useState("");
  const [productNames, setProductNames] = useState<Record<string,string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [vendorProducts, setVendorProducts] = useState<VendorProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [addingItem, setAddingItem] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [approving, setApproving] = useState(false);

  async function loadOrder() {
    try {
      setLoading(true);
      setError("");

      const [orderResponse, itemsResponse] = await Promise.all([
        fetch(`/api/procurement/purchase-orders/${id}`),
        fetch(`/api/procurement/purchase-orders/${id}/items`),
      ]);

      if (!orderResponse.ok || !itemsResponse.ok) {
        throw new Error("Failed to load purchase order");
      }

      const orderData = (await orderResponse.json()) as PurchaseOrder;
      const itemsData = (await itemsResponse.json()) as PurchaseOrderItem[];

      setOrder(orderData);
      setItems(itemsData);
      const [vendorResponse, catalogResponse] = await Promise.all([
        fetch(`/api/vendor/vendors/${orderData.vendorId}`),
        fetch(`/api/inventory/products?ids=${encodeURIComponent(itemsData.map(item=>item.productId).join(","))}`),
      ]);
      if (vendorResponse.ok) setVendorName((await vendorResponse.json()).name);
      if (catalogResponse.ok) { const rows = await catalogResponse.json(); setProductNames(Object.fromEntries(rows.map((p: {productId:string;productName:string})=>[p.productId,p.productName]))); }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load purchase order",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [orderResponse, itemsResponse] = await Promise.all([
          fetch(`/api/procurement/purchase-orders/${id}`),
          fetch(`/api/procurement/purchase-orders/${id}/items`),
        ]);

        if (!orderResponse.ok || !itemsResponse.ok) {
          throw new Error("Failed to load purchase order");
        }

        const orderData = (await orderResponse.json()) as PurchaseOrder;
        const itemsData = (await itemsResponse.json()) as PurchaseOrderItem[];

        if (!cancelled) {
          setOrder(orderData);
          setItems(itemsData);
          const [vendorResponse, catalogResponse] = await Promise.all([
            fetch(`/api/vendor/vendors/${orderData.vendorId}`),
            fetch(`/api/inventory/products?ids=${encodeURIComponent(itemsData.map(item=>item.productId).join(","))}`),
          ]);
          if (vendorResponse.ok) setVendorName((await vendorResponse.json()).name);
          if (catalogResponse.ok) { const rows = await catalogResponse.json(); setProductNames(Object.fromEntries(rows.map((p: {productId:string;productName:string})=>[p.productId,p.productName]))); }
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load purchase order",
          );
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!order?.vendorId) {
      return;
    }

    const vendorId = order.vendorId;

    async function loadVendorProducts() {
      try {
        setLoadingProducts(true);

        const response = await fetch(
          `/api/vendor/vendors/${vendorId}/products`,
        );

        if (!response.ok) {
          throw new Error("Failed to load vendor products");
        }

        const data = (await response.json()) as VendorProduct[];

        setVendorProducts(data);
        if (data.length) {
          const catalogResponse = await fetch(`/api/inventory/products?ids=${encodeURIComponent(data.map((p: VendorProduct) => p.productId).join(","))}`);
          if (catalogResponse.ok) { const rows = await catalogResponse.json(); setProductNames(current=>({...current,...Object.fromEntries(rows.map((p: {productId:string;productName:string})=>[p.productId,p.productName]))})); }
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load vendor products",
        );
      } finally {
        setLoadingProducts(false);
      }
    }

    loadVendorProducts();
  }, [order?.vendorId]);

  async function handleAddItem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setAddingItem(true);
      setError("");

      const response = await fetch(
        `/api/procurement/purchase-orders/${id}/items`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            productId,
            quantity: Number(quantity),
          }),
        },
      );
      const data = await response.json().catch(() => null);

      console.log("ADD ITEM RESPONSE:", response.status, data);

      if (!response.ok) {
        throw new Error(
          data?.error ?? data?.message ?? "Failed to add purchase order item",
        );
      }

      setProductId("");
      setQuantity("");
      setUnitCost("");

      await loadOrder();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to add purchase order item",
      );
    } finally {
      setAddingItem(false);
    }
  }

  async function handleSubmitForApproval() {
    try {
      setSubmitting(true);
      setError("");

      const response = await fetch(
        `/api/procurement/purchase-orders/${id}/submit`,
        {
          method: "POST",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to submit purchase order");
      }

      await loadOrder();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to submit purchase order",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleApprove() {
    try {
      setApproving(true);
      setError("");

      const response = await fetch(
        `/api/procurement/purchase-orders/${id}/approve`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            approverId: "383f6648-adef-488f-8a8e-408569316172",
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to approve purchase order");
      }

      await loadOrder();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to approve purchase order",
      );
    } finally {
      setApproving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <main className="flex min-h-screen items-center justify-center">
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <RefreshCw size={18} className="animate-spin" />
            Loading purchase order...
          </div>
        </main>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-slate-50">
        <main className="mx-auto max-w-3xl px-6 py-16">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <p className="font-semibold text-red-800">
              Purchase order not found.
            </p>

            <Link
              href="/purchase-orders"
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-red-700 hover:underline"
            >
              <ArrowLeft size={16} />
              Back to Purchase Orders
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const orderTotal = items.reduce(
    (total, item) => total + item.quantity * item.lockedUnitCost,
    0,
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="min-h-screen lg:ml-64">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/purchase-orders"
              className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-blue-600"
            >
              <ArrowLeft size={16} />
              Back to Purchase Orders
            </Link>

            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-blue-600">
                  <Package size={16} />
                  Procurement
                </div>

                <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                  Purchase Order
                </h1>

                <p className="mt-1 break-all text-sm text-slate-500">
                  {order.id}
                </p>
              </div>

              <button
                onClick={loadOrder}
                disabled={loading}
                className="inline-flex w-fit items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw size={16} />
                Refresh
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-red-500" />
              <p>{error}</p>
            </div>
          )}

          <div className="space-y-6">
            {/* Order overview */}
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-6 py-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-950">
                      Order Details
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Review the purchase order information and current status.
                    </p>
                  </div>

                  <span
                    className={`w-fit rounded-full px-3 py-1.5 text-xs font-semibold ${getStatusClasses(
                      order.status,
                    )}`}
                  >
                    {formatStatus(order.status)}
                  </span>
                </div>
              </div>

              <div className="grid gap-5 p-6 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Vendor
                  </p>

                  <p className="mt-1 break-all text-sm font-semibold text-slate-800">
                    {vendorName || "Loading vendor name…"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Payment Terms
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {order.paymentTerms}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Currency
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {order.currency}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Created
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {new Date(order.createdAt).toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                </div>
              </div>

              {(order.status === "DRAFT" ||
                order.status === "PENDING_APPROVAL") && (
                <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
                  {order.status === "DRAFT" && (
                    <button
                      onClick={handleSubmitForApproval}
                      disabled={submitting || items.length === 0}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {submitting ? (
                        <RefreshCw size={16} className="animate-spin" />
                      ) : (
                        <Send size={16} />
                      )}

                      {submitting ? "Submitting..." : "Submit for Approval"}
                    </button>
                  )}

                  {order.status === "PENDING_APPROVAL" && (
                    <button
                      onClick={handleApprove}
                      disabled={approving}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {approving ? (
                        <RefreshCw size={16} className="animate-spin" />
                      ) : (
                        <CheckCircle2 size={16} />
                      )}

                      {approving ? "Approving..." : "Approve Purchase Order"}
                    </button>
                  )}
                </div>
              )}
            </section>

            {/* Add item */}
            {order.status === "DRAFT" && (
              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-6 py-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <Plus size={20} />
                    </div>

                    <div>
                      <h2 className="font-semibold text-slate-950">Add Item</h2>

                      <p className="mt-1 text-sm text-slate-500">
                        Select a vendor product and specify the quantity.
                      </p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleAddItem} className="p-6">
                  <div className="grid gap-5 md:grid-cols-3">
                    <div>
                      <label
                        htmlFor="product"
                        className="mb-1.5 block text-sm font-semibold text-slate-700"
                      >
                        Product
                      </label>

                      <ProductPicker
                        value={productId}
                        allowedIds={vendorProducts.filter(product => !items.some(item => item.productId === product.productId)).map(product => product.productId)}
                        onChange={(selectedId) => {
                          setProductId(selectedId);
                          const selectedProduct = vendorProducts.find(product => product.productId === selectedId);
                          setUnitCost(selectedProduct ? String(selectedProduct.supplierCost) : "");
                        }}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="quantity"
                        className="mb-1.5 block text-sm font-semibold text-slate-700"
                      >
                        Quantity
                      </label>

                      <input
                        id="quantity"
                        type="number"
                        min="1"
                        step="1"
                        inputMode="numeric"
                        value={quantity}
                        onChange={(event) => setQuantity(event.target.value)}
                        required
                        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="unit-cost"
                        className="mb-1.5 block text-sm font-semibold text-slate-700"
                      >
                        Unit Cost
                      </label>

                      <div className="relative">
                        <CircleDollarSign
                          size={16}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />

                        <input
                          id="unit-cost"
                          type="number"
                          min="0"
                          step="1"
                          inputMode="numeric"
                          value={unitCost}
                          readOnly
                          required
                          placeholder="Select a product"
                          className="w-full rounded-lg border border-slate-300 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-600 outline-none"
                        />
                      </div>

                      <p className="mt-1.5 text-xs text-slate-500">
                        Supplier cost is loaded automatically.
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex justify-end">
                    <button
                      type="submit"
                      disabled={
                        addingItem || loadingProducts || !productId || !quantity
                      }
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {addingItem ? (
                        <RefreshCw size={16} className="animate-spin" />
                      ) : (
                        <Plus size={16} />
                      )}

                      {addingItem ? "Adding..." : "Add Item"}
                    </button>
                  </div>
                </form>
              </section>
            )}

            {/* Items */}
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-3 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">
                    Purchase Order Items
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {items.length} item{items.length === 1 ? "" : "s"} in this
                    order
                  </p>
                </div>

                <div className="rounded-lg bg-slate-50 px-4 py-2 text-right">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Order Total
                  </p>

                  <p className="text-lg font-bold text-slate-950">
                    {order.currency} {orderTotal.toLocaleString()}
                  </p>
                </div>
              </div>

              {items.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                    <Package size={22} />
                  </div>

                  <p className="mt-4 font-medium text-slate-700">
                    No items added yet
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Add products to this purchase order before submitting it for
                    approval.
                  </p>
                </div>
              ) : (
                <>
                  <div className="hidden overflow-x-auto md:block">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                        <tr>
                          <th className="px-6 py-3 font-semibold">Product</th>
                          <th className="px-6 py-3 font-semibold">Quantity</th>
                          <th className="px-6 py-3 font-semibold">Unit Cost</th>
                          <th className="px-6 py-3 text-right font-semibold">
                            Total
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100">
                        {items.map((item) => (
                          <tr key={item.id} className="text-sm">
                            <td className="px-6 py-4 font-medium text-slate-800">
                              {productNames[item.productId] ?? "Product name unavailable"}
                            </td>

                            <td className="px-6 py-4 text-slate-600">
                              {item.quantity.toLocaleString()}
                            </td>

                            <td className="px-6 py-4 text-slate-600">
                              {order.currency}{" "}
                              {item.lockedUnitCost.toLocaleString()}
                            </td>

                            <td className="px-6 py-4 text-right font-semibold text-slate-800">
                              {order.currency}{" "}
                              {(
                                item.quantity * item.lockedUnitCost
                              ).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="divide-y divide-slate-100 md:hidden">
                    {items.map((item) => (
                      <div key={item.id} className="space-y-3 p-5">
                        <div className="flex items-start justify-between gap-4">
                          <p className="font-semibold text-slate-800">
                            {productNames[item.productId] ?? "Product name unavailable"}
                          </p>

                          <p className="font-semibold text-slate-900">
                            {order.currency}{" "}
                            {(
                              item.quantity * item.lockedUnitCost
                            ).toLocaleString()}
                          </p>
                        </div>

                        <div className="flex gap-5 text-sm text-slate-500">
                          <span>Qty: {item.quantity.toLocaleString()}</span>

                          <span>
                            Unit: {order.currency}{" "}
                            {item.lockedUnitCost.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
