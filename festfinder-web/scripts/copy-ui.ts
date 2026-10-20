/**
 * Copies ../festfinder-frontend/ui into public/ui: the map and MapLibre for the Kính đêm
 * pages and the brand images (the text font, Noto Sans, comes from npm). Run by `npm run dev` and `npm run build`.
 */
import { cpSync, existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { buildId } from './build-id.ts';

const ROOT = resolve(import.meta.dirname, '..');
const SOURCE = resolve(ROOT, '../festfinder-frontend');
const PUBLIC_UI = join(ROOT, 'public/ui');

// The text fonts used to be copied too; drop what an older run left.
rmSync(join(PUBLIC_UI, 'fonts'), { recursive: true, force: true });
for (const folder of ['vendor', 'assets', 'map', 'widget']) {
  const from = join(SOURCE, 'ui', folder);
  // A mirror: a file removed there must stop being served here too.
  rmSync(join(PUBLIC_UI, folder), { recursive: true, force: true });
  if (existsSync(from)) cpSync(from, join(PUBLIC_UI, folder), { recursive: true });
}

// The service worker, named after this build (growth plan card F): a deploy changes /sw.js, so an
// installed copy finds the new worker, which installs itself and reloads an idle page (runtime/pwa.ts).
const id = buildId();
const worker = readFileSync(join(ROOT, 'src/sw/sw.js'), 'utf8').replace('__BUILD_ID__', id);
writeFileSync(join(ROOT, 'public/sw.js'), worker);
console.log(`sw.js: ff-${id}`);
