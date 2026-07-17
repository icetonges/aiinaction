import { unstable_cache } from 'next/cache';
import rawUsecases from '../public/data/usecases.json';
import sources from '../public/data/sources.json';
import stats from '../public/data/stats.json';
import strategyPaper from '../public/data/strategy-paper.json';
import papersData from '../public/data/papers.json';

// `searchText` used to be pre-baked into public/data/usecases.json (~34MB, ~21MB of
// which was this field plus a raw-source-row `original` field that no app code
// ever read). It's a pure function of fields already on each item, so it's built
// once here at module load instead of shipping ~4-5MB of derived text in the
// bundle that every function importing this module has to parse on cold start.
const SEARCH_TEXT_FIELDS = [
  'id', 'workbook', 'catalogType', 'sector', 'subsector', 'missionArea', 'domain',
  'process', 'subprocess', 'owner', 'systemAssets', 'useCaseName', 'description',
  'detailedExample', 'aiPattern', 'automationLevel', 'expectedBenefit', 'auditImpact',
  'sourceBasis', 'sourceUrl', 'sourceName', 'evidenceType', 'riskLevel', 'controls',
  'dataNeeded', 'metrics', 'priority', 'complexity', 'mvpScope', 'controlObjective',
];

function buildSearchText(item) {
  return SEARCH_TEXT_FIELDS.map((field) => item[field] || '').filter(Boolean).join(' ');
}

export const usecases = rawUsecases.map((item) => ({ ...item, searchText: buildSearchText(item) }));

export { sources, stats, strategyPaper, papersData };

export function tokenize(text = '') {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9$%./_-]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

// Scores an item against already-tokenized terms. Callers that score many items
// against the same query (searchCatalog, queryCatalog) should tokenize once and
// call this directly instead of keywordScore, which re-tokenizes on every call.
export function scoreTerms(item, terms) {
  if (!terms.length) return 1;
  const haystack = String(item.searchText || '').toLowerCase();
  const nameHay = String(item.useCaseName || '').toLowerCase();
  const assetsHay = String(item.systemAssets || '').toLowerCase();
  const missionHay = String(item.missionArea || '').toLowerCase();
  let score = 0;
  for (const term of terms) {
    if (haystack.includes(term)) score += 2;
    if (nameHay.includes(term)) score += 4;
    if (assetsHay.includes(term)) score += 3;
    if (missionHay.includes(term)) score += 2;
  }
  return score;
}

export function keywordScore(item, query) {
  return scoreTerms(item, tokenize(query));
}

export function applyFilters(items, filters = {}) {
  return items.filter((item) => {
    if (filters.workbook && item.workbook !== filters.workbook) return false;
    if (filters.sector && item.sector !== filters.sector) return false;
    if (filters.missionArea && item.missionArea !== filters.missionArea) return false;
    if (filters.domain && item.domain !== filters.domain) return false;
    if (filters.evidenceType && item.evidenceType !== filters.evidenceType) return false;
    if (filters.priority && (item.priority || 'Unassigned') !== filters.priority) return false;
    if (filters.riskLevel && (item.riskLevel || 'Unassigned') !== filters.riskLevel) return false;
    return true;
  });
}

export function scoreTextTerms(text, title, terms, paperTitle = '') {
  if (!terms.length) return 1;
  const haystack = String(text || '').toLowerCase();
  const titleText = `${title || ''} ${paperTitle || ''}`.toLowerCase();
  let score = 0;
  for (const term of terms) {
    if (haystack.includes(term)) score += 2;
    if (titleText.includes(term)) score += 5;
  }
  return score;
}

export function keywordScoreText(text, title, query, paperTitle = '') {
  return scoreTextTerms(text, title, tokenize(query), paperTitle);
}

export function allPaperChunks() {
  return (papersData.papers || []).flatMap((paper) =>
    (paper.chunks || []).map((chunk) => ({
      ...chunk,
      paperId: chunk.paperId || paper.paperId,
      paperTitle: chunk.paperTitle || paper.title,
      documentType: chunk.documentType || paper.documentType,
      downloadDocx: chunk.downloadDocx || paper.downloads?.docx,
      downloadPdf: chunk.downloadPdf || paper.downloads?.pdf,
    }))
  );
}

export function searchPapers({ query = '', limit = 8 } = {}) {
  const terms = tokenize(query);
  return allPaperChunks()
    .map((chunk) => ({ ...chunk, score: scoreTextTerms(chunk.text, chunk.title, terms, chunk.paperTitle) }))
    .filter((chunk) => !query || chunk.score > 0)
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
    .slice(0, Number(limit || 8));
}

