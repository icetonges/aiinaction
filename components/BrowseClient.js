"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import UseCaseCard from '@/components/UseCaseCard';
import {
  BROWSE_FACET_FIELDS,
  PAGE_SIZE,
  buildBrowseHref,
  decodeBrowseIndex,
  isUnfiltered,
  queryBrowse,
  readBrowseState,
} from '@/lib/browse/query';

const FACET_LABELS = {
  workbook: 'Workbook',
  sector: 'Sector',
  missionArea: 'Mission area',
  domain: 'Domain',
  evidenceType: 'Evidence type',
  priority: 'Priority',
  riskLevel: 'Risk level',
};

const EMPTY_STATE = { query: '', filters: Object.fromEntries(BROWSE_FACET_FIELDS.map((f) => [f, ''])), page: 1 };

// /browse is prerendered once and served from the CDN for every query string;
// filtering happens here against /browse-index.json (also static). Before,
// every facet/page combination was a server render, and crawlers walking that
// URL space were the project's entire Fluid Active CPU bill.
export default function BrowseClient({ initial }) {
  const [state, setState] = useState(EMPTY_STATE);
  const [result, setResult] = useState(initial);
  const [loading, setLoading] = useState(false);
  const indexRef = useRef({ base: null, withSearch: null });

  const loadItems = useCallback(async (needSearch) => {
    const cache = indexRef.current;
    if (needSearch && cache.withSearch) return cache.withSearch;
    if (!needSearch && cache.base) return cache.base;
    const indexPromise = cache.raw || (cache.raw = fetch('/browse-index.json').then((r) => r.json()));
    if (needSearch) {
      const searchPromise = cache.rawSearch || (cache.rawSearch = fetch('/browse-search.json').then((r) => r.json()));
      const [raw, text] = await Promise.all([indexPromise, searchPromise]);
      cache.withSearch = decodeBrowseIndex(raw, text);
      return cache.withSearch;
    }
    cache.base = decodeBrowseIndex(await indexPromise);
    return cache.base;
  }, []);

  const apply = useCallback(async (next) => {
    setState(next);
    if (isUnfiltered(next)) {
      setResult(initial);
      return;
    }
    setLoading(true);
    try {
      const items = await loadItems(Boolean(next.query));
      setResult(queryBrowse(items, {
        query: next.query,
        filters: next.filters,
        limit: PAGE_SIZE,
        offset: (next.page - 1) * PAGE_SIZE,
      }));
    } finally {
      setLoading(false);
    }
  }, [initial, loadItems]);

  useEffect(() => {
    const sync = () => apply(readBrowseState(new URLSearchParams(window.location.search)));
    sync();
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, [apply]);

  function navigate(event, href) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button === 1) return;
    event.preventDefault();
    window.history.pushState(null, '', href);
    apply(readBrowseState(new URL(href, window.location.origin).searchParams));
    window.scrollTo({ top: 0 });
  }

  function onSearch(event) {
    event.preventDefault();
    const q = String(new FormData(event.currentTarget).get('q') || '').trim();
    navigate(event, buildBrowseHref(state, { q }));
  }

  const { items, total, facets } = result;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const activeFilterEntries = Object.entries(state.filters).filter(([, value]) => value);
  const hasActive = Boolean(state.query) || activeFilterEntries.length > 0;
  const link = (href, children, extra = {}) => (
    <a href={href} rel="nofollow" onClick={(e) => navigate(e, href)} {...extra}>{children}</a>
  );

  return (
    <div className="shell browse-layout">
      <aside className="facet-panel">
        <div className="facet-panel-head">
          <h2>Filters</h2>
          {hasActive ? link('/browse', 'Clear all', { className: 'facet-clear' }) : null}
        </div>
        {BROWSE_FACET_FIELDS.map((key) => {
          const entries = Object.entries(facets[key] || {}).sort((a, b) => b[1] - a[1]);
          if (!entries.length) return null;
          return (
            <details className="facet-group" key={key} open={Boolean(state.filters[key]) || key === 'workbook'}>
              <summary>{FACET_LABELS[key]}</summary>
              <div className="facet-options">
                {entries.slice(0, 20).map(([value, count]) => {
                  const active = state.filters[key] === value;
                  return (
                    <div className="facet-option" data-active={active} key={value}>
                      {link(buildBrowseHref(state, { [key]: active ? '' : value }), value)}
                      <span className="count">{count.toLocaleString()}</span>
                    </div>
                  );
                })}
              </div>
            </details>
          );
        })}
      </aside>

      <div aria-busy={loading}>
        <div className="browse-main-head">
          <form className="browse-search" action="/browse" method="GET" onSubmit={onSearch}>
            <input
              key={state.query}
              type="text"
              name="q"
              defaultValue={state.query}
              placeholder="Search within results…"
              aria-label="Search within results"
            />
            <button type="submit">Search</button>
          </form>
          <div className="result-count">{loading ? 'Loading…' : `${total.toLocaleString()} matching use cases`}</div>
        </div>

        {hasActive ? (
          <div className="active-filters">
            {state.query ? (
              <span className="filter-chip">"{state.query}" {link(buildBrowseHref(state, { q: '' }), '×', { 'aria-label': 'Clear search' })}</span>
            ) : null}
            {activeFilterEntries.map(([key, value]) => (
              <span className="filter-chip" key={key}>{value} {link(buildBrowseHref(state, { [key]: '' }), '×', { 'aria-label': `Clear ${key} filter` })}</span>
            ))}
          </div>
        ) : null}

        {items.length ? (
          <div className="card-grid-3">
            {items.map((item) => <UseCaseCard key={item.id} item={item} />)}
          </div>
        ) : (
          <div className="empty-state">
            <h3>No use cases match these filters</h3>
            <p>Try clearing a filter or searching a broader term.</p>
          </div>
        )}

        {totalPages > 1 ? (
          <div className="pagination">
            {state.page > 1 ? link(buildBrowseHref(state, { page: state.page - 1 }), '← Previous') : null}
            <span className="current">Page {state.page} of {totalPages}</span>
            {state.page < totalPages ? link(buildBrowseHref(state, { page: state.page + 1 }), 'Next →') : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
