import { Request, Response } from "express";
import {
  approveVendorProduct,
  listVendorProducts,
  findVendorProduct,
  changeSupplierCost,
  revokeVendorProduct,
} from "../services/vendorProductService.js";

type VendorParams = {
  vendorId: string;
};

type VendorProductParams = {
  vendorId: string;
  productId: string;
};

export async function approveVendorProductController(
  req: Request<VendorParams>,
  res: Response,
) {
  try {
    const vendorProduct = await approveVendorProduct({
      vendorId: req.params.vendorId,
      productId: req.body.productId,
      supplierCost: req.body.supplierCost,
    });

    res.status(201).json(vendorProduct);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to approve vendor product";

    res.status(400).json({ error: message });
  }
}

export async function listVendorProductsController(
  req: Request<VendorParams>,
  res: Response,
) {
  try {
    const products = await listVendorProducts(req.params.vendorId);

    res.status(200).json(products);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to retrieve vendor products";

    res.status(400).json({ error: message });
  }
}

export async function findVendorProductController(
  req: Request<VendorProductParams>,
  res: Response,
) {
  try {
    const vendorProduct = await findVendorProduct(
      req.params.vendorId,
      req.params.productId,
    );

    if (!vendorProduct) {
      res.status(404).json({
        error: "Vendor product not found",
      });
      return;
    }

    res.status(200).json(vendorProduct);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to retrieve vendor product";

    res.status(400).json({ error: message });
  }
}

export async function changeSupplierCostController(
  req: Request<VendorProductParams>,
  res: Response,
) {
  try {
    const vendorProduct = await changeSupplierCost(
      req.params.vendorId,
      req.params.productId,
      req.body.supplierCost,
    );

    if (!vendorProduct) {
      res.status(404).json({
        error: "Vendor product not found",
      });
      return;
    }

    res.status(200).json(vendorProduct);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update supplier cost";

    res.status(400).json({ error: message });
  }
}

export async function revokeVendorProductController(
  req: Request<VendorProductParams>,
  res: Response,
) {
  try {
    const vendorProduct = await revokeVendorProduct(
      req.params.vendorId,
      req.params.productId,
    );

    if (!vendorProduct) {
      res.status(404).json({
        error: "Vendor product not found",
      });
      return;
    }

    res.status(204).send();
  } catch {
    res.status(500).json({
      error: "Failed to remove vendor product",
    });
  }
}
