const INVENTORY_SERVICE_URL = "http://localhost:3003";

type Params = {
  params: Promise<{
    inventoryItemId: string;
  }>;
};

export async function GET(
  _request: Request,
  { params }: Params,
) {
  const { inventoryItemId } = await params;

  const response = await fetch(
    `${INVENTORY_SERVICE_URL}/inventory/stock/${inventoryItemId}`,
  );

  const data = await response.json();

  return Response.json(data, { status: response.status });
}
