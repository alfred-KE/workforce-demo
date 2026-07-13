// Multi-channel Publisher — post the approved vacancy everywhere and watch it go live (step req11).
import { el, callTool, toast, spinner } from "./_common.js";

export function render(mount, ctx) {
  const chans = ["Careers site", "Job board A", "Job board B", "Internal board"];
  const sel = new Set(["Careers site", "Job board A", "Job board B"]);
  const what = el("textarea", { class: "editable", style: { minHeight: "150px" } }, ctx.tool.inputs[0]?.demo || "");
  const box = el("div", { class: "chips" });
  chans.forEach((c) => { const x = el("span", { class: "chip" + (sel.has(c) ? " on" : ""), onClick: () => { sel.has(c) ? sel.delete(c) : sel.add(c); x.classList.toggle("on"); } }, c); box.append(x); });
  const runBtn = el("button", { class: "btn primary" }, "Publish vacancy");
  const left = el("div", { class: "pane sticky" },
    el("h3", {}, "Multi-channel Publisher"),
    el("p", { class: "psub" }, "Post the approved vacancy to every channel at once, and watch each one go live."),
    el("div", { class: "field" }, el("label", {}, "What to publish"), what),
    el("div", { class: "field" }, el("label", {}, "Channels"), box),
    el("div", { class: "row" }, runBtn));

  const banner = el("div", {});
  const cards = el("div", { class: "cardgrid" });
  const empty = el("div", { class: "result empty", id: "pubEmpty" }, "Publish to see each channel go live.");
  const right = el("div", { class: "pane" }, el("h3", {}, "Publishing"), banner, empty, cards);

  async function run() {
    const list = [...sel]; if (!list.length) return toast("Pick at least one channel");
    runBtn.disabled = true; runBtn.innerHTML = spinner() + " Publishing…"; cards.innerHTML = ""; banner.innerHTML = ""; empty.style.display = "none";
    const map = {};
    list.forEach((c) => { const card = el("div", { class: "minicard" }, el("h5", {}, c, el("span", { class: "muted" }, spinner())), el("div", { class: "muted", style: { fontSize: "12px" } }, "Publishing…")); map[c] = card; cards.append(card); });
    let summary = "";
    try { const d = await callTool(ctx.step.id, { task: what.value }, "Return a single 1-2 line confirmation that the vacancy was posted across the channels."); summary = d.output; } catch (_) {}
    list.forEach((c, i) => setTimeout(() => {
      map[c].innerHTML = "";
      map[c].append(el("h5", {}, c, el("span", { style: { color: "#16a34a", fontWeight: "800" } }, "● Live")),
        el("div", { class: "muted", style: { fontSize: "11.5px" } }, "northwind.example/careers/" + Math.floor(1000 + Math.random() * 9000)));
      if (i === list.length - 1) {
        banner.append(el("div", { class: "verdict pass" }, "✓ Live on " + list.length + " channel" + (list.length !== 1 ? "s" : "")));
        if (summary) banner.append(el("div", { class: "muted", style: { fontSize: "12.5px", marginTop: "8px" } }, summary));
        runBtn.disabled = false; runBtn.textContent = "Publish vacancy";
      }
    }, 550 * (i + 1)));
  }
  runBtn.onclick = run;
  mount.append(el("div", { class: "grid2" }, left, right));
}
