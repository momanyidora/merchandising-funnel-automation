import { Router } from "express";
import { listAmendments, requestAmendment, reviewAmendment } from "../controllers/purchaseOrderAmendmentController.js";
const router = Router();
router.get("/:id/amendments", listAmendments);
router.post("/:id/amendments", requestAmendment);
router.post("/:id/amendments/:amendmentId/review", reviewAmendment);
export default router;
