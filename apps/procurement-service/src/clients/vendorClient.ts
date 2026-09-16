import { env } from "../config/env.js";

export async function getVendorById(vendorId: string) {
  const response = await fetch(`${env.VENDOR_SERVICE_URL}/vendors/${vendorId}`);

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Vendor service is unavailable");
  }

  return response.json();
}
