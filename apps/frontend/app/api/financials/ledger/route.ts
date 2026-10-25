const FINANCIALS_SERVICE_URL = "http://localhost:3008";

export async function GET(request: Request) {
  const url = new URL(request.url);
  try {
    const response = await fetch(
      `${FINANCIALS_SERVICE_URL}/financials/ledger${url.search}`,
    );
    const text = await response.text();
    if (!text) return Response.json([], { status: response.status });
    return new Response(text, {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return Response.json(
      { error: "Financials service unavailable" },
      { status: 503 },
    );
  }
}
