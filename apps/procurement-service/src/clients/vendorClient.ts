const vendorServiceUrl =
  process.env.VENDOR_SERVICE_URL ?? "http://localhost:3001";

export async function getVendorById(vendorId: string) {
  const response = await fetch(`${vendorServiceUrl}/vendors/${vendorId}`);

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Vendor service is unavailable");
  }

  return response.json();
}
