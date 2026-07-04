# DoD FM AI Use Case Library

This is a deployable **Next.js + CSS + JavaScript** website containing every use-case row from both Excel workbooks:

- `dod_fm_ai_use_case_catalog.xlsx` — **1,341** DoD Financial Management use cases
- `ai_use_case_catalog_federal_audit_finance.xlsx` — **550** federal, audit, accounting, and financial-industry use cases
- Combined site data: **1,891** use-case rows

The app includes:

1. A searchable/filterable catalog UI.
2. Source links preserved on each use-case card.
3. Original Excel workbooks copied into `/public/downloads`.
4. `/api/search` deterministic keyword search.
5. `/api/rag` RAG endpoint with Neon + pgvector + AI SDK, with keyword fallback when environment variables are missing.
6. Neon loading scripts to create the vector table and upsert all catalog rows.

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
git commit -m "Initial AI use-case library"
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

## Evidence note

The DoD FM workbook should be represented as a **public-source-derived AI opportunity catalog**, not an official list of confirmed deployed DoD production AI systems. Keep the `Evidence Type`, `Source Basis`, and `Source URL` fields visible in briefings.

## Data checks

```bash
npm run check:data
```

Expected output includes total row count of **1,891**.
