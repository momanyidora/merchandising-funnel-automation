import { Request, Response } from "express";
import { getStocksByInventoryItem, getStocksAtLocation } from "../services/inventoryLocationStockService.js";

export async function getInventoryLocationStocksController(
  req: Request<{ inventoryItemId: string }>,
  res: Response,
) {
  try {
    const stocks = await getStocksByInventoryItem(req.params.inventoryItemId);

    return res.status(200).json(stocks);
  } catch {
    return res.status(500).json({
      error: "Failed to retrieve location stock",
    });
  }
}

export async function getInventoryStocksAtLocationController(req: Request<{ locationId: string }>, res: Response) {
  try { return res.json(await getStocksAtLocation(req.params.locationId)); } catch { return res.status(500).json({ error: "Failed to retrieve location stock" }); }
}
