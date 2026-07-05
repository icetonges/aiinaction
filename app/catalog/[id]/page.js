import { notFound } from 'next/navigation';
import UseCaseCard from '@/components/UseCaseCard';
import { allIds, getById, relatedItems, workbookMeta } from '@/lib/catalog';
import { priorityTone, riskTone } from '@/lib/ui';

export const dynamicParams = false;

export function generateStaticParams() {
  return allIds().map((id) => ({ id }));
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const item = getById(id);
  if (!item) return { title: 'Use case not found' };
  return {
    title: item.useCaseName,
    description: item.description || item.detailedExample || undefined,
  };
}

function Field({ label, value }) {
  if (!value) return null;
  return (
    <div className="detail-block">
      <h3>{label}</h3>
      <p>{value}</p>
    </div>
  );
}

function SideRow({ label, value }) {
  if (!value) return null;
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

export default async function UseCaseDetailPage({ params }) {
  const { id } = await params;
  const item = getById(id);
  if (!item) notFound();

  const meta = workbookMeta(item.workbook);
  const related = relatedItems(item, 6);

  return (
    <main>
      <div className="shell">
        <div className="breadcrumb">
          <a href="/">Home</a>
          <span className="sep">/</span>
          <a href="/browse">Browse catalog</a>
          <span className="sep">/</span>
          <a href={`/browse?workbook=${encodeURIComponent(item.workbook)}`}>{meta.shortLabel}</a>
          <span className="sep">/</span>
          <span className="current">{item.id}</span>
        </div>
      </div>

      <div className="shell detail-layout">
        <div>
          <div className="detail-header">
            <span className="badge" data-tone="workbook">{meta.shortLabel}</span>
            <h1>{item.useCaseName}</h1>
            <div className="detail-badges">
              {item.priority ? <span className="badge" data-tone={priorityTone(item.priority)}>{item.priority} priority</span> : null}
              {item.riskLevel ? <span className="badge" data-tone={riskTone(item.riskLevel)}>{item.riskLevel} risk</span> : null}
              {item.evidenceType ? <span className="badge">{item.evidenceType}</span> : null}
              {item.portfolioTier ? <span className="badge">{item.portfolioTier}</span> : null}
              {item.complexity ? <span className="badge">{item.complexity} complexity</span> : null}
            </div>
          </div>

          <Field label="Description" value={item.description} />
          {item.detailedExample && item.detailedExample !== item.description ? (
            <Field label="Detailed example" value={item.detailedExample} />
          ) : null}
          <Field label="AI / analytics pattern" value={item.aiPattern} />
          <Field label="Automation level / stage" value={item.automationLevel} />
          <Field label="Expected benefit" value={item.expectedBenefit} />
          <Field label="Audit / financial statement impact" value={item.auditImpact} />
          <Field label="Controls / human review" value={item.controls} />
          <Field label="Data needed" value={item.dataNeeded} />
          <Field label="Possible metrics" value={item.metrics} />
          <Field label="MVP scope" value={item.mvpScope} />
          <Field label="Related material weakness / control objective" value={item.controlObjective} />
          <Field label="Reassessment rationale" value={item.reassessmentRationale} />

          {item.sourceUrl ? (
            <div className="detail-block">
              <h3>Source</h3>
              <p><a href={item.sourceUrl} target="_blank" rel="noreferrer">{item.sourceName || item.sourceBasis || 'Open source'}</a></p>
            </div>
          ) : null}
        </div>

        <aside className="side-panel">
          <dl>
            <SideRow label="Use case ID" value={item.id} />
            <SideRow label="Workbook" value={item.workbook} />
            <SideRow label="Sector" value={item.sector} />
            <SideRow label="Subsector / organization" value={item.subsector} />
            <SideRow label="Owner" value={item.owner} />
            <SideRow label="Mission area" value={item.missionArea} />
            <SideRow label="Domain" value={item.domain} />
            <SideRow label="Process" value={item.process} />
            <SideRow label="Subprocess" value={item.subprocess} />
            <SideRow label="System / data assets" value={item.systemAssets} />
            <SideRow label="Portfolio tier" value={item.portfolioTier} />
            <SideRow label="Portfolio lane" value={item.portfolioLane} />
            <SideRow label="Weighted portfolio score" value={item.weightedPortfolioScore} />
            <SideRow label="Vendor" value={item.vendor} />
            <SideRow label="Agency" value={item.agencyAbbreviation} />
            <SideRow label="Evidence type" value={item.evidenceType} />
            <SideRow label="Source basis" value={item.sourceBasis} />
          </dl>
        </aside>
      </div>

      {related.length ? (
        <section className="related-section">
          <div className="shell">
            <div className="section-head">
              <div>
                <span className="eyebrow">Related</span>
                <h2>More from {item.missionArea || meta.shortLabel}</h2>
              </div>
            </div>
            <div className="card-grid-3">
              {related.map((r) => (
                <UseCaseCard key={r.id} item={r} />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </main>
  );
}
