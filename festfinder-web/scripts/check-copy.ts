/**
 * Every line of the public pages exists in every language of the site (design v2 phase 15), as
 * part of `npm run lint`: the `{ en, vi }` pairs in PUBLIC (the files behind the pages a visitor
 * opens) must each have a line in copy/asia/th.ts, ja.ts and id.ts, keyed by the English line.
 * SAME lists the lines that stay as they are in every language (brand names, placeholders, the
 * languages' own names). `npm run copy:export` writes the same pairs as a CSV for a native
 * speaker; scripts/import-copy.ts reads the corrections back.
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const WEB = join(import.meta.dirname, '..');
const KD = join(WEB, 'src', 'kd');

/** The files behind the public pages: what a visitor reads in their language. */
export const PUBLIC = [
  'copy/index.ts', 'runtime.tsx', 'sign-in.tsx', 'sign-in-copy.ts', 'phone.tsx',
  'web/chrome.tsx', 'web/copy.ts', 'web/card.tsx', 'web/me.tsx', 'web/search-sheet.tsx', 'web/lang.ts',
  'web/list', 'web/event', 'web/artist', 'web/directory', 'web/org', 'web/about',
  'ui/origin.tsx', 'ui/parts.tsx', 'ui/covers.tsx', 'ui/share-ask.tsx', 'ui/back-link.tsx', 'ui/skip-link.tsx', 'ui/workspaces.tsx', 'feedback/widget.tsx',
];
/** Lines every language keeps as they are. */
export const SAME = new Set([
  'English', 'Tiếng Việt', 'ไทย', '日本語', 'Bahasa Indonesia', 'Radar', 'm:ss', 'you@example.com', '09xx xxx xxx',
  '48 Lê Lợi, Bến Nghé, Quận 1, TP.HCM', '© {y} FestFinder Co., Ltd', 'Apple Calendar, Outlook (.ics)',
]);
export const LANGS = ['th', 'ja', 'id'] as const;

function* files(p: string): Generator<string> {
  if (statSync(p).isDirectory()) { for (const n of readdirSync(p)) yield* files(join(p, n)); }
  else if (/\.(ts|tsx)$/.test(p) && !p.includes('/copy/asia/')) yield p;
}
const unescape = (s: string) => s.replace(/\\'/g, "'");

/** Every public `{ en, vi }` pair, by its English line, with the file it was first seen in. */
export function publicPairs(): Map<string, { vi: string; file: string }> {
  const out = new Map<string, { vi: string; file: string }>();
  for (const p of PUBLIC) {
    for (const f of files(join(KD, p))) {
      const text = readFileSync(f, 'utf8');
      for (const m of text.matchAll(/en:\s*'((?:[^'\\]|\\.)*)',\s*vi:\s*'((?:[^'\\]|\\.)*)'/g)) {
        const en = unescape(m[1]);
        if (!out.has(en)) out.set(en, { vi: unescape(m[2]), file: relative(KD, f) });
      }
    }
  }
  return out;
}

/** A language's lines, by the English line. */
export function linesOf(lang: string): Map<string, string> {
  const text = readFileSync(join(KD, 'copy', 'asia', `${lang}.ts`), 'utf8');
  return new Map([...text.matchAll(/^  '((?:[^'\\]|\\.)*)': '((?:[^'\\]|\\.)*)',$/gm)].map((m) => [unescape(m[1]), unescape(m[2])]));
}

const csvCell = (s: string) => (/[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s);

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  const pairs = publicPairs();
  if (process.argv[2] === '--export') {
    const dict = Object.fromEntries(LANGS.map((l) => [l, linesOf(l)]));
    const rows = [['English (khóa)', 'Tiếng Việt', 'ไทย (th)', '日本語 (ja)', 'Bahasa Indonesia (id)', 'Ghi chú / bản sửa của người rà soát']];
    for (const [en, { vi }] of pairs) rows.push([en, vi, ...LANGS.map((l) => dict[l].get(en) ?? (SAME.has(en) ? en : '')), '']);
    const out = process.argv[3] ?? join(WEB, 'copy-export.csv');
    writeFileSync(out, '﻿' + rows.map((r) => r.map(csvCell).join(',')).join('\n') + '\n');
    console.log(`copy:export: ${rows.length - 1} lines → ${out}`);
    process.exit(0);
  }
  const problems: string[] = [];
  for (const l of LANGS) {
    const have = linesOf(l);
    for (const [en, { file }] of pairs) if (!have.has(en) && !SAME.has(en)) problems.push(`${l}: no line for "${en}" (${file})`);
  }
  if (problems.length) {
    console.error(problems.join('\n'));
    console.error(`\ncheck-copy: ${problems.length} public line${problems.length > 1 ? 's' : ''} missing a translation: add them to src/kd/copy/asia/{th,ja,id}.ts (or SAME in scripts/check-copy.ts)`);
    process.exit(1);
  }
  console.log(`check-copy: ok (${pairs.size} public lines in every language)`);
}
