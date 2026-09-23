import { Request, Response, NextFunction } from "express";
import { isFeatureEnabled } from "@mms/feature-flags";

export function requireFeature(feature: string) {
  return (_req: Request, res: Response, next: NextFunction) => {
    if (!isFeatureEnabled(feature)) {
      res.status(404).json({
        error: "Feature is not enabled",
      });
      return;
    }

    next();
  };
}
