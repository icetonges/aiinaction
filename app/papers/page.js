import RagPanel from '@/components/RagPanel';
import { papersData } from '@/lib/catalog';

export const metadata = { title: 'Strategy and adoption papers' };

export default function PapersPage() {
  const papers = papersData?.papers || [];

  return (
    <main>
      <div className="shell">
        <div className="breadcrumb">
          <a href="/">Home</a>
          <span className="sep">/</span>
          <span className="current">Papers</span>
        </div>
      </div>

      <section className="section">
        <div className="shell">
          <div className="section-head">
            <div>
              <span className="eyebrow">Strategy &amp; adoption</span>
              <h2>Papers</h2>
              <p className="lede">
                Four papers connect the use-case catalog to business outcomes: audit-readiness strategy, general AI
                adoption practice, practical adoption guidance, and the Advana-FM architecture blueprint.
              </p>
            </div>
          </div>

          <div className="card-grid-2">
            {papers.map((paper) => (
              <article className="paper-card" key={paper.paperId || paper.title}>
                <span className="doc-type">{paper.documentType || 'Paper'}</span>
                <h3>{paper.title}</h3>
                {paper.subtitle ? <p className="summary" style={{ fontWeight: 700, color: 'var(--slate-700)' }}>{paper.subtitle}</p> : null}
                <p className="summary">{paper.summary}</p>
                <div className="paper-actions">
                  <a className="btn btn-primary" href={paper.downloads?.docx}>Download Word</a>
                  <a className="btn" href={paper.downloads?.pdf}>Download PDF</a>
                  <a className="btn" href="#rag">Ask about this paper</a>
                </div>
                {(paper.highlights || []).length ? (
                  <div className="paper-highlights">
                    {(paper.highlights || []).slice(0, 3).map((item) => (
                      <div className="paper-highlight" key={item.id}>
                        <span className="hid">{item.title}</span>
                        <p>{String(item.text || '').replace(/\|/g, ' ').slice(0, 220)}…</p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell">
          <RagPanel />
        </div>
      </section>
    </main>
  );
}
