/**
 * Copies ../festfinder-frontend/ui into public/ui: the map and MapLibre for the Kính đêm
 * pages and the brand images (the text font, Noto Sans, comes from npm). Run by `npm run dev` and `npm run build`.
 */
import { cpSync, existsSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const SOURCE = resolve(ROOT, '../festfinder-frontend');
const PUBLIC_UI = join(ROOT, 'public/ui');

// The text fonts used to be copied too; drop what an older run left.
rmSync(join(PUBLIC_UI, 'fonts'), { recursive: true, force: true });
for (const folder of ['vendor', 'assets', 'map']) {
  const from = join(SOURCE, 'ui', folder);
  // A mirror: a file removed there must stop being served here too.
  rmSync(join(PUBLIC_UI, folder), { recursive: true, force: true });
  if (existsSync(from)) cpSync(from, join(PUBLIC_UI, folder), { recursive: true });
}
