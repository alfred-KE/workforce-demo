// Document Studio — generate, edit and refine a business document.
import { el, callTool, copyText, downloadText, toast, spinner } from "./_common.js";

export function render(mount, ctx) {
  const { tool } = ctx;
  const state = { tone: "Friendly", length: "Medium", format: "Advert" };
  const fields = {};

  const left = el("div", { class: "pane sticky" },
    el("h3", {}, "Document Studio"),
    el("p", { class: "psub" }, "A short brief in — a ready-to-use draft out. Steer tone, length and format."));
  tool.inputs.forEach((inp) => {
    const ctl = inp.type === "textarea" ? el("textarea", {}, inp.demo || "") : el("input", { type: "text", value: inp.demo || "" });
    fields[inp.id] = ctl;
    left.append(el("div", { class: "field" }, el("label", {}, inp.label), ctl));
  });
  const chipRow = (label, opts, key) => {
    const chips = el("div", { class: "chips" });
    opts.forEach((o) => {
      const c = el("span", { class: "chip" + (state[key] === o ? " on" : ""), onClick: () => { state[key] = o; chips.querySelectorAll(".chip").forEach((x) => x.classList.remove("on")); c.classList.add("on"); } }, o);
      chips.append(c);
    });
    return el("div", { class: "field" }, el("label", {}, label), chips);
  };
  left.append(chipRow("Tone", ["Neutral", "Friendly", "Formal", "Energetic"], "tone"));
  left.append(chipRow("Length", ["Short", "Medium", "Long"], "length"));
  left.append(chipRow("Format", ["Advert", "Bulleted", "Formal doc"], "format"));
  const genBtn = el("button", { class: "btn primary" }, tool.run);
  const varBtn = el("button", { class: "btn ghost" }, "Variations ×3");
  const resetBtn = el("button", { class: "linkbtn" }, "Reset to demo");
  left.append(el("div", { class: "row" }, genBtn, varBtn, resetBtn));

  const ta = el("textarea", { class: "editable", style: { minHeight: "340px" } });
  const wc = el("span", { class: "muted" }, "0 words");
  const updateWc = () => { const n = ta.value.trim() ? ta.value.trim().split(/\s+/).length : 0; wc.textContent = n + " words"; };
  ta.addEventListener("input", updateWc);
  const bar = el("div", { class: "toolbar" },
    el("button", { class: "btn small", onClick: () => copyText(ta.value) }, "Copy"),
    el("button", { class: "btn small", onClick: () => downloadText("draft.txt", ta.value) }, "Download"),
    el("button", { class: "btn small", onClick: () => gen() }, "Regenerate"),
    el("button", { class: "btn small", onClick: () => tweak("Make it about 30% shorter, keep the essentials.") }, "Shorter"),
    el("button", { class: "btn small", onClick: () => tweak("Expand it by ~30% with more concrete detail.") }, "Longer"),
    el("button", { class: "btn small", onClick: () => tweak("Make the tone noticeably more formal.") }, "More formal"),
    el("span", { class: "grow" }));
  const variants = el("div", {});
  const right = el("div", { class: "pane" },
    el("div", { class: "row" }, el("h3", { style: { margin: 0 } }, "Draft"), el("span", { class: "grow" }), wc),
    bar, ta, variants);

  const inputs = () => { const o = {}; tool.inputs.forEach((i) => (o[i.id] = fields[i.id].value)); return o; };
  const extra = () => `Tone: ${state.tone}. Length: ${state.length}. Format: ${state.format}. Return only the document text, no preamble or sign-off.`;

  async function gen() {
    genBtn.disabled = true; genBtn.innerHTML = spinner() + " Generating…"; variants.innerHTML = "";
    try { const d = await callTool(tool.id, inputs(), extra()); ta.value = d.output; updateWc(); }
    catch (e) { toast(e.message); } finally { genBtn.disabled = false; genBtn.textContent = tool.run; }
  }
  async function tweak(instr) {
    if (!ta.value.trim()) return gen();
    const prev = ta.value; ta.value = ""; ta.placeholder = "Revising…";
    try { const d = await callTool(tool.id, inputs(), `Current draft:\n${prev}\n\n${instr} Return only the revised document text.`); ta.value = d.output; updateWc(); }
    catch (e) { ta.value = prev; toast(e.message); }
  }
  async function makeVariants() {
    varBtn.disabled = true; varBtn.innerHTML = spinner() + " …"; variants.innerHTML = "";
    try {
      const outs = await Promise.all([0, 1, 2].map((i) =>
        callTool(tool.id, inputs(), extra() + ` Variant ${i + 1} of 3 — make it distinct from the others.`).then((d) => d.output)));
      const grid = el("div", { class: "cardgrid", style: { marginTop: "12px" } });
      outs.forEach((o, i) => {
        const card = el("div", { class: "minicard" },
          el("h5", {}, "Variant " + (i + 1), el("button", { class: "btn small", onClick: () => { ta.value = o; updateWc(); toast("Loaded variant " + (i + 1)); } }, "Use")),
          el("div", { class: "muted", style: { fontSize: "12px", maxHeight: "150px", overflow: "auto", whiteSpace: "pre-wrap" } }, o));
        grid.append(card);
      });
      variants.append(grid);
    } catch (e) { toast(e.message); } finally { varBtn.disabled = false; varBtn.textContent = "Variations ×3"; }
  }
  genBtn.onclick = gen; varBtn.onclick = makeVariants;
  resetBtn.onclick = () => tool.inputs.forEach((i) => (fields[i.id].value = i.demo || ""));
  mount.append(el("div", { class: "grid2" }, left, right));
}