// Backward-compatible name used by earlier app code.
export const searchStrategyPaper = searchPapers;

export function toStrategyEmbeddingText(chunk) {
  return [
    `ID: ${chunk.id}`,
    `Document: ${chunk.paperTitle || 'AI strategy/adoption paper'}`,
    `Document type: ${chunk.documentType || ''}`,
    `Section: ${chunk.section || chunk.title}`,
    `Text: ${chunk.text}`,
  ].filter(Boolean).join('\n');
}

export function searchCatalog({ query = '', filters = {}, limit = 100 } = {}) {
  const terms = tokenize(query);
  const filtered = applyFilters(usecases, filters);
  const ranked = filtered
    .map((item) => ({ item, score: scoreTerms(item, terms) }))
    .filter((row) => !query || row.score > 0)
    .sort((a, b) => b.score - a.score || a.item.id.localeCompare(b.item.id))
    .slice(0, Number(limit || 100))
    .map(({ item, score }) => ({ ...item, score }));
  return ranked;
}

export function distinct(field) {
  return Array.from(new Set(usecases.map((u) => u[field] || '').filter(Boolean))).sort();
}

export function toEmbeddingText(item) {
  return [
    `ID: ${item.id}`,
    `Workbook: ${item.workbook}`,
    `Sector: ${item.sector}`,
    `Mission area: ${item.missionArea}`,
    `Domain: ${item.domain}`,
    `Process: ${item.process}`,
    `System/assets: ${item.systemAssets}`,
    `Use case: ${item.useCaseName}`,
    `Description: ${item.description}`,
    `AI pattern: ${item.aiPattern}`,
    `Benefit: ${item.expectedBenefit}`,
    `Controls: ${item.controls}`,
    `Evidence/source basis: ${item.evidenceType || item.sourceBasis}`,
    `Source: ${item.sourceName || item.sourceBasis} ${item.sourceUrl}`,
  ].filter(Boolean).join('\n');
}

// ---------------------------------------------------------------------------
// Workbook metadata (labels/descriptions used across Home, Browse, and detail
// pages) plus paginated/faceted query support for the Browse catalog page and
// static detail pages. Kept additive so the existing searchCatalog/searchPapers
// exports used by /api/search and /api/rag stay unchanged.
// ---------------------------------------------------------------------------

export const WORKBOOK_ORDER = [
  'DoD FM AI Use Case Catalog',
  'Federal / Audit / Finance Catalog',
  'OMB 2025 Individually Reported AI Use Cases',
  'OMB 2025 Consolidated COTS AI Use Cases',
];

export const WORKBOOK_META = {
  'DoD FM AI Use Case Catalog': {
    slug: 'dod-fm',
    shortLabel: 'DoD FM',
    label: 'DoD FM AI Use Case Catalog (v2.1)',
    description: 'DoD financial-management AI opportunities scored against FY27/FY28 audit priorities, material line items, and portfolio tiers.',
  },
  'Federal / Audit / Finance Catalog': {
    slug: 'federal-audit-finance',
    shortLabel: 'Federal / Audit / Finance',
    label: 'Federal, Audit & Finance Catalog',
    description: 'Cross-sector use cases spanning federal agencies, audit and accounting firms, and financial services.',
  },
  'OMB 2025 Individually Reported AI Use Cases': {
    slug: 'omb-individual',
    shortLabel: 'OMB Individually Reported',
    label: 'OMB 2025 Individually Reported AI Use Cases',
    description: 'Every individually reported AI use case from the 2025 government-wide OMB AI inventory, across 41 agencies.',
  },
  'OMB 2025 Consolidated COTS AI Use Cases': {
    slug: 'omb-cots',
    shortLabel: 'OMB Consolidated COTS',
    label: 'OMB 2025 Consolidated COTS AI Use Cases',
    description: 'Agency-by-agency adoption of common commercial/COTS AI patterns, from the 2025 OMB inventory.',
  },
};

export function workbookMeta(workbook) {
  return WORKBOOK_META[workbook] || { slug: 'catalog', shortLabel: workbook, label: workbook, description: '' };
}

export function slugForWorkbook(workbook) {
  return workbookMeta(workbook).slug;
}

const FACET_FIELDS = ['workbook', 'sector', 'missionArea', 'domain', 'evidenceType', 'priority', 'riskLevel'];
const UNASSIGNED_FIELDS = new Set(['priority', 'riskLevel']);

function facetValue(item, field) {
  return item[field] || (UNASSIGNED_FIELDS.has(field) ? 'Unassigned' : '');
}

function stripHeavyFields(item) {
  const { searchText, ...rest } = item;
  return rest;
}

