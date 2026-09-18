import {
  createInventoryLocation,
  getInventoryLocationById,
} from "../repositories/inventoryLocationRepository.js";

export async function createLocation(data: { name: string; code: string }) {
  return createInventoryLocation(data);
}

export async function getLocationById(id: string) {
  return getInventoryLocationById(id);
}
