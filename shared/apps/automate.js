// Bot Console — run a deterministic RPA bot: rule, actions, result.
import { el, callTool, toast, spinner } from "./_common.js";

export function render(mount, ctx) {
  const { tool } = ctx;
  const trigInput = tool.inputs.find((i) => i.id === "trigger") || tool.inputs[0];
  const trig = el("textarea", { class: "editable", style: { minHeight: "180px" } }, trigInput.demo || "");
  const runBtn = el("button", { class: "btn primary" }, tool.run || "Run bot");
  let runs = 0;
  const runStat = el("div", { class: "stat" }, el("div", { class: "n", id: "runN" }, "0"), el("div", { class: "l" }, "Runs"));
  const statusPill = el("span", { class: "wftag", style: { background: "#94a3b8" } }, "idle");
  const left = el("div", { class: "pane sticky" },
    el("h3", {}, "Bot Console"),
    el("p", { class: "psub" }, "Fire the trigger; the bot applies its rule and logs every action it takes."),
    el("div", { class: "field" }, el("label", {}, trigInput.label), trig),
    el("div", { class: "row" }, runBtn, statusPill),
    el("div", { class: "stats", style: { marginTop: "12px" } }, runStat));

  const ruleBox = el("div", { class: "muted", style: { marginBottom: "10px", fontSize: "12.5px" } });
  const console = el("div", { class: "console" });
  const result = el("div", {});
  const empty = el("div", { class: "result empty", id: "aempty" }, "Run the bot to see its execution log.");
  const right = el("div", { class: "pane" }, el("h3", {}, "Bot run"), ruleBox, empty, console, result);

  function section(text, name) {
    const re = new RegExp(name + "\\s*:?\\s*", "i");
    const idx = text.search(re);
    if (idx < 0) return "";
    const after = text.slice(idx).replace(re, "");
    const next = after.search(/\n\s*(rule applied|actions|result)\s*:/i);
    return (next < 0 ? after : after.slice(0, next)).trim();
  }
  async function run() {
    runBtn.disabled = true; runBtn.innerHTML = spinner() + " Running…";
    statusPill.textContent = "running"; statusPill.style.background = "#f59e0b";
    console.innerHTML = ""; result.innerHTML = ""; ruleBox.innerHTML = "";
    try {
      const d = await callTool(tool.id, { trigger: trig.value });
      empty.style.display = "none";
      const rule = section(d.output, "rule applied");
      const actions = section(d.output, "actions");
      const res = section(d.output, "result");
      if (rule) ruleBox.innerHTML = "<b>Rule applied:</b> " + rule;
      const acts = (actions || d.output).split("\n").map((l) => l.trim()).filter((l) => /^\d+[.)]/.test(l) || /^[-*•]/.test(l));
      (acts.length ? acts : [actions || "Executed."]).forEach((l, i) => {
        const row = el("div", { class: "logline on" }, el("span", { class: "n" }, "→"), el("span", {}, l.replace(/^\d+[.)]\s*/, "").replace(/^[-*•]\s*/, "")));
        console.append(row);
      });
      if (res) result.append(el("div", { class: "statusbar", style: { marginTop: "12px" } }, "✓ " + res));
      runs++; document.getElementById("runN").textContent = runs;
      statusPill.textContent = "done"; statusPill.style.background = "#16a34a";
    } catch (e) { toast(e.message); statusPill.textContent = "error"; statusPill.style.background = "#dc2626"; }
    finally { runBtn.disabled = false; runBtn.textContent = tool.run || "Run bot"; }
  }
  runBtn.onclick = run;
  mount.append(el("div", { class: "grid2" }, left, right));
}
