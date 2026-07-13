// Onboarding Plan — a 30/60/90-day plan on a timeline (step onb11).
import { el, callTool, copyText, downloadText, toast, spinner } from "./_common.js";

export function render(mount, ctx) {
  const state = { role: "Store Associate — Store 118", focus: { "Safety induction": true, "Till & payments": true, "Customer service": true, "Product & stock": true, "Team & culture": false } };
  let lastRaw = "";

  const focusBox = el("div", { class: "chips" });
  Object.keys(state.focus).forEach((f) => { const c = el("span", { class: "chip" + (state.focus[f] ? " on" : ""), onClick: () => { state.focus[f] = !state.focus[f]; c.classList.toggle("on"); } }, f); focusBox.append(c); });
  const roleI = el("input", { type: "text", value: state.role }); roleI.addEventListener("input", () => state.role = roleI.value);
  const genBtn = el("button", { class: "btn primary" }, "Build onboarding plan");
  const left = el("div", { class: "pane sticky" },
    el("h3", {}, "Onboarding Plan"),
    el("p", { class: "psub" }, "A structured first-90-days plan for the new joiner, on a timeline."),
    el("div", { class: "field" }, el("label", {}, "Role"), roleI),
    el("div", { class: "field" }, el("label", {}, "Focus areas"), focusBox),
    el("div", { class: "row" }, genBtn));

  const cols = el("div", { style: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "12px" } });
  const empty = el("div", { class: "result empty", id: "opEmpty" }, "Build the plan to see the 30 / 60 / 90-day timeline.");
  const toolbar = el("div", { class: "toolbar" }, el("h3", { style: { margin: 0 } }, "First 90 days"), el("span", { class: "grow" }),
    el("button", { class: "btn small", onClick: () => copyText(lastRaw) }, "Copy"),
    el("button", { class: "btn small", onClick: () => downloadText("onboarding-plan.txt", lastRaw) }, "Download"));
  const right = el("div", { class: "pane" }, toolbar, empty, cols);

  const phases = [["First 30 days", "#0ea5e9"], ["Days 31–60", "#0d9488"], ["Days 61–90", "#7c3aed"]];
  function draw(raw) {
    cols.innerHTML = "";
    // split into 3 phases by headings; fall back to even thirds of bullets
    const blocks = raw.split(/^#{1,4}\s.*$/m);
    const bulletsOf = (txt) => (txt || "").split("\n").map((l) => l.replace(/^[-*•\d.\s]+/, "").trim()).filter((l) => l.length > 2);
    let groups;
    const headed = raw.match(/^#{1,4}\s.*$/gm);
    if (headed && headed.length >= 3) {
      const segs = raw.split(/^#{1,4}\s.*$/m).slice(1);
      groups = [segs[0], segs[1], segs.slice(2).join("\n")];
    } else {
      const all = bulletsOf(raw); const n = Math.ceil(all.length / 3);
      groups = [all.slice(0, n).join("\n"), all.slice(n, 2 * n).join("\n"), all.slice(2 * n).join("\n")];
    }
    phases.forEach(([label, color], i) => {
      const items = bulletsOf(groups[i]);
      cols.append(el("div", { class: "minicard", style: { borderTop: "3px solid " + color } },
        el("h5", {}, label),
        el("div", { class: "col", style: { gap: "6px", marginTop: "4px" } },
          ...(items.length ? items : ["—"]).map((it) => el("div", { style: { fontSize: "12.5px", padding: "6px 8px", background: "#f7f9fc", borderRadius: "7px" } }, it)))));
    });
  }
  async function run() {
    genBtn.disabled = true; genBtn.innerHTML = spinner() + " Building…"; empty.style.display = "none";
    const focus = Object.keys(state.focus).filter((f) => state.focus[f]).join(", ");
    try {
      const d = await callTool(ctx.step.id, { brief: `Role: ${state.role}. Focus areas: ${focus}.` },
        "Produce a first-90-days onboarding plan with exactly three sections: '## First 30 days', '## Days 31-60', '## Days 61-90'. Under each, 3-5 concrete bullet actions. No preamble.");
      lastRaw = d.output; draw(d.output);
    } catch (e) { toast(e.message); } finally { genBtn.disabled = false; genBtn.textContent = "Build onboarding plan"; }
  }
  genBtn.onclick = run;
  mount.append(el("div", { class: "grid2" }, left, right));
}
