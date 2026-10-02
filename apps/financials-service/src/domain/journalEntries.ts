export type JournalLine={accountCode:string;debit:number;credit:number;currency:string;reference:string};
export function assertBalanced(lines:JournalLine[]) {
  if (!lines.length || lines.some(x=>!Number.isSafeInteger(x.debit)||!Number.isSafeInteger(x.credit)||x.debit<0||x.credit<0||(x.debit>0&&x.credit>0))) throw new Error("Journal lines must contain non-negative whole-unit debit or credit values");
  const debit=lines.reduce((n,x)=>n+x.debit,0),credit=lines.reduce((n,x)=>n+x.credit,0);
  if(debit!==credit)throw new Error("Journal entry must balance");
  return {debit,credit};
}

export function paymentTermDays(value: unknown): number {
  const match = String(value ?? "").match(/\bNET[_ -]?(\d+)\b/i);
  if (!match) return 30;
  const days = Number(match[1]);
  return Number.isSafeInteger(days) && days >= 0 && days <= 3650 ? days : 30;
}
