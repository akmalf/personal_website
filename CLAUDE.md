# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Akmal Fadhlurrahman's personal site (akml.dev), built on the **astro-erudite** template (Astro 7, no UI/CSS framework, native CSS only). Static output, deployed to Cloudflare as a Worker.

## Commands

```bash
bun run dev              # astro dev, http://localhost:4321
bun run build             # astro build -> dist/
bun run preview           # build, then `wrangler dev` against the build
bun run deploy            # build, then `wrangler deploy`
bun run format             # biome format --write .
bun run format:check
bun run generate-types    # wrangler types -> worker-configuration.d.ts
```

There is no test suite and no lint script beyond Biome formatting.

## Deployment (Cloudflare Workers, not Pages)

This project deploys as a Cloudflare **Worker** with static assets (`wrangler.jsonc`, `assets.directory: ./dist`), not a classic Pages project — the dashboard's Workers Builds git integration builds and runs `wrangler versions upload` on every push to `main`. This matters because it pulls in `@astrojs/cloudflare` as an Astro adapter even though the site has zero server-rendered routes; the adapter is only present for the Workers-shaped build/deploy pipeline, not for SSR.

Two non-obvious settings in `astro.config.ts`'s `cloudflare()` adapter call exist specifically to counteract adapter defaults that don't suit a static site:
- `imageService: "compile"` — without this, the adapter routes `astro:assets` images through a runtime `/_image` endpoint backed by Cloudflare Images, which doesn't exist in static output and 404s in production. `"compile"` restores normal build-time Sharp optimization.
- `prerenderEnvironment: "node"` — the adapter prerenders static routes inside a workerd sandbox by default. The OG-image endpoint (see below) needs real `fs` and a native addon (`resvg`), neither of which work in workerd, so prerendering is forced back to plain Node.

`wrangler.jsonc` needs `"nodejs_compat"` in `compatibility_flags` — without it, `astro dev` 500s on every route with `process is not defined`, because the dev server also runs through workerd and Astro's own logger touches `process`.

`astro.config.ts`'s `site` field must stay `https://akml.dev` — it's the base for canonical URLs, the sitemap, RSS, and `og:image`. If it ever drifts (e.g. back to the template's original `astro-erudite.vercel.app`), social previews silently break because crawlers try to fetch OG images from a domain that isn't this one.

## Content collections (`src/content.config.ts`)

Three collections, all Markdown via the `glob` loader: `blog`, `authors`, `projects`. Full field-by-field schema and authoring guide is in `README.md` ("Adding content") — read that before adding/editing content rather than re-deriving it from the Zod schema.

The one thing not in the README: **subposts**. A blog post becomes a series by nesting sibling `.md` files next to its `index.md` (one level of nesting only; id = `parent-slug/subpost-slug`, detected via `isSubpost()` in `src/lib/utils.ts` checking for a `/` in the id). `src/pages/blog/[...id].astro` renders the whole chain as one continuously-scrollable page — every subpost gets its own route, but visiting any of them renders all of them in order, and `src/components/SeriesReader.astro` client-side syncs the URL/tab title/breadcrumb to whichever subpost is currently scrolled into view (`history.replaceState`, not real navigation). It also dispatches a `subpost-change` CustomEvent that `TableOfContents.astro` listens for to keep the mobile TOC title in sync — if you touch the "which subpost am I reading" logic, both of those need to stay wired together.

## OG image generation (`src/lib/og-image.ts`, `src/pages/og/[...id].png.ts`)

Posts without a custom `image` in frontmatter get an auto-generated 1200x630 PNG (logo mark, title, "akml.dev") instead of a generic placeholder. Built with `satori` (JSX-like tree -> SVG) + `@resvg/resvg-js` (SVG -> PNG) at build time, one static file per imageless post. The logo mark isn't embedded as an image — it's reconstructed as absolutely-positioned `div`s by parsing the `<rect>` elements straight out of `src/assets/logo.svg`, so it stays in sync if the logo ever changes. Fonts must be TTF/OTF (satori doesn't read WOFF2); `src/assets/fonts/og/` holds TTF conversions of the two Goldman Sans weights used, separate from the WOFF2s in `src/assets/fonts/` that the site itself uses. Font/logo files are read via `process.cwd()`-relative paths, not `import.meta.url` — Vite relocates this module when bundling for prerender, so relative-to-module resolution silently fails to find the files.

## Rendering pipeline

Markdown goes through **Sätteri** (`@astrojs/markdown-satteri`), a Rust-based processor, with a custom set of mdast/hast plugins wired up in `astro.config.ts` and implemented in `src/lib/`: `callout.ts` (`:::note`-style directives), `math.ts` (Temml, LaTeX -> MathML), `heading-namespace.ts` / `heading-anchors.ts` (per-article-scoped heading IDs so subposts on the same page don't collide, plus clickable anchors), `external-links.ts`. Code blocks use Expressive Code (`src/lib/expressive-code/`) rather than Sätteri's own highlighting.

## CSS architecture

No CSS framework. `src/styles/` is a set of hand-written token/utility files loaded globally: `color.css` defines a Radix-style gray scale with `light-dark()` pairs, and semantic tokens (`--background`, `--foreground`, `--muted-foreground`, `--border`, etc.) point at scale steps rather than raw colors — the theme toggle only needs to flip a `data-theme` attribute, everything else follows `light-dark()` / `prefers-color-scheme` automatically. Spacing/type scale is fluid (Utopia-style clamp()). `bar.css` defines the `[data-bar]` attribute used on mobile sticky header elements (translucent `background-color` + `backdrop-filter: blur`) — any element that should look like part of the frosted mobile header bar needs this attribute, or page content bleeds through behind it (this has bitten this codebase before: adding a new bar-row element without `data-bar` renders it fully transparent).

Layout is `page-grid` / `page-header` / `page-nav` / `page-toc` / `page-content`, defined in `src/layouts/Layout.astro`, using autonomous custom elements as CSS hooks rather than classes.

## Testing UI changes locally

`astro dev` can be unreliable in this environment (see the workerd/`nodejs_compat` note above — if it ever regresses, check that flag first). When it's not viable, `bun run build` + serving `dist/client` with any static file server is a faithful substitute for anything that doesn't need live reload, since the site has no server-rendered routes.
