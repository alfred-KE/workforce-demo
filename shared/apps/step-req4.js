// Job Description Builder — a real, business-facing tool for "Create vacancy text".
// Structured role intake → a polished, multi-channel job posting with an inclusivity check.
import { el, callTool, mdToHtml, copyText, downloadText, toast, spinner } from "./_common.js";

export function render(mount, ctx) {
  const state = {
    title: "Store Associate",
    location: "Store 118 — Rotterdam",
    contract: "Permanent",
    hours: "Part-time (30h)",
    seniority: "Entry level",
    tone: "Warm",
    language: "English",
    responsibilities: ["Help customers and keep the shop floor welcoming", "Keep shelves stocked and tidy", "Operate the till and handle payments"],
    skills: ["Friendly & reliable", "Team player", "Flexible with weekend shifts"],
    benefits: { "20% staff discount": true, "Paid training": true, "Pension scheme": true, "Fixed roster": true, "Team events": false },
    channel: "Careers page",
  };
  const raw = {};   // generated text per channel

  /* ---------------- left: role brief ---------------- */
  const input = (val, on) => { const e = el("input", { type: "text", value: val }); e.addEventListener("input", () => on(e.value)); return e; };
  const chipRow = (opts, key) => {
    const chips = el("div", { class: "chips" });
    opts.forEach((o) => { const c = el("span", { class: "chip" + (state[key] === o ? " on" : ""), onClick: () => { state[key] = o; chips.querySelectorAll(".chip").forEach((x) => x.classList.remove("on")); c.classList.add("on"); } }, o); chips.append(c); });
    return chips;
  };
  const addList = (arr, placeholder) => {
    const listEl = el("div", { class: "col", style: { gap: "6px" } });
    const draw = () => {
      listEl.innerHTML = "";
      arr.forEach((it, i) => listEl.append(el("div", { class: "row tight", style: { justifyContent: "space-between", background: "#f7f9fc", border: "1px solid var(--line)", borderRadius: "8px", padding: "6px 10px" } },
        el("span", { style: { fontSize: "12.5px" } }, it),
        el("button", { class: "linkbtn", onClick: () => { arr.splice(i, 1); draw(); } }, "remove"))));
      const inp = el("input", { type: "text", placeholder });
      const add = () => { if (inp.value.trim()) { arr.push(inp.value.trim()); draw(); } };
      inp.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); add(); } });
      listEl.append(el("div", { class: "row tight" }, inp, el("button", { class: "btn small", onClick: add }, "＋ Add")));
    };
    draw(); return listEl;
  };
  const benefitsBox = el("div", { class: "chips" });
  Object.keys(state.benefits).forEach((b) => {
    const c = el("span", { class: "chip" + (state.benefits[b] ? " on" : ""), onClick: () => { state.benefits[b] = !state.benefits[b]; c.classList.toggle("on"); } }, b);
    benefitsBox.append(c);
  });

  const genBtn = el("button", { class: "btn primary" }, "Generate job description");
  const left = el("div", { class: "pane sticky" },
    el("h3", {}, "Role brief"),
    el("p", { class: "psub" }, "Fill the role in plain terms — the tool writes the posting."),
    el("div", { class: "field" }, el("label", {}, "Job title"), input(state.title, (v) => state.title = v)),
    el("div", { class: "field" }, el("label", {}, "Location"), input(state.location, (v) => state.location = v)),
    el("div", { class: "row" },
      el("div", { class: "field", style: { flex: "1" } }, el("label", {}, "Contract"), chipRow(["Permanent", "Temporary"], "contract")),
      el("div", { class: "field", style: { flex: "1" } }, el("label", {}, "Hours"), chipRow(["Full-time", "Part-time (30h)"], "hours"))),
    el("div", { class: "field" }, el("label", {}, "Seniority"), chipRow(["Entry level", "Experienced", "Team lead"], "seniority")),
    el("div", { class: "field" }, el("label", {}, "Key responsibilities"), addList(state.responsibilities, "Add a responsibility…")),
    el("div", { class: "field" }, el("label", {}, "What you're looking for"), addList(state.skills, "Add a requirement…")),
    el("div", { class: "field" }, el("label", {}, "Benefits"), benefitsBox),
    el("div", { class: "row" },
      el("div", { class: "field", style: { flex: "1" } }, el("label", {}, "Tone"), chipRow(["Warm", "Professional", "Energetic"], "tone")),
      el("div", { class: "field", style: { flex: "1" } }, el("label", {}, "Language"), chipRow(["English", "Dutch", "French"], "language"))),
    el("div", { class: "row" }, genBtn));

  /* ---------------- right: the posting ---------------- */
  const channels = ["Careers page", "Job board", "LinkedIn post", "Plain text"];
  const chanChips = el("div", { class: "chips" });
  channels.forEach((ch) => {
    const c = el("span", { class: "chip" + (state.channel === ch ? " on" : ""), onClick: () => { state.channel = ch; chanChips.querySelectorAll(".chip").forEach((x) => x.classList.remove("on")); c.classList.add("on"); show(ch); } }, ch);
    chanChips.append(c);
  });
  const posting = el("div", { style: { border: "1px solid var(--line)", borderRadius: "12px", overflow: "hidden", background: "#fff" } });
  const empty = el("div", { class: "result empty", id: "jdEmpty" }, "Fill the brief and generate the posting.");
  const inclusivePanel = el("div", {});
  const toolbar = el("div", { class: "toolbar" },
    el("h3", { style: { margin: 0 } }, "Job posting"), el("span", { class: "grow" }),
    el("button", { class: "btn small", onClick: () => copyText(raw[state.channel] || "") }, "Copy"),
    el("button", { class: "btn small", onClick: () => downloadText("job-description.txt", raw[state.channel] || "") }, "Download"),
    el("button", { class: "btn small", onClick: inclusive }, "✓ Inclusive-language check"));
  const right = el("div", { class: "pane" }, toolbar, el("div", { class: "field" }, chanChips), empty, posting, inclusivePanel);

  function brief() {
    const benefits = Object.keys(state.benefits).filter((b) => state.benefits[b]);
    return [
      "Company: Northwind Retail (a value retailer)",
      "Job title: " + state.title,
      "Location: " + state.location,
      "Contract: " + state.contract + ", " + state.hours,
      "Seniority: " + state.seniority,
      "Key responsibilities:\n" + state.responsibilities.map((r) => "- " + r).join("\n"),
      "What we're looking for:\n" + state.skills.map((s) => "- " + s).join("\n"),
      "Benefits: " + (benefits.join(", ") || "—"),
    ].join("\n");
  }
  const channelExtra = {
    "Careers page": 'Write a complete careers-page job description in clean markdown with these sections: a one-line hook (bold), "## About the role", "## What you\'ll do" (bullets), "## What you bring" (bullets), "## What we offer" (bullets), and a short "## How to apply". No preamble.',
    "Job board": "Write a concise job-board listing, about 150 words, in markdown: a punchy opening line then short bullets for the role, requirements and offer.",
    "LinkedIn post": "Write an engaging first-person LinkedIn post announcing this vacancy: a hook, why it's a great role, 3 short bullets, a call to apply, and 2–3 tasteful emoji. Under 130 words.",
    "Plain text": "Write the job description as clean plain text (no markdown symbols), with clear section titles in capitals.",
  };

  async function generate(channel) {
    genBtn.disabled = true; genBtn.innerHTML = spinner() + " Writing…"; inclusivePanel.innerHTML = "";
    empty.style.display = "none";
    try {
      const extra = `${channelExtra[channel]} Tone: ${state.tone}. Language: ${state.language}.`;
      const d = await callTool(ctx.step.id, { brief: brief() }, extra);
      raw[channel] = d.output; show(channel);
    } catch (e) { toast(e.message); } finally { genBtn.disabled = false; genBtn.textContent = "Generate job description"; }
  }
  function show(channel) {
    state.channel = channel;
    chanChips.querySelectorAll(".chip").forEach((c) => c.classList.toggle("on", c.textContent === channel));
    if (!raw[channel]) { generate(channel); return; }
    empty.style.display = "none";
    const benefits = Object.keys(state.benefits).filter((b) => state.benefits[b]);
    posting.innerHTML = "";
    posting.append(
      el("div", { style: { background: "linear-gradient(120deg,#0a2540,#12345c)", color: "#fff", padding: "16px 20px" } },
        el("div", { style: { fontSize: "11px", fontWeight: "800", letterSpacing: ".06em", opacity: ".8" } }, "NORTHWIND RETAIL · CAREERS"),
        el("div", { style: { fontSize: "19px", fontWeight: "800", marginTop: "4px" } }, state.title),
        el("div", { class: "chips", style: { marginTop: "8px" } },
          ...[state.location, state.contract, state.hours, state.seniority].map((m) => el("span", { style: { fontSize: "11px", fontWeight: "700", background: "rgba(255,255,255,.15)", border: "1px solid rgba(255,255,255,.25)", borderRadius: "20px", padding: "3px 10px" } }, m)))),
      el("div", { class: "out-body", style: { padding: "18px 20px" }, html: mdToHtml(raw[channel]) }));
  }
  async function inclusive() {
    if (!raw[state.channel]) return toast("Generate a posting first");
    inclusivePanel.innerHTML = "";
    const box = el("div", { class: "minicard", style: { marginTop: "12px" } }, el("h5", {}, "Inclusive-language check", el("span", { class: "muted" }, spinner())));
    inclusivePanel.append(box);
    try {
      const d = await callTool(ctx.step.id, { brief: "Inclusivity review task" },
        "Act as an inclusive-hiring reviewer. Review the job description below for biased, gendered, ageist or exclusionary language. Return a short markdown list of any issues with a neutral rewrite each; if it reads inclusively, say so clearly.\n\n---\n" + raw[state.channel]);
      box.innerHTML = ""; box.append(el("h5", {}, "Inclusive-language check"), el("div", { class: "out-body", html: mdToHtml(d.output) }));
    } catch (e) { box.innerHTML = ""; box.append(el("div", { class: "errbox" }, e.message)); }
  }

  genBtn.onclick = () => generate(state.channel);
  mount.append(el("div", { class: "grid2" }, left, right));
}
