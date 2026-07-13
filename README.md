# Workforce Reinvention — Demo Suite

A small suite of self-contained web demos that show, at task level, where AI and automation
can reshape core HR processes — using a **five-workforce model** (Agentic AI, RPA / Automation,
Generative AI, Augmented Human, Human).

> **All data in this repository is synthetic and illustrative.** The figures are directional
> estimates built to frame a conversation, not a validated business case. No real company,
> person or proprietary system is referenced.

## Pages

| Page | File | What it shows |
|---|---|---|
| Landing page | [`index.html`](index.html) | Overview of the suite + how to read it |
| Workforce Navigator — Dashboard | [`workforce-navigator-dashboard.html`](workforce-navigator-dashboard.html) | Task inventory across four HR processes, workforce mix, automation potential, skills shift |
| Process Improvement Explorer | [`process-improvement-explorer.html`](process-improvement-explorer.html) | Interactive process maps with a current-vs-improved automation layer (map / list / priority matrix / by-role) |

## Running it

Every page is a single HTML file with **no build step and no network dependencies** — open any
of them directly in a browser, or serve the folder statically.

```
# any static server, e.g.
python3 -m http.server 8000
# then open http://localhost:8000
```

## Technical notes

- Vanilla HTML / CSS / JS only — no frameworks, no CDNs, works offline.
- All charts and process maps are drawn in inline SVG / CSS.
- Responsive, keyboard-navigable, and print-friendly.

## Publishing on GitHub Pages

1. Push this repo to a public GitHub repository.
2. Go to **Settings → Pages**.
3. Under **Source**, select branch `main` and folder `/ (root)`, then **Save**.
4. The suite will be live at `https://<user>.github.io/<repo>/`.
