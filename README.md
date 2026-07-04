# DoD FM AI Use Case Library

This is a deployable **Next.js + CSS + JavaScript** website containing every use-case row from both Excel workbooks, plus the DoD FM AI Integration Strategy Paper.

## Included content

- `dod_fm_ai_use_case_catalog.xlsx` — **1,341** DoD Financial Management use cases
- `ai_use_case_catalog_federal_audit_finance.xlsx` — **550** federal, audit, accounting, and financial-industry use cases
- Combined site data: **1,891** use-case rows
- `DoD_FM_AI_Integration_Strategy_Paper.docx` — strategy paper added to `/public/downloads`
- `DoD_FM_AI_Integration_Strategy_Paper.pdf` — PDF version added to `/public/downloads`
- `strategy-paper.json` — strategy paper indexed into **25 chunks** for RAG retrieval

The app includes:

1. A searchable/filterable catalog UI.
2. A strategy-paper section with Word/PDF downloads.
3. Source links preserved on each use-case card.
4. Original Excel workbooks copied into `/public/downloads`.
5. `/api/search` deterministic keyword search across the catalog, plus strategy-paper document matches.
6. `/api/rag` RAG endpoint with Neon + pgvector + AI SDK, with keyword fallback when environment variables are missing.
7. Neon loading scripts to create vector tables and upsert all catalog rows plus strategy-paper chunks.

## Local setup

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Deploy to GitHub + Vercel

```bash
git init
git add .
git commit -m "Add AI use-case library and DoD FM AI strategy paper"
git branch -M main
git remote add origin https://github.com/<your-user>/<your-repo>.git
git push -u origin main
```

Then import the GitHub repo into Vercel and deploy.

## Optional Neon RAG setup

Create a Neon Postgres database, then set these environment variables locally and in Vercel:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST.neon.tech/DB?sslmode=require"
OPENAI_API_KEY="sk-..."
EMBEDDING_MODEL="text-embedding-3-small"
CHAT_MODEL="gpt-4o-mini"
```

Initialize the database and load embeddings:

```bash
npm run init:neon
npm run load:neon
```

The schema uses pgvector with `vector(1536)` because the default embedding model is `text-embedding-3-small`.

## What changed in this version

- Added the DoD FM AI Integration Strategy Paper to the app as downloadable Word and PDF files.
- Added a strategy-paper UI section on the homepage.
- Added `public/data/strategy-paper.json` so the strategy paper is searchable and retrievable by the RAG endpoint.
- Updated `/api/search` to return `strategyResults` alongside use-case results.
- Updated `/api/rag` to retrieve from both `ai_use_cases` and `ai_strategy_chunks` when Neon is configured.
- Updated Neon scripts to create and load the `ai_strategy_chunks` vector table.

## Evidence note

The DoD FM workbook should be represented as a **public-source-derived AI opportunity catalog**, not an official list of confirmed deployed DoD production AI systems. Keep the `Evidence Type`, `Source Basis`, and `Source URL` fields visible in briefings.

The DoD FM AI Integration Strategy Paper is a recommended strategy document. It connects selected AI opportunities to audit-readiness outcomes, especially Working Capital Fund audit readiness by September 2027 and department-wide audit readiness by December 31, 2028.

## Data checks

```bash
npm run check:data
```

Expected output includes total row count of **1,891**, strategy chunk count of **25**, and no missing downloadable files.
