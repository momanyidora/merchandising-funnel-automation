import { Request, Response } from "express";
import { listPurchaseOrderAmendmentsService, requestPurchaseOrderAmendment, reviewPurchaseOrderAmendmentService } from "../services/purchaseOrderAmendmentService.js";

function sendError(res: Response, error: unknown) {
  const message = error instanceof Error ? error.message : "Amendment request failed";
  res.status(message.includes("not found") ? 404 : 400).json({ error: message });
}
export async function listAmendments(req: Request<{ id: string }>, res: Response) { try { res.json(await listPurchaseOrderAmendmentsService(req.params.id)); } catch (error) { sendError(res, error); } }
export async function requestAmendment(req: Request<{ id: string }>, res: Response) { try { res.status(201).json(await requestPurchaseOrderAmendment(req.params.id, req.body)); } catch (error) { sendError(res, error); } }
export async function reviewAmendment(req: Request<{ id: string; amendmentId: string }>, res: Response) { try { res.json(await reviewPurchaseOrderAmendmentService(req.params.id, req.params.amendmentId, req.body)); } catch (error) { sendError(res, error); } }
