# ADR-0001: Rework the AI Use Case Library into a navigable, multi-page site

**Status:** Accepted (implemented)
**Date:** 2026-07-05
**Deciders:** ds (site owner)

## Context

The site (aiinaction.vercel.app) started as a single long page: hero, one search/filter block with
seven flat dropdown selects, a card grid capped by a "load more" button, a RAG panel, and a footer.
All of it lived in one client component that fetched the entire `usecases.json` file — now 34 MB and
6,442 rows after the DoD FM v2.1 replacement and the two OMB 2025 inventories were added — in the
browser on every visit before anything could render.

Feedback on the live site: it's information-rich but overwhelming, hard to follow, hard to search,
and gives no way to get oriented or find a starting point ("inspiration") before diving into a wall
of cards. There was no navigation, no way to link to or bookmark a single use case, no dedicated place
for the papers, and no way to see the shape of the data (breakdowns by priority, risk, evidence type)
without manually paging through cards.

Two structural problems compounded the UX problem:

1. **Client-side data loading.** The entire catalog shipped to the browser as one JSON blob and was
   filtered in JavaScript after load. As the catalog grew 3.4x (1,891 → 6,442 rows), this only gets
   worse, and a use case has no stable URL — you can't share or bookmark row `UCDOD-FM-E001`.
2. **Single-page structure.** Home, search, papers, and Q&A were all sections on one scroll with no
   navigation, so returning users had no mental map of the site and no way to jump straight to what
   they wanted.

## Decision

Rebuild the site as a multi-page Next.js App Router application with server-rendered pages that
filter and paginate on the server, plus a light, formal navy/slate visual design in place of the
dark glass/gradient SaaS look. Structure:

- **Home (`/`)** — search-first hero, quick stats, four workbook category tiles, auto-curated
  "featured use cases," a papers spotlight, and a link into the insights dashboard. This is the
  index the feedback asked for: a map of the site before the wall of cards.
- **Browse (`/browse`)** — server-rendered faceted search. Filters (workbook, sector, mission area,
  domain, evidence type, priority, risk) are plain links with live counts, driven entirely by the
  URL query string, so every filtered view is a shareable/bookmarkable link and works without
  client-side JavaScript.
- **Use case detail (`/catalog/[id]`)** — one page per use case (6,442 statically generated pages),
  with the full field set, source link, and related use cases. This is what makes individual rows
  linkable, indexable, and shareable — impossible in the old single-page design.
- **Papers (`/papers`)** — a dedicated hub for the four strategy/adoption papers plus the RAG "ask"
  panel, instead of being one more section in an endless scroll.
- **Insights (`/insights`)** — a server-rendered breakdown (by workbook, priority, risk, evidence
  type, sector, mission area) so a visitor can see the shape of 6,442 rows in one screen instead of
  inferring it from paging through cards.

## Options considered

### Option A: Polish the single page in place

| Dimension | Assessment |
|-----------|------------|
| Complexity | Low |
| Effort | Low — new CSS, sticky nav, better filter layout |
| Fixes data-volume problem | No — still ships the full catalog to the client |
| Fixes linkability | No — no per-use-case URLs |
| Fixes "no index" complaint | Partially — better visual hierarchy, still one scroll |

**Pros:** Fast, low risk, no routing changes.
**Cons:** Doesn't address the two structural problems (client-side data volume, no linkable detail
pages) that are the real cause of "overwhelming, can't follow."

### Option B: Multi-page app with server-rendered browse + static detail pages (chosen)

| Dimension | Assessment |
|-----------|------------|
| Complexity | Medium — new routes, `lib/catalog.js` query/facet helpers, static generation for 6,442 pages |
| Effort | Medium-high |
| Fixes data-volume problem | Yes — server does the filtering; client never downloads the full JSON |
| Fixes linkability | Yes — every use case gets a real URL and is server-rendered |
| Fixes "no index" complaint | Yes — dedicated Home, Browse, Papers, Insights with real navigation |
| SEO / shareability | Much better — real per-page titles/descriptions, works without JS |

**Pros:** Directly fixes both structural problems, not just the visual one. Facet links and pagination
are plain `<a>` tags, so the whole browse experience degrades gracefully without JavaScript — good for
a formal/gov-facing tool where reliability matters more than SPA polish.
**Cons:** More surface area to build and maintain; static-generating 6,442 detail pages adds build
time (see Consequences).

### Option C: Move to a real database/API (Neon/Postgres) as the source of truth

