const INVENTORY_SERVICE_URL = "http://localhost:3003";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const ids = searchParams.get("ids");
  const search = searchParams.get("search");
  const limit = searchParams.get("limit");

  const params = new URLSearchParams();

  if (ids) params.set("ids", ids);
  if (search) params.set("search", search);
  if (limit) params.set("limit", limit);

  const response = await fetch(
    `${INVENTORY_SERVICE_URL}/inventory/products?${params.toString()}`,
  );

  const data = await response.json();

  return Response.json(data, { status: response.status });
}
