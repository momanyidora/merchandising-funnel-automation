import { getPurchaseOrderById } from "../repositories/purchaseOrderRepository.js";
import { createPurchaseOrderAmendment, listPurchaseOrderAmendments, reviewPurchaseOrderAmendment } from "../repositories/purchaseOrderAmendmentRepository.js";

export async function requestPurchaseOrderAmendment(id: string, data: { requestedBy: string; reason: string; changeSummary: string }) {
  const order = await getPurchaseOrderById(id);
  if (!order) throw new Error("Purchase order not found");
  if (!["APPROVED", "SENT"].includes(order.status)) throw new Error("Only approved or sent purchase orders can be amended");
  if (!data.requestedBy?.trim() || !data.reason?.trim() || !data.changeSummary?.trim()) throw new Error("Requester, reason, and change summary are required");
  return createPurchaseOrderAmendment({ purchaseOrderId: id, requestedBy: data.requestedBy.trim(), reason: data.reason.trim(), changeSummary: data.changeSummary.trim() });
}

export async function listPurchaseOrderAmendmentsService(id: string) {
  const order = await getPurchaseOrderById(id);
  if (!order) throw new Error("Purchase order not found");
  return listPurchaseOrderAmendments(id);
}

export async function reviewPurchaseOrderAmendmentService(id: string, amendmentId: string, data: { decision: "APPROVED" | "REJECTED"; reviewedBy: string }) {
  if (!["APPROVED", "REJECTED"].includes(data.decision) || !data.reviewedBy?.trim()) throw new Error("A decision and reviewer are required");
  const result = await reviewPurchaseOrderAmendment(amendmentId, data.decision, data.reviewedBy.trim());
  if (!result || result.purchaseOrderId !== id) throw new Error("Amendment not found or already reviewed");
  return result;
}
