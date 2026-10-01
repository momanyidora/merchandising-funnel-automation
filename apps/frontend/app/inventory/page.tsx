"use client";

import { useState } from "react";

type InventoryItem = {
  id: string;
  productId: string;
  onHand: number;
  reserved: number;
  onOrder: number;
  unitCost: number;
  createdAt: string;
  updatedAt: string;
};

export default function InventoryPage() {
  const [productId, setProductId] = useState("");
  const [inventory, setInventory] = useState<InventoryItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function findInventory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");
      setInventory(null);

      const response = await fetch(`/api/inventory/product/${productId}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Inventory item not found for this product.");
        }

        throw new Error("Failed to retrieve inventory.");
      }

      const data = await response.json();
      setInventory(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to retrieve inventory.",
      );
    } finally {
      setLoading(false);
    }
  }

  const available = inventory ? inventory.onHand - inventory.reserved : 0;

  const inventoryValue = inventory ? inventory.onHand * inventory.unitCost : 0;

  return (
    <main className="max-w-6xl space-y-6">
      <div>
        <p className="text-sm font-semibold text-blue-700">
          Phase 1 • Inventory
        </p>

        <h1 className="text-3xl font-bold text-slate-900">
          Inventory Management
        </h1>

        <p className="mt-1 text-slate-700">
          Search and view inventory information for a product.
        </p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">Find Inventory</h2>

        <p className="mt-1 text-sm text-slate-600">
          Enter the product UUID to retrieve its inventory.
        </p>

        <form
          onSubmit={findInventory}
          className="mt-4 flex flex-col gap-3 sm:flex-row"
        >
          <input
            value={productId}
            onChange={(event) => setProductId(event.target.value)}
            placeholder="Enter product UUID"
            required
            className="flex-1 rounded-lg border border-slate-300 px-4 py-3 text-slate-900 placeholder:text-slate-500 outline-none focus:border-blue-500"
          />

          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Searching..." : "Find Inventory"}
          </button>
        </form>
      </section>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {inventory && (
        <>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border bg-white p-5">
              <p className="text-sm text-slate-600">On Hand</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {inventory.onHand}
              </p>
            </div>

            <div className="rounded-xl border bg-white p-5">
              <p className="text-sm text-slate-600">Reserved</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {inventory.reserved}
              </p>
            </div>

            <div className="rounded-xl border bg-white p-5">
              <p className="text-sm text-slate-600">On Order</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {inventory.onOrder}
              </p>
            </div>

            <div className="rounded-xl border bg-white p-5">
              <p className="text-sm text-slate-600">Available</p>
              <p className="mt-2 text-2xl font-bold text-blue-700">
                {available}
              </p>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-900">
              Inventory Details
            </h2>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-slate-600">Inventory ID</p>
                <p className="mt-1 break-all font-medium text-slate-900">
                  {inventory.id}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-600">Product ID</p>
                <p className="mt-1 break-all font-medium text-slate-900">
                  {inventory.productId}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-600">Unit Cost</p>
                <p className="mt-1 font-medium text-slate-900">
                  KSh {inventory.unitCost.toLocaleString()}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-600">Inventory Value</p>
                <p className="mt-1 font-medium text-slate-900">
                  KSh {inventoryValue.toLocaleString()}
                </p>
              </div>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
