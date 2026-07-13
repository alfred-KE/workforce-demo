// Planner — turn constraints into a concrete schedule + a week view.
import { el, callTool, mdToHtml, parseTable, downloadText, toast, spinner } from "./_common.js";

export function render(mount, ctx) {
  const { tool } = ctx;
  const cons = tool.inputs.find((i) => i.id === "constraints") || tool.inputs[0];
  const consEl = el("textarea", { class: "editable", style: { minHeight: "150px" } }, cons.demo || "");
  const startEl = el("input", { type: "date" });
  const sessEl = el("input", { type: "number", min: "1", max: "20", value: "3" });
  const runBtn = el("button", { class: "btn primary" }, tool.run || "Build plan");
  const left = el("div", { class: "pane sticky" },
    el("h3", {}, "Planner"),
    el("p", { class: "psub" }, "Turn constraints and participants into a concrete, dated plan."),
    el("div", { class: "field" }, el("label", {}, cons.label), consEl),
    el("div", { class: "row" },
      el("div", { class: "field", style: { flex: "1" } }, el("label", {}, "Start date"), startEl),
      el("div", { class: "field", style: { width: "110px" } }, el("label", {}, "# sessions"), sessEl)),
    el("div", { class: "row" }, runBtn));

  const grid = el("div", {});
  const planBody = el("div", { class: "out-body" });
  const empty = el("div", { class: "result empty", id: "sempty" }, "Build a plan to see the schedule and week view.");
  let lastPlan = "";
  const right = el("div", { class: "pane" },
    el("div", { class: "toolbar" }, el("h3", { style: { margin: 0 } }, "Schedule"), el("span", { class: "grow" }),
      el("button", { class: "btn small", onClick: () => lastPlan ? downloadText("schedule.txt", lastPlan) : toast("Build first") }, "Export")),
    empty, grid, planBody);

  const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  function weekView(text) {
    const wrap = el("div", { style: { display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: "8px", margin: "6px 0 14px" } });
    DAYS.forEach((day) => {
      const items = text.split("\n").filter((l) => new RegExp("\\b" + day, "i").test(l));
      wrap.append(el("div", { class: "minicard", style: { minHeight: "70px" } },
        el("h5", {}, day),
        ...items.map((it) => el("div", { style: { fontSize: "11.5px", marginTop: "4px" }, class: "muted" }, it.replace(/^[-*•\s]+/, "").slice(0, 80)))));
    });
    return wrap;
  }
  async function run() {
    runBtn.disabled = true; runBtn.innerHTML = spinner() + " Planning…"; grid.innerHTML = ""; planBody.innerHTML = "";
    const extra = `Start date: ${startEl.value || "next Monday"}. Number of sessions: ${sessEl.value}. Where possible reference weekdays (Mon–Fri) explicitly.`;
    try {
      const d = await callTool(tool.id, { constraints: consEl.value }, extra);
      lastPlan = d.output; empty.style.display = "none";
      grid.append(weekView(d.output));
      const t = parseTable(d.output);
      planBody.innerHTML = t ? mdToHtml(d.output) : mdToHtml(d.output);
    } catch (e) { toast(e.message); } finally { runBtn.disabled = false; runBtn.textContent = tool.run || "Build plan"; }
  }
  runBtn.onclick = run;
  mount.append(el("div", { class: "grid2" }, left, right));
}
