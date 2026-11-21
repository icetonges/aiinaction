// Pure browse/filter logic shared by the static /browse prerender (server) and
// BrowseClient (browser). Must not import lib/catalog: that module pulls the
// 13 MB usecases.json, which would land in the client bundle.

export const BROWSE_FACET_FIELDS = ['workbook', 'sector', 'missionArea', 'domain', 'evidenceType', 'priority', 'riskLevel'];
export const BROWSE_FILTER_KEYS = [...BROWSE_FACET_FIELDS, 'q', 'page'];
export const PAGE_SIZE = 24;
const UNASSIGNED_FIELDS = new Set(['priority', 'riskLevel']);

export function truncateCard(text, max = 180) {
  const value = String(text || '');
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1).trim()}…`;
}

export function facetValue(item, field) {
  return item[field] || (UNASSIGNED_FIELDS.has(field) ? 'Unassigned' : '');
}

// Same tokenizer as lib/catalog.js.
export function tokenize(text = '') {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9$%./_-]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

/** Decodes buildBrowseIndex() output (plus optional aligned search text). */
export function decodeBrowseIndex({ dict, items }, searchText) {
  return items.map((row, i) => {
    const item = { id: row[0] };
    BROWSE_FACET_FIELDS.forEach((field, j) => {
      item[field] = dict[field][row[1 + j]];
    });
    const base = 1 + BROWSE_FACET_FIELDS.length;
    item.useCaseName = row[base];
    item.description = row[base + 1];
    item.systemAssets = row[base + 2];
    item.haystack = [
      item.id, ...BROWSE_FACET_FIELDS.map((f) => item[f]), item.useCaseName, item.description, item.systemAssets,
      searchText ? searchText[i] : '',
    ].join(' ').toLowerCase();
    return item;
  });
}

// Mirrors scoreTerms in lib/catalog.js.
function scoreTerms(item, terms) {
  if (!terms.length) return 1;
  const nameHay = String(item.useCaseName || '').toLowerCase();
  const assetsHay = String(item.systemAssets || '').toLowerCase();
  const missionHay = String(item.missionArea || '').toLowerCase();
  let score = 0;
  for (const term of terms) {
    if (item.haystack.includes(term)) score += 2;
    if (nameHay.includes(term)) score += 4;
    if (assetsHay.includes(term)) score += 3;
    if (missionHay.includes(term)) score += 2;
  }
  return score;
}

/** Same result shape and facet-count semantics as queryCatalog in lib/catalog.js. */
export function queryBrowse(items, { query = '', filters = {}, limit = PAGE_SIZE, offset = 0 } = {}) {
  const terms = tokenize(query);
  const hasQuery = terms.length > 0;
  const scored = items.map((item) => {
    const fieldMatch = {};
    for (const field of BROWSE_FACET_FIELDS) {
      const value = filters[field];
      fieldMatch[field] = !value || facetValue(item, field) === value;
    }
    return { item, score: scoreTerms(item, terms), fieldMatch };
  });
  const matchesQuery = (row) => !hasQuery || row.score > 0;
  const matchesExcept = (row, except) => BROWSE_FACET_FIELDS.every((f) => f === except || row.fieldMatch[f]);

  const ranked = scored
    .filter((row) => matchesExcept(row, null) && matchesQuery(row))
    .sort((a, b) => b.score - a.score || a.item.id.localeCompare(b.item.id));

  const facets = {};
  for (const field of BROWSE_FACET_FIELDS) {
    const counts = {};
    for (const row of scored) {
      if (!matchesExcept(row, field) || !matchesQuery(row)) continue;
      const value = facetValue(row.item, field);
      if (value) counts[value] = (counts[value] || 0) + 1;
    }
    facets[field] = counts;
  }
  return {
    items: ranked.slice(offset, offset + limit).map(({ item }) => cardFields(item)),
    total: ranked.length,
    facets,
  };
}

/** Only what UseCaseCard renders, so the prerendered RSC payload stays small. */
export function cardFields(item) {
  return {
    id: item.id,
    workbook: item.workbook,
    missionArea: item.missionArea,
    priority: item.priority,
    riskLevel: item.riskLevel,
    useCaseName: item.useCaseName,
    description: truncateCard(item.description || item.detailedExample),
  };
}

/** Parses a URLSearchParams into the browse state. */
export function readBrowseState(params) {
  const filters = {};
  for (const field of BROWSE_FACET_FIELDS) filters[field] = params.get(field) || '';
  const page = Math.max(1, parseInt(params.get('page') || '1', 10) || 1);
  return { query: params.get('q') || '', filters, page };
}

export function isUnfiltered(state) {
  return !state.query && state.page === 1 && BROWSE_FACET_FIELDS.every((f) => !state.filters[f]);
}

/** Same URL format as the old server-rendered page, so existing links keep working. */
export function buildBrowseHref(state, overrides) {
  const params = new URLSearchParams();
  for (const field of BROWSE_FACET_FIELDS) if (state.filters[field]) params.set(field, state.filters[field]);
  if (state.query) params.set('q', state.query);
  if (state.page > 1) params.set('page', String(state.page));
  for (const [key, value] of Object.entries(overrides || {})) {
    if (value === undefined || value === null || value === '' || (key === 'page' && Number(value) <= 1)) params.delete(key);
    else params.set(key, String(value));
  }
  if (!('page' in (overrides || {}))) params.delete('page');
  const qs = params.toString();
  return qs ? `/browse?${qs}` : '/browse';
}
