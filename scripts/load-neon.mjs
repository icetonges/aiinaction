import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { neon } from '@neondatabase/serverless';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../public/data/usecases.json'), 'utf8'));
const papersData = JSON.parse(fs.readFileSync(path.join(__dirname, '../public/data/papers.json'), 'utf8'));
// Raw source-spreadsheet rows live outside public/data so they aren't bundled into
// every Next.js function that imports lib/catalog.js (see public/data/usecases.json,
// which no longer carries an `original` field per row). Only this load script needs it.
const originalsPath = path.join(__dirname, '../data/usecases-original.json');
const originals = fs.existsSync(originalsPath) ? JSON.parse(fs.readFileSync(originalsPath, 'utf8')) : {};

function toEmbeddingText(item) {
  return [
    `ID: ${item.id}`,
    `Workbook: ${item.workbook}`,
    `Sector: ${item.sector}`,
    `Mission area: ${item.missionArea}`,
    `Domain: ${item.domain}`,
    `Process: ${item.process}`,
    `System/assets: ${item.systemAssets}`,
    `Use case: ${item.useCaseName}`,
    `Description: ${item.description}`,
    `AI pattern: ${item.aiPattern}`,
    `Benefit: ${item.expectedBenefit}`,
    `Controls: ${item.controls}`,
    `Evidence/source basis: ${item.evidenceType || item.sourceBasis}`,
    `Source: ${item.sourceName || item.sourceBasis} ${item.sourceUrl}`,
  ].filter(Boolean).join('\n');
}

function allPaperChunks() {
  return (papersData.papers || []).flatMap((paper) =>
    (paper.chunks || []).map((chunk) => ({
      ...chunk,
      paperId: chunk.paperId || paper.paperId,
      paperTitle: chunk.paperTitle || paper.title,
      documentType: chunk.documentType || paper.documentType,
      downloadDocx: chunk.downloadDocx || paper.downloads?.docx,
      downloadPdf: chunk.downloadPdf || paper.downloads?.pdf,
    }))
  );
}

function toPaperEmbeddingText(chunk) {
  return [
    `ID: ${chunk.id}`,
    `Document: ${chunk.paperTitle}`,
    `Document type: ${chunk.documentType}`,
    `Section: ${chunk.section || chunk.title}`,
    `Text: ${chunk.text}`,
  ].filter(Boolean).join('\n');
}

const DATABASE_URL = process.env.DATABASE_URL;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const MODEL = process.env.EMBEDDING_MODEL || 'text-embedding-3-small';

if (!DATABASE_URL || !OPENAI_API_KEY) {
  console.error('DATABASE_URL and OPENAI_API_KEY are required.');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function embedBatch(inputs) {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({ model: MODEL, input: inputs }),
  });
  if (!response.ok) throw new Error(`OpenAI embedding failed: ${response.status} ${await response.text()}`);
  const payload = await response.json();
  return payload.data.map((d) => d.embedding);
}

