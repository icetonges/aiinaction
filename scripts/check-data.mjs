import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../public/data/usecases.json'), 'utf8'));
const strategyPaper = JSON.parse(fs.readFileSync(path.join(__dirname, '../public/data/strategy-paper.json'), 'utf8'));

const byWorkbook = data.reduce((acc, row) => {
  acc[row.workbook] = (acc[row.workbook] || 0) + 1;
  return acc;
}, {});

const requiredDownloads = [
  '../public/downloads/dod_fm_ai_use_case_catalog.xlsx',
  '../public/downloads/ai_use_case_catalog_federal_audit_finance.xlsx',
  '../public/downloads/DoD_FM_AI_Integration_Strategy_Paper.docx',
  '../public/downloads/DoD_FM_AI_Integration_Strategy_Paper.pdf',
];

const missingDownloads = requiredDownloads.filter((relPath) => !fs.existsSync(path.join(__dirname, relPath)));

console.log({
  totalUseCases: data.length,
  byWorkbook,
  strategyChunks: strategyPaper.chunks?.length || 0,
  strategyTitle: strategyPaper.title,
  missingDownloads,
});

if (data.length !== 1891) {
  console.error('Expected 1,891 rows from both workbooks.');
  process.exit(1);
}
if ((strategyPaper.chunks?.length || 0) < 1) {
  console.error('Expected strategy paper chunks to be indexed.');
  process.exit(1);
}
if (missingDownloads.length) {
  console.error('Missing expected downloadable files.');
  process.exit(1);
}
