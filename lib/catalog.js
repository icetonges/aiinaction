import usecases from '../public/data/usecases.json';
import sources from '../public/data/sources.json';
import stats from '../public/data/stats.json';
import strategyPaper from '../public/data/strategy-paper.json';
import papersData from '../public/data/papers.json';

export { usecases, sources, stats, strategyPaper, papersData };

export function tokenize(text = '') {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9$%./_-]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

export function keywordScore(item, query) {
  const terms = tokenize(query);
  if (!terms.length) return 1;
  const haystack = String(item.searchText || '').toLowerCase();
  let score = 0;
  for (const term of terms) {
    if (haystack.includes(term)) score += 2;
    if (String(item.useCaseName || '').toLowerCase().includes(term)) score += 4;
    if (String(item.systemAssets || '').toLowerCase().includes(term)) score += 3;
    if (String(item.missionArea || '').toLowerCase().includes(term)) score += 2;
  }
  return score;
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

export function keywordScoreText(text, title, query, paperTitle = '') {
  const terms = tokenize(query);
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
  return allPaperChunks()
    .map((chunk) => ({ ...chunk, score: keywordScoreText(chunk.text, chunk.title, query, chunk.paperTitle) }))
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
  const filtered = applyFilters(usecases, filters);
  const ranked = filtered
    .map((item) => ({ item, score: keywordScore(item, query) }))
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

function matchesFiltersExcept(item, filters, exceptKey) {
  for (const key of FACET_FIELDS) {
    if (key === exceptKey) continue;
    const value = filters[key];
    if (!value) continue;
    if (facetValue(item, key) !== value) return false;
  }
  return true;
}

function stripHeavyFields(item) {
  const { original, searchText, ...rest } = item;
  return rest;
}

export function queryCatalog({ query = '', filters = {}, limit = 24, offset = 0 } = {}) {
  const hasQuery = tokenize(query).length > 0;
  const matchesQuery = (item) => !hasQuery || keywordScore(item, query) > 0;

  const inScope = usecases.filter((item) => matchesFiltersExcept(item, filters, null) && matchesQuery(item));

  const ranked = inScope
    .map((item) => ({ item, score: keywordScore(item, query) }))
    .sort((a, b) => b.score - a.score || a.item.id.localeCompare(b.item.id));

  const total = ranked.length;
  const page = ranked.slice(offset, offset + limit).map(({ item, score }) => ({ ...stripHeavyFields(item), score }));

  const facets = {};
  for (const field of FACET_FIELDS) {
    const counts = {};
    for (const item of usecases) {
      if (!matchesFiltersExcept(item, filters, field)) continue;
      if (!matchesQuery(item)) continue;
      const value = facetValue(item, field);
      if (!value) continue;
      counts[value] = (counts[value] || 0) + 1;
    }
    facets[field] = counts;
  }

  return { items: page, total, facets };
}

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
