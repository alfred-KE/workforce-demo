// Intake Planner — propose meeting slots and a briefing agenda for the hiring intake (step req3).
import { el, callTool, mdToHtml, copyText, toast, spinner } from "./_common.js";

export function render(mount, ctx) {
  const state = { people: "Recruiter, Hiring Manager (Store 118)", duration: "30 min", days: "Tue–Thu afternoons", focus: "New Store Associate vacancy — profile, must-haves, timeline" };
  const f = (key, label) => { const i = el("input", { type: "text", value: state[key] }); i.addEventListener("input", () => state[key] = i.value); return el("div", { class: "field" }, el("label", {}, label), i); };
  const planBtn = el("button", { class: "btn primary" }, "Plan intake");
  const left = el("div", { class: "pane sticky" },
    el("h3", {}, "Intake Planner"),
    el("p", { class: "psub" }, "Line up the intake meeting and hand the recruiter a ready briefing pack."),
    f("people", "Participants"), f("duration", "Duration"), f("days", "Availability"),
    el("div", { class: "field" }, el("label", {}, "Focus"), (() => { const t = el("textarea", { class: "editable", style: { minHeight: "70px" } }, state.focus); t.addEventListener("input", () => state.focus = t.value); return t; })()),
    el("div", { class: "row" }, planBtn));

  const slots = el("div", { class: "cardgrid" });
  const agenda = el("div", {});
  const empty = el("div", { class: "result empty", id: "ipEmpty" }, "Plan the intake to see proposed slots and the agenda.");
  const right = el("div", { class: "pane" }, el("h3", {}, "Proposed intake"), empty, slots, agenda);

  async function run() {
    planBtn.disabled = true; planBtn.innerHTML = spinner() + " Planning…"; slots.innerHTML = ""; agenda.innerHTML = "";
    empty.style.display = "none";
    try {
      const d = await callTool(ctx.step.id, { constraints: `${state.people}. Duration ${state.duration}. Availability: ${state.days}. Focus: ${state.focus}` },
        "First output 3 candidate meeting slots, each on its own line prefixed 'SLOT: ' (e.g. 'SLOT: Tue 14:00–14:30'). Then a section '## Briefing agenda' with 4-6 bullet points.");
      const slotLines = d.output.split("\n").filter((l) => /^\s*slot:/i.test(l)).map((l) => l.replace(/^\s*slot:\s*/i, "").trim());
      (slotLines.length ? slotLines : ["Proposed slot 1", "Proposed slot 2", "Proposed slot 3"]).forEach((sl) => {
        const card = el("div", { class: "minicard" }, el("h5", {}, "🗓 " + sl), el("button", { class: "btn small", onClick: () => { slots.querySelectorAll(".minicard").forEach((m) => m.style.outline = ""); card.style.outline = "2px solid #7c3aed"; toast("Slot selected — invite sent (demo)"); } }, "Choose"));
        slots.append(card);
      });
      const ag = d.output.split(/##\s*briefing agenda/i)[1] || "";
      agenda.append(el("div", { class: "toolbar", style: { marginTop: "12px" } }, el("h3", { style: { margin: 0 } }, "Briefing agenda"), el("span", { class: "grow" }), el("button", { class: "btn small", onClick: () => copyText(ag || d.output) }, "Copy")),
        el("div", { class: "out-body", html: mdToHtml(ag || d.output) }));
    } catch (e) { toast(e.message); } finally { planBtn.disabled = false; planBtn.textContent = "Plan intake"; }
  }
  planBtn.onclick = run;
  mount.append(el("div", { class: "grid2" }, left, right));
}
