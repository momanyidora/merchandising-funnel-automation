"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  MapPin,
  Package,
  Plus,
  RefreshCw,
  Warehouse,
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import ProductPicker from "../components/ProductPicker";

type Location = {
  id: string;
  code: string;
  name: string;
  capacity: number;
  inventory_location_id: string;
  default_putaway: boolean;
  occupied?: number;
  utilization_percent?: number;
};

type Task = {
  id: string;
  task_type: "PUTAWAY" | "PICK" | "TRANSFER";
  product_id: string;
  product_name?: string;
  quantity: number;
  source_location_name: string;
  destination_location_name: string;
  status: "OPEN" | "COMPLETED";
  created_at: string;
};

type InventoryLocation = {
  id: string;
  code: string;
  name: string;
};

type Tab = "LOCATIONS" | "TASKS" | "CREATE";

export default function WarehousePage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [inventoryLocations, setInventoryLocations] = useState<
    InventoryLocation[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("LOCATIONS");

  // Forms
  const [locName, setLocName] = useState("");
  const [locCode, setLocCode] = useState("");
  const [capacity, setCapacity] = useState("");
  const [inventoryLocationId, setInventoryLocationId] = useState("");
  const [defaultPutaway, setDefaultPutaway] = useState(false);

  const [taskType, setTaskType] = useState("TRANSFER");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const [l, t, inv, u] = await Promise.all([
        fetch("/api/warehouse/locations"),
        fetch("/api/warehouse/tasks"),
        fetch("/api/inventory/locations"),
        fetch("/api/warehouse/utilization"),
      ]);
      if (!l.ok || !t.ok || !inv.ok || !u.ok) {
        throw new Error("A warehouse or inventory service is unavailable");
      }
      const [locData, taskData, invData, utilData] = await Promise.all([
        l.json(),
        t.json(),
        inv.json(),
        u.json(),
      ]);

      const utilMap: Record<string, Location> = Object.fromEntries(
        utilData.map((x: Location) => [x.id, x]),
      );

      setLocations(
        locData.map((x: Location) => {
          const occupied = Number(utilMap[x.id]?.occupied ?? 0);
          const utilizationPercent = Number(
            utilMap[x.id]?.utilization_percent ?? 0,
          );
          return {
            ...x,
            occupied: Number.isFinite(occupied) ? occupied : 0,
            utilization_percent: Number.isFinite(utilizationPercent)
              ? utilizationPercent
              : 0,
          };
        }),
      );
      setInventoryLocations(invData);

      const ids = [...new Set(taskData.map((x: Task) => x.product_id))];
      if (ids.length > 0) {
        const p = await fetch(
          `/api/inventory/products?ids=${encodeURIComponent(ids.join(","))}`,
        );
        const products = p.ok ? await p.json() : [];
        const names: Record<string, string> = Object.fromEntries(
          products.map((x: { productId: string; productName: string }) => [
            x.productId,
            x.productName,
          ]),
        );
        ids.forEach((id) => {
          if (!names[id as string])
            names[id as string] = `Product ${(id as string).slice(0, 8)}`;
        });
        setTasks(
          taskData.map((x: Task) => ({
            ...x,
            product_name: names[x.product_id],
          })),
        );
      } else {
        setTasks(taskData);
      }
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Unable to load warehouse data",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  async function addLocation(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setNotice("");
    if (!Number.isSafeInteger(Number(capacity)) || Number(capacity) < 1) {
      setError("Capacity must be a positive whole number of units.");
      return;
    }
    setSaving(true);
    try {
      const r = await fetch("/api/warehouse/locations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: locName,
          code: locCode,
          capacity: Number(capacity),
          inventoryLocationId,
          defaultPutaway,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Location could not be created");
      setNotice("Storage location added.");
      setLocName("");
      setLocCode("");
      setCapacity("");
      setInventoryLocationId("");
      setDefaultPutaway(false);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Location failed");
    } finally {
      setSaving(false);
    }
  }

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setNotice("");
    if (
      !productId ||
      !source ||
      !destination ||
      !Number.isSafeInteger(Number(quantity)) ||
      Number(quantity) < 1
    ) {
      setError(
        "Select a product and both locations, and enter a positive whole quantity.",
      );
      return;
    }
    setSaving(true);
    try {
      const r = await fetch("/api/warehouse/tasks", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          taskType,
          productId,
          quantity: Number(quantity),
          sourceLocationId: source,
          destinationLocationId: destination,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Task could not be created");
      setNotice("Warehouse task created.");
      setProductId("");
      setQuantity("1");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Task failed");
    } finally {
      setSaving(false);
    }
  }

  async function complete(id: string) {
    setError("");
    setNotice("");
    try {
      const r = await fetch(`/api/warehouse/tasks/${id}/complete`, {
        method: "PATCH",
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Task could not be completed");
      setNotice(`Moved ${d.quantity} units of ${d.productName}.`);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Task failed");
    }
  }

  const openTasks = tasks.filter((t) => t.status === "OPEN");
  const completedToday = tasks.filter((t) => {
    if (t.status !== "COMPLETED") return false;
    const d = new Date(t.created_at);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });
  const avgUtilization =
    locations.length > 0
      ? Math.round(
          locations.reduce((sum, location) => {
            const utilization = Number(location.utilization_percent ?? 0);
            return sum + (Number.isFinite(utilization) ? utilization : 0);
          }, 0) /
            locations.length,
        )
      : 0;
  const totalCapacity = locations.reduce((s, l) => s + l.capacity, 0);

  const hasDockLocation = locations.some((l) => !l.default_putaway);
  const hasDefaultPutaway = locations.some((l) => l.default_putaway);

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <Sidebar />
      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-blue-600">
                <Warehouse size={16} /> Warehouse Operations
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                Warehouse Floor
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-slate-500 sm:text-base">
                Manage physical bins, putaway and pick tasks, and stock
                transfers across the warehouse.
              </p>
            </div>
            <button
              onClick={refresh}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>

          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" /> {error}
            </div>
          )}

          {notice && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> {notice}
            </div>
          )}

          {/* Setup Warning */}
          {!hasDockLocation || !hasDefaultPutaway ? (
            <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm">
              <div className="flex items-start gap-3">
                <AlertTriangle
                  size={18}
                  className="mt-0.5 shrink-0 text-amber-700"
                />
                <div>
                  <p className="font-semibold text-amber-900">Setup required</p>
                  <p className="mt-1 text-amber-800">
                    You need at least one <strong>Dock location</strong> (where
                    trucks unload) and one{" "}
                    <strong>Default Putaway location</strong> (where goods get
                    stored) before receiving deliveries.
                  </p>
                  <button
                    onClick={() => setActiveTab("CREATE")}
                    className="mt-3 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
                  >
                    Set up locations
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {/* Stats */}
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                    {totalCapacity} total capacity
                  </p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <MapPin size={21} />
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Avg Utilization
                  </p>
                  <p className="mt-2 text-3xl font-bold text-slate-950">
                    {avgUtilization}%
                  </p>
                  <p className="mt-1 text-xs text-slate-500">Across all bins</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Warehouse size={21} />
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Open Tasks
                  </p>
                  <p className="mt-2 text-3xl font-bold text-slate-950">
                    {openTasks.length}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Awaiting completion
                  </p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <Package size={21} />
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Completed Today
                  </p>
                  <p className="mt-2 text-3xl font-bold text-slate-950">
                    {completedToday.length}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">Tasks finished</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <CheckCircle2 size={21} />
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-4 flex flex-wrap gap-2">
            {[
              { key: "LOCATIONS" as Tab, label: "Locations" },
              { key: "TASKS" as Tab, label: `Tasks (${openTasks.length})` },
              { key: "CREATE" as Tab, label: "Create" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                  activeTab === tab.key
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* LOCATIONS TAB */}
          {activeTab === "LOCATIONS" && (
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-6 py-5">
                <h2 className="font-semibold text-slate-950">
                  Storage Locations
                </h2>
                <p className="text-sm text-slate-500">
                  {locations.length} bin{locations.length === 1 ? "" : "s"}{" "}
                  across the warehouse
                </p>
              </div>
              {loading ? (
                <div className="flex min-h-64 items-center justify-center">
                  <RefreshCw size={20} className="animate-spin text-blue-600" />
                </div>
              ) : locations.length === 0 ? (
                <div className="flex min-h-64 flex-col items-center justify-center p-12 text-center">
                  <MapPin size={32} className="text-slate-300" />
                  <h3 className="mt-4 font-semibold text-slate-900">
                    No locations yet
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Create your first storage location to start.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
                  {locations.map((l) => {
                    const util = l.utilization_percent ?? 0;
                    const isFull = util >= 90;
                    return (
                      <article
                        key={l.id}
                        className="rounded-xl border border-slate-200 bg-white p-4"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-slate-900">
                              {l.name}
                            </p>
                            <p className="text-xs text-slate-500">{l.code}</p>
                          </div>
                          {l.default_putaway && (
                            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="mt-3 text-sm text-slate-700">
                          {l.occupied ?? 0} / {l.capacity} units · {util}%
                        </p>
                        <div className="mt-2 h-2 overflow-hidden rounded bg-slate-100">
                          <div
                            className={`h-full transition ${isFull ? "bg-red-500" : util >= 70 ? "bg-amber-500" : "bg-blue-600"}`}
                            style={{ width: `${Math.min(100, util)}%` }}
                          />
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* TASKS TAB */}
          {activeTab === "TASKS" && (
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-6 py-5">
                <h2 className="font-semibold text-slate-950">Task Queue</h2>
                <p className="text-sm text-slate-500">
                  {openTasks.length} open · {tasks.length - openTasks.length}{" "}
                  completed
                </p>
              </div>
              {tasks.length === 0 ? (
                <div className="flex min-h-64 flex-col items-center justify-center p-12 text-center">
                  <Package size={32} className="text-slate-300" />
                  <h3 className="mt-4 font-semibold text-slate-900">
                    No tasks yet
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Putaway tasks are auto-created when goods are received. You
                    can also create tasks manually.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {tasks.map((t) => {
                    const typeColor =
                      t.task_type === "PUTAWAY"
                        ? "bg-blue-50 text-blue-700"
                        : t.task_type === "PICK"
                          ? "bg-purple-50 text-purple-700"
                          : "bg-amber-50 text-amber-700";
                    return (
                      <div
                        key={t.id}
                        className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex min-w-0 items-start gap-4">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                            <Package size={19} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold text-slate-900">
                                {t.product_name ?? "Unknown product"} ×{" "}
                                {t.quantity}
                              </p>
                              <span
                                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${typeColor}`}
                              >
                                {t.task_type}
                              </span>
                              <span
                                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                                  t.status === "OPEN"
                                    ? "bg-amber-50 text-amber-700"
                                    : "bg-emerald-50 text-emerald-700"
                                }`}
                              >
                                {t.status}
                              </span>
                            </div>
                            <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
                              {t.source_location_name} <ArrowRight size={12} />{" "}
                              {t.destination_location_name}
                            </p>
                          </div>
                        </div>
                        {t.status === "OPEN" && (
                          <button
                            onClick={() => void complete(t.id)}
                            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                          >
                            <CheckCircle2 size={14} /> Complete
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* CREATE TAB */}
          {activeTab === "CREATE" && (
            <div className="grid gap-6 lg:grid-cols-2">
              <form
                onSubmit={addLocation}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <h2 className="font-semibold text-slate-950">
                      Add Storage Location
                    </h2>
                    <p className="text-xs text-slate-500">
                      Create a bin, shelf, or zone.
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <input
                    required
                    minLength={2}
                    value={locName}
                    onChange={(e) => setLocName(e.target.value)}
                    placeholder="Location name (e.g. Aisle 2 Bin 4)"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      required
                      value={locCode}
                      onChange={(e) => setLocCode(e.target.value)}
                      placeholder="Code (e.g. A2-B4)"
                      className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                    />
                    <input
                      required
                      type="number"
                      min="1"
                      step="1"
                      value={capacity}
                      onChange={(e) => setCapacity(e.target.value)}
                      placeholder="Capacity (units)"
                      className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                    />
                  </div>
                  <select
                    required
                    value={inventoryLocationId}
                    onChange={(e) => setInventoryLocationId(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                  >
                    <option value="">Link to Inventory location</option>
                    {inventoryLocations.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name} · {l.code}
                      </option>
                    ))}
                  </select>
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={defaultPutaway}
                      onChange={(e) => setDefaultPutaway(e.target.checked)}
                    />
                    Default putaway destination (auto-route received goods here)
                  </label>
                  <button
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    <Plus size={14} /> Add Location
                  </button>
                </div>
              </form>

              <form
                onSubmit={addTask}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Package size={20} />
                  </div>
                  <div>
                    <h2 className="font-semibold text-slate-950">
                      Create Movement Task
                    </h2>
                    <p className="text-xs text-slate-500">
                      Putaway, pick, or transfer.
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <select
                      value={taskType}
                      onChange={(e) => setTaskType(e.target.value)}
                      className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                    >
                      <option value="PUTAWAY">Putaway</option>
                      <option value="PICK">Pick</option>
                      <option value="TRANSFER">Transfer</option>
                    </select>
                    <input
                      required
                      type="number"
                      min="1"
                      step="1"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder="Quantity"
                      className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                    />
                  </div>
                  <ProductPicker value={productId} onChange={setProductId} />
                  <select
                    required
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                  >
                    <option value="">Source location</option>
                    {locations.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name} · {l.code}
                      </option>
                    ))}
                  </select>
                  <select
                    required
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                  >
                    <option value="">Destination location</option>
                    {locations.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name} · {l.code}
                      </option>
                    ))}
                  </select>
                  <button
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    <Plus size={14} /> Create Task
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
