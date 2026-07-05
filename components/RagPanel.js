"use client";

import { useState } from 'react';

const DEFAULT_QUERY = 'Show high-value AI use cases and adoption actions for audit readiness, data quality, governance, process redesign, and measurable business value.';

export default function RagPanel() {
  const [query, setQuery] = useState(DEFAULT_QUERY);
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
    <div className="rag-panel" id="rag">
      <h2>Ask the catalog and papers</h2>
      <p className="lede" style={{ margin: '8px 0 16px', color: 'var(--slate-600)' }}>
        Without Neon/OpenAI environment variables configured, this falls back to deterministic keyword retrieval
        across the use-case catalog and all indexed papers.
      </p>
      <textarea value={query} onChange={(event) => setQuery(event.target.value)} />
      <div className="rag-submit">
        <button type="button" className="btn btn-primary" onClick={ask} disabled={loading}>
          {loading ? 'Searching…' : 'Ask the library'}
        </button>
      </div>
      {answer ? (
        <div className="rag-answer">
          <p className="rag-mode">Mode: {answer.mode}</p>
          {answer.answer ? <p className="rag-answer-text">{answer.answer}</p> : null}
          <div className="mini-results">
            {(answer.results || []).slice(0, 6).map((r) => (
              <div key={r.id} className="mini-card">
                <strong>{r.id}: {r.useCaseName}</strong>
                <span>{r.missionArea} · {r.systemAssets}</span>
              </div>
            ))}
            {paperResults.slice(0, 6).map((r) => (
              <div key={r.id} className="mini-card">
                <strong>{r.id}: {r.title}</strong>
                <span>{r.paperTitle || r.documentType || 'Indexed paper'} · {String(r.text || '').slice(0, 150)}…</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
