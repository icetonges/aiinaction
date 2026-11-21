import { usecases } from '@/lib/catalog';
import { BROWSE_FACET_FIELDS, truncateCard } from '@/lib/browse/query';

// Builds the compact, dictionary-encoded catalog the /browse page filters in
// the browser. Facet strings repeat thousands of times, so each facet column
// stores an index into dict[field] instead of the string (~1.4 MB raw /
// ~290 KB gzip versus 13 MB for usecases.json). Generated once at build by
// the force-static route handlers next to /browse and served from the CDN.
export function buildBrowseIndex() {
  const dict = {};
  const lookup = {};
  for (const field of BROWSE_FACET_FIELDS) {
    dict[field] = [];
    lookup[field] = new Map();
  }
  const encode = (field, raw) => {
    const value = raw || '';
    const map = lookup[field];
    if (!map.has(value)) {
      map.set(value, dict[field].length);
      dict[field].push(value);
    }
    return map.get(value);
  };
  const items = usecases.map((item) => [
    item.id,
    ...BROWSE_FACET_FIELDS.map((field) => encode(field, item[field])),
    item.useCaseName || '',
    truncateCard(item.description || item.detailedExample),
    item.systemAssets || '',
  ]);
  return { dict, items };
}

// Extra free text for "Search within results", aligned by position with
// buildBrowseIndex().items. Loaded by the browser only when a query is typed.
export function buildBrowseSearchText() {
  return usecases.map((item) =>
    [item.description, item.detailedExample, item.process, item.subprocess, item.owner, item.aiPattern, item.sourceName]
      .filter(Boolean)
      .join(' ')
  );
}
