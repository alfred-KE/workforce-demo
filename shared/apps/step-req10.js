// Requisition Builder — fill a requisition form, validate it, raise it (step req10).
import { el, callTool, mdToHtml, copyText, toast, spinner } from "./_common.js";

export function render(mount, ctx) {
  const f = { position: "Store Associate", dept: "Store Operations", location: "Store 118 — Rotterdam", manager: "J. de Vries", headcount: "1", type: "Permanent · 30h", band: "L2 (NL)", start: "2026-07-01", reason: "Backfill — seasonal leaver" };
  const field = (key, label) => { const i = el("input", { type: "text", value: f[key] }); i.addEventListener("input", () => f[key] = i.value); return el("div", { class: "field" }, el("label", {}, label), i); };
  const raiseBtn = el("button", { class: "btn primary" }, "Validate & raise requisition");
  const left = el("div", { class: "pane sticky" },
    el("h3", {}, "Requisition Builder"),
    el("p", { class: "psub" }, "Complete the requisition — it's validated for mandatory fields before it's raised."),
    field("position", "Position"), field("dept", "Department"), field("location", "Location"),
    el("div", { class: "row" }, el("div", { style: { flex: 1 } }, field("manager", "Hiring manager")), el("div", { style: { flex: 1 } }, field("headcount", "Headcount"))),
    el("div", { class: "row" }, el("div", { style: { flex: 1 } }, field("type", "Type")), el("div", { style: { flex: 1 } }, field("band", "Salary band"))),
    field("start", "Target start"), field("reason", "Justification"),
    el("div", { class: "row" }, raiseBtn));

  const checklist = el("div", {});
  const summary = el("div", {});
  const empty = el("div", { class: "result empty", id: "rqEmpty" }, "Validate to raise the requisition.");
  const right = el("div", { class: "pane" }, el("h3", {}, "Requisition"), checklist, empty, summary);

  async function run() {
    raiseBtn.disabled = true; raiseBtn.innerHTML = spinner() + " Validating…"; checklist.innerHTML = ""; summary.innerHTML = "";
    empty.style.display = "none";
    const mandatory = [["Position", f.position], ["Department", f.dept], ["Location", f.location], ["Hiring manager", f.manager], ["Headcount", f.headcount], ["Salary band", f.band], ["Justification", f.reason]];
    const missing = mandatory.filter(([, v]) => !String(v).trim());
    mandatory.forEach(([lab, v]) => checklist.append(el("div", { class: "check" }, el("span", { class: "mk " + (v ? "ok" : "no") }, v ? "✓" : "✗"), el("span", {}, lab + (v ? "" : " — required")))));
    if (missing.length) { summary.append(el("div", { class: "verdict fail", style: { marginTop: "10px" } }, `✗ ${missing.length} required field${missing.length !== 1 ? "s" : ""} missing`)); raiseBtn.disabled = false; raiseBtn.textContent = "Validate & raise requisition"; return; }
    const trigger = Object.entries({ Position: f.position, Department: f.dept, Location: f.location, "Hiring manager": f.manager, Headcount: f.headcount, Type: f.type, Band: f.band, "Target start": f.start, Justification: f.reason }).map(([k, v]) => k + ": " + v).join("\n");
    try {
      const d = await callTool(ctx.step.id, { trigger }, "Produce a clean, formatted requisition summary ready to submit (markdown). Do not invent extra data.");
      const reqId = "NW-" + Math.floor(4000 + Math.random() * 5000);
      summary.append(
        el("div", { class: "verdict pass", style: { marginTop: "10px" } }, "✓ Requisition " + reqId + " ready to raise"),
        el("div", { class: "out-body", style: { marginTop: "10px" }, html: mdToHtml(d.output) }),
        el("div", { class: "row", style: { marginTop: "10px" } },
          el("button", { class: "btn small", onClick: () => copyText(d.output) }, "Copy"),
          el("button", { class: "btn small primary", onClick: () => toast("Requisition " + reqId + " submitted (demo)") }, "Submit requisition")));
    } catch (e) { toast(e.message); } finally { raiseBtn.disabled = false; raiseBtn.textContent = "Validate & raise requisition"; }
  }
  raiseBtn.onclick = run;
  mount.append(el("div", { class: "grid2" }, left, right));
}
