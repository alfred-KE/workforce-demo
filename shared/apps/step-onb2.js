// New-hire Data Check — validate a new-hire record for completeness before onboarding (step onb2).
import { el, callTool, parseTable, toast, spinner } from "./_common.js";

export function render(mount, ctx) {
  const raw = el("textarea", { class: "editable", style: { minHeight: "200px" } }, ctx.tool.inputs[0]?.demo || "");
  const runBtn = el("button", { class: "btn primary" }, "Validate record");
  const left = el("div", { class: "pane sticky" },
    el("h3", {}, "New-hire Data Check"),
    el("p", { class: "psub" }, "Confirm the new-hire record is complete and consistent before contracting."),
    el("div", { class: "field" }, el("label", {}, "New-hire record"), raw),
    el("div", { class: "row" }, runBtn));

  const banner = el("div", {}), stats = el("div", { class: "stats" }), wrap = el("div", { style: { overflowX: "auto" } });
  const empty = el("div", { class: "result empty", id: "ndEmpty" }, "Validate to see the field-by-field status.");
  const right = el("div", { class: "pane" }, el("h3", {}, "Validation"), banner, stats, empty, wrap);

  const cls = (s) => /missing|invalid|error/i.test(s) ? "no" : /check|verify|review|unclear/i.test(s) ? "warn" : "ok";
  async function run() {
    runBtn.disabled = true; runBtn.innerHTML = spinner() + " Validating…"; wrap.innerHTML = ""; banner.innerHTML = ""; stats.innerHTML = "";
    empty.style.display = "none";
    try {
      const d = await callTool(ctx.step.id, { raw: raw.value },
        "Validate the new-hire record. Return ONLY a markdown table with columns: Field | Value | Status. Status must be exactly 'OK', 'Missing' or 'Check'. Cover name, DOB, tax/social number, IBAN, start date, contract, emergency contact.");
      const t = parseTable(d.output);
      if (!t) { wrap.innerHTML = '<div class="errbox">Could not structure the record.</div>'; return; }
      const si = t.head.findIndex((h) => /status/i.test(h));
      let ok = 0, miss = 0, chk = 0;
      const table = el("table", { class: "data" });
      table.append(el("thead", {}, el("tr", {}, ...t.head.map((h) => el("th", {}, h)))));
      const tb = el("tbody", {});
      t.rows.forEach((r) => {
        const c = cls(r[si] || ""); if (c === "ok") ok++; else if (c === "no") miss++; else chk++;
        tb.append(el("tr", {}, ...r.map((v, i) => i === si
          ? el("td", {}, el("span", { class: "check" }, el("span", { class: "mk " + (c === "ok" ? "ok" : c === "no" ? "no" : "") }, c === "ok" ? "✓" : c === "no" ? "✗" : "⚠"), el("span", {}, r[si])))
          : el("td", {}, v))));
      });
      table.append(tb); wrap.append(table);
      banner.append(el("div", { class: "verdict " + (miss ? "fail" : chk ? "warn" : "pass") }, miss ? `✗ ${miss} field(s) missing — cannot contract yet` : chk ? "⚠ Ready with items to verify" : "✓ Record complete — ready to contract"));
      stats.append(
        el("div", { class: "stat" }, el("div", { class: "n", style: { color: "#16a34a" } }, ok), el("div", { class: "l" }, "Complete")),
        el("div", { class: "stat" }, el("div", { class: "n", style: { color: "#8a5a00" } }, chk), el("div", { class: "l" }, "To verify")),
        el("div", { class: "stat" }, el("div", { class: "n", style: { color: "#991b1b" } }, miss), el("div", { class: "l" }, "Missing")));
    } catch (e) { toast(e.message); } finally { runBtn.disabled = false; runBtn.textContent = "Validate record"; }
  }
  runBtn.onclick = run;
  mount.append(el("div", { class: "grid2" }, left, right));
}
