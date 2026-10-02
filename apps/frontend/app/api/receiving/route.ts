const RECEIVING_SERVICE_URL = "http://localhost:3004";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const response = await fetch(`${RECEIVING_SERVICE_URL}/receiving`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    return Response.json(data, {
      status: response.status,
    });
  } catch {
    return Response.json(
      { error: "Receiving service is unavailable" },
      { status: 503 },
    );
  }
}
