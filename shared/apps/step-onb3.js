// Identity Check — duplicate / rehire detection for a new hire (step onb3).
import { el, callTool, toast, spinner } from "./_common.js";

export function render(mount, ctx) {
  const nh = { name: "Milan Bakker", dob: "2004-03-04", email: "m.bakker@example.com", role: "Store Associate — Store 118" };
  const records = [
    { name: "M. Bakker", dob: "2004-03-04", note: "Seasonal Store Associate, Store 118 — left 5 months ago" },
    { name: "Milan Bakker", dob: "1998-09-12", note: "Applicant (2022), never employed" },
  ];

  const field = (label, val, on) => { const i = el("input", { type: "text", value: val }); i.addEventListener("input", () => on(i.value)); return el("div", { class: "field" }, el("label", {}, label), i); };
  const recList = el("div", { class: "col", style: { gap: "8px" } });
  records.forEach((r) => recList.append(el("div", { class: "minicard" },
    el("h5", {}, r.name), el("div", { class: "muted", style: { fontSize: "12px" } }, "DOB " + r.dob + " · " + r.note))));

  const runBtn = el("button", { class: "btn primary" }, "Check identity");
  const left = el("div", { class: "pane sticky" },
    el("h3", {}, "Identity Check"),
    el("p", { class: "psub" }, "Before onboarding, confirm this person isn't already on file (duplicate) or a returning employee (rehire)."),
    field("Full name", nh.name, (v) => nh.name = v),
    el("div", { class: "row" }, el("div", { style: { flex: "1" } }, field("Date of birth", nh.dob, (v) => nh.dob = v)), el("div", { style: { flex: "1" } }, field("Email", nh.email, (v) => nh.email = v))),
    field("Role", nh.role, (v) => nh.role = v),
    el("div", { class: "field" }, el("label", {}, "Records on file"), recList),
    el("div", { class: "row" }, runBtn));

  const banner = el("div", {});
  const cards = el("div", { class: "cardgrid" });
  const empty = el("div", { class: "result empty", id: "idEmpty" }, "Run the check to compare against records on file.");
  const right = el("div", { class: "pane" }, el("h3", {}, "Match result"), banner, empty, cards);

  const sim = (a, b) => { a = a.toLowerCase(); b = b.toLowerCase(); const A = new Set(a.split(/\s+/)); let m = 0; b.split(/\s+/).forEach((w) => { if (A.has(w)) m++; }); return Math.round((m / Math.max(A.size, 1)) * 100); };

  async function run() {
    runBtn.disabled = true; runBtn.innerHTML = spinner() + " Checking…"; cards.innerHTML = ""; banner.innerHTML = "";
    empty.style.display = "none";
    const record = `New hire: ${nh.name}, DOB ${nh.dob}, ${nh.role}, email ${nh.email}.\nRecords on file:\n` +
      records.map((r, i) => `${i + 1}. ${r.name}, DOB ${r.dob} — ${r.note}`).join("\n") +
      `\nDecide: is the new hire a NEW hire, a REHIRE of an existing record, or a DUPLICATE to block?`;
    try {
      const d = await callTool(ctx.step.id, { record });
      const dec = (d.output.match(/decision:\s*(.*)/i) || [, "—"])[1].trim();
      const reason = (d.output.match(/reason:\s*(.*)/i) || [, ""])[1].trim();
      const next = (d.output.match(/next action:\s*(.*)/i) || [, ""])[1].trim();
      const v = /duplicate|block/i.test(dec) ? "fail" : /rehire|review/i.test(dec) ? "warn" : "pass";
      banner.append(el("div", { class: "verdict " + v }, (v === "pass" ? "✓ " : v === "warn" ? "⚠ " : "✕ ") + dec),
        reason && el("p", { style: { marginTop: "8px", fontSize: "13px" } }, reason),
        next && el("p", { style: { marginTop: "4px", fontSize: "12.5px" } }, el("b", {}, "Next: "), next));
      records.forEach((r) => {
        const score = Math.min(100, sim(nh.name, r.name) * 0.6 + (nh.dob === r.dob ? 40 : 0));
        cards.append(el("div", { class: "minicard" },
          el("h5", {}, r.name, el("span", { class: "muted", style: { fontWeight: "800" } }, score + "% match")),
          el("div", { class: "progbar", style: { height: "6px", background: "var(--line)", borderRadius: "3px", overflow: "hidden", margin: "6px 0" } },
            el("div", { style: { height: "100%", width: score + "%", background: score >= 70 ? "#dc2626" : score >= 40 ? "#f59e0b" : "#16a34a" } })),
          el("div", { class: "muted", style: { fontSize: "12px" } }, "DOB " + r.dob + " · " + r.note),
          el("div", { class: "row tight", style: { marginTop: "8px" } },
            el("button", { class: "btn small", onClick: () => toast("Marked as same person — profile reused (demo)") }, "Same person"),
            el("button", { class: "btn small ghost", onClick: () => toast("Marked as different (demo)") }, "Different"))));
      });
    } catch (e) { toast(e.message); } finally { runBtn.disabled = false; runBtn.textContent = "Check identity"; }
  }
  runBtn.onclick = run;
  mount.append(el("div", { class: "grid2" }, left, right));
}
