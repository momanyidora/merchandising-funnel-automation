import {
  createReliabilityRecord,
  getVendorReliabilityHistory,
  getReliabilityRecordById,
} from "../repositories/vendorReliabilityRepository.js";
import { validateUuid } from "../utils/validation.js";
import { vendorExists } from "../repositories/vendorRepository.js";

const VALID_STATUSES = [
  "ON_TIME",
  "LATE",
  "SHORT",
  "OVERAGE",
  "DAMAGED",
] as const;

type ReliabilityStatus = (typeof VALID_STATUSES)[number];

type CreateReliabilityInput = {
  vendorId: string;
  purchaseOrderId?: string;
  expectedDeliveryDate: Date;
  actualDeliveryDate?: Date;
  expectedQuantity: number;
  receivedQuantity: number;
  status: ReliabilityStatus;
  notes?: string;
};

function validateId(id: string, fieldName: string): void {
  validateUuid(id, fieldName);
}


function validateReliabilityRecord(data: CreateReliabilityInput): void {
  validateId(data.vendorId, "Vendor ID");

  if (data.expectedQuantity <= 0) {
    throw new Error("Expected quantity must be greater than 0");
  }

  if (data.receivedQuantity < 0) {
    throw new Error("Received quantity cannot be negative");
  }

  if (!VALID_STATUSES.includes(data.status)) {
    throw new Error("Invalid reliability status");
  }
  if (Number.isNaN(data.expectedDeliveryDate.getTime())) {
    throw new Error("Expected delivery date must be a valid date");
  }

  if (
    data.actualDeliveryDate !== undefined &&
    Number.isNaN(data.actualDeliveryDate.getTime())
  ) {
    throw new Error("Actual delivery date must be a valid date");
  }
}

export async function recordVendorReliability(data: CreateReliabilityInput) {
  validateReliabilityRecord(data);

  const exists = await vendorExists(data.vendorId);

  if (!exists) {
    throw new Error("Vendor not found");
  }

  return createReliabilityRecord(data);
}
export async function getVendorHistory(vendorId: string) {
  validateId(vendorId, "Vendor ID");

  return getVendorReliabilityHistory(vendorId);
}
export async function findReliabilityRecord(vendorId: string, id: string) {
  validateId(vendorId, "Vendor ID");
  validateId(id, "Reliability record ID");

  return getReliabilityRecordById(vendorId, id);
}
