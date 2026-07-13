// Decision Console — batch-classify records into decisions with verdict badges.
import { el, callTool, toast, spinner } from "./_common.js";

export function render(mount, ctx) {
  const { tool } = ctx;
  const recInput = tool.inputs.find((i) => i.id === "record") || tool.inputs[0];
  const records = [];

  const list = el("div", {});
  function addRecord(val) {
    const ta = el("textarea", { class: "editable", style: { minHeight: "80px" } }, val || "");
    const wrap = el("div", { class: "field" },
      el("div", { class: "row" }, el("label", { style: { flex: "1" } }, "Record " + (records.length + 1)),
        el("button", { class: "linkbtn", onClick: () => { wrap.remove(); const i = records.indexOf(ta); if (i > -1) records.splice(i, 1); } }, "remove")),
      ta);
    records.push(ta); list.append(wrap);
  }
  addRecord(recInput.demo || "");
  const runBtn = el("button", { class: "btn primary" }, "Decide all");
  const left = el("div", { class: "pane sticky" },
    el("h3", {}, "Decision Console"),
    el("p", { class: "psub" }, "Assess one or many records and get a decision, reason and next action for each."),
    list,
    el("div", { class: "row" }, el("button", { class: "btn ghost small", onClick: () => addRecord("") }, "＋ Add record"), runBtn));

  const stats = el("div", { class: "stats" });
  const grid = el("div", { class: "cardgrid" });
  const empty = el("div", { class: "result empty", id: "cempty" }, "Run to get decisions.");
  const right = el("div", { class: "pane" }, el("h3", {}, "Decisions"), stats, empty, grid);

  const verdictClass = (dec) => {
    const t = dec.toLowerCase();
    if (/(duplicate|blocked|not eligible|ineligible|reject|fail|no\b)/.test(t)) return "fail";
    if (/(review|manual|uncertain|check|maybe|escalate)/.test(t)) return "warn";
    return "pass";
  };
  async function run() {
    if (!records.length) return toast("Add a record");
    empty.style.display = "none"; grid.innerHTML = ""; stats.innerHTML = "";
    runBtn.disabled = true; runBtn.innerHTML = spinner() + " Deciding…";
    const counts = { pass: 0, warn: 0, fail: 0 };
    for (let i = 0; i < records.length; i++) {
      const card = el("div", { class: "minicard" }, el("h5", {}, "Record " + (i + 1), el("span", { class: "muted" }, spinner())));
      grid.append(card);
      try {
        const d = await callTool(tool.id, { record: records[i].value });
        const dec = (d.output.match(/decision:\s*(.*)/i) || [, "—"])[1].trim();
        const reason = (d.output.match(/reason:\s*(.*)/i) || [, ""])[1].trim();
        const next = (d.output.match(/next action:\s*(.*)/i) || [, ""])[1].trim();
        const v = verdictClass(dec); counts[v]++;
        card.innerHTML = "";
        card.append(
          el("div", { class: "verdict " + v, style: { marginBottom: "8px" } }, dec),
          reason && el("p", { style: { margin: "0 0 6px", fontSize: "12.5px" } }, el("b", {}, "Why: "), reason),
          next && el("p", { style: { margin: 0, fontSize: "12.5px" } }, el("b", {}, "Next: "), next));
      } catch (e) { card.innerHTML = ""; card.append(el("div", { class: "errbox" }, e.message)); }
    }
    stats.append(
      el("div", { class: "stat" }, el("div", { class: "n", style: { color: "#16a34a" } }, counts.pass), el("div", { class: "l" }, "Proceed")),
      el("div", { class: "stat" }, el("div", { class: "n", style: { color: "#8a5a00" } }, counts.warn), el("div", { class: "l" }, "Review")),
      el("div", { class: "stat" }, el("div", { class: "n", style: { color: "#991b1b" } }, counts.fail), el("div", { class: "l" }, "Blocked")));
    runBtn.disabled = false; runBtn.textContent = "Decide all";
  }
  runBtn.onclick = run;
  mount.append(el("div", { class: "grid2" }, left, right));
}
