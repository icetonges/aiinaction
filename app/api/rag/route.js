import { generateText, embed } from 'ai';
import { openai } from '@ai-sdk/openai';
import { neon } from '@neondatabase/serverless';
import { searchCatalog, searchStrategyPaper } from '@/lib/catalog';

const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || 'text-embedding-3-small';
const CHAT_MODEL = process.env.CHAT_MODEL || 'gpt-4o-mini';

function compact(row) {
  return {
    id: row.id,
    useCaseName: row.useCaseName,
    missionArea: row.missionArea,
    domain: row.domain,
    systemAssets: row.systemAssets,
    description: row.description,
    aiPattern: row.aiPattern,
    expectedBenefit: row.expectedBenefit,
    evidenceType: row.evidenceType,
    sourceUrl: row.sourceUrl,
  };
}

function compactStrategy(chunk) {
  return {
    id: chunk.id,
    title: chunk.title,
    section: chunk.section,
    text: String(chunk.text || '').slice(0, 900),
    downloadDocx: chunk.downloadDocx,
    downloadPdf: chunk.downloadPdf,
  };
}

function fallback(query, filters = {}) {
  const results = searchCatalog({ query, filters, limit: 12 }).map(compact);
  const strategyResults = searchStrategyPaper({ query, limit: 8 }).map(compactStrategy);
  return { results, strategyResults };
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const query = String(body.query || '').slice(0, 2000);
  if (!query) return Response.json({ mode: 'error', error: 'Missing query' }, { status: 400 });

  const canUseRag = Boolean(process.env.DATABASE_URL && process.env.OPENAI_API_KEY);
  if (!canUseRag) {
    const { results, strategyResults } = fallback(query, body.filters || {});
    return Response.json({
      mode: 'keyword-fallback',
      answer: 'Neon/OpenAI environment variables are not configured, so the API returned deterministic matches from the use-case catalog and the DoD FM AI strategy paper instead of vector RAG.',
      results,
      strategyResults,
    });
  }

  try {
    const { embedding } = await embed({ model: openai.embedding(EMBEDDING_MODEL), value: query });
    const sql = neon(process.env.DATABASE_URL);
    const vector = `[${embedding.join(',')}]`;

    const rows = await sql`
      SELECT id, use_case_name, mission_area, domain, system_assets, description, ai_pattern,
             expected_benefit, evidence_type, source_url,
             1 - (embedding <=> ${vector}::vector) AS similarity
      FROM ai_use_cases
      ORDER BY embedding <=> ${vector}::vector
      LIMIT 12;
    `;

    let strategyRows = [];
    try {
      strategyRows = await sql`
        SELECT id, title, section, text, download_docx, download_pdf,
               1 - (embedding <=> ${vector}::vector) AS similarity
        FROM ai_strategy_chunks
        ORDER BY embedding <=> ${vector}::vector
        LIMIT 8;
      `;
    } catch {
      strategyRows = [];
    }

    const catalogContext = rows.map((r, i) => `${i + 1}. ${r.id} — ${r.use_case_name}\nMission: ${r.mission_area}\nSystem/assets: ${r.system_assets}\nDescription: ${r.description}\nPattern: ${r.ai_pattern}\nBenefit: ${r.expected_benefit}\nEvidence: ${r.evidence_type}\nSource: ${r.source_url}`).join('\n\n');

    const strategyContext = strategyRows.map((r, i) => `${i + 1}. ${r.id} — ${r.title}\nSection: ${r.section}\nText: ${String(r.text || '').slice(0, 2200)}`).join('\n\n');

    const { text } = await generateText({
      model: openai(CHAT_MODEL),
      system: 'You answer questions using only the provided AI use-case catalog and DoD FM AI integration strategy paper context. Be precise. Say when a row is a candidate/opportunity rather than a confirmed deployed system. Connect recommendations to audit outcomes when the strategy paper provides that context.',
      prompt: `Question: ${query}\n\nCatalog context:\n${catalogContext}\n\nStrategy paper context:\n${strategyContext}\n\nAnswer with 5-10 bullet points. Cite catalog row IDs and/or strategy chunk IDs in parentheses.`,
    });

    return Response.json({
      mode: 'neon-pgvector-rag',
      answer: text,
      results: rows.map((r) => ({
        id: r.id,
        useCaseName: r.use_case_name,
        missionArea: r.mission_area,
        domain: r.domain,
        systemAssets: r.system_assets,
        description: r.description,
        aiPattern: r.ai_pattern,
        expectedBenefit: r.expected_benefit,
        evidenceType: r.evidence_type,
        sourceUrl: r.source_url,
        similarity: Number(r.similarity),
      })),
      strategyResults: strategyRows.map((r) => ({
        id: r.id,
        title: r.title,
        section: r.section,
        text: String(r.text || '').slice(0, 900),
        downloadDocx: r.download_docx,
        downloadPdf: r.download_pdf,
        similarity: Number(r.similarity),
      })),
    });
  } catch (error) {
    const { results, strategyResults } = fallback(query, body.filters || {});
    return Response.json({ mode: 'rag-error-keyword-fallback', error: error.message, results, strategyResults }, { status: 200 });
  }
}
