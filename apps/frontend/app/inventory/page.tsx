"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Boxes,
  CircleDollarSign,
  MapPin,
  Package,
  Plus,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import Sidebar from "../components/Sidebar";

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

const FILTER_TABS = ["ALL", "IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK"] as const;

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filtering
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const pageSize = 12;

  // Selected item drawer
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [selectedStocks, setSelectedStocks] = useState<Stock[]>([]);
  const [selectedMovements, setSelectedMovements] = useState<Movement[]>([]);
  const [drawerLoading, setDrawerLoading] = useState(false);

  // Add product modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProductName, setNewProductName] = useState("");
  const [newUnitCost, setNewUnitCost] = useState("");
  const [creatingProduct, setCreatingProduct] = useState(false);

  async function loadAll() {
    try {
      setLoading(true);
      setError("");

      const [itemsRes, locationsRes] = await Promise.all([
        fetch("/api/inventory/items"),
        fetch("/api/inventory/locations"),
      ]);

      if (!itemsRes.ok) throw new Error("Failed to load inventory");
      if (!locationsRes.ok) throw new Error("Failed to load locations");

      const itemsData = (await itemsRes.json()) as InventoryItem[];
      const locationsData = (await locationsRes.json()) as Location[];

      setItems(itemsData);
      setLocations(locationsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load inventory");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void loadAll(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function openDrawer(item: InventoryItem) {
    setSelectedItem(item);
    setDrawerLoading(true);
    try {
      const [stocksRes, movementsRes] = await Promise.all([
        fetch(`/api/inventory/stock/${item.id}`),
        fetch(`/api/inventory/movements/${item.id}`),
      ]);
      const stocks = stocksRes.ok ? await stocksRes.json() : [];
      const movements = movementsRes.ok ? await movementsRes.json() : [];
      setSelectedStocks(stocks);
      setSelectedMovements(movements.slice(0, 10));
    } catch {
      setSelectedStocks([]);
      setSelectedMovements([]);
    } finally {
      setDrawerLoading(false);
    }
  }

  async function createProduct(e: React.FormEvent) {
    e.preventDefault();
    const cost = Number(newUnitCost);
    if (!Number.isFinite(cost) || cost < 0) {
      setError("Enter a valid unit cost.");
      return;
    }
    setCreatingProduct(true);
    setError("");
    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: newProductName.trim(),
          unitCost: cost,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create product");
      setShowAddModal(false);
      setNewProductName("");
      setNewUnitCost("");
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create product");
    } finally {
      setCreatingProduct(false);
    }
  }

  // --- Derived data ---
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const q = search.toLowerCase().trim();
      const matchesSearch = !q || item.productName.toLowerCase().includes(q);
      const available = item.onHand - item.reserved;
      let matchesTab = true;
      if (activeTab === "LOW_STOCK")
        matchesTab = item.onHand > 0 && item.onHand <= item.lowStockThreshold;
      else if (activeTab === "OUT_OF_STOCK") matchesTab = item.onHand === 0;
      else if (activeTab === "IN_STOCK") matchesTab = available > 0;
      return matchesSearch && matchesTab;
    });
  }, [items, search, activeTab]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const paginated = filteredItems.slice((page - 1) * pageSize, page * pageSize);

  const totalValue = items.reduce((sum, i) => sum + i.onHand * i.unitCost, 0);
  const lowStockCount = items.filter(
    (i) => i.onHand > 0 && i.onHand <= i.lowStockThreshold,
  ).length;
  const outOfStockCount = items.filter((i) => i.onHand === 0).length;

  const locationName = (id: string) => {
    const loc = locations.find((l) => l.id === id);
    return loc ? `${loc.name} (${loc.code})` : id;
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <Sidebar />

      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-blue-600">
                <Boxes size={16} /> Inventory
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                Inventory Control Center
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-slate-500 sm:text-base">
                Real-time stock levels, valuation, and locations across the
                business.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                onClick={loadAll}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
              >
                <RefreshCw
                  size={16}
                  className={loading ? "animate-spin" : ""}
                />{" "}
                Refresh
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
              >
                <Plus size={16} /> Add Product
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" /> {error}
            </div>
          )}

          {/* Stats */}
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Total SKUs
                  </p>
                  <p className="mt-2 text-3xl font-bold text-slate-950">
                    {items.length}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Products tracked
                  </p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Package size={21} />
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Inventory Value
                  </p>
                  <p className="mt-2 text-2xl font-bold text-slate-950">
                    KSh {totalValue.toLocaleString()}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Total stock value
                  </p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <CircleDollarSign size={21} />
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Low Stock
                  </p>
                  <p
                    className={`mt-2 text-3xl font-bold ${lowStockCount > 0 ? "text-red-600" : "text-slate-950"}`}
                  >
                    {lowStockCount}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Below reorder point
                  </p>
                </div>
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${lowStockCount > 0 ? "bg-red-50 text-red-600" : "bg-slate-100 text-slate-400"}`}
                >
                  <AlertTriangle size={21} />
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Locations
                  </p>
                  <p className="mt-2 text-3xl font-bold text-slate-950">
                    {locations.length}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {outOfStockCount > 0
                      ? `${outOfStockCount} out of stock`
                      : "Warehouses & stores"}
                  </p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <MapPin size={21} />
                </div>
              </div>
            </div>
          </div>

          {/* List Section */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {/* Toolbar */}
            <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                {FILTER_TABS.map((tab) => (
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
                    {tab === "ALL"
                      ? "All Items"
                      : tab === "IN_STOCK"
                        ? "In Stock"
                        : tab === "LOW_STOCK"
                          ? "Low Stock"
                          : "Out of Stock"}
                  </button>
                ))}
              </div>
              <div className="relative w-full sm:w-72">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  placeholder="Search products by name…"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            {/* Table */}
            {loading ? (
              <div className="flex min-h-64 flex-col items-center justify-center py-12">
                <RefreshCw
                  size={24}
                  className="mb-3 animate-spin text-blue-600"
                />
                <p className="text-sm font-medium text-slate-700">
                  Loading inventory…
                </p>
              </div>
            ) : paginated.length === 0 ? (
              <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
                <Package size={32} className="text-slate-300" />
                <h3 className="mt-4 font-semibold text-slate-900">
                  No inventory found
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {search || activeTab !== "ALL"
                    ? "Try adjusting your filters."
                    : "Add your first product to begin."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-6 py-3 font-semibold">Product</th>
                      <th className="px-6 py-3 font-semibold text-right">
                        On Hand
                      </th>
                      <th className="px-6 py-3 font-semibold text-right">
                        Reserved
                      </th>
                      <th className="px-6 py-3 font-semibold text-right">
                        Available
                      </th>
                      <th className="px-6 py-3 font-semibold text-right">
                        On Order
                      </th>
                      <th className="px-6 py-3 font-semibold text-right">
                        Unit Cost
                      </th>
                      <th className="px-6 py-3 font-semibold text-right">
                        Value
                      </th>
                      <th className="px-6 py-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginated.map((item) => {
                      const available = item.onHand - item.reserved;
                      const isLow =
                        item.onHand > 0 &&
                        item.onHand <= item.lowStockThreshold;
                      const isOut = item.onHand === 0;
                      return (
                        <tr
                          key={item.id}
                          onClick={() => openDrawer(item)}
                          className="cursor-pointer transition hover:bg-slate-50"
                        >
                          <td className="px-6 py-4">
                            <div className="font-medium text-slate-900">
                              {item.productName}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right font-medium text-slate-900">
                            {item.onHand.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-right text-slate-600">
                            {item.reserved.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-right font-semibold text-blue-700">
                            {available.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-right text-slate-600">
                            {item.onOrder.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-right text-slate-600">
                            KSh {item.unitCost.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-right font-semibold text-slate-900">
                            KSh {(item.onHand * item.unitCost).toLocaleString()}
                          </td>
                          <td className="px-6 py-4">
                            {isOut ? (
                              <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                                Out of Stock
                              </span>
                            ) : isLow ? (
                              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                                Low Stock
                              </span>
                            ) : (
                              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                                Healthy
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {filteredItems.length > 0 && (
              <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
                <p className="text-sm text-slate-500">
                  Showing{" "}
                  <span className="font-medium text-slate-900">
                    {(page - 1) * pageSize + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-medium text-slate-900">
                    {Math.min(page * pageSize, filteredItems.length)}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium text-slate-900">
                    {filteredItems.length}
                  </span>{" "}
                  products
                </p>
                <div className="flex gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    disabled={page >= totalPages}
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

      {/* Detail Drawer */}
      {selectedItem && (
        <div className="fixed inset-0 z-40 flex justify-end">
          <div
            className="absolute inset-0 bg-slate-900/40"
            onClick={() => setSelectedItem(null)}
          />
          <div className="relative h-full w-full max-w-xl overflow-y-auto bg-white shadow-2xl">
            <div className="sticky top-0 flex items-start justify-between border-b border-slate-200 bg-white px-6 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                  Product
                </p>
                <h2 className="mt-1 text-xl font-bold text-slate-950">
                  {selectedItem.productName}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {selectedItem.onHand} on hand ·{" "}
                  {selectedItem.onHand * selectedItem.unitCost} KSh value
                </p>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            {drawerLoading ? (
              <div className="flex items-center justify-center py-16">
                <RefreshCw size={20} className="animate-spin text-blue-600" />
              </div>
            ) : (
              <div className="space-y-6 p-6">
                <section>
                  <h3 className="mb-3 text-sm font-semibold text-slate-900">
                    Stock by Location
                  </h3>
                  {selectedStocks.length === 0 ? (
                    <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
                      No location stock recorded yet.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {selectedStocks.map((s) => (
                        <div
                          key={s.id}
                          className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-2.5"
                        >
                          <span className="text-sm text-slate-700">
                            {locationName(s.locationId)}
                          </span>
                          <span className="font-semibold text-slate-900">
                            {s.quantity.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <section>
                  <h3 className="mb-3 text-sm font-semibold text-slate-900">
                    Recent Movements
                  </h3>
                  {selectedMovements.length === 0 ? (
                    <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
                      No recent movements.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {selectedMovements.map((m) => (
                        <div
                          key={m.id}
                          className="rounded-lg border border-slate-200 px-4 py-2.5"
                        >
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-xs font-semibold ${m.quantity >= 0 ? "text-emerald-700" : "text-red-700"}`}
                            >
                              {m.type}
                            </span>
                            <span
                              className={`text-sm font-semibold ${m.quantity >= 0 ? "text-emerald-700" : "text-red-700"}`}
                            >
                              {m.quantity >= 0 ? "+" : ""}
                              {m.quantity.toLocaleString()}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-slate-500">
                            {m.locationName} ({m.locationCode}) ·{" "}
                            {new Date(m.createdAt).toLocaleString("en-KE")}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40"
            onClick={() => setShowAddModal(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">
                  Add Product
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Create a new product in the inventory catalog.
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={createProduct} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Product name
                </label>
                <input
                  required
                  minLength={2}
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  placeholder="e.g. Rice 5kg bag"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Unit cost (KSh)
                </label>
                <input
                  required
                  type="number"
                  min="0"
                  step="1"
                  value={newUnitCost}
                  onChange={(e) => setNewUnitCost(e.target.value)}
                  placeholder="e.g. 500"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingProduct}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {creatingProduct && (
                    <RefreshCw size={14} className="animate-spin" />
                  )}
                  {creatingProduct ? "Creating…" : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
