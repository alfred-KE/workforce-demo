// Agent Runner — reveal a multi-step action log with a final status.
import { el, callTool, toast, spinner } from "./_common.js";

export function render(mount, ctx) {
  const { tool } = ctx;
  const taskInput = tool.inputs.find((i) => i.id === "task") || tool.inputs[0];
  const task = el("textarea", { class: "editable", style: { minHeight: "180px" } }, taskInput.demo || "");
  const runBtn = el("button", { class: "btn primary" }, tool.run || "Run agent");
  const left = el("div", { class: "pane sticky" },
    el("h3", {}, "Agent Runner"),
    el("p", { class: "psub" }, "Give the agent a task; watch it plan and execute the steps across systems."),
    el("div", { class: "field" }, el("label", {}, taskInput.label), task),
    el("div", { class: "row" }, runBtn));

  const stats = el("div", { class: "stats" });
  const console = el("div", { class: "console" });
  const status = el("div", {});
  const empty = el("div", { class: "result empty", id: "oempty" }, "Run the agent to see its action log.");
  const right = el("div", { class: "pane" }, el("h3", {}, "Execution"), stats, empty, console, status);

  async function run() {
    runBtn.disabled = true; runBtn.innerHTML = spinner() + " Running…";
    console.innerHTML = ""; status.innerHTML = ""; stats.innerHTML = "";
    try {
      const d = await callTool(tool.id, { task: task.value });
      empty.style.display = "none";
      const lines = d.output.split("\n").map((l) => l.trim()).filter(Boolean);
      const actionLines = lines.filter((l) => /^\d+[.)]/.test(l) || /^[-*•]/.test(l));
      const statusLine = (d.output.match(/status:\s*(.*)/i) || [, ""])[1].trim();
      const list = actionLines.length ? actionLines : lines.filter((l) => !/status:/i.test(l));
      stats.append(el("div", { class: "stat" }, el("div", { class: "n" }, list.length), el("div", { class: "l" }, "Actions")));
      list.forEach((l, i) => {
        const row = el("div", { class: "logline" },
          el("span", { class: "n" }, String(i + 1).padStart(2, "0")),
          el("span", {}, l.replace(/^\d+[.)]\s*/, "").replace(/^[-*•]\s*/, "")));
        console.append(row);
        setTimeout(() => row.classList.add("on"), 120 * i + 60);
      });
      setTimeout(() => {
        if (statusLine) status.append(el("div", { class: "statusbar" }, "✓ " + statusLine));
      }, 120 * list.length + 120);
    } catch (e) { toast(e.message); } finally { runBtn.disabled = false; runBtn.textContent = tool.run || "Run agent"; }
  }
  runBtn.onclick = run;
  mount.append(el("div", { class: "grid2" }, left, right));
}
