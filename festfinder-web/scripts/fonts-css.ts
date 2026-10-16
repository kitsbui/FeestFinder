/**
 * Writes src/kd/fonts.css from the @fontsource-variable packages: the one type family, Noto Sans,
 * declared so a page fetches only what it shows. Run after upgrading those packages:
 *   node scripts/fonts-css.ts
 *
 * - Noto Sans: vietnamese, latin and latin-ext. The package's latin-ext range repeats code points
 *   of the vietnamese one (ă đ ĩ ũ ơ ư ₫…), and a browser picks the face declared last, so every
 *   Vietnamese page fetched the 164 KB latin-ext file for them. Here latin-ext loses those code
 *   points and the 14 KB vietnamese file serves them.
 * - Noto Sans Thai only for Thai characters (one face, in fonts.css).
 * - Noto Sans JP only for CJK characters, and not in fonts.css at all: its 114 slices list every
 *   glyph in their ranges, about 100 KB of CSS no Vietnamese page should parse. They go to
 *   public/fonts/noto-sans-jp.css with the files beside it, and kd/ui/script-fonts.tsx adds that
 *   stylesheet only on a page that shows CJK text. Runs with `npm run copy-ui` (dev and build);
 *   public/fonts is generated, not committed.
 */
import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const PKG = (name: string) => resolve(ROOT, 'node_modules/@fontsource-variable', name);
const OUT = resolve(ROOT, 'src/kd/fonts.css');
// From src/kd/fonts.css to the package's files.
const URL_BASE = (name: string) => `../../node_modules/@fontsource-variable/${name}/files/`;

interface Face { comment: string; file: string; ranges: [number, number][] }

function faces(name: string): Face[] {
  const css = readFileSync(resolve(PKG(name), 'wght.css'), 'utf8');
  return [...css.matchAll(/\/\* ([^*]+) \*\/\s*@font-face\s*\{([^}]*)\}/g)].map((m) => ({
    comment: m[1].trim(),
    file: /url\(\.\/files\/([^)]+)\)/.exec(m[2])![1],
    ranges: /unicode-range:\s*([^;]+);/.exec(m[2])![1].split(',').map((r) => {
      const [a, b] = r.trim().replace(/^U\+/i, '').split('-');
      return [parseInt(a, 16), parseInt(b ?? a, 16)] as [number, number];
    }),
  }));
}

const toSet = (ranges: [number, number][]) => { const s = new Set<number>(); for (const [a, b] of ranges) for (let c = a; c <= b; c++) s.add(c); return s; };
function toRanges(set: Set<number>): string {
  const cs = [...set].sort((a, b) => a - b);
  const out: string[] = [];
  for (let i = 0; i < cs.length; i++) {
    let j = i;
    while (j + 1 < cs.length && cs[j + 1] === cs[j] + 1) j++;
    const hex = (n: number) => n.toString(16).toUpperCase().padStart(4, '0');
    out.push(i === j ? `U+${hex(cs[i])}` : `U+${hex(cs[i])}-${hex(cs[j])}`);
    i = j;
  }
  return out.join(',');
}
const within = (set: Set<number>, blocks: [number, number][]) => new Set([...set].filter((c) => blocks.some(([a, b]) => c >= a && c <= b)));

const face = (family: string, pkg: string, file: string, range: string, base = URL_BASE(pkg)) => `@font-face {
  font-family: '${family}';
  font-style: normal;
  font-display: swap;
  font-weight: 100 900;
  src: url('${base}${file}') format('woff2-variations');
  unicode-range: ${range};
}`;

const sans = faces('noto-sans');
const vi = sans.find((f) => f.comment.endsWith('-vietnamese-wght-normal'))!;
const latin = sans.find((f) => f.comment.endsWith('-latin-wght-normal'))!;
const latinExt = sans.find((f) => f.comment.endsWith('-latin-ext-wght-normal'))!;
const viSet = toSet(vi.ranges);
const extSet = new Set([...toSet(latinExt.ranges)].filter((c) => !viSet.has(c)));

const THAI: [number, number][] = [[0x0e01, 0x0e5b]];
const CJK: [number, number][] = [[0x3000, 0x30ff], [0x3400, 0x4dbf], [0x4e00, 0x9fff], [0xf900, 0xfaff], [0xff00, 0xffef], [0x20000, 0x3134f]];
const thai = faces('noto-sans-thai').filter((f) => f.comment.includes('-thai-thai-'));
const jp = faces('noto-sans-jp').filter((f) => /-jp-\[?\d+\]?-wght/.test(f.comment));

const HEAD = '/* Written by scripts/fonts-css.ts from @fontsource-variable (SIL Open Font License 1.1). Do not edit by hand. */';
const blocks: string[] = [
  HEAD,
  // Order matters only where ranges overlap; latin-ext no longer overlaps vietnamese.
  face('Noto Sans Variable', 'noto-sans', latinExt.file, toRanges(extSet)),
  face('Noto Sans Variable', 'noto-sans', vi.file, toRanges(viSet)),
  face('Noto Sans Variable', 'noto-sans', latin.file, toRanges(toSet(latin.ranges))),
  ...thai.map((f) => face('Noto Sans Thai Variable', 'noto-sans-thai', f.file, toRanges(within(toSet(f.ranges), THAI)))),
];
writeFileSync(OUT, blocks.join('\n\n') + '\n');

// Noto Sans JP: a stylesheet of its own in public/fonts, loaded only where CJK text shows.
const PUBLIC = resolve(ROOT, 'public/fonts');
rmSync(PUBLIC, { recursive: true, force: true });
mkdirSync(resolve(PUBLIC, 'noto-sans-jp'), { recursive: true });
const jpFaces = jp.map((f) => [f, within(toSet(f.ranges), CJK)] as const).filter(([, set]) => set.size);
for (const [f] of jpFaces) copyFileSync(resolve(PKG('noto-sans-jp'), 'files', f.file), resolve(PUBLIC, 'noto-sans-jp', f.file));
writeFileSync(resolve(PUBLIC, 'noto-sans-jp.css'), [HEAD, ...jpFaces.map(([f, set]) => face('Noto Sans JP Variable', 'noto-sans-jp', f.file, toRanges(set), './noto-sans-jp/'))].join('\n\n') + '\n');
console.log(`fonts: src/kd/fonts.css ${blocks.length - 1} faces · public/fonts/noto-sans-jp.css ${jpFaces.length} faces`);
