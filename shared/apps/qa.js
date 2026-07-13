// Control Console — compare expected vs actual and produce a PASS/FAIL checklist.
import { el, callTool, downloadText, toast, spinner } from "./_common.js";

export function render(mount, ctx) {
  const { tool } = ctx;
  const srcInput = tool.inputs.find((i) => i.id === "source") || tool.inputs[0];
  const actInput = tool.inputs.find((i) => i.id === "actual") || tool.inputs[1];
  const src = el("textarea", { class: "editable", style: { minHeight: "150px" } }, srcInput.demo || "");
  const act = el("textarea", { class: "editable", style: { minHeight: "150px" } }, actInput.demo || "");
  const runBtn = el("button", { class: "btn primary" }, tool.run || "Run check");
  const left = el("div", { class: "pane sticky" },
    el("h3", {}, "Control Console"),
    el("p", { class: "psub" }, "Compare the expected version with what actually happened and close the control gap."),
    el("div", { class: "field" }, el("label", {}, srcInput.label), src),
    el("div", { class: "field" }, el("label", {}, actInput.label), act),
    el("div", { class: "row" }, runBtn, el("span", { class: "muted", id: "qmodel" })));

  const banner = el("div", {});
  const stats = el("div", { class: "stats" });
  const checks = el("div", {});
  const empty = el("div", { class: "result empty", id: "qempty" }, "Run the check to see the control result.");
  let lastReport = "";
  const right = el("div", { class: "pane" },
    el("div", { class: "toolbar" }, el("h3", { style: { margin: 0 } }, "Control result"), el("span", { class: "grow" }),
      el("button", { class: "btn small", onClick: () => lastReport ? downloadText("control-report.txt", lastReport) : toast("Run first") }, "Export report")),
    banner, stats, empty, checks);

  async function run() {
    runBtn.disabled = true; runBtn.innerHTML = spinner() + " Checking…";
    banner.innerHTML = ""; stats.innerHTML = ""; checks.innerHTML = "";
    try {
      const d = await callTool(tool.id, { source: src.value, actual: act.value });
      lastReport = d.output; empty.style.display = "none";
      const pass = /result:\s*pass/i.test(d.output);
      const fail = /result:\s*fail/i.test(d.output);
      const lines = d.output.split("\n").map((l) => l.trim()).filter(Boolean);
      let issues = 0, oks = 0;
      lines.forEach((l) => {
        const ok = /^[✓✔]/.test(l), no = /^[✗✘x]/i.test(l) && !/result/i.test(l);
        if (!ok && !no) return;
        if (ok) oks++; if (no) issues++;
        checks.append(el("div", { class: "check" },
          el("span", { class: "mk " + (ok ? "ok" : "no") }, ok ? "✓" : "✗"),
          el("span", {}, l.replace(/^[✓✔✗✘x]\s*/i, ""))));
      });
      const v = fail || issues > 0 ? "fail" : "pass";
      banner.append(el("div", { class: "verdict " + (v === "pass" ? "pass" : "fail") },
        v === "pass" ? "✓ PASS — no discrepancies" : "✗ FAIL — " + issues + " issue" + (issues !== 1 ? "s" : "")));
      stats.append(
        el("div", { class: "stat" }, el("div", { class: "n", style: { color: "#16a34a" } }, oks), el("div", { class: "l" }, "Matches")),
        el("div", { class: "stat" }, el("div", { class: "n", style: { color: "#991b1b" } }, issues), el("div", { class: "l" }, "Issues")));
      document.getElementById("qmodel").textContent = "model: " + d.model;
    } catch (e) { toast(e.message); } finally { runBtn.disabled = false; runBtn.textContent = tool.run || "Run check"; }
  }
  runBtn.onclick = run;
  mount.append(el("div", { class: "grid2" }, left, right));
}
