// Business-framed workflow runner (light vertical stepper, no raw console) — reused by routine agent steps.
import { el, callTool, toast, spinner } from "./_common.js";

export function render(mount, ctx) {
  const s = ctx.step, inp = ctx.tool.inputs[0];
  const task = el("textarea", { class: "editable", style: { minHeight: "170px" } }, inp ? inp.demo || "" : "");
  const runBtn = el("button", { class: "btn primary" }, "Run workflow");
  const left = el("div", { class: "pane sticky" },
    el("h3", {}, "Workflow"),
    el("p", { class: "psub" }, s.imp || "Runs this multi-step task end to end."),
    el("div", { class: "field" }, el("label", {}, "Task context"), task),
    el("div", { class: "row" }, runBtn));

  const stepper = el("div", {});
  const banner = el("div", {});
  const empty = el("div", { class: "result empty", id: "prEmpty" }, "Run the workflow to watch each step complete.");
  const right = el("div", { class: "pane" }, el("h3", {}, "Steps"),
    s.impact ? el("div", { class: "muted", style: { fontSize: "12.5px", marginBottom: "10px" } }, "Outcome: " + s.impact) : null,
    empty, stepper, banner);

  async function run() {
    runBtn.disabled = true; runBtn.innerHTML = spinner() + " Running…"; stepper.innerHTML = ""; banner.innerHTML = "";
    empty.style.display = "none";
    const inputs = {}; if (inp) inputs[inp.id] = task.value;
    try {
      const d = await callTool(s.id, inputs);
      const lines = d.output.split("\n").map((l) => l.trim()).filter((l) => /^\d+[.)]/.test(l) || /^[-*•]/.test(l));
      const status = (d.output.match(/status:\s*(.*)/i) || [, ""])[1].trim();
      const list = lines.length ? lines : d.output.split("\n").filter(Boolean).slice(0, 7);
      list.forEach((l, i) => {
        const row = el("div", { style: { display: "flex", gap: "12px", alignItems: "flex-start", opacity: "0", transform: "translateY(4px)", transition: ".3s" } },
          el("div", { style: { display: "flex", flexDirection: "column", alignItems: "center" } },
            el("div", { style: { width: "24px", height: "24px", borderRadius: "50%", background: "#7c3aed", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "800", flex: "0 0 auto" } }, String(i + 1)),
            i < list.length - 1 ? el("div", { style: { width: "2px", flex: "1", minHeight: "14px", background: "var(--line)" } }) : null),
          el("div", { style: { fontSize: "13px", paddingBottom: "12px" } }, l.replace(/^\d+[.)]\s*/, "").replace(/^[-*•]\s*/, "")));
        stepper.append(row);
        setTimeout(() => { row.style.opacity = "1"; row.style.transform = "none"; }, 140 * i + 80);
      });
      setTimeout(() => banner.append(el("div", { class: "verdict pass" }, "✓ " + (status || "Workflow complete"))), 140 * list.length + 140);
    } catch (e) { toast(e.message); } finally { runBtn.disabled = false; runBtn.textContent = "Run workflow"; }
  }
  runBtn.onclick = run;
  mount.append(el("div", { class: "grid2" }, left, right));
}
