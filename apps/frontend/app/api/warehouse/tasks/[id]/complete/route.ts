const WAREHOUSE_SERVICE_URL = "http://localhost:3005";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const response = await fetch(
    `${WAREHOUSE_SERVICE_URL}/warehouse/tasks/${id}/complete`,
    { method: "PATCH" },
  );
  const data = await response.json();
  return Response.json(data, { status: response.status });
}
