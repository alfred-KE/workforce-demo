// Certificate Monitor — who's expiring and who needs training (steps saf1/saf3).
import { el, callTool, parseTable, downloadText, toast, spinner } from "./_common.js";

export function render(mount, ctx) {
  const raw = el("textarea", { class: "editable", style: { minHeight: "200px" } }, ctx.tool.inputs[0]?.demo || "");
  const runBtn = el("button", { class: "btn primary" }, "Refresh monitor");
  const left = el("div", { class: "pane sticky" },
    el("h3", {}, "Certificate Monitor"),
    el("p", { class: "psub" }, "See at a glance whose safety certificates are expiring and who needs training next."),
    el("div", { class: "field" }, el("label", {}, "Certificate register"), raw),
    el("div", { class: "row" }, runBtn));

  const stats = el("div", { class: "stats" }), wrap = el("div", { style: { overflowX: "auto" } });
  const empty = el("div", { class: "result empty", id: "cmEmpty" }, "Refresh to build the expiry monitor.");
  let report = "";
  const right = el("div", { class: "pane" }, el("div", { class: "toolbar" }, el("h3", { style: { margin: 0 } }, "Expiry monitor"), el("span", { class: "grow" }),
    el("button", { class: "btn small", onClick: () => report ? downloadText("cert-monitor.csv", report) : toast("Run first") }, "Export")), stats, empty, wrap);

  const cls = (s) => /expired/i.test(s) ? "no" : /due|soon|weeks?|days?/i.test(s) ? "warn" : "ok";
  async function run() {
    runBtn.disabled = true; runBtn.innerHTML = spinner() + " Refreshing…"; wrap.innerHTML = ""; stats.innerHTML = "";
    empty.style.display = "none";
    try {
      const d = await callTool(ctx.step.id, { raw: raw.value },
        "Return ONLY a markdown table: Employee | Certificate | Expiry | Status. Status must be exactly 'Expired', 'Due soon' or 'Valid'. Sort most urgent first.");
      report = d.output; const t = parseTable(d.output);
      if (!t) { wrap.innerHTML = '<div class="errbox">Could not structure the register.</div>'; return; }
      const si = t.head.findIndex((h) => /status/i.test(h)); let exp = 0, due = 0, ok = 0;
      const table = el("table", { class: "data" }); table.append(el("thead", {}, el("tr", {}, ...t.head.map((h) => el("th", {}, h)))));
      const tb = el("tbody", {});
      t.rows.forEach((r) => { const c = cls(r[si] || ""); if (c === "no") exp++; else if (c === "warn") due++; else ok++;
        tb.append(el("tr", { style: c === "no" ? { background: "#fdf1f1" } : c === "warn" ? { background: "#fef6e7" } : {} },
          ...r.map((v, i) => i === si ? el("td", {}, el("span", { style: { fontWeight: "800", color: c === "no" ? "#991b1b" : c === "warn" ? "#8a5a00" : "#166534" } }, (c === "no" ? "● " : c === "warn" ? "● " : "● ") + r[si])) : el("td", {}, v)))); });
      table.append(tb); wrap.append(table);
      stats.append(el("div", { class: "stat" }, el("div", { class: "n", style: { color: "#991b1b" } }, exp), el("div", { class: "l" }, "Expired")),
        el("div", { class: "stat" }, el("div", { class: "n", style: { color: "#8a5a00" } }, due), el("div", { class: "l" }, "Due soon")),
        el("div", { class: "stat" }, el("div", { class: "n", style: { color: "#16a34a" } }, ok), el("div", { class: "l" }, "Valid")));
    } catch (e) { toast(e.message); } finally { runBtn.disabled = false; runBtn.textContent = "Refresh monitor"; }
  }
  runBtn.onclick = run;
  mount.append(el("div", { class: "grid2" }, left, right));
}
