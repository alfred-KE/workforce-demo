// Revision Editor — merge feedback into a draft, with before/after.
import { el, callTool, copyText, toast, spinner } from "./_common.js";

export function render(mount, ctx) {
  const { tool } = ctx;
  const draftInput = tool.inputs.find((i) => i.id === "draft") || tool.inputs[0];
  const fbInput = tool.inputs.find((i) => i.id === "feedback") || tool.inputs[1];

  const draft = el("textarea", { class: "editable", style: { minHeight: "150px" } }, draftInput.demo || "");
  const fb = el("textarea", { class: "editable", style: { minHeight: "110px" } }, fbInput.demo || "");
  const runBtn = el("button", { class: "btn primary" }, tool.run || "Apply feedback");
  const left = el("div", { class: "pane sticky" },
    el("h3", {}, "Revision Editor"),
    el("p", { class: "psub" }, "Fold reviewer feedback into the draft and see exactly what changed."),
    el("div", { class: "field" }, el("label", {}, draftInput.label), draft),
    el("div", { class: "field" }, el("label", {}, fbInput.label), fb),
    el("div", { class: "row" }, runBtn));

  let showOriginal = false, revised = "";
  const changesNote = el("div", { class: "muted", style: { marginBottom: "10px", fontSize: "12.5px" } });
  const body = el("textarea", { class: "editable", style: { minHeight: "300px" } });
  const toggle = el("button", { class: "btn small" }, "Show original");
  toggle.onclick = () => { showOriginal = !showOriginal; toggle.textContent = showOriginal ? "Show revised" : "Show original"; body.value = showOriginal ? draft.value : revised; body.readOnly = showOriginal; };
  const right = el("div", { class: "pane" },
    el("div", { class: "toolbar" }, el("h3", { style: { margin: 0 } }, "Result"), el("span", { class: "grow" }),
      toggle,
      el("button", { class: "btn small", onClick: () => copyText(body.value) }, "Copy")),
    changesNote,
    el("div", { class: "result empty", id: "rempty" }, "Apply the feedback to see the revision."),
    body);
  body.style.display = "none";

  async function run() {
    runBtn.disabled = true; runBtn.innerHTML = spinner() + " Applying…";
    try {
      const d = await callTool(tool.id, { draft: draft.value, feedback: fb.value });
      let out = d.output, note = "";
      const m = out.match(/>\s*Changes?:\s*(.*)$/im);
      if (m) { note = m[1].trim(); out = out.replace(m[0], "").trim(); }
      revised = out; showOriginal = false; toggle.textContent = "Show original"; body.readOnly = false;
      document.getElementById("rempty").style.display = "none";
      body.style.display = "block"; body.value = revised;
      changesNote.innerHTML = note ? "<b>What changed:</b> " + note : "";
    } catch (e) { toast(e.message); } finally { runBtn.disabled = false; runBtn.textContent = tool.run || "Apply feedback"; }
  }
  runBtn.onclick = run;
  mount.append(el("div", { class: "grid2" }, left, right));
}
