"use client";

import { FormEvent, useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";

type Audit = {
  id: string;
  store_name: string;
  register_name: string;
  cashier_name: string;
  business_date: string;
  expected_total: number;
  actual_total: number;
  variance: number;
  manager_name: string;
  explanation: string;
  status: string;
};

type TenderMethod = "CASH" | "CARD" | "GIFT_CARD";

type Counts = Record<TenderMethod, string>;

type Field = {
  label: string;
  value: string;
  setValue: (value: string) => void;
};

function todayLocal() {
  const d = new Date();

  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
}

export default function SalesAuditPage() {
  const [storeName, setStoreName] = useState("");
  const [registerName, setRegisterName] = useState("");
  const [cashierName, setCashierName] = useState("");
  const [managerName, setManagerName] = useState("");
  const [businessDate, setBusinessDate] = useState(todayLocal());
  const [counts, setCounts] = useState<Counts>({
    CASH: "",
    CARD: "",
    GIFT_CARD: "",
  });
  const [explanation, setExplanation] = useState("");
  const [audits, setAudits] = useState<Audit[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  async function refresh() {
    try {
      const response = await fetch("/api/sales-audit");

      if (!response.ok) {
        throw new Error("Unable to load register history");
      }

      const data: Audit[] = await response.json();
      setAudits(data);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Audit service unavailable",
      );
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refresh();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  async function closeRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setNotice("");

    const values = Object.values(counts).map(Number);

    if (values.some((value) => !Number.isSafeInteger(value) || value < 0)) {
      setError("Each tender count must be a non-negative whole KES amount.");
      return;
    }

    if (!managerName.trim() || explanation.trim().length < 8) {
      setError(
        "Enter a manager name and an explanation of at least 8 characters.",
      );
      return;
    }

    setBusy(true);

    try {
      const response = await fetch("/api/sales-audit", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          storeName,
          registerName,
          cashierName,
          managerName,
          businessDate,
          currency: "KES",
          counts: Object.entries(counts).map(([method, actual]) => ({
            method,
            actual: Number(actual),
          })),
          explanation,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not close register");
      }

      setNotice(
        `Register closed. Expected KES ${Number(
          data.expected_total,
        ).toLocaleString("en-KE")}; counted KES ${Number(
          data.actual_total,
        ).toLocaleString("en-KE")}; variance KES ${Number(
          data.variance,
        ).toLocaleString("en-KE")} (${
          data.eventStatus || "queued for Finance"
        }).`,
      );

      setCounts({
        CASH: "",
        CARD: "",
        GIFT_CARD: "",
      });
      setExplanation("");

      await refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Audit failed");
    } finally {
      setBusy(false);
    }
  }

  const fields: Field[] = [
    {
      label: "Store",
      value: storeName,
      setValue: setStoreName,
    },
    {
      label: "Register",
      value: registerName,
      setValue: setRegisterName,
    },
    {
      label: "Cashier",
      value: cashierName,
      setValue: setCashierName,
    },
    {
      label: "Manager",
      value: managerName,
      setValue: setManagerName,
    },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <main className="mx-auto w-full max-w-6xl space-y-6 p-6">
        <header>
          <p className="text-sm font-semibold text-blue-600">Store close</p>

          <h1 className="text-3xl font-bold">Sales Audit</h1>

          <p className="mt-2 text-slate-500">
            Compare POS tender totals to the physical drawer and card slips. A
            manager explanation is required before close.
          </p>
        </header>

        {error && (
          <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-700">
            {error}
          </p>
        )}

        {notice && (
          <p
            role="status"
            className="rounded-lg bg-emerald-50 p-3 text-emerald-700"
          >
            {notice}
          </p>
        )}

        <form
          onSubmit={closeRegister}
          className="space-y-5 rounded-2xl border bg-white p-6"
        >
          <div className="grid gap-4 md:grid-cols-3">
            {fields.map((field) => (
              <label
                key={field.label}
                className="space-y-1 text-sm font-medium"
              >
                {field.label}

                <input
                  required
                  value={field.value}
                  onChange={(event) => field.setValue(event.target.value)}
                  className="w-full rounded-lg border px-3 py-2"
                  placeholder={`${field.label} name`}
                />
              </label>
            ))}

            <label className="space-y-1 text-sm font-medium">
              Business date
              <input
                type="date"
                required
                value={businessDate}
                onChange={(event) => setBusinessDate(event.target.value)}
                className="w-full rounded-lg border px-3 py-2"
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {(["CASH", "CARD", "GIFT_CARD"] as TenderMethod[]).map((method) => (
              <label key={method} className="space-y-1 text-sm font-medium">
                {method.replace("_", " ")} counted (KES)
                <input
                  required
                  type="number"
                  min="0"
                  step="1"
                  inputMode="numeric"
                  value={counts[method]}
                  onChange={(event) =>
                    setCounts({
                      ...counts,
                      [method]: event.target.value,
                    })
                  }
                  className="w-full rounded-lg border px-3 py-2"
                />
              </label>
            ))}
          </div>

          <label className="block space-y-1 text-sm font-medium">
            Manager explanation
            <textarea
              minLength={8}
              required
              rows={3}
              value={explanation}
              onChange={(event) => setExplanation(event.target.value)}
              className="w-full rounded-lg border px-3 py-2"
              placeholder="Explain any cash overage or shortage"
            />
          </label>

          <button
            disabled={busy}
            className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white disabled:opacity-50"
          >
            {busy ? "Reconciling…" : "Reconcile and close register"}
          </button>
        </form>

        <section className="rounded-2xl border bg-white p-5">
          <h2 className="mb-4 font-semibold">Recent reconciliations</h2>

          <div className="divide-y">
            {audits.map((audit) => (
              <article
                key={audit.id}
                className="grid gap-2 py-4 md:grid-cols-4"
              >
                <div>
                  <b>
                    {audit.store_name} · {audit.register_name}
                  </b>

                  <p className="text-sm text-slate-500">
                    {audit.cashier_name} ·{" "}
                    {new Date(audit.business_date).toLocaleDateString("en-KE", {
                      dateStyle: "medium",
                      timeZone: "UTC",
                    })}
                  </p>
                </div>

                <p className="text-sm">
                  Expected{" "}
                  <b>
                    KES {Number(audit.expected_total).toLocaleString("en-KE")}
                  </b>
                  <br />
                  Counted KES{" "}
                  {Number(audit.actual_total).toLocaleString("en-KE")}
                </p>

                <p
                  className={`text-sm font-semibold ${
                    audit.variance === 0 ? "text-emerald-700" : "text-amber-700"
                  }`}
                >
                  Variance KES {Number(audit.variance).toLocaleString("en-KE")}
                </p>

                <p className="text-sm text-slate-500">
                  Closed by {audit.manager_name}
                  <br />
                  {audit.explanation}
                </p>
              </article>
            ))}

            {!audits.length && (
              <p className="py-6 text-sm text-slate-500">
                No reconciliations recorded.
              </p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
