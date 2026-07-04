import usecases from '../public/data/usecases.json';
import sources from '../public/data/sources.json';
import stats from '../public/data/stats.json';
import strategyPaper from '../public/data/strategy-paper.json';

export { usecases, sources, stats, strategyPaper };

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


export function keywordScoreText(text, title, query) {
  const terms = tokenize(query);
  if (!terms.length) return 1;
  const haystack = String(text || '').toLowerCase();
  const titleText = String(title || '').toLowerCase();
  let score = 0;
  for (const term of terms) {
    if (haystack.includes(term)) score += 2;
    if (titleText.includes(term)) score += 5;
  }
  return score;
}

export function searchStrategyPaper({ query = '', limit = 8 } = {}) {
  return (strategyPaper.chunks || [])
    .map((chunk) => ({ ...chunk, score: keywordScoreText(chunk.text, chunk.title, query) }))
    .filter((chunk) => !query || chunk.score > 0)
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
    .slice(0, Number(limit || 8));
}

export function toStrategyEmbeddingText(chunk) {
  return [
    `ID: ${chunk.id}`,
    `Document: DoD FM AI Integration Strategy Paper`,
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
