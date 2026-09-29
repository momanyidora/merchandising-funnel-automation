"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import {
  Edit,
  Mail,
  Phone,
  Plus,
  RefreshCw,
  Trash2,
  Truck,
  Users,
} from "lucide-react";
import Sidebar from "../components/Sidebar";

type Vendor = {
  id: string;
  name: string;
  email: string;
  phone: string;
  paymentTerms: string;
  leadTimeDays: number;
};

type VendorForm = {
  name: string;
  email: string;
  phone: string;
  paymentTerms: string;
  leadTimeDays: string;
};

const emptyForm: VendorForm = {
  name: "",
  email: "",
  phone: "",
  paymentTerms: "Net 30",
  leadTimeDays: "14",
};

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [form, setForm] = useState<VendorForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalVendors, setTotalVendors] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  async function loadVendors() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`/api/vendor/vendors?page=${page}&pageSize=${pageSize}&search=${encodeURIComponent(search)}`);

      if (!response.ok) {
        throw new Error("Failed to load vendors");
      }

      const data = await response.json();
      setVendors(data.items ?? data);
      setTotalVendors(data.total ?? data.length);
      setTotalPages(data.totalPages ?? 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load vendors");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    async function fetchVendors() {
      try {
        setLoading(true); setError("");
        const response = await fetch(`/api/vendor/vendors?page=${page}&pageSize=${pageSize}&search=${encodeURIComponent(search)}`);
        if (!response.ok) throw new Error("Failed to load vendors");
        const data = await response.json();
        if (!cancelled) { setVendors(data.items ?? data); setTotalVendors(data.total ?? data.length); setTotalPages(data.totalPages ?? 1); }
      } catch (err) { if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load vendors"); }
      finally { if (!cancelled) setLoading(false); }
    }
    void fetchVendors();
    return () => { cancelled = true; };
  }, [page, search]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setSubmitting(true);
      setError("");

      const isEditing = Boolean(editingVendor);

      const response = await fetch(
        isEditing
          ? `/api/vendor/vendors/${editingVendor?.id}`
          : "/api/vendor/vendors",
        {
          method: isEditing ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: form.name,
            email: form.email,
            phone: form.phone,
            paymentTerms: form.paymentTerms,
            leadTimeDays: Number(form.leadTimeDays),
          }),
        },
      );

      if (!response.ok) {
        const data = await response.json().catch(() => null);

        throw new Error(data?.error || "Failed to save vendor");
      }

      await response.json();

      if (!isEditing) setPage(1);
      await loadVendors();
      setForm(emptyForm);
      setEditingVendor(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save vendor");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(vendorId: string) {
    try {
      setError("");

      const response = await fetch(`/api/vendor/vendors/${vendorId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);

        throw new Error(data?.error || "Failed to delete vendor");
      }

      setVendors((current) =>
        current.filter((vendor) => vendor.id !== vendorId),
      );

      if (editingVendor?.id === vendorId) {
        setEditingVendor(null);
        setForm(emptyForm);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete vendor");
    }
  }

  function handleEdit(vendor: Vendor) {
    setEditingVendor(vendor);

    setForm({
      name: vendor.name,
      email: vendor.email,
      phone: vendor.phone,
      paymentTerms: vendor.paymentTerms,
      leadTimeDays: String(vendor.leadTimeDays),
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function handleCancelEdit() {
    setEditingVendor(null);
    setForm(emptyForm);
    setError("");
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Sidebar />

      <main className="ml-0 min-h-screen lg:ml-64">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-blue-600">
                <Truck size={16} />
                Vendor Management
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                Vendors
              </h1>

              <p className="mt-1 max-w-2xl text-sm text-slate-500 sm:text-base">
                Manage your suppliers, payment terms, and expected delivery
                timelines.
              </p>
            </div>

            <button
              type="button"
              onClick={loadVendors}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-red-500" />
              <p>{error}</p>
            </div>
          )}

          {/* Stats */}
          <div className="mb-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Total Vendors
                  </p>

                  <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                    {totalVendors}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Registered suppliers
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Users size={21} />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Vendor Management
                  </p>

                  <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                    Active
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Supplier records are available
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Truck size={21} />
                </div>
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
            {/* Vendor form */}
            <section className="h-fit overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-6 py-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Plus size={20} />
                  </div>

                  <div>
                    <h2 className="font-semibold text-slate-950">
                      {editingVendor ? "Edit Vendor" : "Add Vendor"}
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      {editingVendor
                        ? "Update the supplier information below."
                        : "Create a new supplier record."}
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 p-6">
                <div>
                  <label
                    htmlFor="vendor-name"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    Vendor Name
                  </label>

                  <input
                    id="vendor-name"
                    required
                    placeholder="e.g. Acme Supplies Ltd"
                    value={form.name}
                    onChange={(event) =>
                      setForm({ ...form, name: event.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="vendor-email"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    Email
                  </label>

                  <div className="relative">
                    <Mail
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      id="vendor-email"
                      required
                      type="email"
                      placeholder="supplier@example.com"
                      value={form.email}
                      onChange={(event) =>
                        setForm({ ...form, email: event.target.value })
                      }
                      className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="vendor-phone"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    Phone Number
                  </label>

                  <div className="relative">
                    <Phone
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      id="vendor-phone"
                      required
                      placeholder="+254 700 000 000"
                      value={form.phone}
                      onChange={(event) =>
                        setForm({ ...form, phone: event.target.value })
                      }
                      className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="payment-terms"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    Payment Terms
                  </label>

                  <input
                    id="payment-terms"
                    required
                    placeholder="Net 30"
                    value={form.paymentTerms}
                    onChange={(event) =>
                      setForm({ ...form, paymentTerms: event.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="lead-time"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    Lead Time
                  </label>

                  <div className="relative">
                    <input
                      id="lead-time"
                      required
                      type="number"
                      min="0"
                      step="1"
                      inputMode="numeric"
                      placeholder="14"
                      value={form.leadTimeDays}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          leadTimeDays: event.target.value,
                        })
                      }
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 pr-16 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />

                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                      days
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting && (
                      <RefreshCw size={16} className="animate-spin" />
                    )}

                    {submitting
                      ? "Saving..."
                      : editingVendor
                        ? "Update Vendor"
                        : "Create Vendor"}
                  </button>

                  {editingVendor && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </section>

            {/* Vendor list */}
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-3 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Truck size={20} />
                  </div>

                  <div>
                    <h2 className="font-semibold text-slate-950">
                      Vendor List
                    </h2>

                    <p className="text-sm text-slate-500">
                      {totalVendors} vendor{totalVendors === 1 ? "" : "s"} registered
                    </p>
                  </div>
                </div>

                <span className="w-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Active
                </span>
              </div>

              <div className="border-b border-slate-100 p-4">
                <label htmlFor="vendor-search" className="sr-only">Search vendors by name</label>
                <input id="vendor-search" type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search vendor names…" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              </div>
              {loading ? (
                <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12">
                  <RefreshCw
                    size={24}
                    className="mb-3 animate-spin text-blue-600"
                  />

                  <p className="text-sm font-medium text-slate-700">
                    Loading vendors...
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Please wait a moment.
                  </p>
                </div>
              ) : vendors.length === 0 ? (
                <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                    <Users size={22} />
                  </div>

                  <h3 className="font-semibold text-slate-900">
                    No vendors yet
                  </h3>

                  <p className="mt-1 max-w-sm text-sm text-slate-500">
                    Add your first vendor using the form to start managing
                    suppliers.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {vendors.map((vendor) => (
                    <div
                      key={vendor.id}
                      className="group flex flex-col gap-4 p-5 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex min-w-0 items-start gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-700">
                          {vendor.name
                            .split(" ")
                            .map((part) => part[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>

                        <div className="min-w-0">
                          <Link
                            href={`/vendors/${vendor.id}`}
                            className="font-semibold text-slate-900 transition hover:text-blue-600"
                          >
                            {vendor.name}
                          </Link>

                          <div className="mt-1.5 flex flex-col gap-1 text-sm text-slate-500 sm:flex-row sm:items-center sm:gap-4">
                            <span className="flex items-center gap-1.5 truncate">
                              <Mail size={14} className="shrink-0" />
                              {vendor.email}
                            </span>

                            <span className="flex items-center gap-1.5">
                              <Phone size={14} className="shrink-0" />
                              {vendor.phone}
                            </span>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2">
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                              {vendor.paymentTerms}
                            </span>

                            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                              {vendor.leadTimeDays} days lead time
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-1">
                        <Link
                          href={`/vendors/${vendor.id}`}
                          className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                        >
                          View
                        </Link>

                        <button
                          type="button"
                          onClick={() => handleEdit(vendor)}
                          className="rounded-lg p-2 text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
                          aria-label={`Edit ${vendor.name}`}
                        >
                          <Edit size={18} />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const confirmed = window.confirm(
                              `Are you sure you want to delete ${vendor.name}?`,
                            );

                            if (confirmed) {
                              handleDelete(vendor.id);
                            }
                          }}
                          className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                          aria-label={`Delete ${vendor.name}`}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4">
                <p className="text-sm text-slate-500">Page {page} of {totalPages}</p>
                <div className="flex gap-2">
                  <button type="button" disabled={page <= 1 || loading} onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded-lg border px-3 py-2 text-sm disabled:opacity-40">Previous</button>
                  <button type="button" disabled={page >= totalPages || loading} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="rounded-lg border px-3 py-2 text-sm disabled:opacity-40">Next</button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
