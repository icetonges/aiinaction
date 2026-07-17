import UseCaseCard from '@/components/UseCaseCard';
import { stats, papersData, curatedHighlights, WORKBOOK_ORDER, workbookMeta } from '@/lib/catalog';

export default function Home() {
  const total = stats.total || 0;
  const byWorkbook = stats.byWorkbook || {};
  const papers = (papersData?.papers || []).slice(0, 4);
  const highlights = curatedHighlights(8);
  const paperChunks = papersData?.stats?.chunks || 0;

  return (
    <main>
      <section className="hero">
        <div className="shell">
          <p className="hero-eyebrow">AI use-case intelligence library</p>
          <h1>Find, compare, and act on 6,400+ federal and DoD financial-management AI use cases</h1>
          <p className="hero-copy">
            One index across five source workbooks — the DoD FM AI Use Case Catalog v2.1, the Federal/Audit/Finance
            catalog, and both 2025 OMB government-wide AI inventories — plus strategy and adoption papers. Search by
            keyword, browse by catalog or mission area, or open a use case to see its full evidence trail.
          </p>
          <form className="hero-search-form" action="/browse" method="GET">
            <input type="text" name="q" placeholder="Try “reconciliation”, “FBWT”, “invoice”, “document summarization”…" aria-label="Search use cases" />
            <button type="submit">Search the library</button>
          </form>
          <div className="hero-links">
            <a href="/browse">Browse the full catalog →</a>
            <a href="/papers">Strategy &amp; adoption papers →</a>
            <a href="/insights">Explore the data →</a>
          </div>

          <div className="stat-strip">
            <div className="stat-cell">
              <div className="stat-value">{total.toLocaleString()}</div>
              <div className="stat-label">Total use cases</div>
              <div className="stat-hint">Across five workbooks</div>
            </div>
            <div className="stat-cell">
              <div className="stat-value">{(byWorkbook['DoD FM AI Use Case Catalog'] || 0).toLocaleString()}</div>
              <div className="stat-label">Recommended cases for defense audit</div>
              <div className="stat-hint">Audit-priority portfolio</div>
            </div>
            <div className="stat-cell">
              <div className="stat-value">{(byWorkbook['Federal / Audit / Finance Catalog'] || 0).toLocaleString()}</div>
              <div className="stat-label">Federal / audit / finance</div>
              <div className="stat-hint">Cross-sector catalog</div>
            </div>
            <div className="stat-cell">
              <div className="stat-value">{(byWorkbook['OMB 2025 Individually Reported AI Use Cases'] || 0).toLocaleString()}</div>
              <div className="stat-label">OMB individually reported</div>
              <div className="stat-hint">41 agencies, 2025 inventory</div>
            </div>
            <div className="stat-cell">
              <div className="stat-value">{(byWorkbook['OMB 2025 Consolidated COTS AI Use Cases'] || 0).toLocaleString()}</div>
              <div className="stat-label">OMB consolidated COTS</div>
              <div className="stat-hint">Common AI pattern adoption</div>
            </div>
            <div className="stat-cell">
              <div className="stat-value">{papersData?.papers?.length || 4}</div>
              <div className="stat-label">Indexed papers</div>
              <div className="stat-hint">{paperChunks || '90+'} searchable chunks</div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell">
          <div className="section-head">
            <div>
              <span className="eyebrow">Browse by catalog</span>
              <h2>Four source workbooks, one index</h2>
              <p className="lede">Each catalog has its own evidence standard and reporting basis. Start from whichever matches the question you're asking.</p>
            </div>
          </div>
          <div className="tile-grid">
            {WORKBOOK_ORDER.map((wb) => {
              const meta = workbookMeta(wb);
              return (
                <a key={wb} className="tile" href={`/browse?workbook=${encodeURIComponent(wb)}`}>
                  <div className="tile-count">{(byWorkbook[wb] || 0).toLocaleString()}</div>
                  <div className="tile-label">{meta.label}</div>
                  <div className="tile-desc">{meta.description}</div>
                </a>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell">
          <div className="section-head">
            <div>
              <span className="eyebrow">Get inspired</span>
              <h2>Featured use cases</h2>
              <p className="lede">Auto-selected top-priority, best-documented use case from each catalog, backfilled by priority score — a starting point, not an exhaustive list.</p>
            </div>
            <a className="section-link" href="/browse">See all {stats.total?.toLocaleString()} use cases →</a>
          </div>
          <div className="card-grid-3">
            {highlights.map((item) => (
              <UseCaseCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell">
          <div className="section-head">
            <div>
              <span className="eyebrow">Strategy &amp; adoption</span>
              <h2>Papers</h2>
              <p className="lede">Recommended strategy, adoption, and architecture guidance connecting selected use cases to audit-readiness outcomes.</p>
            </div>
            <a className="section-link" href="/papers">See all papers →</a>
          </div>
          <div className="card-grid-2">
            {papers.map((paper) => (
              <article className="paper-card" key={paper.paperId || paper.title}>
                <span className="doc-type">{paper.documentType || 'Paper'}</span>
                <h3>{paper.title}</h3>
                <p className="summary">{paper.summary}</p>
                <div className="paper-actions">
                  <a className="btn btn-primary" href={paper.downloads?.docx}>Download Word</a>
                  <a className="btn" href={paper.downloads?.pdf}>Download PDF</a>
                  <a className="btn" href="/papers">Read highlights</a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell">
          <div className="evidence-banner">
            <strong>Evidence note:</strong> the DoD FM workbook (v2.1) is a public-source-derived opportunity catalog, not
            an official complete list of deployed DoD AI systems. The OMB individually reported and consolidated COTS
            datasets are exact rows from the 2025 government-wide OMB AI use-case inventories and reflect agency
            self-reporting. Check each use case's Evidence Type and Source Basis before briefing leadership — see the
            {' '}<a href="/insights">insights dashboard</a> for a full breakdown by evidence type, priority, and risk.
          </div>
        </div>
      </section>
    </main>
  );
}
