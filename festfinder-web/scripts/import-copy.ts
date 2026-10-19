/**
 * Reads a reviewed copy CSV (the one `npm run copy:export` wrote, or the kit page's download) and
 * writes the corrected Thai, Japanese and Indonesian lines back into copy/asia/{th,ja,id}.ts:
 *   node scripts/import-copy.ts reviewed.csv
 * A cell that is empty or unchanged changes nothing; a changed cell replaces that language's line.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { LANGS, linesOf, publicPairs } from './check-copy.ts';

const KD = join(import.meta.dirname, '..', 'src', 'kd');
const file = process.argv[2];
if (!file) { console.error('usage: node scripts/import-copy.ts <reviewed.csv>'); process.exit(2); }

/** A CSV with quoted cells, as the export writes it. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], cell = '', q = false;
  const s = text.replace(/^﻿/, '');
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) { if (c === '"' && s[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') q = false; else cell += c; continue; }
    if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && s[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
    else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((x) => x.trim()));
}

const rows = parseCsv(readFileSync(file, 'utf8')).slice(1);
const known = publicPairs();
const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
let changed = 0;
LANGS.forEach((lang, i) => {
  const path = join(KD, 'copy', 'asia', `${lang}.ts`);
  let text = readFileSync(path, 'utf8');
  const have = linesOf(lang);
  for (const r of rows) {
    const en = r[0]?.trim(), val = r[2 + i]?.trim();
    if (!en || !val || !known.has(en) || have.get(en) === val) continue;
    const line = `  '${esc(en)}': '${esc(val)}',\n`;
    if (have.has(en)) text = text.replace(new RegExp(`^  '${esc(en).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}': '(?:[^'\\\\]|\\\\.)*',\\n`, 'm'), line);
    else text = text.replace(/\n};\s*$/, `\n${line}};\n`);
    changed++;
  }
  writeFileSync(path, text);
});
console.log(`import-copy: ${changed} line${changed === 1 ? '' : 's'} changed`);
