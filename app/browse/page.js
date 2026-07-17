import UseCaseCard from '@/components/UseCaseCard';
import { cachedQueryCatalog } from '@/lib/catalog';

export const metadata = { title: 'Browse the catalog' };

const PAGE_SIZE = 24;

const FACET_CONFIG = [
  { key: 'workbook', label: 'Workbook' },
  { key: 'sector', label: 'Sector' },
  { key: 'missionArea', label: 'Mission area' },
  { key: 'domain', label: 'Domain' },
  { key: 'evidenceType', label: 'Evidence type' },
  { key: 'priority', label: 'Priority' },
  { key: 'riskLevel', label: 'Risk level' },
];

function toSingle(value) {
  if (Array.isArray(value)) return value[0] || '';
  return value || '';
}

function buildQuery(current, overrides) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(current || {})) {
    const single = toSingle(value);
    if (single) params.set(key, single);
  }
  for (const [key, value] of Object.entries(overrides || {})) {
    if (value === undefined || value === null || value === '') params.delete(key);
    else params.set(key, String(value));
  }
  if (!('page' in overrides)) params.delete('page');
  const qs = params.toString();
  return qs ? `/browse?${qs}` : '/browse';
}

export default async function BrowsePage({ searchParams }) {
  const sp = (await searchParams) || {};
  const query = toSingle(sp.q);
  const filters = {
    workbook: toSingle(sp.workbook),
    sector: toSingle(sp.sector),
    missionArea: toSingle(sp.missionArea),
    domain: toSingle(sp.domain),
    evidenceType: toSingle(sp.evidenceType),
    priority: toSingle(sp.priority),
    riskLevel: toSingle(sp.riskLevel),
  };
  const page = Math.max(1, parseInt(toSingle(sp.page) || '1', 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const { items, total, facets } = await cachedQueryCatalog({ query, filters, limit: PAGE_SIZE, offset });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const activeFilterEntries = Object.entries(filters).filter(([, value]) => value);
  const hasActive = Boolean(query) || activeFilterEntries.length > 0;

  return (
    <main>
      <div className="shell">
        <div className="breadcrumb">
          <a href="/">Home</a>
          <span className="sep">/</span>
          <span className="current">Browse catalog</span>
        </div>
      </div>

      <div className="shell browse-layout">
        <aside className="facet-panel">
          <div className="facet-panel-head">
            <h2>Filters</h2>
            {hasActive ? <a className="facet-clear" href="/browse">Clear all</a> : null}
          </div>
          {FACET_CONFIG.map(({ key, label }) => {
            const counts = facets[key] || {};
            const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
            if (!entries.length) return null;
            return (
              <details className="facet-group" key={key} open={Boolean(filters[key]) || key === 'workbook'}>
                <summary>{label}</summary>
                <div className="facet-options">
                  {entries.slice(0, 20).map(([value, count]) => {
                    const active = filters[key] === value;
                    const href = buildQuery(sp, { [key]: active ? '' : value });
                    return (
                      <div className="facet-option" data-active={active} key={value}>
                        <a href={href}>{value}</a>
                        <span className="count">{count.toLocaleString()}</span>
                      </div>
                    );
                  })}
                </div>
              </details>
            );
          })}
        </aside>

        <div>
          <div className="browse-main-head">
            <form className="browse-search" action="/browse" method="GET">
              {activeFilterEntries.map(([key, value]) => (
                <input key={key} type="hidden" name={key} value={value} />
              ))}
              <input type="text" name="q" defaultValue={query} placeholder="Search within results…" aria-label="Search within results" />
              <button type="submit">Search</button>
            </form>
            <div className="result-count">{total.toLocaleString()} matching use cases</div>
          </div>

          {hasActive ? (
            <div className="active-filters">
              {query ? (
                <span className="filter-chip">"{query}" <a href={buildQuery(sp, { q: '' })} aria-label="Clear search">×</a></span>
              ) : null}
              {activeFilterEntries.map(([key, value]) => (
                <span className="filter-chip" key={key}>{value} <a href={buildQuery(sp, { [key]: '' })} aria-label={`Clear ${key} filter`}>×</a></span>
              ))}
            </div>
          ) : null}

          {items.length ? (
            <div className="card-grid-3">
              {items.map((item) => (
                <UseCaseCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <h3>No use cases match these filters</h3>
              <p>Try clearing a filter or searching a broader term.</p>
            </div>
          )}

          {totalPages > 1 ? (
            <div className="pagination">
              {page > 1 ? <a href={buildQuery(sp, { page: page - 1 })}>← Previous</a> : null}
              <span className="current">Page {page} of {totalPages}</span>
              {page < totalPages ? <a href={buildQuery(sp, { page: page + 1 })}>Next →</a> : null}
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
