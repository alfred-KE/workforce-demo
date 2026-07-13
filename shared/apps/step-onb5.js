// Contract Pack — assemble an employment contract + annexes from offer terms (step onb5).
import { el, callTool, mdToHtml, copyText, downloadText, toast, spinner, esc } from "./_common.js";

export function render(mount, ctx) {
  const t = { name: "Milan Bakker", role: "Store Associate", location: "Store 118 — Rotterdam", start: "2026-07-01", contract: "Permanent", hours: "30h / week", salary: "Band L2 (as per pay policy)", probation: "6 months" };
  const docs = {};
  const parts = [
    { id: "contract", label: "Contract", extra: "Draft a plain-language employment contract summary (illustrative, not legal advice) with clear clauses: parties, role, start date, hours, salary band, probation, notice, place of work. Markdown." },
    { id: "role", label: "Role profile annex", extra: "Write a one-page role profile annex: purpose of the role, key responsibilities, and reporting line. Markdown." },
    { id: "policy", label: "Policy summary annex", extra: "Write a short annex summarising the key HR policies a new retail employee should acknowledge (conduct, safety, data, discount policy). Markdown." },
  ];

  const field = (label, val, on) => { const i = el("input", { type: "text", value: val }); i.addEventListener("input", () => on(i.value)); return el("div", { class: "field" }, el("label", {}, label), i); };
  const genBtn = el("button", { class: "btn primary" }, "Generate contract pack");
  const left = el("div", { class: "pane sticky" },
    el("h3", {}, "Offer terms"),
    el("p", { class: "psub" }, "Enter the agreed terms — the pack (contract + annexes) is assembled for you."),
    field("Employee", t.name, (v) => t.name = v), field("Role", t.role, (v) => t.role = v), field("Location", t.location, (v) => t.location = v),
    el("div", { class: "row" }, el("div", { style: { flex: 1 } }, field("Start date", t.start, (v) => t.start = v)), el("div", { style: { flex: 1 } }, field("Contract", t.contract, (v) => t.contract = v))),
    el("div", { class: "row" }, el("div", { style: { flex: 1 } }, field("Hours", t.hours, (v) => t.hours = v)), el("div", { style: { flex: 1 } }, field("Probation", t.probation, (v) => t.probation = v))),
    field("Salary", t.salary, (v) => t.salary = v),
    el("div", { class: "row" }, genBtn));

  const tabs = el("div", { class: "chips" });
  const checklist = el("div", { class: "col", style: { gap: "6px", marginBottom: "12px" } });
  const view = el("div", {});
  const empty = el("div", { class: "result empty", id: "cpEmpty" }, "Generate the pack to assemble the contract and annexes.");
  let active = "contract";
  const toolbar = el("div", { class: "toolbar" }, el("h3", { style: { margin: 0 } }, "Contract pack"), el("span", { class: "grow" }),
    el("button", { class: "btn small", onClick: () => copyText(docs[active] || "") }, "Copy"),
    el("button", { class: "btn small", onClick: () => downloadText(active + ".txt", docs[active] || "") }, "Download"),
    el("button", { class: "btn small", onClick: printPack }, "Print / PDF"),
    el("button", { class: "btn small primary", onClick: () => toast("Sent to " + t.name + " for e-signature (demo)") }, "Send for e-signature"));

  function printPack() {
    const got = [["Employment contract", docs.contract], ["Role profile annex", docs.role], ["Policy summary annex", docs.policy]].filter((x) => x[1]);
    if (!got.length) return toast("Generate the pack first");
    const w = window.open("", "_blank");
    if (!w) return toast("Allow pop-ups to print / save as PDF");
    const body = got.map(([h, md]) => `<h2>${esc(h)}</h2>` + mdToHtml(md)).join('<div style="page-break-after:always"></div>');
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Employment Pack — ${esc(t.name)}</title>
      <style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:#1b2733;max-width:720px;margin:26px auto;padding:0 22px;line-height:1.55}
      h1{font-size:20px;color:#0a2540} h2{font-size:16px;color:#0a2540;border-bottom:1px solid #e3e9f0;padding-bottom:5px;margin-top:26px}
      h4{margin:12px 0 4px} table{border-collapse:collapse;width:100%} th,td{border:1px solid #d7dee7;padding:5px 9px;text-align:left} th{background:#f0f4f9}
      .meta{color:#5b6b7b;font-size:13px;margin-bottom:8px}</style></head>
      <body><h1>Northwind Retail — Employment Pack</h1>
      <div class="meta"><b>Employee:</b> ${esc(t.name)} &nbsp;·&nbsp; <b>Role:</b> ${esc(t.role)} &nbsp;·&nbsp; <b>Start:</b> ${esc(t.start)}</div>
      ${body}
      <script>window.onload=function(){setTimeout(function(){window.print();},300);};<\/script></body></html>`);
    w.document.close();
  }
  const right = el("div", { class: "pane" }, toolbar, checklist, tabs, empty, view);

  function drawChecklist() {
    checklist.innerHTML = "";
    const items = [["Employment contract", !!docs.contract], ["Role profile annex", !!docs.role], ["Policy summary annex", !!docs.policy], ["ID & bank details form", false], ["Signature request", false]];
    items.forEach(([lab, done]) => checklist.append(el("div", { class: "check" }, el("span", { class: "mk " + (done ? "ok" : "") }, done ? "✓" : "○"), el("span", {}, lab))));
  }
  function drawTabs() {
    tabs.innerHTML = "";
    parts.forEach((p) => tabs.append(el("span", { class: "chip" + (active === p.id ? " on" : ""), onClick: () => { active = p.id; showTab(); } }, p.label)));
  }
  function brief() { return Object.entries({ Company: "Northwind Retail", Employee: t.name, Role: t.role, Location: t.location, "Start date": t.start, Contract: t.contract, Hours: t.hours, Salary: t.salary, Probation: t.probation }).map(([k, v]) => k + ": " + v).join("\n"); }

  async function showTab() {
    drawTabs();
    const p = parts.find((x) => x.id === active);
    if (docs[active]) { empty.style.display = "none"; view.innerHTML = '<div class="out-body">' + mdToHtml(docs[active]) + "</div>"; return; }
    empty.style.display = "none"; view.innerHTML = '<p class="muted">' + spinner() + " Assembling " + p.label.toLowerCase() + "…</p>";
    try { const d = await callTool(ctx.step.id, { brief: brief() }, p.extra); docs[active] = d.output; drawChecklist(); view.innerHTML = '<div class="out-body">' + mdToHtml(d.output) + "</div>"; }
    catch (e) { view.innerHTML = '<div class="errbox">' + e.message + "</div>"; }
  }
  async function generate() {
    genBtn.disabled = true; genBtn.innerHTML = spinner() + " Assembling…";
    active = "contract"; docs.contract = null;
    try { await showTab(); } finally { genBtn.disabled = false; genBtn.textContent = "Generate contract pack"; }
  }
  drawChecklist(); drawTabs();
  genBtn.onclick = generate;
  mount.append(el("div", { class: "grid2" }, left, right));
}
