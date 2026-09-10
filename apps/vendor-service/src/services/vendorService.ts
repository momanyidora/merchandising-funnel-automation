import {
  createVendor as createVendorRepository,
  getVendorById,
  getAllVendors,
  updateVendor as updateVendorRepository,
  deleteVendor as deleteVendorRepository,
} from "../repositories/vendorRepository.js";
import { validateUuid } from "../utils/validation.js";


type CreateVendorInput = {
  name: string;
  email: string;
  phone: string;
  paymentTerms: string;
  leadTimeDays: number;
};

type UpdateVendorInput = Partial<CreateVendorInput>;

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function validateCreateVendor(data: CreateVendorInput): void {
  if (!data.name || !data.name.trim()) {
    throw new Error("Vendor name is required");
  }

  if (data.name.trim().length < 2) {
    throw new Error("Vendor name must be at least 2 characters");
  }

  if (!data.email || !validateEmail(data.email)) {
    throw new Error("Invalid email address");
  }

  if (!data.phone || !data.phone.trim()) {
    throw new Error("Vendor phone is required");
  }

  if (!data.paymentTerms || !data.paymentTerms.trim()) {
    throw new Error("Payment terms are required");
  }

  if (data.leadTimeDays === undefined || data.leadTimeDays === null) {
    throw new Error("Lead time is required");
  }

  if (data.leadTimeDays < 0) {
    throw new Error("Lead time cannot be negative");
  }
}
export async function createVendor(data: CreateVendorInput) {
  validateCreateVendor(data);

  return createVendorRepository(data);
}

export async function findVendorById(id: string) {
  validateUuid(id, "Vendor ID")
  return getVendorById(id);
}

export async function listVendors() {
  return getAllVendors();
}

export async function updateVendor(id: string, data: UpdateVendorInput) {
  validateUuid(id, "Vendor ID");
  if (data.name !== undefined && !data.name.trim()) {
    throw new Error("Vendor name cannot be empty");
  }

  if (data.name !== undefined && data.name.trim().length < 2) {
    throw new Error("Vendor name must be at least 2 characters");
  }
  if (data.email !== undefined && !validateEmail(data.email)) {
    throw new Error("Invalid email address");
  }

  if (data.phone !== undefined && !data.phone.trim()) {
    throw new Error("Vendor phone cannot be empty");
  }

  if (data.paymentTerms !== undefined && !data.paymentTerms.trim()) {
    throw new Error("Payment terms cannot be empty");
  }

  if (data.leadTimeDays !== undefined && data.leadTimeDays < 0) {
    throw new Error("Lead time cannot be negative");
  }

  return updateVendorRepository(id, data);
}

export async function deleteVendor(id: string) {
  validateUuid(id, "Vendor ID");
  return deleteVendorRepository(id);
}
