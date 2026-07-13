// Appointment Booking — find and confirm the pre-employment medical check (step onb13).
import { el, callTool, toast, spinner } from "./_common.js";

export function render(mount, ctx) {
  const state = { who: "Milan Bakker", deadline: "before 01/07", avail: "Clinic: Mon & Wed mornings", pref: "Employee prefers early slots" };
  const f = (k, l) => { const i = el("input", { type: "text", value: state[k] }); i.addEventListener("input", () => state[k] = i.value); return el("div", { class: "field" }, el("label", {}, l), i); };
  const findBtn = el("button", { class: "btn primary" }, "Find slots");
  const left = el("div", { class: "pane sticky" },
    el("h3", {}, "Appointment Booking"),
    el("p", { class: "psub" }, "Book the pre-employment medical check with the provider and send the invite."),
    f("who", "Employee"), f("deadline", "Deadline"), f("avail", "Provider availability"), f("pref", "Preference"),
    el("div", { class: "row" }, findBtn));

  const slots = el("div", { class: "cardgrid" });
  const confirm = el("div", {});
  const empty = el("div", { class: "result empty", id: "abEmpty" }, "Find slots to book the appointment.");
  const right = el("div", { class: "pane" }, el("h3", {}, "Booking"), empty, slots, confirm);

  function book(sl) {
    confirm.innerHTML = "";
    confirm.append(el("div", { style: { border: "1px solid var(--line)", borderRadius: "12px", overflow: "hidden", marginTop: "12px" } },
      el("div", { style: { background: "#e7f6ec", color: "#166534", padding: "10px 14px", fontWeight: "800", fontSize: "13px" } }, "✓ Appointment confirmed"),
      el("div", { style: { padding: "12px 14px", fontSize: "13px" } },
        el("div", {}, el("b", {}, "Who: "), state.who),
        el("div", {}, el("b", {}, "What: "), "Pre-employment medical check"),
        el("div", {}, el("b", {}, "When: "), sl),
        el("div", { class: "muted", style: { marginTop: "6px", fontSize: "12px" } }, "Calendar invite sent to the employee and the clinic (demo)."))));
    toast("Appointment booked (demo)");
  }
  async function run() {
    findBtn.disabled = true; findBtn.innerHTML = spinner() + " Finding…"; slots.innerHTML = ""; confirm.innerHTML = "";
    empty.style.display = "none";
    try {
      const d = await callTool(ctx.step.id, { constraints: `${state.who}, medical check ${state.deadline}. ${state.avail}. ${state.pref}.` },
        "Propose 3 concrete appointment slots, each on its own line prefixed 'SLOT: ' (e.g. 'SLOT: Mon 08:30').");
      const lines = d.output.split("\n").filter((l) => /^\s*slot:/i.test(l)).map((l) => l.replace(/^\s*slot:\s*/i, "").trim());
      (lines.length ? lines : ["Mon 08:30", "Wed 09:00", "Mon 09:30"]).forEach((sl) => slots.append(el("div", { class: "minicard" }, el("h5", {}, "🩺 " + sl), el("button", { class: "btn small primary", onClick: () => book(sl) }, "Book"))));
    } catch (e) { toast(e.message); } finally { findBtn.disabled = false; findBtn.textContent = "Find slots"; }
  }
  findBtn.onclick = run;
  mount.append(el("div", { class: "grid2" }, left, right));
}