| Dimension | Assessment |
|-----------|------------|
| Complexity | High |
| Effort | High — schema design, migration scripts, hosting cost |
| Fixes data-volume problem | Yes, and scales further than static JSON |
| Fixes linkability | Yes |

**Pros:** Would remove the 34 MB JSON import from the server bundle entirely and scale past tens of
thousands of rows.
**Cons:** The project already has an optional Neon/pgvector path for RAG only; making it required
infrastructure for basic browsing is a bigger lift than the problem currently justifies, and adds a
paid dependency for a small internal tool. Deferred — see Action Items.

**Decision:** Option B. It solves the two structural problems (data volume, linkability) without
introducing new infrastructure, and its output (real routes, plain links) matches the "formal,
government/enterprise" style direction — no client-heavy interaction model required to browse.

## Trade-off analysis

- **Static generation of 6,442 detail pages** trades build time for runtime simplicity: pages are
  plain static HTML, so there is no serverless function per use case and no client fetch on load.
  The cost shows up once, at `next build` time, not on every visitor's request.
- **Server-rendered facets over a client-side filter UI** trades a small amount of interactivity
  (no live-updating counts without a page navigation) for correctness and robustness: filters can
  never show stale or partial data because there's no separate client-side fetch/hydration step to
  get out of sync with the URL.
- **Keeping `usecases.json` as flat-file storage** (Option B) over a database (Option C) trades
  long-term scalability for zero added operational cost and no new secrets/hosting to manage, which
  matches the current scale (6,442 rows, expected to grow but not explode).

## Consequences

**Easier now:**
- Any use case can be linked, bookmarked, and indexed by search engines.
- Filtering/browsing works even with JavaScript disabled or slow.
- New visitors have an actual front door (Home) instead of landing mid-scroll in a wall of cards.
- The data's shape (priority/risk/evidence-type mix) is visible in one screen (Insights) instead of
  requiring someone to page through cards to infer it.

**Harder / needs attention:**
- `next build` now statically generates 6,442 detail pages; watch build time and Vercel build
  minutes as the catalog grows further.
- Facet counts in `/browse` are recomputed per request over all 6,442 rows in memory — fine at this
  scale, but if the catalog grows another order of magnitude, move to a precomputed facet index.
- The `original` field (full raw source row) is preserved per use case for provenance but stripped
  from the Browse page payload (`queryCatalog` strips it) to keep responses small; it is still
  available on the detail page via `getById`.

**Explicitly out of scope for this pass** (flagged for a follow-up, not silently dropped):
- A full per-paper "reader" page that lets you page through paper chunks (Papers currently shows
  summary + top highlights + download links, not a full inline reader).
- Replacing the flat-file JSON with a database (Option C above).
- Upgrading Insights from CSS bar charts to a charting library — deferred to keep the page fast and
  dependency-free at this data size.

## Action items

1. [x] Add `queryCatalog`, `getById`, `relatedItems`, `curatedHighlights`, and workbook metadata to `lib/catalog.js`.
2. [x] Rebuild `app/styles.css` as a light navy/slate design system (header, tiles, cards, facets, badges, bars).
3. [x] Add `SiteHeader`, `SiteFooter`, `UseCaseCard`, `RagPanel` shared components.
4. [x] Rebuild `app/page.js` as a Home/index page (search, tiles, featured use cases, papers spotlight).
5. [x] Build `app/browse/page.js` as a server-rendered faceted search over the full catalog.
6. [x] Build `app/catalog/[id]/page.js` as a statically generated detail page for all 6,442 use cases.
7. [x] Build `app/papers/page.js` as a dedicated papers hub with the RAG panel.
8. [x] Build `app/insights/page.js` as a data-shape dashboard.
9. [ ] Run `npm install && npm run build` on a clean machine to confirm the 6,442-page static build
       completes within acceptable time/Vercel limits (not verified in this session — see note below).
10. [ ] Decide whether to build a full per-paper reader page, or keep Papers as summary + download.
11. [ ] Revisit Option C (database-backed catalog) if the source workbooks grow past roughly 15-20k rows.

**Verification note:** local build tooling in this session's sandbox became unreliable (an `npm install`
attempt partially corrupted the local `node_modules`, which is `.gitignore`d and does not affect the
real repo or Vercel's build). All new code was written and manually reviewed for correctness, but a
full `next build` was not confirmed end-to-end locally. Run `npm install && npm run build` (or push to
trigger a Vercel build) before treating this as fully verified.
