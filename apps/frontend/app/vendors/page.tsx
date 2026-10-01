"use client";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { Edit, Plus, RefreshCw, Trash2, Truck } from "lucide-react";

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

  async function loadVendors() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/vendor/vendors");

      if (!response.ok) {
        throw new Error("Failed to load vendors");
      }

      const data = await response.json();
      setVendors(data);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to load vendors",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    fetch("/api/vendor/vendors")
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Failed to load vendors");
        }

        return response.json();
      })
      .then((data: Vendor[]) => {
        if (!cancelled) {
          setVendors(data);
          setLoading(false);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setError(
            error instanceof Error ? error.message : "Failed to load vendors",
          );
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setSubmitting(true);
      setError("");

      const isEditing = editingVendor !== null;

      const response = await fetch(
        isEditing
          ? `/api/vendor/vendors/${editingVendor.id}`
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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to save vendor");
      }

      setVendors((current) =>
        isEditing
          ? current.map((vendor) => (vendor.id === data.id ? data : vendor))
          : [data, ...current],
      );

      setForm(emptyForm);
      setEditingVendor(null);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to save vendor",
      );
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

      const data = response.status === 204 ? null : await response.json();

      if (!response.ok) {
        throw new Error(data?.error ?? "Failed to delete vendor");
      }

      setVendors((current) =>
        current.filter((vendor) => vendor.id !== vendorId),
      );
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to delete vendor",
      );
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
  }

  function handleCancelEdit() {
    setEditingVendor(null);
    setForm(emptyForm);
    setError("");
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-blue-600">
              Phase 1 • Vendor Management
            </p>

            <h1 className="mt-2 text-3xl font-bold text-slate-900">Vendors</h1>

            <p className="mt-2 text-slate-600">
              Manage your suppliers and their business details.
            </p>
          </div>

          <button
            type="button"
            onClick={loadVendors}
            className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                {editingVendor ? <Edit size={20} /> : <Plus size={20} />}
              </div>

              <div>
                <h2 className="font-semibold text-slate-900">
                  {editingVendor ? "Edit Vendor" : "Add Vendor"}
                </h2>

                <p className="text-sm text-slate-500">
                  {editingVendor
                    ? "Update supplier details"
                    : "Create a new supplier"}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                required
                placeholder="Vendor name"
                value={form.name}
                onChange={(event) =>
                  setForm({ ...form, name: event.target.value })
                }
               className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 outline-none focus:border-blue-500"
              />

              <input
                required
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(event) =>
                  setForm({ ...form, email: event.target.value })
                }
               className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 outline-none focus:border-blue-500"
              />

              <input
                required
                placeholder="Phone"
                value={form.phone}
                onChange={(event) =>
                  setForm({ ...form, phone: event.target.value })
                }
               className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 outline-none focus:border-blue-500"
              />

              <input
                required
                placeholder="Payment terms"
                value={form.paymentTerms}
                onChange={(event) =>
                  setForm({ ...form, paymentTerms: event.target.value })
                }
               className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 outline-none focus:border-blue-500"
              />

              <input
                required
                type="number"
                min="0"
                placeholder="Lead time (days)"
                value={form.leadTimeDays}
                onChange={(event) =>
                  setForm({ ...form, leadTimeDays: event.target.value })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 outline-none focus:border-blue-500"
/>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
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
                    className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-6">
              <div className="flex items-center gap-3">
                <Truck size={20} className="text-blue-600" />

                <div>
                  <h2 className="font-semibold text-slate-900">Vendor List</h2>

                  <p className="text-sm text-slate-500">
                    {vendors.length} vendor{vendors.length === 1 ? "" : "s"}
                  </p>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="p-6 text-sm text-slate-500">
                Loading vendors...
              </div>
            ) : vendors.length === 0 ? (
              <div className="p-6 text-sm text-slate-500">
                No vendors found.
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {vendors.map((vendor) => (
                  <div
                    key={vendor.id}
                    className="flex items-center justify-between p-6"
                  >
                    <div>
                      <Link
                        href={`/vendors/${vendor.id}`}
                        className="font-semibold text-slate-900 hover:text-blue-600"
                      >
                        {vendor.name}
                      </Link>

                      <p className="mt-1 text-sm text-slate-500">
                        {vendor.email}
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        {vendor.phone} • {vendor.paymentTerms} •{" "}
                        {vendor.leadTimeDays} days
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(vendor)}
                        className="rounded-lg p-2 text-slate-400 hover:bg-blue-50 hover:text-blue-600"
                        aria-label={`Edit ${vendor.name}`}
                      >
                        <Edit size={18} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(vendor.id)}
                        className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        aria-label={`Delete ${vendor.name}`}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
