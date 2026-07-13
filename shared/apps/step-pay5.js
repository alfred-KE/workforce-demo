// Mutation Validator — flag anomalous payroll mutations before the run (step pay5).
import { el, callTool, parseTable, downloadText, toast, spinner } from "./_common.js";

export function render(mount, ctx) {
  const raw = el("textarea", { class: "editable", style: { minHeight: "200px" } }, ctx.tool.inputs[0]?.demo || "");
  const runBtn = el("button", { class: "btn primary" }, "Validate mutations");
  const left = el("div", { class: "pane sticky" },
    el("h3", {}, "Mutation Validator"),
    el("p", { class: "psub" }, "Scan this period's changes and surface only the ones a human should double-check."),
    el("div", { class: "field" }, el("label", {}, "Mutations for the period"), raw),
    el("div", { class: "row" }, runBtn));

  const stats = el("div", { class: "stats" }), wrap = el("div", { style: { overflowX: "auto" } });
  const empty = el("div", { class: "result empty", id: "mvEmpty" }, "Validate to see clean vs flagged mutations.");
  let report = "";
  const right = el("div", { class: "pane" }, el("div", { class: "toolbar" }, el("h3", { style: { margin: 0 } }, "Review queue"), el("span", { class: "grow" }),
    el("button", { class: "btn small", onClick: () => report ? downloadText("mutations.txt", report) : toast("Run first") }, "Export")), stats, empty, wrap);

  async function run() {
    runBtn.disabled = true; runBtn.innerHTML = spinner() + " Validating…"; wrap.innerHTML = ""; stats.innerHTML = "";
    empty.style.display = "none";
    try {
      const d = await callTool(ctx.step.id, { raw: raw.value },
        "Validate the mutations. Return ONLY a markdown table: Employee | Change | Value | Flag. Flag is exactly 'OK' or 'Review' (with a very short reason after Review, e.g. 'Review: 40% jump').");
      report = d.output; const t = parseTable(d.output);
      if (!t) { wrap.innerHTML = '<div class="errbox">Could not structure the mutations.</div>'; return; }
      const fi = t.head.findIndex((h) => /flag/i.test(h)); let ok = 0, rev = 0;
      const table = el("table", { class: "data" }); table.append(el("thead", {}, el("tr", {}, ...t.head.map((h) => el("th", {}, h)))));
      const tb = el("tbody", {});
      t.rows.forEach((r) => { const review = /review|flag|check/i.test(r[fi] || ""); if (review) rev++; else ok++;
        tb.append(el("tr", { style: review ? { background: "#fef6e7" } : {} }, ...r.map((v, i) => i === fi ? el("td", {}, el("span", { style: { fontWeight: "800", color: review ? "#8a5a00" : "#166534" } }, review ? "⚠ " + r[fi].replace(/review:?/i, "").trim() : "✓ OK")) : el("td", {}, v)))); });
      table.append(tb); wrap.append(table);
      stats.append(el("div", { class: "stat" }, el("div", { class: "n", style: { color: "#16a34a" } }, ok), el("div", { class: "l" }, "Clean")),
        el("div", { class: "stat" }, el("div", { class: "n", style: { color: "#8a5a00" } }, rev), el("div", { class: "l" }, "To review")));
    } catch (e) { toast(e.message); } finally { runBtn.disabled = false; runBtn.textContent = "Validate mutations"; }
  }
  runBtn.onclick = run;
  mount.append(el("div", { class: "grid2" }, left, right));
}
