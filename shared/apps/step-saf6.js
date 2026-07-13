// Training Planner — schedule mandatory training; drag sessions across the week grid (steps saf6/10/11).
import { el, callTool, copyText, downloadText, toast, spinner } from "./_common.js";

const COURSES = ["Forklift", "First-aid", "Fire-warden", "Manual handling", "Battery/crane"];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

export function render(mount, ctx) {
  const sel = new Set(["Forklift", "First-aid", "Fire-warden"]);
  const people = el("input", { type: "number", min: "1", value: "12" });
  const weeksI = el("input", { type: "number", min: "1", max: "6", value: "4" });
  const cons = el("textarea", { class: "editable", style: { minHeight: "90px" } }, ctx.tool.inputs[0]?.demo || "");
  const box = el("div", { class: "chips" });
  COURSES.forEach((c) => { const chip = el("span", { class: "chip" + (sel.has(c) ? " on" : ""), onClick: () => { sel.has(c) ? sel.delete(c) : sel.add(c); chip.classList.toggle("on"); } }, c); box.append(chip); });
  const runBtn = el("button", { class: "btn primary" }, "Build schedule");
  const left = el("div", { class: "pane sticky" },
    el("h3", {}, "Training Planner"),
    el("p", { class: "psub" }, "Turn training demand into a schedule, then drag sessions to reschedule them."),
    el("div", { class: "row" }, el("div", { style: { flex: 1 } }, el("div", { class: "field" }, el("label", {}, "Participants"), people)), el("div", { style: { flex: 1 } }, el("div", { class: "field" }, el("label", {}, "Weeks"), weeksI))),
    el("div", { class: "field" }, el("label", {}, "Courses"), box),
    el("div", { class: "field" }, el("label", {}, "Constraints"), cons),
    el("div", { class: "row" }, runBtn));

  const gridWrap = el("div", { style: { overflowX: "auto" } });
  const empty = el("div", { class: "result empty", id: "tpEmpty" }, "Build the schedule to see the week grid — then drag sessions between slots.");
  let sessions = [], nWeeks = 4, sid = 0;
  const toolbar = el("div", { class: "toolbar" }, el("h3", { style: { margin: 0 } }, "Schedule"), el("span", { class: "grow" }),
    el("button", { class: "btn small", onClick: () => sessions.length ? copyText(serialize()) : toast("Build first") }, "Copy"),
    el("button", { class: "btn small", onClick: () => sessions.length ? downloadText("training-schedule.txt", serialize()) : toast("Build first") }, "Download"));
  const hint = el("div", { class: "muted", style: { fontSize: "11.5px", marginTop: "8px" } }, "Tip: drag a session card into another day or week to reschedule it.");
  const right = el("div", { class: "pane" }, toolbar, empty, gridWrap, hint);

  const serialize = () => sessions.slice().sort((a, b) => a.week - b.week || DAYS.indexOf(a.day) - DAYS.indexOf(b.day)).map((s) => `Week ${s.week} · ${s.day} · ${s.label}`).join("\n");
  const normDay = (d) => { d = d.toLowerCase(); return DAYS.find((x) => x.toLowerCase() === d.slice(0, 3)) || "Mon"; };

  function parseSessions(text) {
    const out = [];
    text.split("\n").forEach((l) => {
      const m = l.match(/week\s*(\d+)\D+?(mon|tue|wed|thu|fri)/i);
      if (!m) return;
      const label = l.replace(/^[-*•\s]+/, "").replace(/week\s*\d+/i, "").replace(new RegExp(m[2], "i"), "").replace(/^[\s·|,\-–—]+/, "").trim();
      out.push({ id: "s" + (sid++), week: Math.max(1, Math.min(nWeeks, parseInt(m[1], 10))), day: normDay(m[2]), label: label || "Session" });
    });
    return out;
  }
  function chip(s) {
    const c = el("div", { class: "minicard", draggable: "true", style: { padding: "7px 9px", cursor: "grab", borderLeft: "3px solid #7c3aed", marginBottom: "5px" } },
      el("div", { style: { fontSize: "11.5px", fontWeight: "700" } }, s.label));
    c.addEventListener("dragstart", (e) => { e.dataTransfer.setData("text/plain", s.id); c.style.opacity = ".5"; });
    c.addEventListener("dragend", () => { c.style.opacity = "1"; });
    return c;
  }
  function renderGrid() {
    gridWrap.innerHTML = ""; empty.style.display = "none";
    const table = el("table", { class: "data", style: { minWidth: "640px" } });
    table.append(el("thead", {}, el("tr", {}, el("th", { style: { width: "70px" } }, ""), ...DAYS.map((d) => el("th", {}, d)))));
    const tb = el("tbody", {});
    for (let w = 1; w <= nWeeks; w++) {
      const tr = el("tr", {}, el("th", {}, "Week " + w));
      DAYS.forEach((day) => {
        const cell = el("td", { style: { verticalAlign: "top", minWidth: "110px", height: "56px" } });
        cell.dataset.week = w; cell.dataset.day = day;
        sessions.filter((s) => s.week === w && s.day === day).forEach((s) => cell.append(chip(s)));
        cell.addEventListener("dragover", (e) => { e.preventDefault(); cell.style.background = "#eef2ff"; });
        cell.addEventListener("dragleave", () => { cell.style.background = ""; });
        cell.addEventListener("drop", (e) => {
          e.preventDefault(); cell.style.background = "";
          const id = e.dataTransfer.getData("text/plain"); const s = sessions.find((x) => x.id === id);
          if (s) { s.week = +cell.dataset.week; s.day = cell.dataset.day; renderGrid(); toast("Rescheduled to Week " + s.week + " · " + s.day); }
        });
        tr.append(cell);
      });
      tb.append(tr);
    }
    table.append(tb); gridWrap.append(table);
  }
  async function run() {
    runBtn.disabled = true; runBtn.innerHTML = spinner() + " Planning…";
    nWeeks = Math.max(1, Math.min(6, parseInt(weeksI.value, 10) || 4)); sid = 0;
    const extra = `Participants: ${people.value}. Courses: ${[...sel].join(", ")}. Spread across ${nWeeks} weeks, weekdays Mon-Fri. Output ONE line per session, no headings/nesting, EXACT format: 'Week <n> · <Day> · <course> · <n> people · <room>' (Day = Mon/Tue/Wed/Thu/Fri).`;
    try {
      const d = await callTool(ctx.step.id, { constraints: cons.value }, extra);
      sessions = parseSessions(d.output);
      if (!sessions.length) { empty.style.display = "none"; gridWrap.innerHTML = '<div class="out-body" style="white-space:pre-wrap">' + d.output + "</div>"; }
      else renderGrid();
    } catch (e) { toast(e.message); } finally { runBtn.disabled = false; runBtn.textContent = "Build schedule"; }
  }
  runBtn.onclick = run;
  mount.append(el("div", { class: "grid2" }, left, right));
}
