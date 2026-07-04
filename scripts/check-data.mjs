import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../public/data/usecases.json'), 'utf8'));
const byWorkbook = data.reduce((acc, row) => {
  acc[row.workbook] = (acc[row.workbook] || 0) + 1;
  return acc;
}, {});
console.log({ total: data.length, byWorkbook });
if (data.length !== 1891) {
  console.error('Expected 1,891 rows from both workbooks.');
  process.exit(1);
}
