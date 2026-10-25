import { Router, Request, Response } from "express";
import {
  createReceiving,
  getReceivableDetail,
} from "../services/receivingService.js";

const router = Router();

router.get("/receivable/:purchaseOrderId", async (req, res) => {
  try {
    const data = await getReceivableDetail(req.params.purchaseOrderId);
    res.json(data);
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : "Failed",
    });
  }
});

router.post("/", async (req: Request, res: Response) => {
  try {
    const receipt = await createReceiving(req.body);

    res.status(201).json(receipt);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create goods receipt";

    const status =
      message === "Purchase order not found" ||
      message === "Purchase order items not found"
        ? 404
        : 400;

    res.status(status).json({ error: message });
  }
});

export default router;
