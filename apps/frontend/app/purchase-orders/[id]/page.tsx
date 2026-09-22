"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams} from "next/navigation";
import { ArrowLeft, Plus, RefreshCw } from "lucide-react";

type PurchaseOrder = {
  id: string;
  vendorId: string;
  status: string;
  paymentTerms: string;
  currency: string;
  createdAt: string;
  updatedAt: string;
};

type PurchaseOrderItem = {
  id: string;
  purchaseOrderId: string;
  productId: string;
  quantity: number;
  lockedUnitCost: number;
  createdAt: string;
};

export default function PurchaseOrderDetailPage() {
  const params = useParams();


  const id = params.id as string;

  const [order, setOrder] = useState<PurchaseOrder | null>(null);
  const [items, setItems] = useState<PurchaseOrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [addingItem, setAddingItem] = useState(false);

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
            lockedUnitCost: Number(unitCost),
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to add purchase order item");
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
    }
  }

  async function handleApprove() {
    try {
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
    }
  }

  if (loading) {
    return <main>Loading purchase order...</main>;
  }

  if (!order) {
    return (
      <main>
        <p className="text-red-600">Purchase order not found.</p>
      </main>
    );
  }

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/purchase-orders"
            className="mb-3 inline-flex items-center gap-2 text-sm text-blue-600"
          >
            <ArrowLeft size={16} />
            Back to Purchase Orders
          </Link>

          <p className="text-sm font-medium text-blue-600">
            Phase 1 • Procurement
          </p>

          <h1 className="text-3xl font-bold text-slate-900">Purchase Order</h1>

          <p className="mt-1 text-sm text-slate-500">{order.id}</p>
        </div>

        <button
          onClick={loadOrder}
          className="flex items-center gap-2 rounded-lg border px-4 py-2"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </p>
      )}

      <section className="rounded-xl border bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-600">
            Order Details
          </h2>

          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium">
            {order.status}
          </span>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm text-slate-500">Vendor ID</p>
            <p className="font-medium">{order.vendorId}</p>
          </div>

          <div>
            <p className="text-sm text-slate-500">Payment Terms</p>
            <p className="font-medium">{order.paymentTerms}</p>
          </div>

          <div>
            <p className="text-sm text-slate-500">Currency</p>
            <p className="font-medium">{order.currency}</p>
          </div>

          <div>
            <p className="text-sm text-slate-500">Created</p>
            <p className="font-medium">
              {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          {order.status === "DRAFT" && (
            <button
              onClick={handleSubmitForApproval}
              className="rounded-lg bg-blue-600 px-4 py-2 text-white"
            >
              Submit for Approval
            </button>
          )}

          {order.status === "PENDING_APPROVAL" && (
            <button
              onClick={handleApprove}
              className="rounded-lg bg-green-600 px-4 py-2 text-white"
            >
              Approve Purchase Order
            </button>
          )}
        </div>
      </section>

      {order.status === "DRAFT" && (
        <section className="rounded-xl border bg-white p-6">
          <div className="mb-5 flex items-center gap-2">
            <Plus size={20} />
            <h2 className="text-xl font-semibold text-slate-600">Add Item</h2>
          </div>

          <form onSubmit={handleAddItem} className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-600">
                Product ID
              </label>

              <input
                value={productId}
                onChange={(event) => setProductId(event.target.value)}
                placeholder="Product UUID"
                required
                className="w-full rounded-lg border px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-600">
                Quantity
              </label>

              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                required
                className="w-full rounded-lg border px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-600">
                Unit Cost
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={unitCost}
                onChange={(event) => setUnitCost(event.target.value)}
                required
                className="w-full rounded-lg border px-4 py-3"
              />
            </div>

            <button
              type="submit"
              disabled={addingItem}
              className="rounded-lg bg-blue-600 px-4 py-3 text-white disabled:opacity-50 md:col-span-3"
            >
              {addingItem ? "Adding..." : "Add Item"}
            </button>
          </form>
        </section>
      )}

      <section className="rounded-xl border bg-white">
        <div className="border-b p-5">
          <h2 className="text-xl font-semibold text-slate-600">
            Purchase Order Items
          </h2>
          <p className="text-sm text-slate-500">
            {items.length} item{items.length === 1 ? "" : "s"}
          </p>
        </div>

        {items.length === 0 ? (
          <p className="p-5 text-slate-500">No items have been added yet.</p>
        ) : (
          <div className="divide-y text-slate-500">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-5"
              >
                <div>
                  <p className="font-medium text-slate-500">
                    Product: {item.productId}
                  </p>

                  <p className="text-sm text-slate-500">
                    Quantity: {item.quantity}
                  </p>
                </div>

                <p className="font-semibold text-slate-500">
                  {order.currency} {item.lockedUnitCost.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
