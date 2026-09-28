"use client";

import { useState } from "react";
import ProductPicker from "../components/ProductPicker";

type InventoryItem = {
  id: string;
  productId: string;
  productName: string;
  onHand: number;
  reserved: number;
  onOrder: number;
  unitCost: number;
  lowStockThreshold: number;
  createdAt: string;
  updatedAt: string;
};

type Location = {
  id: string;
  name: string;
  code: string;
};

type Stock = {
  id: string;
  inventoryItemId: string;
  locationId: string;
  quantity: number;
};

type Movement = {
  id: string;
  inventoryItemId: string;
  locationId: string;
  locationName: string;
  locationCode: string;
  type: string;
  quantity: number;
  reason: string | null;
  createdAt: string;
};

export default function InventoryPage() {
  const [productId, setProductId] = useState("");
  const [inventory, setInventory] = useState<InventoryItem | null>(null);
  const [newProductName, setNewProductName] = useState("");
  const [newUnitCost, setNewUnitCost] = useState("");
  const [creatingProduct, setCreatingProduct] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function findInventory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");
      setInventory(null);
      setStocks([]);
      setMovements([]);

      const inventoryResponse = await fetch(
        `/api/inventory/product/${productId}`,
      );

      if (!inventoryResponse.ok) {
        if (inventoryResponse.status === 404) {
          throw new Error("Inventory item not found for this product.");
        }

        throw new Error("Failed to retrieve inventory.");
      }

      const inventoryData: InventoryItem = await inventoryResponse.json();

      const [stockResponse, movementResponse] = await Promise.all([
        fetch(`/api/inventory/stock/${inventoryData.id}`),
        fetch(`/api/inventory/movements/${inventoryData.id}`),
      ]);

      const stockData = stockResponse.ok ? await stockResponse.json() : [];
      const movementData = movementResponse.ok
        ? await movementResponse.json()
        : [];

      setInventory(inventoryData);
      setStocks(stockData);
      setMovements(movementData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to retrieve inventory.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function createProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    const cost = Number(newUnitCost);
    if (!Number.isSafeInteger(cost) || cost < 0) { setError("Enter a non-negative whole-number unit cost."); return; }
    setCreatingProduct(true);
    try {
      const response = await fetch("/api/inventory", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productName: newProductName, unitCost: cost }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error || "Unable to create product");
      setProductId(data.productId); setNewProductName(""); setNewUnitCost("");
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to create product"); }
    finally { setCreatingProduct(false); }
  }

  async function loadLocations() {
    try {
      const response = await fetch("/api/inventory/locations");

      if (!response.ok) {
        throw new Error("Failed to retrieve locations.");
      }

      const data = await response.json();
      setLocations(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to retrieve locations.",
      );
    }
  }

  const available = inventory ? inventory.onHand - inventory.reserved : 0;

  const inventoryValue = inventory ? inventory.onHand * inventory.unitCost : 0;

  const getLocationName = (locationId: string) => {
    const location = locations.find((item) => item.id === locationId);
    return location ? `${location.name} (${location.code})` : locationId;
  };

  return (
    <main className="max-w-6xl space-y-6">
      <div>
        <p className="text-sm font-semibold text-blue-700">• Inventory</p>

        <h1 className="text-3xl font-bold text-slate-900">
          Inventory Management
        </h1>

        <p className="mt-1 text-slate-700">
          Monitor stock levels, locations, movements and inventory value.
        </p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-slate-900">
            Find Inventory
          </h2>

          <p className="text-sm text-slate-600">
            Search the catalog by product name to retrieve stock and value.
          </p>
        </div>

        <form
          onSubmit={findInventory}
          className="mt-4 flex flex-col gap-3 sm:flex-row"
        >
          <div className="flex-1"><ProductPicker value={productId} onChange={setProductId} /></div>

          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Searching..." : "Find Inventory"}
          </button>
        </form>
      </section>

      <form onSubmit={createProduct} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-[1fr_180px_auto]">
        <label className="sr-only" htmlFor="new-product-name">Product name</label>
        <input id="new-product-name" value={newProductName} onChange={e=>setNewProductName(e.target.value)} required minLength={2} placeholder="New product name" className="rounded-lg border border-slate-300 px-3 py-2" />
        <label className="sr-only" htmlFor="new-product-cost">Unit cost (whole KES)</label>
        <input id="new-product-cost" type="number" min="0" step="1" inputMode="numeric" value={newUnitCost} onChange={e=>setNewUnitCost(e.target.value)} required placeholder="Unit cost (KES)" className="rounded-lg border border-slate-300 px-3 py-2" />
        <button disabled={creatingProduct} className="rounded-lg bg-slate-900 px-4 py-2 font-medium text-white disabled:opacity-50">{creatingProduct?"Creating…":"Add product"}</button>
      </form>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {inventory && (
        <>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="text-sm text-slate-600">On Hand</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {inventory.onHand}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="text-sm text-slate-600">Reserved</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {inventory.reserved}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="text-sm text-slate-600">On Order</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {inventory.onOrder}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="text-sm text-slate-600">Available</p>
              <p className="mt-2 text-2xl font-bold text-blue-700">
                {available}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="text-sm text-slate-600">Inventory Value</p>
              <p className="mt-2 text-xl font-bold text-slate-900">
                KSh {inventoryValue.toLocaleString()}
              </p>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Stock by Location
                </h2>

                <p className="mt-1 text-sm text-slate-600">
                  See how this inventory item is distributed across locations.
                </p>
              </div>

              <button
                type="button"
                onClick={loadLocations}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Load Locations
              </button>
            </div>

            {stocks.length === 0 ? (
              <div className="mt-5 rounded-lg bg-slate-50 p-5 text-sm text-slate-600">
                No location stock has been recorded for this inventory item.
              </div>
            ) : (
              <div className="mt-5 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-200 text-slate-600">
                    <tr>
                      <th className="px-3 py-3 font-medium">Location</th>
                      <th className="px-3 py-3 font-medium">Quantity</th>
                    </tr>
                  </thead>

                  <tbody>
                    {stocks.map((stock) => (
                      <tr
                        key={stock.id}
                        className="border-b border-slate-100 last:border-0"
                      >
                        <td className="px-3 py-3 font-medium text-slate-900">
                          {getLocationName(stock.locationId)}
                        </td>

                        <td className="px-3 py-3 text-slate-700">
                          {stock.quantity}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-900">Locations</h2>

            <p className="mt-1 text-sm text-slate-600">
              Inventory locations available in the system.
            </p>

            {locations.length === 0 ? (
              <div className="mt-5 rounded-lg bg-slate-50 p-5 text-sm text-slate-600">
                Click &quot;Load Locations&quot; above to view locations.
              </div>
            ) : (
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {locations.map((location) => (
                  <div
                    key={location.id}
                    className="rounded-lg border border-slate-200 p-4"
                  >
                    <p className="font-semibold text-slate-900">
                      {location.name}
                    </p>

                    <p className="mt-1 text-sm text-slate-600">
                      Code: {location.code}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-900">
              Stock Movements
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              Recent inventory movements for this item.
            </p>

            {movements.length === 0 ? (
              <div className="mt-5 rounded-lg bg-slate-50 p-5 text-sm text-slate-600">
                No stock movements have been recorded for this inventory item.
              </div>
            ) : (
              <div className="mt-5 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-200 text-slate-600">
                    <tr>
                      <th className="px-3 py-3 font-medium">Type</th>
                      <th className="px-3 py-3 font-medium">Quantity</th>
                      <th className="px-3 py-3 font-medium">Location</th>
                      <th className="px-3 py-3 font-medium">Reason</th>
                      <th className="px-3 py-3 font-medium">Date</th>
                    </tr>
                  </thead>

                  <tbody>
                    {movements.map((movement) => (
                      <tr
                        key={movement.id}
                        className="border-b border-slate-100 last:border-0"
                      >
                        <td className="px-3 py-3 font-medium text-slate-900">
                          {movement.type}
                        </td>

                        <td className="px-3 py-3 text-slate-700">
                          {movement.quantity}
                        </td>

                        <td className="px-3 py-3 text-slate-700">
                          {movement.locationName} ({movement.locationCode})
                        </td>

                        <td className="px-3 py-3 text-slate-700">
                          {movement.reason || "—"}
                        </td>

                        <td className="px-3 py-3 text-slate-600">
                          {new Date(movement.createdAt).toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-900">
              Inventory Details
            </h2>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-slate-600">Product</p>
                <p className="mt-1 font-medium text-slate-900">{inventory.productName}</p>
              </div>

              <div>
                <p className="text-sm text-slate-600">Product ID</p>
                <p className="mt-1 break-all font-medium text-slate-900">
                  {inventory.productName}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-600">Unit Cost</p>
                <p className="mt-1 font-medium text-slate-900">
                  KSh {inventory.unitCost.toLocaleString()}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-600">Low Stock Threshold</p>
                <p className="mt-1 font-medium text-slate-900">
                  {inventory.lowStockThreshold}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-600">Created</p>
                <p className="mt-1 font-medium text-slate-900">
                  {new Date(inventory.createdAt).toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" })}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-600">Last Updated</p>
                <p className="mt-1 font-medium text-slate-900">
                  {new Date(inventory.updatedAt).toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" })}
                </p>
              </div>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
