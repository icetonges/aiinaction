import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is required. Copy .env.example to .env.local or set it in your shell.');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
await sql`CREATE EXTENSION IF NOT EXISTS vector;`;
await sql`
CREATE TABLE IF NOT EXISTS ai_use_cases (
  id TEXT PRIMARY KEY,
  workbook TEXT,
  catalog_type TEXT,
  sector TEXT,
  mission_area TEXT,
  domain TEXT,
  process TEXT,
  subprocess TEXT,
  owner TEXT,
  system_assets TEXT,
  use_case_name TEXT,
  description TEXT,
  ai_pattern TEXT,
  automation_level TEXT,
  expected_benefit TEXT,
  audit_impact TEXT,
  source_basis TEXT,
  source_url TEXT,
  source_name TEXT,
  evidence_type TEXT,
  risk_level TEXT,
  controls TEXT,
  data_needed TEXT,
  metrics TEXT,
  priority TEXT,
  complexity TEXT,
  mvp_scope TEXT,
  control_objective TEXT,
  text_for_embedding TEXT,
  metadata JSONB,
  embedding vector(1536)
);
`;
await sql`
CREATE TABLE IF NOT EXISTS ai_strategy_chunks (
  id TEXT PRIMARY KEY,
  paper_id TEXT,
  paper_title TEXT,
  document_type TEXT,
  title TEXT,
  section TEXT,
  text TEXT,
  download_docx TEXT,
  download_pdf TEXT,
  text_for_embedding TEXT,
  metadata JSONB,
  embedding vector(1536)
);
`;
await sql`ALTER TABLE ai_strategy_chunks ADD COLUMN IF NOT EXISTS paper_id TEXT;`;
await sql`ALTER TABLE ai_strategy_chunks ADD COLUMN IF NOT EXISTS paper_title TEXT;`;
await sql`ALTER TABLE ai_strategy_chunks ADD COLUMN IF NOT EXISTS document_type TEXT;`;
await sql`CREATE INDEX IF NOT EXISTS ai_use_cases_embedding_hnsw ON ai_use_cases USING hnsw (embedding vector_cosine_ops);`;
await sql`CREATE INDEX IF NOT EXISTS ai_use_cases_mission_idx ON ai_use_cases (mission_area);`;
await sql`CREATE INDEX IF NOT EXISTS ai_use_cases_workbook_idx ON ai_use_cases (workbook);`;
await sql`CREATE INDEX IF NOT EXISTS ai_strategy_chunks_embedding_hnsw ON ai_strategy_chunks USING hnsw (embedding vector_cosine_ops);`;
await sql`CREATE INDEX IF NOT EXISTS ai_strategy_chunks_section_idx ON ai_strategy_chunks (section);`;
await sql`CREATE INDEX IF NOT EXISTS ai_strategy_chunks_paper_idx ON ai_strategy_chunks (paper_id);`;
console.log('Neon schema initialized for use cases and indexed AI paper chunks.');
