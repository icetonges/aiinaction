"use client";

import { useEffect, useMemo, useState } from 'react';

const PAGE_SIZE = 24;

function unique(data, key) {
  return Array.from(new Set(data.map((row) => row[key] || '').filter(Boolean))).sort();
}

function score(row, query) {
  if (!query.trim()) return 1;
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const text = String(row.searchText || '').toLowerCase();
  let s = 0;
  for (const term of terms) {
    if (text.includes(term)) s += 2;
    if (String(row.useCaseName || '').toLowerCase().includes(term)) s += 5;
    if (String(row.systemAssets || '').toLowerCase().includes(term)) s += 3;
    if (String(row.missionArea || '').toLowerCase().includes(term)) s += 2;
  }
  return s;
}

function filterRows(data, filters, query) {
  return data
    .filter((row) => {
      for (const [key, value] of Object.entries(filters)) {
        if (!value) continue;
        const actual = row[key] || (key === 'priority' || key === 'riskLevel' ? 'Unassigned' : '');
        if (actual !== value) return false;
      }
      return true;
    })
    .map((row) => ({ ...row, _score: score(row, query) }))
    .filter((row) => !query.trim() || row._score > 0)
    .sort((a, b) => b._score - a._score || a.id.localeCompare(b.id));
}

function StatCard({ label, value, hint }) {
  return (
    <div className="stat-card">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {hint ? <div className="stat-hint">{hint}</div> : null}
    </div>
  );
}

function Pill({ children }) {
  if (!children) return null;
  return <span className="pill">{children}</span>;
}

