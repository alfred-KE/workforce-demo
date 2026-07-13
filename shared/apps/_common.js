// Shared helpers for the tool apps (browser only). Design-system classes live in tool.html.

export const esc = (s) =>
  String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// tiny DOM builder: el("div",{class:"x",onClick:fn}, child, [children])
export function el(tag, attrs, ...kids) {
  const e = document.createElement(tag);
  if (attrs) for (const k in attrs) {
    const v = attrs[k];
    if (v == null || v === false) continue;
    if (k === "class") e.className = v;
    else if (k === "html") e.innerHTML = v;
    else if (k === "style" && typeof v === "object") Object.assign(e.style, v);
    else if (k.startsWith("on") && typeof v === "function") e.addEventListener(k.slice(2).toLowerCase(), v);
    else if (v === true) e.setAttribute(k, "");
    else e.setAttribute(k, v);
  }
  kids.flat().forEach((c) => { if (c == null || c === false) return; e.append(c.nodeType ? c : document.createTextNode(String(c))); });
  return e;
}

// call our serverless AI endpoint; returns {output} or throws Error(message)
export async function callTool(id, inputs, extra) {
  let ok = false;
  try {
    const r = await fetch("/api/tool", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, inputs, extra }),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error || "The tool couldn't run just now.");
    ok = true;
    return d;
  } finally {
    // let embedders (e.g. the showcase auto-player) know a run finished
    try { window.dispatchEvent(new CustomEvent("tool:result", { detail: { ok } })); } catch (_) {}
  }
}

export function copyText(t) {
  (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => toast("Copied to clipboard")).catch(() => toast("Copy failed"));
}
export function downloadText(name, text, mime = "text/plain") {
  const b = new Blob([text], { type: mime });
  const a = el("a", { href: URL.createObjectURL(b), download: name });
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
let toastT;
export function toast(msg) {
  let t = document.getElementById("toast");
  if (!t) { t = el("div", { id: "toast", class: "toast" }); document.body.appendChild(t); }
  t.textContent = msg; t.classList.add("on");
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("on"), 1800);
}
export const spinner = () => '<span class="spin"></span>';

// minimal markdown -> html (bold/italic/code, headings, bullets, pipe tables)
export function mdToHtml(md) {
  const lines = String(md).replace(/\r/g, "").split("\n");
  const inl = (s) => esc(s).replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>").replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, "$1<i>$2</i>").replace(/`([^`]+)`/g, "<code>$1</code>");
  let html = "", i = 0, inList = false;
  const closeList = () => { if (inList) { html += "</ul>"; inList = false; } };
  while (i < lines.length) {
    const ln = lines[i];
    if (/\|/.test(ln) && i + 1 < lines.length && /^\s*\|?[\s:|-]+\|?\s*$/.test(lines[i + 1]) && /-/.test(lines[i + 1])) {
      closeList();
      const cells = (r) => r.split("|").map((c) => c.trim()).filter((c, idx, a) => !(idx === 0 && c === "") && !(idx === a.length - 1 && c === ""));
      const head = cells(ln); i += 2; const rows = [];
      while (i < lines.length && /\|/.test(lines[i])) { rows.push(cells(lines[i])); i++; }
      html += "<table><thead><tr>" + head.map((h) => `<th>${inl(h)}</th>`).join("") + "</tr></thead><tbody>" +
        rows.map((r) => "<tr>" + r.map((c) => `<td>${inl(c)}</td>`).join("") + "</tr>").join("") + "</tbody></table>";
      continue;
    }
    const h = ln.match(/^\s*(#{1,4})\s+(.*)$/);
    if (h) { closeList(); html += `<h4>${inl(h[2])}</h4>`; i++; continue; }
    const li = ln.match(/^\s*[-*•]\s+(.*)$/);
    if (li) { if (!inList) { html += "<ul>"; inList = true; } html += `<li>${inl(li[1])}</li>`; i++; continue; }
    if (ln.trim() === "") { closeList(); i++; continue; }
    closeList(); html += `<p>${inl(ln)}</p>`; i++;
  }
  closeList(); return html;
}

// parse the first pipe-table found in markdown into {head:[], rows:[[]]} (for editable data grids)
export function parseTable(md) {
  const lines = String(md).replace(/\r/g, "").split("\n");
  const cells = (r) => r.split("|").map((c) => c.trim()).filter((c, idx, a) => !(idx === 0 && c === "") && !(idx === a.length - 1 && c === ""));
  for (let i = 0; i < lines.length - 1; i++) {
    if (/\|/.test(lines[i]) && /^\s*\|?[\s:|-]+\|?\s*$/.test(lines[i + 1]) && /-/.test(lines[i + 1])) {
      const head = cells(lines[i]); const rows = []; let j = i + 2;
      while (j < lines.length && /\|/.test(lines[j])) { rows.push(cells(lines[j])); j++; }
      return { head, rows };
    }
  }
  return null;
}
