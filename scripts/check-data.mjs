import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../public/data/usecases.json'), 'utf8'));
const papersData = JSON.parse(fs.readFileSync(path.join(__dirname, '../public/data/papers.json'), 'utf8'));

const byWorkbook = data.reduce((acc, row) => {
  acc[row.workbook] = (acc[row.workbook] || 0) + 1;
  return acc;
}, {});

const paperChunks = (papersData.papers || []).reduce((sum, paper) => sum + (paper.chunks?.length || 0), 0);

const requiredDownloads = [
  '../public/downloads/dod_fm_ai_use_case_catalog.xlsx',
  '../public/downloads/ai_use_case_catalog_federal_audit_finance.xlsx',
  '../public/downloads/omb_2025_individually_reported_ai_use_cases.xlsx',
  '../public/downloads/omb_2025_consolidated_cots_ai_use_cases.xlsx',
  '../public/downloads/DoD_FM_AI_Integration_Strategy_Paper.docx',
  '../public/downloads/DoD_FM_AI_Integration_Strategy_Paper.pdf',
  '../public/downloads/General_AI_Integration_and_Adoption_Strategy_Paper.docx',
  '../public/downloads/General_AI_Integration_and_Adoption_Strategy_Paper.pdf',
  '../public/downloads/AI_Practical_Adoption_Guidance_and_Best_Practices_Paper.docx',
  '../public/downloads/AI_Practical_Adoption_Guidance_and_Best_Practices_Paper.pdf',
  '../public/downloads/Advana_FM_AI_Integration_Architecture_Blueprint_Paper.docx',
  '../public/downloads/Advana_FM_AI_Integration_Architecture_Blueprint_Paper.pdf',
  '../app/favicon.ico',
  '../app/apple-icon.png',
  '../public/favicon.png',
  '../public/favicon.svg',
];

const missingDownloads = requiredDownloads.filter((relPath) => !fs.existsSync(path.join(__dirname, relPath)));

console.log({
  totalUseCases: data.length,
  byWorkbook,
  papers: papersData.papers?.length || 0,
  paperChunks,
  paperTitles: (papersData.papers || []).map((p) => p.title),
  missingDownloads,
});

if (data.length !== 6442) {
  console.error('Expected 6,442 rows from all five workbooks.');
  process.exit(1);
}
if ((papersData.papers?.length || 0) < 4) {
  console.error('Expected at least four indexed papers.');
  process.exit(1);
}
if (paperChunks < 2) {
  console.error('Expected paper chunks to be indexed.');
  process.exit(1);
}
if (missingDownloads.length) {
  console.error('Missing expected downloadable files or icon files.');
  process.exit(1);
}
