// Payroll Checklist — evidence-based sign-off checklist before the run (step pay12).
import { el, callTool, parseTable, toast, spinner } from "./_common.js";

export function render(mount, ctx) {
  const raw = el("textarea", { class: "editable", style: { minHeight: "200px" } }, ctx.tool.inputs[0]?.demo || "");
  const runBtn = el("button", { class: "btn primary" }, "Build checklist");
  const left = el("div", { class: "pane sticky" },
    el("h3", {}, "Payroll Checklist"),
    el("p", { class: "psub" }, "Every checklist item ticks only when the evidence is there — no blind sign-off."),
    el("div", { class: "field" }, el("label", {}, "Checklist evidence / status"), raw),
    el("div", { class: "row" }, runBtn));

  const bar = el("div", {}), list = el("div", { class: "col", style: { gap: "6px" } });
  const empty = el("div", { class: "result empty", id: "plEmpty" }, "Build the checklist to see completion.");
  const right = el("div", { class: "pane" }, el("h3", {}, "Sign-off checklist"), bar, empty, list);

  async function run() {
    runBtn.disabled = true; runBtn.innerHTML = spinner() + " Building…"; list.innerHTML = ""; bar.innerHTML = "";
    empty.style.display = "none";
    try {
      const d = await callTool(ctx.step.id, { raw: raw.value },
        "Return ONLY a markdown table: Checklist item | Evidence | Status. Status is exactly 'Done' or 'Pending'.");
      const t = parseTable(d.output);
      if (!t) { list.innerHTML = '<div class="errbox">Could not structure the checklist.</div>'; return; }
      const si = t.head.findIndex((h) => /status/i.test(h)), ei = t.head.findIndex((h) => /evidence/i.test(h));
      let done = 0;
      t.rows.forEach((r) => { const ok = /done|complete|✓/i.test(r[si] || ""); if (ok) done++;
        list.append(el("div", { class: "check" }, el("span", { class: "mk " + (ok ? "ok" : "") }, ok ? "✓" : "○"),
          el("span", {}, el("b", {}, r[0]), r[ei] ? el("span", { class: "muted", style: { fontSize: "12px" } }, " — " + r[ei]) : null))); });
      const pct = Math.round(done / t.rows.length * 100);
      bar.append(el("div", { class: "row", style: { justifyContent: "space-between", marginBottom: "6px" } }, el("b", {}, done + " / " + t.rows.length + " complete"),
        el("span", { class: pct === 100 ? "verdict pass" : "verdict warn", style: { padding: "4px 10px" } }, pct === 100 ? "✓ Ready for sign-off" : pct + "%")),
        el("div", { style: { height: "8px", background: "var(--line)", borderRadius: "4px", overflow: "hidden", marginBottom: "12px" } }, el("div", { style: { height: "100%", width: pct + "%", background: pct === 100 ? "#16a34a" : "#f59e0b" } })));
    } catch (e) { toast(e.message); } finally { runBtn.disabled = false; runBtn.textContent = "Build checklist"; }
  }
  runBtn.onclick = run;
  mount.append(el("div", { class: "grid2" }, left, right));
}
