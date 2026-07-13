// Serverless endpoint: executive summary for a whole process (keyed by process id — not an open proxy).
import { PROCS, STEPS } from "../shared/data.js";

export default async function handler(req, res) {
  if (req.method !== "POST") { res.status(405).json({ error: "Use POST" }); return; }
  try {
    let body = req.body;
    if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
    const proc = body && body.process;
    if (!proc || !PROCS[proc]) { res.status(400).json({ error: "Unknown process" }); return; }

    const steps = STEPS.filter((s) => s.process === proc);
    const avg = Math.round(steps.reduce((a, s) => a + s.ap, 0) / steps.length);
    const human = steps.filter((s) => s.wf === "Human").length;
    const gaps = steps.filter((s) => s.gap).length;
    const lines = steps.map((s) => `- ${s.name} [${s.wf}, ${s.ap}% automatable${s.gap ? ", control gap" : ""}]`).join("\n");

    const key = process.env.OPENAI_API_KEY;
    if (!key) { res.status(500).json({ error: "The overview is not configured." }); return; }

    const sys = "You are an operations advisor for a fictitious value retailer called Northwind Retail. Write a concise executive overview (clean markdown) of one HR process's automation opportunity, for a non-technical business reader. Use these sections: a two-sentence headline paragraph; '## Where the time goes' (2-3 bullets); '## What automation changes' (2-3 bullets); '## What stays human'; '## Recommended first moves' (2-3 bullets). No jargon, no product, vendor or model names.";
    const user = `Process: ${PROCS[proc].name}\nSteps: ${steps.length}, average automation potential ${avg}%, ${human} human-led, ${gaps} control gaps, directional effort freed ${PROCS[proc].freed}.\nSteps:\n${lines}`;

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: process.env.TOOL_MODEL || "gpt-4o-mini", max_tokens: 750, temperature: 0.5, messages: [{ role: "system", content: sys }, { role: "user", content: user }] }),
    });
    const data = await r.json();
    if (!r.ok) { res.status(502).json({ error: "The overview couldn't be generated just now." }); return; }
    res.status(200).json({ output: data.choices?.[0]?.message?.content?.trim() || "(no output)" });
  } catch (e) {
    res.status(500).json({ error: "The overview couldn't be generated just now." });
  }
}
