import { generateText, embed } from 'ai';
import { openai } from '@ai-sdk/openai';
import { neon } from '@neondatabase/serverless';
import { searchCatalog } from '@/lib/catalog';

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

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const query = String(body.query || '').slice(0, 2000);
  if (!query) return Response.json({ mode: 'error', error: 'Missing query' }, { status: 400 });

  const canUseRag = Boolean(process.env.DATABASE_URL && process.env.OPENAI_API_KEY);
  if (!canUseRag) {
    const results = searchCatalog({ query, filters: body.filters || {}, limit: 12 }).map(compact);
    return Response.json({
      mode: 'keyword-fallback',
      answer: 'Neon/OpenAI environment variables are not configured, so the API returned deterministic catalog matches instead of vector RAG.',
      results,
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
    const context = rows.map((r, i) => `${i + 1}. ${r.id} — ${r.use_case_name}
Mission: ${r.mission_area}
System/assets: ${r.system_assets}
Description: ${r.description}
Pattern: ${r.ai_pattern}
Benefit: ${r.expected_benefit}
Evidence: ${r.evidence_type}
Source: ${r.source_url}`).join('

');
    const { text } = await generateText({
      model: openai(CHAT_MODEL),
      system: 'You answer questions using only the provided AI use-case catalog context. Be precise. Say when a row is a candidate/opportunity rather than a confirmed deployed system.',
      prompt: `Question: ${query}

Catalog context:
${context}

Answer with 5-10 bullet points and cite the row IDs in parentheses.`,
    });
    return Response.json({ mode: 'neon-pgvector-rag', answer: text, results: rows.map((r) => ({
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
    })) });
  } catch (error) {
    const results = searchCatalog({ query, filters: body.filters || {}, limit: 12 }).map(compact);
    return Response.json({ mode: 'rag-error-keyword-fallback', error: error.message, results }, { status: 200 });
  }
}
