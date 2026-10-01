export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { messages, model, max_tokens, temperature, seed, reasoning_effort, stream } = req.body || {};

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "messages is required" });
    }

    const upstream = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.NVIDIA_API_KEY}`,
        "Content-Type": "application/json",
        "Accept": stream ? "text/event-stream" : "application/json"
      },
      body: JSON.stringify({
        model: model || "moonshotai/kimi-k3",
        messages,
        max_tokens: Math.min(Number(max_tokens) || 16384, 16384),
        temperature: typeof temperature === "number" ? temperature : 1,
        seed: typeof seed === "number" ? seed : 0,
        reasoning_effort: reasoning_effort || "max",
        stream: Boolean(stream)
      })
    });

    const body = await upstream.text();
    res.status(upstream.status);
    res.setHeader("Content-Type", upstream.headers.get("content-type") || "application/json");
    return res.send(body);
  } catch (error) {
    return res.status(500).json({ error: "NVIDIA request failed", detail: error.message });
  }
}