// Faceted counts need, for each facet field, how many items match every
// *other* active filter (so picking a value shows what else is still
// reachable). The previous implementation recomputed keywordScore and
// re-walked FACET_FIELDS from scratch for every (field, item) pair -
// 7 x 6,442 calls into a tokenizing string-matcher on every /browse
// request. Score and per-field filter matches are now computed once per
// item up front and reused for the query, the ranked page, and every
// facet column.
export function queryCatalog({ query = '', filters = {}, limit = 24, offset = 0 } = {}) {
  const terms = tokenize(query);
  const hasQuery = terms.length > 0;

  const scored = usecases.map((item) => {
    const fieldMatch = {};
    for (const field of FACET_FIELDS) {
      const value = filters[field];
      fieldMatch[field] = !value || facetValue(item, field) === value;
    }
    return { item, score: scoreTerms(item, terms), fieldMatch };
  });

  const matchesQuery = (row) => !hasQuery || row.score > 0;
  const matchesAllFilters = (row) => FACET_FIELDS.every((field) => row.fieldMatch[field]);
  const matchesFiltersExcept = (row, exceptKey) =>
    FACET_FIELDS.every((field) => field === exceptKey || row.fieldMatch[field]);

  const inScope = scored.filter((row) => matchesAllFilters(row) && matchesQuery(row));

  const ranked = [...inScope].sort((a, b) => b.score - a.score || a.item.id.localeCompare(b.item.id));

  const total = ranked.length;
  const page = ranked.slice(offset, offset + limit).map(({ item, score }) => ({ ...stripHeavyFields(item), score }));

  const facets = {};
  for (const field of FACET_FIELDS) {
    const counts = {};
    for (const row of scored) {
      if (!matchesFiltersExcept(row, field)) continue;
      if (!matchesQuery(row)) continue;
      const value = facetValue(row.item, field);
      if (!value) continue;
      counts[value] = (counts[value] || 0) + 1;
    }
    facets[field] = counts;
  }

  return { items: page, total, facets };
}

// /browse and /api/search re-run these functions on every request (they read
// searchParams / request body, so Next can't statically cache the route).
// Wrapping the actual scan in unstable_cache means repeat requests for the
// same query+filters reuse the cached result instead of re-scanning all
// 6,442 items - the part of the request that costs real CPU time, as
// opposed to page HTML generation, which is comparatively cheap. 5 minutes
// is a reasonable default since this catalog is a curated dataset that
// doesn't change during normal traffic; lower it if data updates more often.
export const cachedQueryCatalog = unstable_cache(
  async (params) => queryCatalog(params),
  ['catalog-query'],
  { revalidate: 300 }
);

export const cachedSearchCatalog = unstable_cache(
  async (params) => searchCatalog(params),
  ['catalog-search'],
  { revalidate: 300 }
);

export const cachedSearchPapers = unstable_cache(
  async (params) => searchPapers(params),
  ['catalog-search-papers'],
  { revalidate: 300 }
);

export function getById(id) {
  return usecases.find((u) => u.id === id) || null;
}

export function allIds() {
  return usecases.map((u) => u.id);
}

export function relatedItems(item, limit = 6) {
  if (!item) return [];
  const sameDomain = usecases.filter(
    (u) => u.id !== item.id && u.workbook === item.workbook && u.missionArea && u.missionArea === item.missionArea
  );
  const pool = sameDomain.length >= limit
    ? sameDomain
    : sameDomain.concat(usecases.filter((u) => u.id !== item.id && u.workbook === item.workbook && !sameDomain.includes(u)));
  return pool.slice(0, limit);
}

const PRIORITY_RANK = ['Very High', 'High', 'Medium', 'Low', ''];

function priorityRank(item) {
  const idx = PRIORITY_RANK.indexOf(item.priority || '');
  return idx === -1 ? PRIORITY_RANK.length : idx;
}

export function curatedHighlights(limit = 8) {
  const eligible = usecases.filter((u) => u.useCaseName && u.description);
  const sorted = [...eligible].sort((a, b) => priorityRank(a) - priorityRank(b));
  const picks = [];
  const used = new Set();

  for (const wb of WORKBOOK_ORDER) {
    const found = sorted.find((u) => u.workbook === wb && !used.has(u.id));
    if (found) {
      picks.push(found);
      used.add(found.id);
    }
  }
  for (const u of sorted) {
    if (picks.length >= limit) break;
    if (used.has(u.id)) continue;
    picks.push(u);
    used.add(u.id);
  }
  return picks.slice(0, limit);
}

export function topEntries(map, n = 8) {
  return Object.entries(map || {})
    .filter(([key]) => key)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n);
}

