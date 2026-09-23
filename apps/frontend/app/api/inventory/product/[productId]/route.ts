const INVENTORY_SERVICE_URL = "http://localhost:3003";

type Params = {
  params: Promise<{
    productId: string;
  }>;
};

export async function GET(
  _request: Request,
  { params }: Params,
) {
  const { productId } = await params;

  const response = await fetch(
    `${INVENTORY_SERVICE_URL}/inventory/product/${productId}`,
  );

  const data = await response.json();

  return Response.json(data, { status: response.status });
}
