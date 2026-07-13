// Training Planner — schedule mandatory training across a multi-week window (steps saf6/10/11).
import { el, callTool, mdToHtml, copyText, downloadText, toast, spinner } from "./_common.js";

const COURSES = ["Forklift", "First-aid", "Fire-warden", "Manual handling", "Battery/crane"];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

export function render(mount, ctx) {
  const sel = new Set(["Forklift", "First-aid", "Fire-warden"]);
  const people = el("input", { type: "number", min: "1", value: "12" });
  const weeks = el("input", { type: "number", min: "1", max: "6", value: "4" });
  const cons = el("textarea", { class: "editable", style: { minHeight: "90px" } }, ctx.tool.inputs[0]?.demo || "");
  const box = el("div", { class: "chips" });
  COURSES.forEach((c) => { const chip = el("span", { class: "chip" + (sel.has(c) ? " on" : ""), onClick: () => { sel.has(c) ? sel.delete(c) : sel.add(c); chip.classList.toggle("on"); } }, c); box.append(chip); });
  const runBtn = el("button", { class: "btn primary" }, "Build schedule");
  const left = el("div", { class: "pane sticky" },
    el("h3", {}, "Training Planner"),
    el("p", { class: "psub" }, "Turn training demand into a concrete, conflict-aware schedule across the weeks available."),
    el("div", { class: "row" }, el("div", { style: { flex: 1 } }, el("div", { class: "field" }, el("label", {}, "Participants"), people)), el("div", { style: { flex: 1 } }, el("div", { class: "field" }, el("label", {}, "Weeks"), weeks))),
    el("div", { class: "field" }, el("label", {}, "Courses"), box),
    el("div", { class: "field" }, el("label", {}, "Constraints"), cons),
    el("div", { class: "row" }, runBtn));

  const gridWrap = el("div", { style: { overflowX: "auto" } });
  const planBody = el("div", { class: "out-body" });
  const empty = el("div", { class: "result empty", id: "tpEmpty" }, "Build the schedule to see the week grid.");
  let raw = "";
  const toolbar = el("div", { class: "toolbar" }, el("h3", { style: { margin: 0 } }, "Schedule"), el("span", { class: "grow" }),
    el("button", { class: "btn small", onClick: () => copyText(raw) }, "Copy"),
    el("button", { class: "btn small", onClick: () => downloadText("training-schedule.txt", raw) }, "Download"));
  const right = el("div", { class: "pane" }, toolbar, empty, gridWrap, planBody);

  function grid(nWeeks, text) {
    gridWrap.innerHTML = "";
    const table = el("table", { class: "data", style: { minWidth: "560px" } });
    table.append(el("thead", {}, el("tr", {}, el("th", {}, ""), ...DAYS.map((d) => el("th", {}, d)))));
    const tb = el("tbody", {});
    for (let w = 1; w <= nWeeks; w++) {
      const tr = el("tr", {}, el("th", {}, "Week " + w));
      DAYS.forEach((day) => {
        const hits = text.split("\n").filter((l) => new RegExp("week\\s*" + w, "i").test(l) && new RegExp(day, "i").test(l));
        tr.append(el("td", {}, ...hits.map((h) => el("div", { style: { fontSize: "11px", background: "#eef2ff", border: "1px solid #dfe6ff", borderRadius: "6px", padding: "3px 6px", marginBottom: "3px" } }, h.replace(/^[-*•\s]+/, "").slice(0, 60)))));
      });
      tb.append(tr);
    }
    table.append(tb); gridWrap.append(table);
  }
  async function run() {
    runBtn.disabled = true; runBtn.innerHTML = spinner() + " Planning…"; planBody.innerHTML = "";
    empty.style.display = "none";
    const extra = `Participants: ${people.value}. Courses: ${[...sel].join(", ")}. Spread across ${weeks.value} weeks, weekdays Mon-Fri. For each session output a line like 'Week 2 · Wed · Forklift · 6 people · Room B'. Then a short notes paragraph on conflicts/capacity.`;
    try { const d = await callTool(ctx.step.id, { constraints: cons.value }, extra); raw = d.output; grid(parseInt(weeks.value, 10) || 4, d.output); planBody.innerHTML = mdToHtml(d.output); }
    catch (e) { toast(e.message); } finally { runBtn.disabled = false; runBtn.textContent = "Build schedule"; }
  }
  runBtn.onclick = run;
  mount.append(el("div", { class: "grid2" }, left, right));
}
