import { getLocationStocks, getStocksByLocation } from "../repositories/inventoryLocationStockRepository.js";

export async function getStocksAtLocation(locationId: string) { return getStocksByLocation(locationId); }

export async function getStocksByInventoryItem(inventoryItemId: string) {
  return getLocationStocks(inventoryItemId);
}
