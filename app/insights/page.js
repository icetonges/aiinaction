import { stats, topEntries, workbookMeta } from '@/lib/catalog';

export const metadata = { title: 'Insights' };

const PRIORITY_ORDER = ['Very High', 'High', 'Medium', 'Low', 'Unassigned'];
const RISK_ORDER = ['High', 'Medium-High', 'Medium', 'Low-Medium', 'Low', 'Unassigned'];

function orderedEntries(map, order) {
  const entries = Object.entries(map || {});
  return order
    .filter((key) => map && map[key] !== undefined)
    .map((key) => [key, map[key]])
    .concat(entries.filter(([key]) => !order.includes(key)));
}

function BarPanel({ title, hint, entries, total, labelFor }) {
  const max = entries.reduce((m, [, count]) => Math.max(m, count), 0) || 1;
  return (
    <div className="insight-panel">
      <h3>{title}</h3>
      {hint ? <p className="lede" style={{ marginBottom: 14, color: 'var(--slate-500)', fontSize: '0.82rem' }}>{hint}</p> : null}
      {entries.map(([key, count]) => (
        <div className="bar-item" key={key}>
          <div className="bar-label">
            <span>{labelFor ? labelFor(key) : key}</span>
            <span className="bar-value">{count.toLocaleString()}{total ? ` (${Math.round((count / total) * 100)}%)` : ''}</span>
          </div>
          <div className="bar-track">
            <div className="bar-fill" style={{ width: `${Math.max(3, Math.round((count / max) * 100))}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function InsightsPage() {
  const total = stats.total || 0;
  const byWorkbook = orderedEntries(stats.byWorkbook, ['DoD FM AI Use Case Catalog', 'Federal / Audit / Finance Catalog', 'OMB 2025 Individually Reported AI Use Cases', 'OMB 2025 Consolidated COTS AI Use Cases']);
  const byPriority = orderedEntries(stats.byPriority, PRIORITY_ORDER);
  const byRisk = orderedEntries(stats.byRiskLevel, RISK_ORDER);
  const byEvidence = topEntries(stats.byEvidenceType, 8);
  const bySector = topEntries(stats.bySector, 8);
  const byMissionArea = topEntries(stats.byMissionArea, 10);

  return (
    <main>
      <div className="shell">
        <div className="breadcrumb">
          <a href="/">Home</a>
          <span className="sep">/</span>
          <span className="current">Insights</span>
        </div>
      </div>

      <section className="section">
        <div className="shell">
          <div className="section-head">
            <div>
              <span className="eyebrow">Explore the data</span>
              <h2>Catalog at a glance</h2>
              <p className="lede">
                A survey of all {total.toLocaleString()} use cases before you drill into individual rows — by
                workbook, priority, risk, evidence quality, sector, and mission area.
              </p>
            </div>
            <a className="section-link" href="/browse">Open full catalog →</a>
          </div>

          <div className="insight-grid">
            <BarPanel
              title="By workbook"
              hint="The four source catalogs behind this library."
              entries={byWorkbook}
              total={total}
              labelFor={(key) => workbookMeta(key).shortLabel}
            />
            <BarPanel
              title="By priority"
              hint="Defense audit priority; other catalogs are mostly unassigned/opportunity rows."
              entries={byPriority}
              total={total}
            />
            <BarPanel
              title="By risk level"
              hint="Assigned mainly on the defense audit catalog and OMB high-impact determinations."
              entries={byRisk}
              total={total}
            />
            <BarPanel
              title="By evidence type"
              hint="How directly each row is tied to a public-source system, process, or exact inventory row."
              entries={byEvidence}
              total={total}
            />
            <BarPanel
              title="Top sectors"
              entries={bySector}
              total={total}
            />
            <BarPanel
              title="Top mission areas"
              entries={byMissionArea}
              total={total}
            />
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell">
          <div className="evidence-banner">
            <strong>How to read this:</strong> Priority, risk, and portfolio-tier scoring apply most fully to the defense
            audit catalog. The OMB individually reported and consolidated COTS datasets are exact inventory rows and
            largely appear as "Unassigned" here until reviewed against defense audit priorities — see each use case's
            detail page for its full evidence trail.
          </div>
        </div>
      </section>
    </main>
  );
}
