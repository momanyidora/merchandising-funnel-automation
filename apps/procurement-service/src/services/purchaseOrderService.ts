import {
  createPurchaseOrder,
  getPurchaseOrderById,
  listPurchaseOrders,
  updatePurchaseOrder,
  deletePurchaseOrder,
} from "../repositories/purchaseOrderRepository.js";
import { getVendorById } from "../clients/vendorClient.js";
import { publishEvent } from "../events/rabbitmqPublisher.js";

export async function createPurchaseOrderService(data: {
  vendorId: string;
  paymentTerms: string;
  currency: string;
}) {
  if (!data.vendorId) {
    throw new Error("Vendor ID is required");
  }
  const vendor = await getVendorById(data.vendorId);

  if (!vendor) {
    throw new Error("Vendor not found");
  }
  if (!data.paymentTerms) {
    throw new Error("Payment terms are required");
  }

  if (!data.currency) {
    throw new Error("Currency is required");
  }

  return createPurchaseOrder({
    vendorId: data.vendorId,
    status: "DRAFT",
    paymentTerms: data.paymentTerms,
    currency: data.currency,
  });
}

export async function getPurchaseOrderService(id: string) {
  if (!id) {
    throw new Error("Purchase order ID is required");
  }

  const purchaseOrder = await getPurchaseOrderById(id);

  if (!purchaseOrder) {
    throw new Error("Purchase order not found");
  }

  return purchaseOrder;
}

export async function listPurchaseOrdersService() {
  return listPurchaseOrders();
}

export async function updatePurchaseOrderService(
  id: string,
  data: {
    status?: string;
    paymentTerms?: string;
    currency?: string;
  },
) {
  const existing = await getPurchaseOrderById(id);

  if (!existing) {
    throw new Error("Purchase order not found");
  }

  if (existing.status !== "DRAFT") {
    throw new Error("Only draft purchase orders can be updated");
  }

  return updatePurchaseOrder(id, data);
}

export async function deletePurchaseOrderService(id: string) {
  const existing = await getPurchaseOrderById(id);

  if (!existing) {
    throw new Error("Purchase order not found");
  }

  if (existing.status !== "DRAFT") {
    throw new Error("Only draft purchase orders can be deleted");
  }

  return deletePurchaseOrder(id);
}
export async function submitPurchaseOrderForApprovalService(id: string) {
  const existing = await getPurchaseOrderById(id);

  if (!existing) {
    throw new Error("Purchase order not found");
  }

  if (existing.status !== "DRAFT") {
    throw new Error("Only draft purchase orders can be submitted for approval");
  }

  return updatePurchaseOrder(id, {
    status: "PENDING_APPROVAL",
  });
}
export async function approvePurchaseOrderService(id: string) {
  const existing = await getPurchaseOrderById(id);

  if (!existing) {
    throw new Error("Purchase order not found");
  }

  if (existing.status !== "PENDING_APPROVAL") {
    throw new Error("Only purchase orders pending approval can be approved");
  }

  const approvedPurchaseOrder = await updatePurchaseOrder(id, {
    status: "APPROVED",
  });

  await publishEvent("PurchaseOrderApproved", approvedPurchaseOrder);

  return approvedPurchaseOrder;
}