# DoD FM AI Use Case Library

This is a deployable **Next.js + CSS + JavaScript** website containing every use-case row from five Excel workbooks, plus four downloadable and RAG-searchable papers:

1. **DoD FM AI Integration Strategy Paper**
2. **General AI Integration and Adoption Strategy Paper**

## Included content

- `dod_fm_ai_use_case_catalog.xlsx` — **1,381** DoD Financial Management use cases (v2.1 full scoreable portfolio; replaces the prior 1,341-row catalog)
- `ai_use_case_catalog_federal_audit_finance.xlsx` — **550** federal, audit, accounting, and financial-industry use cases
- `omb_2025_individually_reported_ai_use_cases.xlsx` — **3,611** individually reported use cases from the 2025 OMB government-wide AI use-case inventory
- `omb_2025_consolidated_cots_ai_use_cases.xlsx` — **900** consolidated COTS/common-use AI pattern rows reported across agencies
- Combined site data: **6,442** use-case rows
- `DoD_FM_AI_Integration_Strategy_Paper.docx` and `.pdf` — added to `/public/downloads`
- `General_AI_Integration_and_Adoption_Strategy_Paper.docx` and `.pdf` — added to `/public/downloads`
- `AI_Practical_Adoption_Guidance_and_Best_Practices_Paper.docx` and `.pdf` — added to `/public/downloads`
- `Advana_FM_AI_Integration_Architecture_Blueprint_Paper.docx` and `.pdf` — added to `/public/downloads`
- `papers.json` — four papers indexed for deterministic search and optional Neon/pgvector RAG retrieval
- Custom favicon and app icon assets in `app/favicon.ico`, `app/apple-icon.png`, `public/favicon.png`, and `public/favicon.svg`

The app includes:

1. A searchable/filterable catalog UI.
2. A paper section with Word/PDF downloads for both papers.
3. Source links preserved on each use-case card.
4. Original Excel workbooks copied into `/public/downloads`.
5. `/api/search` deterministic keyword search across the catalog and indexed papers.
6. `/api/rag` RAG endpoint with Neon + pgvector + AI SDK, with keyword fallback when environment variables are missing.
7. Neon loading scripts to create vector tables and upsert all catalog rows plus all indexed paper chunks.
8. A custom AI-library favicon for the browser tab and app icon.

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
git commit -m "Add AI use-case library, papers, and favicon"
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

The schema uses pgvector with `vector(1536)` because the default embedding model is `text-embedding-3-small`. The `ai_strategy_chunks` table now stores the DoD FM strategy paper, the general AI adoption paper, the AI practical adoption guidance paper, and the Advana-FM architecture blueprint paper.

## What changed in this version

- Added the **General AI Integration and Adoption Strategy Paper** to the app as downloadable Word and PDF files.
- Added a custom favicon and app icon.
- Added `public/data/general-ai-adoption-paper.json` and `public/data/papers.json`.
- Updated the homepage to show both papers.
- Updated `/api/search` to return `paperResults` alongside use-case results.
- Updated `/api/rag` to retrieve from both `ai_use_cases` and indexed paper chunks when Neon is configured.
- Updated Neon scripts to create/load the expanded paper metadata and chunks.
- Updated `npm run check:data` to verify the two papers and icon files.

## Evidence note

The DoD FM workbook should be represented as a **public-source-derived AI opportunity catalog**, not an official list of confirmed deployed DoD production AI systems. Keep the `Evidence Type`, `Source Basis`, and `Source URL` fields visible in briefings.

The DoD FM AI Integration Strategy Paper is a recommended strategy document. It connects selected AI opportunities to audit-readiness outcomes, especially Working Capital Fund audit readiness by September 2027 and department-wide audit readiness by December 31, 2028.

The General AI Integration and Adoption Strategy Paper is a companion paper. It explains why almost any business process, event, action, decision, document, transaction, or workflow can become an AI use-case candidate, and what must be true for successful adoption from data, resource, environment, process, governance, control, and human-in-the-loop perspectives.

## Data checks

```bash
npm run check:data
```

Expected output includes total row count of **6,442**, at least **4** indexed papers, no missing downloadable files, and no missing favicon/icon assets.


## Added Advana-FM architecture and practical adoption guidance

This update adds the AI Practical Adoption Guidance and Best Practices Paper and the Advana-FM AI Integration Architecture Blueprint Paper. The Advana-FM paper reinforces the operating concept that Advana-FM is the technical accelerator for the audit goal and AI is a governed layer within Advana-FM for reconciliation, evidence generation, anomaly detection, control validation, and audit-remediation execution.

## DoD FM v2.1 catalog replacement and OMB 2025 inventory insert

- Replaced the DoD FM AI Use Case Catalog data and workbook with the **v2.1 full scoreable portfolio** (1,381 rows), which restores 462 previously-removed candidate rows as scoreable items and adds 40 new audit-priority use cases, each with scoring columns (Portfolio Tier, Portfolio Lane, Weighted Portfolio Score, V2 Priority/Status) preserved in each row's `original` data and surfaced as `portfolioTier`, `portfolioLane`, and `catalogVersion` fields.
- Inserted the **OMB 2025 individually reported AI use cases** (3,611 rows across 41 agencies) and the **OMB 2025 consolidated COTS/common-use AI patterns** (900 rows, including both reported use and non-use) as two new workbooks in the site data, each downloadable from the homepage.
- Site total grew from 1,891 to **6,442** use-case rows across five workbooks.
