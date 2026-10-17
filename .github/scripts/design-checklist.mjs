/**
 * The design checklist of a pull request (.github/pull_request_template.md, section "## Thiết kế"):
 * every box ticked, or the first one, "Không đổi giao diện". Run by .github/workflows/design-checklist.yml
 * with the PR's description in PR_BODY; tested in festfinder-backend/test/design-checklist.test.ts.
 */

const HEAD = /^##\s+Thiết kế\s*$/m;
const NONE = /không đổi giao diện/i;

/** What is wrong with the description, or an empty list when the checklist passes. */
export function problems(body) {
  const text = String(body ?? '').replace(/\r\n/g, '\n').replace(/<!--[\s\S]*?-->/g, '');
  const at = text.search(HEAD);
  if (at < 0) return ['The description has no "## Thiết kế" checklist: copy it from .github/pull_request_template.md.'];
  const rest = text.slice(at).split('\n').slice(1);
  const end = rest.findIndex((l) => /^##\s/.test(l));
  const boxes = (end < 0 ? rest : rest.slice(0, end))
    .map((l) => l.match(/^\s*[-*]\s+\[([ xX])\]\s+(.*)$/))
    .filter(Boolean)
    .map((m) => ({ done: m[1] !== ' ', text: m[2].trim() }));
  if (!boxes.length) return ['The "## Thiết kế" section has no boxes: copy it from .github/pull_request_template.md.'];
  if (boxes.some((b) => b.done && NONE.test(b.text))) return [];
  return boxes.filter((b) => !b.done && !NONE.test(b.text)).map((b) => `Not ticked: ${b.text}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const out = problems(process.env.PR_BODY);
  for (const p of out) console.log(`::error::${p}`);
  if (out.length) process.exit(1);
  console.log('Design checklist: every box ticked.');
}
