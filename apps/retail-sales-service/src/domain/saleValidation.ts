export type SaleLineInput = { productId: string; quantity: number; unitPrice: number; locationId: string };
export type TenderInput = { method: string; amount: number };
export function validateSaleAmounts(items: SaleLineInput[], payments: TenderInput[]): number {
  if (!items.length || !payments.length) throw new Error("Sale items and tenders are required");
  if (items.some((item) => !item.productId || !item.locationId || !Number.isSafeInteger(item.quantity) || item.quantity < 1 || !Number.isSafeInteger(item.unitPrice) || item.unitPrice < 0)) throw new Error("Invalid sale item");
  if (payments.some((payment) => !["CASH", "CARD", "GIFT_CARD"].includes(payment.method) || !Number.isSafeInteger(payment.amount) || payment.amount < 0)) throw new Error("Invalid tender");
  if (new Set(payments.map((payment) => payment.method)).size !== payments.length) throw new Error("Tender methods must be unique per sale");
  const total = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const paid = payments.reduce((sum, payment) => sum + payment.amount, 0);
  if (!Number.isSafeInteger(total) || paid !== total) throw new Error("Payments must equal the sale total in whole currency units");
  return total;
}
