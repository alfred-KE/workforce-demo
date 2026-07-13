// Message Composer — draft, edit and "send" an internal message.
import { el, callTool, copyText, toast, spinner } from "./_common.js";

export function render(mount, ctx) {
  const { tool } = ctx;
  const ctxInput = tool.inputs.find((i) => i.id === "context") || tool.inputs[0];
  const recInput = tool.inputs.find((i) => i.id === "recipients") || tool.inputs[1];
  const state = { tone: "Friendly", channel: "Email" };

  const ctxEl = el("textarea", { class: "editable", style: { minHeight: "120px" } }, ctxInput.demo || "");
  const recEl = el("input", { type: "text", value: recInput ? recInput.demo || "" : "" });
  const chipRow = (label, opts, key) => {
    const chips = el("div", { class: "chips" });
    opts.forEach((o) => { const c = el("span", { class: "chip" + (state[key] === o ? " on" : ""), onClick: () => { state[key] = o; chips.querySelectorAll(".chip").forEach((x) => x.classList.remove("on")); c.classList.add("on"); } }, o); chips.append(c); });
    return el("div", { class: "field" }, el("label", {}, label), chips);
  };
  const runBtn = el("button", { class: "btn primary" }, tool.run || "Draft message");
  const left = el("div", { class: "pane sticky" },
    el("h3", {}, "Message Composer"),
    el("p", { class: "psub" }, "Draft the right message to the right people, edit it, then send."),
    el("div", { class: "field" }, el("label", {}, ctxInput.label), ctxEl),
    el("div", { class: "field" }, el("label", {}, recInput ? recInput.label : "Recipients"), recEl),
    chipRow("Tone", ["Neutral", "Friendly", "Formal"], "tone"),
    chipRow("Channel", ["Email", "Chat"], "channel"),
    el("div", { class: "row" }, runBtn));

  const subj = el("input", { type: "text", placeholder: "Subject" });
  const bodyEl = el("textarea", { class: "editable", style: { minHeight: "230px" } });
  const sent = el("div", {});
  const empty = el("div", { class: "result empty", id: "nempty" }, "Draft a message to edit and send.");
  const subjRow = el("div", { class: "field" }, el("label", {}, "Subject"), subj);
  subjRow.style.display = "none"; bodyEl.style.display = "none";
  const right = el("div", { class: "pane" },
    el("div", { class: "toolbar" }, el("h3", { style: { margin: 0 } }, "Message"), el("span", { class: "grow" }),
      el("button", { class: "btn small", onClick: () => copyText((subj.value ? "Subject: " + subj.value + "\n\n" : "") + bodyEl.value) }, "Copy"),
      el("button", { class: "btn small primary", onClick: send }, "Send")),
    empty, subjRow, bodyEl, sent);

  function send() {
    if (!bodyEl.value.trim()) return toast("Draft a message first");
    sent.innerHTML = "";
    sent.append(el("div", { class: "verdict pass", style: { marginTop: "12px" } },
      `✓ Sent via ${state.channel} to ${recEl.value || "recipients"} · ${new Date().toLocaleTimeString()} (demo)`));
    toast("Message sent (demo)");
  }
  async function run() {
    runBtn.disabled = true; runBtn.innerHTML = spinner() + " Drafting…"; sent.innerHTML = "";
    try {
      const d = await callTool(tool.id, { context: ctxEl.value, recipients: recEl.value }, `Tone: ${state.tone}. Channel: ${state.channel}.`);
      let out = d.output; const m = out.match(/subject:\s*(.*)/i);
      subj.value = m ? m[1].trim() : ""; if (m) out = out.replace(m[0], "").trim();
      empty.style.display = "none"; subjRow.style.display = "block"; bodyEl.style.display = "block"; bodyEl.value = out;
    } catch (e) { toast(e.message); } finally { runBtn.disabled = false; runBtn.textContent = tool.run || "Draft message"; }
  }
  runBtn.onclick = run;
  mount.append(el("div", { class: "grid2" }, left, right));
}
