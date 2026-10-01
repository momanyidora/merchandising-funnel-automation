import { readFile } from "node:fs/promises";
import path from "node:path";
export async function GET() {
  try {
    const file = path.resolve(process.cwd(), "../../config/features.json");
    return Response.json(JSON.parse(await readFile(file, "utf8")));
  } catch {
    return Response.json({}, { status: 503 });
  }
}
