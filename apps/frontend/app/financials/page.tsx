"use client";
import { useCallback,useEffect,useState } from "react";
import Sidebar from "../components/Sidebar";
type Row=Record<string,unknown>;type Vendor={id:string;name:string};
function formatTime(value:unknown){const raw=String(value);const dateOnly=/^\d{4}-\d{2}-\d{2}$/.test(raw);const d=new Date(dateOnly?`${raw}T00:00:00Z`:raw);return Number.isNaN(d.getTime())?"—":d.toLocaleString("en-KE",{dateStyle:"medium",...(dateOnly?{timeZone:"UTC"}:{timeStyle:"short"})})}
function amount(value:unknown){return `KES ${Number(value||0).toLocaleString("en-KE",{maximumFractionDigits:0})}`}
export default function FinancialsPage(){const [ledger,setLedger]=useState<Row[]>([]);const [payables,setPayables]=useState<Row[]>([]);const [balances,setBalances]=useState<Row[]>([]);const [vendors,setVendors]=useState<Record<string,string>>({});const [from,setFrom]=useState("");const [to,setTo]=useState("");const [error,setError]=useState("");const [loading,setLoading]=useState(false);
 const refresh=useCallback(async()=>{setLoading(true);setError("");try{const q=new URLSearchParams();if(from)q.set("from",from);if(to)q.set("to",to);const suffix=q.size?`?${q}`:"";const [l,p,b,v]=await Promise.all([fetch(`/api/financials/ledger${suffix}`),fetch("/api/financials/payables"),fetch(`/api/financials/profitability${suffix}`),fetch("/api/vendor/vendors")]);for(const r of [l,p,b])if(!r.ok)throw new Error("Financial report service unavailable");const [ld,pd,bd]=await Promise.all([l.json(),p.json(),b.json()]);const vendorData:Vendor[]=v.ok?await v.json():[];setLedger(ld);setPayables(pd);setBalances(bd);setVendors(Object.fromEntries(vendorData.map(x=>[x.id,x.name])))}catch(e){setError(e instanceof Error?e.message:"Unable to load reports")}finally{setLoading(false)}},[from,to]);

useEffect(()=>{
  let cancelled=false;
  const load=async()=>{
    setLoading(true);
    setError("");
    try{
      const q=new URLSearchParams();
      if(from)q.set("from",from);
      if(to)q.set("to",to);
      const suffix=q.size?`?${q}`:"";
      const [l,p,b,v]=await Promise.all([
        fetch(`/api/financials/ledger${suffix}`),
        fetch("/api/financials/payables"),
        fetch(`/api/financials/profitability${suffix}`),
        fetch("/api/vendor/vendors")
      ]);
      for(const r of [l,p,b])if(!r.ok)throw new Error("Financial report service unavailable");
      const [ld,pd,bd]=await Promise.all([l.json(),p.json(),b.json()]);
      const vendorData:Vendor[]=v.ok?await v.json():[];
      if(cancelled)return;
      setLedger(ld);
      setPayables(pd);
      setBalances(bd);
      setVendors(Object.fromEntries(vendorData.map(x=>[x.id,x.name])));
    }catch(e){
      if(!cancelled)setError(e instanceof Error?e.message:"Unable to load reports");
    }finally{
      if(!cancelled)setLoading(false);
    }
  };
  void load();
  return()=>{cancelled=true};
},[from,to]);
 const credit=(code:string)=>balances.filter(x=>x.account_code===code).reduce((n,x)=>n+Number(x.credits||0),0);const debit=(code:string)=>balances.filter(x=>x.account_code===code).reduce((n,x)=>n+Number(x.debits||0),0);const revenue=credit("SALES_REVENUE");const cogs=debit("COST_OF_GOODS_SOLD");
 return <div className="flex min-h-screen bg-slate-50"><Sidebar/><main className="mx-auto w-full max-w-7xl space-y-6 p-6"><header><p className="text-sm font-semibold text-blue-600">Back office</p><h1 className="text-3xl font-bold">Financials</h1><p className="mt-2 text-slate-500">Read-only ledger, supplier balances, revenue, and cost of goods sold.</p></header>{error&&<p role="alert" className="rounded-lg bg-red-50 p-3 text-red-700">{error}</p>}<section className="flex flex-wrap items-end gap-3 rounded-2xl border bg-white p-4"><label className="text-sm">From<input type="date" value={from} onChange={e=>setFrom(e.target.value)} className="mt-1 block rounded-lg border px-3 py-2"/></label><label className="text-sm">To<input type="date" value={to} onChange={e=>setTo(e.target.value)} className="mt-1 block rounded-lg border px-3 py-2"/></label><button onClick={()=>void refresh()} className="rounded-lg border px-4 py-2">{loading?"Loading…":"Refresh reports"}</button></section><section className="grid gap-4 sm:grid-cols-3"><article className="rounded-2xl border bg-white p-5"><p className="text-sm text-slate-500">Sales revenue</p><p className="mt-2 text-2xl font-bold">{amount(revenue)}</p></article><article className="rounded-2xl border bg-white p-5"><p className="text-sm text-slate-500">Cost of goods sold</p><p className="mt-2 text-2xl font-bold">{amount(cogs)}</p></article><article className="rounded-2xl border bg-white p-5"><p className="text-sm text-slate-500">Gross profit</p><p className="mt-2 text-2xl font-bold">{amount(revenue-cogs)}</p></article></section><section className="overflow-hidden rounded-2xl border bg-white"><div className="border-b p-5"><h2 className="font-semibold">Accounts payable</h2></div><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-slate-500"><tr><th className="p-3">Supplier</th><th className="p-3">Currency</th><th className="p-3">Open balance</th><th className="p-3">Next due</th></tr></thead><tbody className="divide-y">{payables.map((x,i)=><tr key={i}><td className="p-3 font-medium">{vendors[String(x.vendor_id)]??"Supplier name unavailable"}</td><td className="p-3">{String(x.currency)}</td><td className="p-3">{amount(x.balance)}</td><td className="p-3">{formatTime(x.next_due)}</td></tr>)}</tbody></table>{!payables.length&&<p className="p-5 text-sm text-slate-500">No open supplier balances.</p>}</div></section><section className="overflow-hidden rounded-2xl border bg-white"><div className="border-b p-5"><h2 className="font-semibold">General ledger</h2></div><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-slate-500"><tr><th className="p-3">Date</th><th className="p-3">Account</th><th className="p-3">Debit</th><th className="p-3">Credit</th><th className="p-3">Reference</th></tr></thead><tbody className="divide-y">{ledger.map((x,i)=><tr key={String(x.id??i)}><td className="p-3">{formatTime(x.created_at??x.business_date)}</td><td className="p-3 font-medium">{String(x.account_code).replaceAll("_"," ")}</td><td className="p-3">{amount(x.debit)}</td><td className="p-3">{amount(x.credit)}</td><td className="p-3">Automated business event</td></tr>)}</tbody></table>{!ledger.length&&<p className="p-5 text-sm text-slate-500">No ledger entries in this date range.</p>}</div></section></main></div>
}
