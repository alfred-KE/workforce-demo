// Salary Band Finder — look up the pay band for a role/level and draft the C&B share (step req2).
import { el, callTool, copyText, toast, spinner } from "./_common.js";

const BANDS = { "Level 1": [1800, 2050, 2300], "Level 2": [2050, 2350, 2700], "Level 3": [2500, 2900, 3400], "Team lead": [3400, 4100, 5000] };

export function render(mount, ctx) {
  const state = { role: "Store Associate", level: "Level 2", region: "Netherlands" };
  const roleI = el("input", { type: "text", value: state.role }); roleI.addEventListener("input", () => state.role = roleI.value);
  const chipRow = (opts, key, after) => { const c = el("div", { class: "chips" }); opts.forEach((o) => { const x = el("span", { class: "chip" + (state[key] === o ? " on" : ""), onClick: () => { state[key] = o; c.querySelectorAll(".chip").forEach((y) => y.classList.remove("on")); x.classList.add("on"); if (after) after(); } }, o); c.append(x); }); return c; };
  const findBtn = el("button", { class: "btn primary" }, "Find band & draft share");
  const left = el("div", { class: "pane sticky" },
    el("h3", {}, "Salary Band Finder"),
    el("p", { class: "psub" }, "Pull the approved pay band for a role and draft the note to share with the recruiter."),
    el("div", { class: "field" }, el("label", {}, "Role"), roleI),
    el("div", { class: "field" }, el("label", {}, "Level"), chipRow(Object.keys(BANDS), "level", drawBand)),
    el("div", { class: "field" }, el("label", {}, "Region"), chipRow(["Netherlands", "Belgium", "Germany"], "region")),
    el("div", { class: "row" }, findBtn));

  const bandCard = el("div", {});
  const msg = el("div", {});
  const empty = el("div", { class: "result empty", id: "sbEmpty" }, "Choose a level to see the band.");
  const right = el("div", { class: "pane" }, el("h3", {}, "Compensation & benefits"), bandCard, msg, empty);

  function drawBand() {
    empty.style.display = "none";
    const [lo, mid, hi] = BANDS[state.level];
    bandCard.innerHTML = "";
    const bar = (label, v) => el("div", { style: { marginBottom: "8px" } },
      el("div", { class: "row", style: { justifyContent: "space-between", fontSize: "12px" } }, el("span", { class: "muted" }, label), el("b", {}, "€" + v.toLocaleString())),
      el("div", { style: { height: "8px", background: "var(--line)", borderRadius: "4px", overflow: "hidden" } }, el("div", { style: { height: "100%", width: Math.round(v / hi * 100) + "%", background: "#0d9488" } })));
    bandCard.append(el("div", { class: "minicard" },
      el("h5", {}, state.level + " · " + state.region),
      bar("Minimum", lo), bar("Midpoint", mid), bar("Maximum", hi),
      el("div", { class: "muted", style: { fontSize: "11.5px", marginTop: "4px" } }, "Gross / month · illustrative band")));
  }
  async function run() {
    drawBand();
    findBtn.disabled = true; findBtn.innerHTML = spinner() + " Drafting…"; msg.innerHTML = "";
    const [lo, , hi] = BANDS[state.level];
    try {
      const d = await callTool(ctx.step.id, { context: `Share the C&B job description link and salary band for ${state.role} (${state.level}, ${state.region}): €${lo}–€${hi} gross/month.`, recipients: "Recruiter" }, "Keep it to 3-4 lines.");
      msg.append(el("div", { class: "toolbar", style: { marginTop: "12px" } }, el("h3", { style: { margin: 0 } }, "Share note"), el("span", { class: "grow" }), el("button", { class: "btn small", onClick: () => copyText(d.output) }, "Copy")),
        el("div", { class: "out-body", style: { whiteSpace: "pre-wrap", fontSize: "13px" } }, d.output));
    } catch (e) { toast(e.message); } finally { findBtn.disabled = false; findBtn.textContent = "Find band & draft share"; }
  }
  findBtn.onclick = run; drawBand();
  mount.append(el("div", { class: "grid2" }, left, right));
}
