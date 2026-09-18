import { Router } from "express";
import {
  createLocationController,
  getLocationController,
} from "../controllers/inventoryLocationController.js";

const router = Router();

router.post("/", createLocationController);
router.get("/:id", getLocationController);

export default router;
