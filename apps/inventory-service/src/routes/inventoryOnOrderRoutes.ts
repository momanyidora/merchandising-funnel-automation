import { Router } from "express";
import { changeOnOrderController } from "../controllers/inventoryOnOrderController.js";

const router = Router();

router.post("/", changeOnOrderController);

export default router;
