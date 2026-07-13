// Payroll Control Cockpit — run the control battery and see pass/fail tiles (steps pay6/9/10/11).
import { el, callTool, downloadText, toast, spinner } from "./_common.js";

const CONTROLS = ["Gross-to-net simulation", "Journal entries", "Pension file", "Recalculations", "Minimum-wage check", "Active vs gross", "30%-ruling check"];

export function render(mount, ctx) {
  const pass = (ctx.step.timer ? ctx.step.timer + " pass" : "Control pass");
  const sel = new Set(CONTROLS);
  const period = el("input", { type: "text", value: "Period 07 — Netherlands" });
  const box = el("div", { class: "chips" });
  CONTROLS.forEach((c) => { const chip = el("span", { class: "chip on", onClick: () => { if (sel.has(c)) { sel.delete(c); chip.classList.remove("on"); } else { sel.add(c); chip.classList.add("on"); } } }, c); box.append(chip); });
  const runBtn = el("button", { class: "btn primary" }, "Run controls");
  const left = el("div", { class: "pane sticky" },
    el("h3", {}, "Payroll Control Cockpit"),
    el("p", { class: "psub" }, "Run the payroll control battery for the " + pass.toLowerCase() + " and see what passes before the run."),
    el("div", { class: "field" }, el("label", {}, "Period"), period),
    el("div", { class: "field" }, el("label", {}, "Control set"), box),
    el("div", { class: "row" }, runBtn));

  const banner = el("div", {});
  const stats = el("div", { class: "stats" });
  const grid = el("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(190px,1fr))", gap: "10px", marginTop: "6px" } });
  const empty = el("div", { class: "result empty", id: "pcEmpty" }, "Run the controls to see the cockpit.");
  let report = "";
  const right = el("div", { class: "pane" },
    el("div", { class: "toolbar" }, el("h3", { style: { margin: 0 } }, pass + " results"), el("span", { class: "grow" }),
      el("button", { class: "btn small", onClick: () => report ? downloadText("payroll-controls.txt", report) : toast("Run first") }, "Export")),
    banner, stats, empty, grid);

  async function run() {
    runBtn.disabled = true; runBtn.innerHTML = spinner() + " Running…"; grid.innerHTML = ""; banner.innerHTML = ""; stats.innerHTML = "";
    empty.style.display = "none";
    const controls = [...sel];
    const source = controls.join("; ");
    const actual = ctx.tool.inputs.find((i) => i.id === "actual")?.demo || "Payroll run data for the period.";
    try {
      const d = await callTool(ctx.step.id, { source, actual },
        "You are a payroll control agent. For EACH control in the source list, output exactly one line in this format: '<control>: PASS' or '<control>: FAIL - <short reason>'. Use the literal words PASS or FAIL (no symbols, no bullets). Base failures on the actual run data if it suggests issues, otherwise PASS. End with 'Result: PASS' or 'Result: FAIL'.");
      report = d.output;
      let ok = 0, bad = 0;
      controls.forEach((c) => {
        const line = d.output.split("\n").find((l) => l.toLowerCase().includes(c.toLowerCase().slice(0, 8)));
        const failed = line && (/\bfail/i.test(line) || /[✗✘]/.test(line));
        if (failed) bad++; else ok++;
        grid.append(el("div", { class: "minicard", style: { borderLeft: "4px solid " + (failed ? "#dc2626" : "#16a34a") } },
          el("div", { style: { fontSize: "12.5px", fontWeight: "700" } }, c),
          el("div", { style: { fontSize: "12px", fontWeight: "800", color: failed ? "#991b1b" : "#166534", marginTop: "4px" } }, failed ? "✕ FAIL" : "✓ PASS"),
          failed && line ? el("div", { class: "muted", style: { fontSize: "11.5px", marginTop: "3px" } }, line.replace(/.*fail:?/i, "").trim()) : null));
      });
      banner.append(el("div", { class: "verdict " + (bad ? "fail" : "pass") }, bad ? `✕ ${bad} control${bad !== 1 ? "s" : ""} failed — resolve before run` : "✓ All controls passed — cleared for payroll"));
      stats.append(
        el("div", { class: "stat" }, el("div", { class: "n", style: { color: "#16a34a" } }, ok), el("div", { class: "l" }, "Passed")),
        el("div", { class: "stat" }, el("div", { class: "n", style: { color: "#991b1b" } }, bad), el("div", { class: "l" }, "Failed")));
    } catch (e) { toast(e.message); } finally { runBtn.disabled = false; runBtn.textContent = "Run controls"; }
  }
  runBtn.onclick = run;
  mount.append(el("div", { class: "grid2" }, left, right));
}
