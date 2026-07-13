// Error Worklist — triage payroll control failures into an actionable list (step pay7).
import { el, callTool, parseTable, downloadText, toast, spinner } from "./_common.js";

export function render(mount, ctx) {
  const rawI = el("textarea", { class: "editable", style: { minHeight: "200px" } }, ctx.tool.inputs[0]?.demo || "");
  const runBtn = el("button", { class: "btn primary" }, "Build worklist");
  const left = el("div", { class: "pane sticky" },
    el("h3", {}, "Error Worklist"),
    el("p", { class: "psub" }, "Turn raw control failures into an owned, trackable worklist with suggested fixes."),
    el("div", { class: "field" }, el("label", {}, "Control output / errors"), rawI),
    el("div", { class: "row" }, runBtn));

  const stats = el("div", { class: "stats" });
  const wrap = el("div", {});
  const empty = el("div", { class: "result empty", id: "ewEmpty" }, "Build the worklist from the control output.");
  const toolbar = el("div", { class: "toolbar" }, el("h3", { style: { margin: 0 } }, "Worklist"), el("span", { class: "grow" }),
    el("button", { class: "btn small", onClick: exportCsv }, "Export CSV"));
  const right = el("div", { class: "pane" }, toolbar, stats, empty, wrap);

  let head = [];
  function refreshStats() {
    const rows = [...wrap.querySelectorAll("tbody tr")];
    const open = rows.filter((r) => r.querySelector("select")?.value === "Open").length;
    const prog = rows.filter((r) => r.querySelector("select")?.value === "In progress").length;
    const done = rows.filter((r) => r.querySelector("select")?.value === "Resolved").length;
    stats.innerHTML = "";
    stats.append(
      el("div", { class: "stat" }, el("div", { class: "n", style: { color: "#991b1b" } }, open), el("div", { class: "l" }, "Open")),
      el("div", { class: "stat" }, el("div", { class: "n", style: { color: "#8a5a00" } }, prog), el("div", { class: "l" }, "In progress")),
      el("div", { class: "stat" }, el("div", { class: "n", style: { color: "#166534" } }, done), el("div", { class: "l" }, "Resolved")));
  }
  function build(t) {
    head = t.head.concat(["Status"]); wrap.innerHTML = ""; empty.style.display = "none";
    const table = el("table", { class: "data" });
    table.append(el("thead", {}, el("tr", {}, ...head.map((h) => el("th", {}, h)))));
    const tb = el("tbody", {});
    t.rows.forEach((r) => {
      const sel = el("select", {}, ...["Open", "In progress", "Resolved"].map((o) => el("option", {}, o)));
      sel.addEventListener("change", refreshStats);
      tb.append(el("tr", {}, ...t.head.map((_, i) => el("td", { contenteditable: "true" }, r[i] || "")), el("td", {}, sel)));
    });
    table.append(tb); wrap.append(table); refreshStats();
  }
  function exportCsv() {
    if (!head.length) return toast("Build the worklist first");
    const rows = [...wrap.querySelectorAll("tbody tr")].map((tr) => [...tr.children].map((td) => { const s = td.querySelector("select"); return `"${(s ? s.value : td.textContent).replace(/"/g, '""')}"`; }).join(","));
    downloadText("error-worklist.csv", [head.map((h) => `"${h}"`).join(","), ...rows].join("\n"), "text/csv");
  }
  async function run() {
    runBtn.disabled = true; runBtn.innerHTML = spinner() + " Building…";
    try {
      const d = await callTool(ctx.step.id, { raw: rawI.value },
        "Return ONLY a markdown table with columns: Error | Source system | Severity | Suggested fix. One row per distinct error found.");
      const t = parseTable(d.output);
      if (t) build(t); else { empty.style.display = "none"; wrap.innerHTML = '<div class="errbox">Could not structure the errors — try clearer input.</div>'; }
    } catch (e) { toast(e.message); } finally { runBtn.disabled = false; runBtn.textContent = "Build worklist"; }
  }
  runBtn.onclick = run;
  mount.append(el("div", { class: "grid2" }, left, right));
}
