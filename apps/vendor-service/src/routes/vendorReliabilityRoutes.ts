import { Router, Request, Response } from "express";
import {
  recordVendorReliability,
  getVendorHistory,
  findReliabilityRecord,
} from "../services/vendorReliabilityService.js";

const router = Router({ mergeParams: true });

router.post("/", async (req: Request<{ vendorId: string }>, res: Response) => {
  try {
    const record = await recordVendorReliability({
      vendorId: req.params.vendorId,
      purchaseOrderId: req.body.purchaseOrderId,
      expectedDeliveryDate: new Date(req.body.expectedDeliveryDate),
      actualDeliveryDate: req.body.actualDeliveryDate
        ? new Date(req.body.actualDeliveryDate)
        : undefined,
      expectedQuantity: req.body.expectedQuantity,
      receivedQuantity: req.body.receivedQuantity,
      status: req.body.status,
      notes: req.body.notes,
    });

    res.status(201).json(record);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to record vendor reliability";

    res.status(400).json({
      error: message,
    });
  }
});

router.get("/", async (req: Request<{ vendorId: string }>, res: Response) => {
  try {
    const history = await getVendorHistory(req.params.vendorId);

    res.json(history);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to retrieve vendor reliability history";

    res.status(400).json({
      error: message,
    });
  }
});

router.get(
  "/:reliabilityId",
  async (
    req: Request<{
      vendorId: string;
      reliabilityId: string;
    }>,
    res: Response,
  ) => {
    try {
      const record = await findReliabilityRecord(
        req.params.vendorId,
        req.params.reliabilityId,
      );

      if (!record) {
        res.status(404).json({
          error: "Reliability record not found",
        });
        return;
      }

      res.json(record);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to retrieve reliability record";

      res.status(400).json({
        error: message,
      });
    }
  },
);

export default router;
