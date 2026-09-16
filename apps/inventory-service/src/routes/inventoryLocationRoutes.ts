import { Router } from "express";
import {
  createLocation,
  getLocationById,
} from "../services/inventoryLocationService.js";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { name, code } = req.body;

    if (!name || !code) {
      return res.status(400).json({
        error: "name and code are required",
      });
    }

    const location = await createLocation({ name, code });

    return res.status(201).json(location);
  } catch {
    return res.status(500).json({
      error: "Failed to create inventory location",
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const location = await getLocationById(req.params.id);

    if (!location) {
      return res.status(404).json({
        error: "Inventory location not found",
      });
    }

    return res.json(location);
  } catch {
    return res.status(500).json({
      error: "Failed to retrieve inventory location",
    });
  }
});

export default router;
