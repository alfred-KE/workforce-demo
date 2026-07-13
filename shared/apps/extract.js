// Data Console — turn messy input into an editable table you can export.
import { el, callTool, parseTable, mdToHtml, downloadText, toast, spinner } from "./_common.js";

export function render(mount, ctx) {
  const { tool } = ctx;
  const rawInput = tool.inputs.find((i) => i.id === "raw") || tool.inputs[0];
  const raw = el("textarea", { class: "editable", style: { minHeight: "220px" } }, rawInput.demo || "");
  const runBtn = el("button", { class: "btn primary" }, tool.run || "Extract");
  const left = el("div", { class: "pane sticky" },
    el("h3", {}, "Data Console"),
    el("p", { class: "psub" }, "Extract structured fields from raw text into a table you can edit and export."),
    el("div", { class: "field" }, el("label", {}, rawInput.label), raw),
    el("div", { class: "row" }, runBtn, el("span", { class: "muted", id: "emodel" })));

  const tableWrap = el("div", {});
  const flags = el("div", { class: "muted", style: { marginTop: "10px", fontSize: "12.5px" } });
  const empty = el("div", { class: "result empty", id: "eempty" }, "Extract to build a structured table.");
  const bar = el("div", { class: "toolbar" }, el("h3", { style: { margin: 0 } }, "Extracted data"), el("span", { class: "grow" }),
    el("button", { class: "btn small", onClick: addRow }, "+ Row"),
    el("button", { class: "btn small", onClick: exportCsv }, "Export CSV"));
  const right = el("div", { class: "pane" }, bar, empty, tableWrap, flags);

  let head = [];
  function buildTable(h, rows) {
    head = h; tableWrap.innerHTML = ""; empty.style.display = "none";
    const table = el("table", { class: "data" });
    const thead = el("tr", {}, ...h.map((c) => el("th", {}, c)), el("th", { style: { width: "30px" } }, ""));
    table.append(el("thead", {}, thead));
    const tbody = el("tbody", {});
    rows.forEach((r) => tbody.append(rowEl(r)));
    table.append(tbody); tableWrap.append(table); tableWrap._tbody = tbody;
  }
  function rowEl(cells) {
    const tr = el("tr", {}, ...head.map((_, i) => el("td", { contenteditable: "true" }, cells[i] || "")),
      el("td", {}, el("button", { class: "linkbtn", onClick: (e) => e.target.closest("tr").remove(), title: "delete" }, "✕")));
    return tr;
  }
  function addRow() { if (!head.length) return toast("Extract first"); tableWrap._tbody.append(rowEl([])); }
  function exportCsv() {
    if (!head.length) return toast("Nothing to export");
    const rows = [...tableWrap._tbody.querySelectorAll("tr")].map((tr) => [...tr.querySelectorAll("td")].slice(0, head.length).map((td) => `"${td.textContent.replace(/"/g, '""')}"`).join(","));
    downloadText("extract.csv", [head.map((h) => `"${h}"`).join(","), ...rows].join("\n"), "text/csv");
  }
  async function run() {
    runBtn.disabled = true; runBtn.innerHTML = spinner() + " Extracting…"; flags.innerHTML = "";
    try {
      const d = await callTool(tool.id, { raw: raw.value });
      const t = parseTable(d.output);
      if (t) { buildTable(t.head, t.rows); const rest = d.output.split("\n").filter((l) => /flag/i.test(l)).join(" "); flags.innerHTML = rest ? "<b>Flags:</b> " + rest.replace(/.*flags?:?/i, "") : ""; }
      else { empty.style.display = "none"; tableWrap.innerHTML = '<div class="out-body">' + mdToHtml(d.output) + "</div>"; head = []; }
      document.getElementById("emodel").textContent = "model: " + d.model;
    } catch (e) { toast(e.message); } finally { runBtn.disabled = false; runBtn.textContent = tool.run || "Extract"; }
  }
  runBtn.onclick = run;
  mount.append(el("div", { class: "grid2" }, left, right));
}
