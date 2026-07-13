// Posting QA — compare the approved vacancy against what's live, field by field (steps req12/13).
import { el, callTool, parseTable, downloadText, toast, spinner } from "./_common.js";

export function render(mount, ctx) {
  const srcI = el("textarea", { class: "editable", style: { minHeight: "150px" } }, ctx.tool.inputs.find((i) => i.id === "source")?.demo || "");
  const actI = el("textarea", { class: "editable", style: { minHeight: "150px" } }, ctx.tool.inputs.find((i) => i.id === "actual")?.demo || "");
  const runBtn = el("button", { class: "btn primary" }, "Run posting check");
  const left = el("div", { class: "pane sticky" },
    el("h3", {}, "Posting QA"),
    el("p", { class: "psub" }, "Confirm the live posting matches the approved vacancy — field by field."),
    el("div", { class: "field" }, el("label", {}, "Approved vacancy (source)"), srcI),
    el("div", { class: "field" }, el("label", {}, "Live posting (actual)"), actI),
    el("div", { class: "row" }, runBtn));

  const banner = el("div", {});
  const wrap = el("div", { style: { overflowX: "auto" } });
  const empty = el("div", { class: "result empty", id: "pqEmpty" }, "Run the check to see the field comparison.");
  let report = "";
  const toolbar = el("div", { class: "toolbar" }, el("h3", { style: { margin: 0 } }, "Comparison"), el("span", { class: "grow" }),
    el("button", { class: "btn small", onClick: () => report ? downloadText("posting-qa.txt", report) : toast("Run first") }, "Export"),
    el("button", { class: "btn small", onClick: () => toast("Posting approved (demo)") }, "Approve"),
    el("button", { class: "btn small ghost", onClick: () => toast("Flagged for fix (demo)") }, "Flag for fix"));
  const right = el("div", { class: "pane" }, toolbar, banner, empty, wrap);

  async function run() {
    runBtn.disabled = true; runBtn.innerHTML = spinner() + " Checking…"; wrap.innerHTML = ""; banner.innerHTML = "";
    empty.style.display = "none";
    try {
      const d = await callTool(ctx.step.id, { source: srcI.value, actual: actI.value },
        "Compare source vs actual field by field. Return ONLY a markdown table with columns: Field | Approved | Live | Match (write 'OK' or 'DIFF'). Cover title, hours, contract, location, deadline, benefits where present.");
      report = d.output;
      const t = parseTable(d.output);
      if (!t) { wrap.innerHTML = '<div class="errbox">Could not structure the comparison.</div>'; return; }
      const mi = t.head.findIndex((h) => /match/i.test(h));
      let diffs = 0;
      const table = el("table", { class: "data" });
      table.append(el("thead", {}, el("tr", {}, ...t.head.map((h) => el("th", {}, h)))));
      const tb = el("tbody", {});
      t.rows.forEach((r) => {
        const bad = mi >= 0 && /diff|✗|mismatch|no/i.test(r[mi] || "");
        if (bad) diffs++;
        tb.append(el("tr", { style: bad ? { background: "#fdf1f1" } : {} }, ...r.map((c, i) => i === mi
          ? el("td", {}, el("span", { style: { fontWeight: "800", color: bad ? "#991b1b" : "#166534" } }, bad ? "✗ DIFF" : "✓ OK"))
          : el("td", {}, c))));
      });
      table.append(tb); wrap.append(table);
      banner.append(el("div", { class: "verdict " + (diffs ? "fail" : "pass") }, diffs ? `✗ ${diffs} field${diffs !== 1 ? "s" : ""} differ from the approved vacancy` : "✓ Live posting matches the approved vacancy"));
    } catch (e) { toast(e.message); } finally { runBtn.disabled = false; runBtn.textContent = "Run posting check"; }
  }
  runBtn.onclick = run;
  mount.append(el("div", { class: "grid2" }, left, right));
}