function UseCaseCard({ item }) {
  return (
    <article className="usecase-card">
      <div className="card-topline">
        <span className="id">{item.id}</span>
        <span className="workbook">{item.workbook}</span>
      </div>
      <h3>{item.useCaseName}</h3>
      <p>{item.description}</p>
      <div className="pill-row">
        <Pill>{item.missionArea}</Pill>
        <Pill>{item.domain}</Pill>
        <Pill>{item.aiPattern}</Pill>
        <Pill>{item.systemAssets}</Pill>
      </div>
      <dl className="card-grid">
        <div><dt>Benefit</dt><dd>{item.expectedBenefit || '—'}</dd></div>
        <div><dt>Controls</dt><dd>{item.controls || '—'}</dd></div>
        <div><dt>Evidence Type</dt><dd>{item.evidenceType || item.sourceBasis || '—'}</dd></div>
        <div><dt>Risk / Priority</dt><dd>{[item.riskLevel, item.priority].filter(Boolean).join(' / ') || '—'}</dd></div>
      </dl>
      {item.sourceUrl ? (
        <a className="source-link" href={item.sourceUrl} target="_blank" rel="noreferrer">Open source</a>
      ) : null}
    </article>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <label className="filter-label">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">All</option>
        {options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </label>
  );
}

function PapersSection({ papersData }) {
  const papers = papersData?.papers || [];
  if (!papers.length) return null;
  return (
    <section className="papers-section" id="papers">
      <div className="section-title-row">
        <div>
          <p className="eyebrow">Strategy and adoption papers</p>
          <h2>Download and search the papers</h2>
        </div>
        <p className="muted">Both papers are indexed for deterministic search and optional Neon/pgvector RAG retrieval.</p>
      </div>
      <div className="papers-grid">
        {papers.map((paper) => (
          <article className="paper-card" key={paper.paperId || paper.title}>
            <span className="id">{paper.documentType || 'Paper'}</span>
            <h3>{paper.title}</h3>
            <p className="strategy-subtitle">{paper.subtitle}</p>
            <p className="muted">{paper.summary}</p>
            <div className="hero-actions compact-actions">
              <a href={paper.downloads?.docx}>Download Word</a>
              <a href={paper.downloads?.pdf}>Download PDF</a>
              <a href="#rag">Ask with RAG</a>
            </div>
            <div className="paper-highlights">
              {(paper.highlights || []).slice(0, 3).map((item) => (
                <div className="strategy-card" key={item.id}>
                  <span className="id">{item.id}</span>
                  <h3>{item.title}</h3>
                  <p>{String(item.text || '').replace(/\|/g, ' ').slice(0, 240)}…</p>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function RagPanel() {
  const [query, setQuery] = useState('Show high-value AI use cases and adoption actions for audit readiness, data quality, governance, process redesign, and measurable business value.');
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState(null);

  async function ask() {
    setLoading(true);
    setAnswer(null);
    try {
      const response = await fetch('/api/rag', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      setAnswer(await response.json());
    } finally {
      setLoading(false);
    }
  }

  const paperResults = answer?.paperResults || answer?.strategyResults || [];

  return (
    <section className="rag-panel" id="rag">
      <div>
        <p className="eyebrow">RAG backend</p>
        <h2>Ask the catalog and papers</h2>
        <p className="muted">Without Neon/OpenAI environment variables, this route falls back to deterministic keyword retrieval. After loading Neon embeddings, it retrieves from the use-case catalog, the DoD FM strategy paper, and the general AI adoption paper.</p>
      </div>
      <textarea value={query} onChange={(e) => setQuery(e.target.value)} />
      <button onClick={ask} disabled={loading}>{loading ? 'Searching…' : 'Ask catalog'}</button>
      {answer ? (
        <div className="rag-answer">
          <p className="mode">Mode: {answer.mode}</p>
          {answer.answer ? <p>{answer.answer}</p> : null}
          <div className="mini-results">
            {(answer.results || []).slice(0, 6).map((r) => (
              <div key={r.id} className="mini-card">
                <strong>{r.id}: {r.useCaseName}</strong>
                <span>{r.missionArea} · {r.systemAssets}</span>
              </div>
            ))}
            {paperResults.slice(0, 6).map((r) => (
              <div key={r.id} className="mini-card strategy-mini-card">
                <strong>{r.id}: {r.title}</strong>
                <span>{r.paperTitle || r.documentType || 'Indexed paper'} · {String(r.text || '').slice(0, 170)}…</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default function Home() {
  const [data, setData] = useState([]);
  const [papersData, setPapersData] = useState(null);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ workbook: '', sector: '', missionArea: '', domain: '', evidenceType: '', priority: '', riskLevel: '' });

  useEffect(() => {
    fetch('/data/usecases.json').then((r) => r.json()).then(setData);
    fetch('/data/papers.json').then((r) => r.json()).then(setPapersData);
  }, []);

  const filtered = useMemo(() => filterRows(data, filters, query), [data, filters, query]);
  const visible = filtered.slice(0, page * PAGE_SIZE);
  const dodCount = data.filter((r) => r.workbook === 'DoD FM AI Use Case Catalog').length;
  const broadCount = data.filter((r) => r.workbook === 'Federal / Audit / Finance Catalog').length;
  const missionAreas = unique(data.filter((r) => !filters.workbook || r.workbook === filters.workbook), 'missionArea');
  const domains = unique(data, 'domain');
  const evidenceTypes = unique(data, 'evidenceType');
  const priorities = unique(data.map((r) => ({ ...r, priority: r.priority || 'Unassigned' })), 'priority');
  const risks = unique(data.map((r) => ({ ...r, riskLevel: r.riskLevel || 'Unassigned' })), 'riskLevel');
  const paperCount = papersData?.stats?.papers || 2;
  const documentChunks = papersData?.stats?.chunks || 0;

  function updateFilter(key, value) {
    setPage(1);
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <main>
      <section className="hero">
        <div className="hero-content">
          <p className="eyebrow">AI use-case intelligence library</p>
          <h1>DoD FM, federal, audit, accounting, and financial-industry AI use cases</h1>
          <p className="hero-copy">A deployable Next.js library containing every row from both Excel workbooks, the DoD FM AI Integration Strategy Paper, the General AI Integration and Adoption Strategy Paper, searchable cards, source links, and a Neon/pgvector RAG backend path.</p>
          <div className="hero-actions">
            <a href="/downloads/dod_fm_ai_use_case_catalog.xlsx">Download DoD FM workbook</a>
            <a href="/downloads/ai_use_case_catalog_federal_audit_finance.xlsx">Download broad catalog workbook</a>
            <a href="/downloads/DoD_FM_AI_Integration_Strategy_Paper.docx">DoD strategy paper</a>
            <a href="/downloads/General_AI_Integration_and_Adoption_Strategy_Paper.docx">General AI adoption paper</a>
            <a href="#rag">Ask with RAG</a>
          </div>
        </div>
        <div className="hero-panel">
          <StatCard label="Total use cases" value={data.length || '1,891'} hint="Loaded from both workbooks" />
          <StatCard label="DoD FM use cases" value={dodCount || '1,341'} hint="Financial-management mission areas" />
          <StatCard label="Federal / audit / finance" value={broadCount || '550'} hint="Cross-sector source catalog" />
          <StatCard label="Indexed papers" value={paperCount} hint={`${documentChunks || '50+'} document chunks for search/RAG`} />
        </div>
      </section>

      <PapersSection papersData={papersData} />

      <section className="search-shell">
        <div className="search-header">
          <div>
            <p className="eyebrow">Explore catalog</p>
            <h2>{filtered.length.toLocaleString()} matching use cases</h2>
          </div>
          <input className="search-input" value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} placeholder="Search: FIAR, FBWT, GFEBS, DTS, audit, AML, journal entry…" />
        </div>

        <div className="filters">
          <Select label="Workbook" value={filters.workbook} onChange={(v) => updateFilter('workbook', v)} options={unique(data, 'workbook')} />
          <Select label="Sector" value={filters.sector} onChange={(v) => updateFilter('sector', v)} options={unique(data, 'sector')} />
          <Select label="Mission area" value={filters.missionArea} onChange={(v) => updateFilter('missionArea', v)} options={missionAreas} />
          <Select label="Domain" value={filters.domain} onChange={(v) => updateFilter('domain', v)} options={domains} />
          <Select label="Evidence" value={filters.evidenceType} onChange={(v) => updateFilter('evidenceType', v)} options={evidenceTypes} />
          <Select label="Priority" value={filters.priority} onChange={(v) => updateFilter('priority', v)} options={priorities} />
          <Select label="Risk" value={filters.riskLevel} onChange={(v) => updateFilter('riskLevel', v)} options={risks} />
        </div>

        <div className="cards">
          {visible.map((item) => <UseCaseCard key={`${item.workbook}-${item.id}`} item={item} />)}
        </div>
        {visible.length < filtered.length ? (
          <button className="load-more" onClick={() => setPage((p) => p + 1)}>Load more</button>
        ) : null}
      </section>

      <RagPanel />

      <footer>
        <strong>Evidence note:</strong> the DoD FM workbook is a public-source-derived opportunity catalog, not an official complete list of deployed DoD AI systems. Keep the Evidence Type and Source Basis fields visible when briefing leadership. The papers are included as recommended strategy and adoption guidance to connect selected use cases to business outcomes, data readiness, governance, and audit-readiness value.
      </footer>
    </main>
  );
}
