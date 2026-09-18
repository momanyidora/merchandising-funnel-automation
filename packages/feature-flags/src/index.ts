import fs from "node:fs";
import path from "node:path";

type FeatureFlags = Record<string, boolean>;

const featuresPath = path.resolve(process.cwd(), "../../config/features.json");

export function isFeatureEnabled(feature: string): boolean {
  if (!fs.existsSync(featuresPath)) {
    return false;
  }

  const features = JSON.parse(
    fs.readFileSync(featuresPath, "utf-8"),
  ) as FeatureFlags;

  return features[feature] === true;
}
