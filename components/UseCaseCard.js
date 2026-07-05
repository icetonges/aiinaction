import { workbookMeta } from '@/lib/catalog';
import { priorityTone, riskTone, truncate } from '@/lib/ui';

export default function UseCaseCard({ item }) {
  const meta = workbookMeta(item.workbook);
  return (
    <a className="usecase-card" href={`/catalog/${encodeURIComponent(item.id)}`}>
      <div className="card-topline">
        <span className="cid">{item.id}</span>
        <span>{meta.shortLabel}</span>
      </div>
      <h3>{item.useCaseName}</h3>
      <p className="card-desc">{truncate(item.description || item.detailedExample, 180)}</p>
      <div className="badge-row">
        <span className="badge" data-tone="workbook">{meta.shortLabel}</span>
        {item.missionArea ? <span className="badge">{item.missionArea}</span> : null}
        {item.priority ? <span className="badge" data-tone={priorityTone(item.priority)}>{item.priority} priority</span> : null}
        {item.riskLevel ? <span className="badge" data-tone={riskTone(item.riskLevel)}>{item.riskLevel} risk</span> : null}
      </div>
    </a>
  );
}
