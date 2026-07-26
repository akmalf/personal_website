---
name: run
description: Launch and drive akml.dev (Astro static site on Cloudflare Workers) to visually verify a change, including mobile-viewport screenshots via Playwright.
---

This is a fully static Astro site (no server-rendered routes, no API to hit) — "running" it means rendering pages in a real browser, most often at a mobile viewport, since most UI work here targets the mobile sticky header / TOC.

## Preferred: dev server

```bash
bun run dev
```

Serves at `http://localhost:4321` with live reload. Poll instead of sleeping:

```bash
until curl -sf http://localhost:4321 >/dev/null; do sleep 1; done
```

**Known failure mode:** every route 500s with `process is not defined` in the response body. This means `wrangler.jsonc`'s `compatibility_flags` lost `"nodejs_compat"` (the Cloudflare adapter's dev server runs through workerd, which needs that flag to polyfill Node builtins Astro's own logger touches). Check that flag first before debugging further; see `CLAUDE.md` for the full explanation.

## Fallback: static build + plain file server

If the dev server is unavailable or you specifically want to verify what the actual `dist/` build produces (e.g. checking that images/OG endpoints resolved correctly, not just dev's on-demand transforms):

```bash
rm -rf dist .astro && bun run build
cd dist/client && python3 -m http.server 8123 &
```

Kill it after: `lsof -ti:8123 -sTCP:LISTEN | xargs -r kill`.

## Screenshotting (mobile viewport)

No `chromium-cli` in this environment historically — use `playwright` directly. It's not a project dependency (would bloat the site's own `node_modules` unnecessarily), so install it into the scratchpad directory instead of the repo:

```bash
cd /path/to/scratchpad
npm install playwright --no-save --silent
npx --yes playwright install chromium --with-deps   # first time only
```

Then drive it with a throwaway `.mjs` script in that same scratchpad directory (must run from there so its local `node_modules/playwright` resolves):

```js
import { chromium } from "playwright"
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
await page.goto("http://localhost:8123/blog/introducing-v2/", { waitUntil: "networkidle" })
await page.evaluate(() => window.scrollTo(0, 800))
await page.waitForTimeout(300)
await page.screenshot({ path: "out.png" })
await browser.close()
```

The breakpoint for mobile-vs-desktop layout throughout this codebase is `64rem` (1024px) — anything narrower than that in the viewport triggers the mobile CSS paths.

## Diagnosing pixel-level alignment issues

Don't guess offsets from a full-page screenshot — measure. Two techniques, both via `page.evaluate()` in a throwaway script (same scratchpad setup as above):

- **Comparing rendered position of two elements** (e.g. "is this icon sitting lower than that one"): `element.getBoundingClientRect()` on both and diff the numbers. If two elements report identical `top`/`bottom`/`height`, the problem isn't a CSS box/positioning bug — it's something about the visible content within an identical box (e.g. an SVG's internal ink not filling its own viewBox evenly), which no amount of margin/padding tweaking on the wrapper will fix.
- **Checking whether an SVG's declared viewBox matches its actual content**: load the raw SVG in a blank page (`page.setContent`) and call `svgElement.getBBox()`, then compare against the `viewBox` attribute. A mismatch (bbox much smaller than viewBox, or off-center within it) means the source file has baked-in padding — see the CLAUDE.md note on third-party logo SVGs for a live example (Visa's Simple Icons export was only 32% ink within its declared square).

For fine alignment work specifically, a tight `clip` screenshot at `deviceScaleFactor: 3` around just the element in question (using its `boundingBox()` as the clip origin) shows sub-pixel issues that a normal full-viewport screenshot won't.

## What to check on a TOC/mobile-header change specifically

This area has a recurring failure mode: an element in the sticky mobile header rendering without the `[data-bar]` attribute (see `src/styles/bar.css`), which makes it fully transparent so page content bleeds through behind it as you scroll. After any change here, screenshot at least two scroll positions — top of page, and scrolled a few hundred px into body content — and check for text/images showing through the header bar that shouldn't be there.

If the post has subposts (e.g. `/blog/v1-posts/`), also verify scrolling from the parent into an embedded subpost updates the TOC title live, and that loading a subpost's own URL directly (e.g. `/blog/v1-posts/mobile-nav-and-subposts/`) shows the right title from initial load, not just after a scroll event fires.
