// Announcement Studio — compose, preview and "send" a stakeholder announcement (notify steps).
import { el, callTool, copyText, toast, spinner } from "./_common.js";

export function render(mount, ctx) {
  const ctxInput = ctx.tool.inputs.find((i) => i.id === "context") || ctx.tool.inputs[0];
  const recInput = ctx.tool.inputs.find((i) => i.id === "recipients");
  const state = { channel: "Email", tone: "Clear & friendly", urgency: "Normal" };

  const purpose = el("textarea", { class: "editable", style: { minHeight: "110px" } }, ctxInput.demo || "");
  const recips = el("input", { type: "text", value: recInput ? recInput.demo || "" : "" });
  const audience = el("div", { class: "chips" });
  ["+ Team leads", "+ Managers", "+ All staff", "+ Finance"].forEach((a) => audience.append(el("span", { class: "chip", onClick: () => { recips.value = (recips.value ? recips.value + ", " : "") + a.replace("+ ", ""); } }, a)));
  const chipRow = (opts, key) => { const c = el("div", { class: "chips" }); opts.forEach((o) => { const x = el("span", { class: "chip" + (state[key] === o ? " on" : ""), onClick: () => { state[key] = o; c.querySelectorAll(".chip").forEach((y) => y.classList.remove("on")); x.classList.add("on"); } }, o); c.append(x); }); return c; };
  const runBtn = el("button", { class: "btn primary" }, "Draft announcement");
  const left = el("div", { class: "pane sticky" },
    el("h3", {}, "Announcement Studio"),
    el("p", { class: "psub" }, "Say the right thing to the right people, on the right channel — then send."),
    el("div", { class: "field" }, el("label", {}, "What to announce"), purpose),
    el("div", { class: "field" }, el("label", {}, "Recipients"), recips, el("div", { style: { marginTop: "6px" } }, audience)),
    el("div", { class: "row" }, el("div", { style: { flex: 1 } }, el("div", { class: "field" }, el("label", {}, "Channel"), chipRow(["Email", "Chat", "Notice board"], "channel"))),
      el("div", { style: { flex: 1 } }, el("div", { class: "field" }, el("label", {}, "Urgency"), chipRow(["Normal", "Action needed", "FYI"], "urgency")))),
    el("div", { class: "field" }, el("label", {}, "Tone"), chipRow(["Clear & friendly", "Formal", "Brief"], "tone")),
    el("div", { class: "row" }, runBtn));

  const subj = el("input", { type: "text", placeholder: "Subject", style: { fontWeight: "700" } });
  const body = el("textarea", { class: "editable", style: { minHeight: "200px", border: "none", background: "transparent" } });
  const envelope = el("div", { style: { border: "1px solid var(--line)", borderRadius: "12px", overflow: "hidden" } });
  const sent = el("div", {});
  const empty = el("div", { class: "result empty", id: "asEmpty" }, "Draft an announcement to preview it.");
  envelope.style.display = "none";
  const toolbar = el("div", { class: "toolbar" }, el("h3", { style: { margin: 0 } }, "Preview"), el("span", { class: "grow" }),
    el("button", { class: "btn small", onClick: () => copyText((subj.value ? "Subject: " + subj.value + "\n\n" : "") + body.value) }, "Copy"),
    el("button", { class: "btn small primary", onClick: send } , "Send"));
  const right = el("div", { class: "pane" }, toolbar, empty, envelope, sent);

  function buildEnvelope() {
    envelope.innerHTML = ""; envelope.style.display = "block";
    envelope.append(
      el("div", { style: { background: "#f0f4f9", borderBottom: "1px solid var(--line)", padding: "10px 14px", fontSize: "12px" } },
        el("div", {}, el("b", {}, "From: "), "Northwind Retail — People team"),
        el("div", {}, el("b", {}, "To: "), recips.value || "recipients"),
        el("div", {}, el("b", {}, "Channel: "), state.channel + " · " + state.urgency)),
      el("div", { style: { padding: "12px 14px" } }, el("div", { class: "field", style: { margin: 0 } }, subj), body));
  }
  function send() {
    if (!body.value.trim()) return toast("Draft first");
    const n = (recips.value.split(",").filter((x) => x.trim()).length) || 1;
    sent.innerHTML = "";
    sent.append(el("div", { class: "verdict pass", style: { marginTop: "12px" } }, `✓ Sent via ${state.channel} to ${n} recipient group${n !== 1 ? "s" : ""} · ${new Date().toLocaleTimeString()} (demo)`));
    toast("Announcement sent (demo)");
  }
  async function run() {
    runBtn.disabled = true; runBtn.innerHTML = spinner() + " Drafting…"; sent.innerHTML = ""; empty.style.display = "none";
    try {
      const d = await callTool(ctx.step.id, { context: purpose.value, recipients: recips.value }, `Channel: ${state.channel}. Urgency: ${state.urgency}. Tone: ${state.tone}.`);
      let out = d.output; const m = out.match(/subject:\s*(.*)/i); subj.value = m ? m[1].trim() : ""; if (m) out = out.replace(m[0], "").trim();
      body.value = out; buildEnvelope();
    } catch (e) { toast(e.message); } finally { runBtn.disabled = false; runBtn.textContent = "Draft announcement"; }
  }
  runBtn.onclick = run;
  mount.append(el("div", { class: "grid2" }, left, right));
}