const BATCH = 50;
for (let i = 0; i < data.length; i += BATCH) {
  const rows = data.slice(i, i + BATCH);
  const texts = rows.map(toEmbeddingText);
  const embeddings = await embedBatch(texts);
  for (let j = 0; j < rows.length; j++) {
    const r = rows[j];
    const vector = `[${embeddings[j].join(',')}]`;
    await sql`
      INSERT INTO ai_use_cases (
        id, workbook, catalog_type, sector, mission_area, domain, process, subprocess, owner,
        system_assets, use_case_name, description, ai_pattern, automation_level, expected_benefit,
        audit_impact, source_basis, source_url, source_name, evidence_type, risk_level, controls,
        data_needed, metrics, priority, complexity, mvp_scope, control_objective, text_for_embedding,
        metadata, embedding
      ) VALUES (
        ${r.id}, ${r.workbook}, ${r.catalogType}, ${r.sector}, ${r.missionArea}, ${r.domain}, ${r.process}, ${r.subprocess}, ${r.owner},
        ${r.systemAssets}, ${r.useCaseName}, ${r.description}, ${r.aiPattern}, ${r.automationLevel}, ${r.expectedBenefit},
        ${r.auditImpact}, ${r.sourceBasis}, ${r.sourceUrl}, ${r.sourceName}, ${r.evidenceType}, ${r.riskLevel}, ${r.controls},
        ${r.dataNeeded}, ${r.metrics}, ${r.priority}, ${r.complexity}, ${r.mvpScope}, ${r.controlObjective}, ${texts[j]},
        ${JSON.stringify(originals[r.id] || {})}::jsonb, ${vector}::vector
      )
      ON CONFLICT (id) DO UPDATE SET
        workbook = EXCLUDED.workbook,
        catalog_type = EXCLUDED.catalog_type,
        sector = EXCLUDED.sector,
        mission_area = EXCLUDED.mission_area,
        domain = EXCLUDED.domain,
        process = EXCLUDED.process,
        subprocess = EXCLUDED.subprocess,
        owner = EXCLUDED.owner,
        system_assets = EXCLUDED.system_assets,
        use_case_name = EXCLUDED.use_case_name,
        description = EXCLUDED.description,
        ai_pattern = EXCLUDED.ai_pattern,
        automation_level = EXCLUDED.automation_level,
        expected_benefit = EXCLUDED.expected_benefit,
        audit_impact = EXCLUDED.audit_impact,
        source_basis = EXCLUDED.source_basis,
        source_url = EXCLUDED.source_url,
        source_name = EXCLUDED.source_name,
        evidence_type = EXCLUDED.evidence_type,
        risk_level = EXCLUDED.risk_level,
        controls = EXCLUDED.controls,
        data_needed = EXCLUDED.data_needed,
        metrics = EXCLUDED.metrics,
        priority = EXCLUDED.priority,
        complexity = EXCLUDED.complexity,
        mvp_scope = EXCLUDED.mvp_scope,
        control_objective = EXCLUDED.control_objective,
        text_for_embedding = EXCLUDED.text_for_embedding,
        metadata = EXCLUDED.metadata,
        embedding = EXCLUDED.embedding;
    `;
  }
  console.log(`Loaded use cases ${Math.min(i + BATCH, data.length)} / ${data.length}`);
}

const chunks = allPaperChunks();
for (let i = 0; i < chunks.length; i += BATCH) {
  const rows = chunks.slice(i, i + BATCH);
  const texts = rows.map(toPaperEmbeddingText);
  const embeddings = await embedBatch(texts);
  for (let j = 0; j < rows.length; j++) {
    const r = rows[j];
    const vector = `[${embeddings[j].join(',')}]`;
    await sql`
      INSERT INTO ai_strategy_chunks (
        id, paper_id, paper_title, document_type, title, section, text, download_docx, download_pdf, text_for_embedding, metadata, embedding
      ) VALUES (
        ${r.id}, ${r.paperId}, ${r.paperTitle}, ${r.documentType}, ${r.title}, ${r.section}, ${r.text}, ${r.downloadDocx}, ${r.downloadPdf}, ${texts[j]}, ${JSON.stringify({ sectionId: r.sectionId, source: r.source })}::jsonb, ${vector}::vector
      )
      ON CONFLICT (id) DO UPDATE SET
        paper_id = EXCLUDED.paper_id,
        paper_title = EXCLUDED.paper_title,
        document_type = EXCLUDED.document_type,
        title = EXCLUDED.title,
        section = EXCLUDED.section,
        text = EXCLUDED.text,
        download_docx = EXCLUDED.download_docx,
        download_pdf = EXCLUDED.download_pdf,
        text_for_embedding = EXCLUDED.text_for_embedding,
        metadata = EXCLUDED.metadata,
        embedding = EXCLUDED.embedding;
    `;
  }
  console.log(`Loaded paper chunks ${Math.min(i + BATCH, chunks.length)} / ${chunks.length}`);
}

console.log('All use cases and indexed paper chunks loaded into Neon.');
