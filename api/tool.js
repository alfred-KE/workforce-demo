// Serverless endpoint: runs the AI tool for a given step id.
// Looks the tool up server-side by id (clients cannot inject arbitrary prompts).
import { buildMessages } from "../shared/tools.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Use POST" });
    return;
  }
  try {
    let body = req.body;
    if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
    const { id, inputs, extra } = body || {};
    if (!id) { res.status(400).json({ error: "Missing step id" }); return; }

    const spec = buildMessages(id, inputs, extra);
    if (!spec) { res.status(400).json({ error: "This step is human judgement — no tool." }); return; }

    const key = process.env.OPENAI_API_KEY;
    if (!key) { res.status(500).json({ error: "The tool is not configured. Please try again later." }); return; }

    const MODEL = process.env.TOOL_MODEL || "gpt-4o-mini"; // server-side only, never exposed to the client
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: spec.max_tokens,
        temperature: 0.4,
        messages: spec.messages,
      }),
    });
    const data = await r.json();
    if (!r.ok) {
      res.status(502).json({ error: "The tool couldn't run just now. Please try again." });
      return;
    }
    const output = data.choices?.[0]?.message?.content?.trim() || "(no output)";
    res.status(200).json({ output });
  } catch (e) {
    res.status(500).json({ error: "The tool couldn't run just now. Please try again." });
  }
}
