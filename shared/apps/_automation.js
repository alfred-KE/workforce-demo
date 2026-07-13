// Business-framed automation runner (light, no raw console) — reused by routine RPA steps.
import { el, callTool, toast, spinner } from "./_common.js";

export function render(mount, ctx) {
  const s = ctx.step, inp = ctx.tool.inputs[0];
  const trig = el("textarea", { class: "editable", style: { minHeight: "150px" } }, inp ? inp.demo || "" : "");
  const runBtn = el("button", { class: "btn primary" }, "Run automation");
  const left = el("div", { class: "pane sticky" },
    el("h3", {}, "Automation"),
    el("p", { class: "psub" }, s.imp || "Runs this step automatically."),
    el("div", { class: "field" }, el("label", {}, "Trigger / input"), trig),
    s.sys ? el("div", { class: "muted", style: { fontSize: "12px", marginBottom: "10px" } }, "Runs against: " + s.sys) : null,
    el("div", { class: "row" }, runBtn));

  const banner = el("div", {});
  const steps = el("div", { class: "col", style: { gap: "8px" } });
  const empty = el("div", { class: "result empty", id: "auEmpty" }, "Run to see exactly what the automation does.");
  const right = el("div", { class: "pane" }, el("h3", {}, "Result"),
    s.impact ? el("div", { class: "muted", style: { fontSize: "12.5px", marginBottom: "10px" } }, "Outcome: " + s.impact) : null,
    banner, empty, steps);

  async function run() {
    runBtn.disabled = true; runBtn.innerHTML = spinner() + " Running…"; steps.innerHTML = ""; banner.innerHTML = "";
    empty.style.display = "none";
    const inputs = {}; if (inp) inputs[inp.id] = trig.value;
    try {
      const d = await callTool(s.id, inputs);
      const lines = d.output.split("\n").map((l) => l.trim()).filter((l) => /^\d+[.)]/.test(l) || /^[-*•]/.test(l));
      const status = (d.output.match(/(?:status|result):\s*(.*)/i) || [, ""])[1].trim();
      (lines.length ? lines : d.output.split("\n").filter(Boolean).slice(0, 6)).forEach((l) => {
        steps.append(el("div", { style: { display: "flex", gap: "10px", alignItems: "flex-start", background: "#f7f9fc", border: "1px solid var(--line)", borderRadius: "9px", padding: "9px 12px" } },
          el("span", { style: { color: "#16a34a", fontWeight: "800" } }, "✓"),
          el("span", { style: { fontSize: "13px" } }, l.replace(/^\d+[.)]\s*/, "").replace(/^[-*•]\s*/, "").replace(/^(rule applied|actions|result):?\s*/i, ""))));
      });
      banner.append(el("div", { class: "verdict pass" }, "✓ " + (status || "Done")));
    } catch (e) { toast(e.message); } finally { runBtn.disabled = false; runBtn.textContent = "Run automation"; }
  }
  runBtn.onclick = run;
  mount.append(el("div", { class: "grid2" }, left, right));
}
