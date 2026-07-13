// Translation Workspace — one source, many target languages side by side.
import { el, callTool, copyText, toast, spinner } from "./_common.js";

const LANGS = ["Dutch", "French", "German", "Polish", "Spanish", "Italian"];

export function render(mount, ctx) {
  const { tool } = ctx;
  const textInput = tool.inputs.find((i) => i.id === "text") || tool.inputs[0];
  const langInput = tool.inputs.find((i) => i.id === "lang");
  const defaultLang = (langInput && langInput.demo) || "Dutch";
  const selected = new Set([defaultLang]);

  const src = el("textarea", { class: "editable", style: { minHeight: "180px" } }, textInput.demo || "");
  const glossary = el("input", { type: "text", placeholder: "e.g. keep “staff discount” as is" });
  const chips = el("div", { class: "chips" });
  LANGS.forEach((L) => {
    const c = el("span", { class: "chip" + (selected.has(L) ? " on" : ""), onClick: () => { if (selected.has(L)) selected.delete(L); else selected.add(L); c.classList.toggle("on"); } }, L);
    chips.append(c);
  });
  const runBtn = el("button", { class: "btn primary" }, "Translate");
  const left = el("div", { class: "pane sticky" },
    el("h3", {}, "Translation Workspace"),
    el("p", { class: "psub" }, "Translate the source into several languages at once, with a shared glossary."),
    el("div", { class: "field" }, el("label", {}, textInput.label), src),
    el("div", { class: "field" }, el("label", {}, "Glossary (optional)"), glossary),
    el("div", { class: "field" }, el("label", {}, "Target languages"), chips),
    el("div", { class: "row" }, runBtn));

  const grid = el("div", { class: "cardgrid" });
  const right = el("div", { class: "pane" },
    el("div", { class: "row" }, el("h3", { style: { margin: 0 } }, "Translations"),
      el("span", { class: "grow" }),
      el("button", { class: "btn small", onClick: copyAll }, "Copy all")),
    el("div", { class: "result empty", id: "tempty" }, "Pick languages and hit Translate."),
    grid);

  const results = {};
  function copyAll() {
    const t = Object.entries(results).map(([l, v]) => `[${l}]\n${v}`).join("\n\n");
    if (t) copyText(t); else toast("Nothing to copy yet");
  }
  async function run() {
    const langs = [...selected];
    if (!langs.length) return toast("Select at least one language");
    document.getElementById("tempty").style.display = "none";
    runBtn.disabled = true; runBtn.innerHTML = spinner() + " Translating…"; grid.innerHTML = "";
    const gl = glossary.value.trim() ? `Glossary / do-not-translate: ${glossary.value.trim()}.` : "";
    for (const L of langs) {
      const card = el("div", { class: "minicard" }, el("h5", {}, L, el("span", { class: "muted" }, spinner())),
        el("div", { class: "muted", style: { fontSize: "12.5px" } }, "…"));
      grid.append(card);
      try {
        const d = await callTool(tool.id, { text: src.value, lang: L }, gl);
        results[L] = d.output;
        card.innerHTML = "";
        card.append(el("h5", {}, L, el("button", { class: "btn small", onClick: () => copyText(d.output) }, "Copy")),
          el("div", { style: { fontSize: "13px", whiteSpace: "pre-wrap" } }, d.output));
      } catch (e) {
        card.innerHTML = ""; card.append(el("h5", {}, L), el("div", { class: "errbox" }, e.message));
      }
    }
    runBtn.disabled = false; runBtn.textContent = "Translate";
  }
  runBtn.onclick = run;
  mount.append(el("div", { class: "grid2" }, left, right));
}
