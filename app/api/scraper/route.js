export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const keyword = (body.keyword || "").trim();
    const maxPosts = body.maxPosts ?? 10;

    if (!keyword) {
      return Response.json({ error: "Keyword is required" }, { status: 400 });
    }

    const webhookUrl = process.env.N8N_WEBHOOK_URL;
    const apiKey = process.env.N8N_API_KEY;

    if (!webhookUrl) {
      return Response.json({ error: "Missing N8N_WEBHOOK_URL env var" }, { status: 500 });
    }
    if (!apiKey) {
      return Response.json({ error: "Missing N8N_API_KEY env var" }, { status: 500 });
    }

    const r = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({ keyword, maxPosts }),
    });

    const text = await r.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    return Response.json(data, { status: r.status });
  } catch (e) {
    return Response.json({ error: "Server crashed", details: String(e) }, { status: 500 });
  }
}