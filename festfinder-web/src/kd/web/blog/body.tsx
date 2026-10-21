/**
 * A post's words, drawn from the few marks the editor names (copy.ts fBodyHint): "## " and "### "
 * headings, "- " and "1. " lists, "> " quotes, **bold**, [links](https://…) and links pasted as
 * they are, tables of "| a | b |" rows, and pictures on a line of their own:
 * ![alt](https://… "caption"). Plain text in, React elements out: nothing the writer types is
 * ever HTML. Links leave with `nofollow ugc` unless the team wrote the post (`trusted`).
 */
import type { ReactNode } from 'react';

type Block =
  | { kind: 'h2'; text: string } | { kind: 'h3'; text: string } | { kind: 'p'; text: string } | { kind: 'quote'; text: string }
  | { kind: 'ul'; items: string[] } | { kind: 'ol'; items: string[] }
  | { kind: 'table'; head: string[]; rows: string[][] }
  | { kind: 'img'; src: string; alt: string; caption: string };

const IMG = /^!\[([^\]]*)\]\((https:\/\/\S+?)(?:\s+"([^"]*)")?\)$/;
const cells = (line: string) => line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());

function blocks(src: string): Block[] {
  const out: Block[] = [];
  for (const chunk of src.replace(/\r\n?/g, '\n').split(/\n{2,}/)) {
    let lines = chunk.split('\n').filter((l) => l.trim());
    // Headings and pictures stand on their own lines; what follows them in the chunk carries on.
    while (lines.length && (/^#{2,3}\s+/.test(lines[0]) || IMG.test(lines[0].trim()))) {
      const m = lines[0].trim().match(IMG);
      if (m) out.push({ kind: 'img', alt: m[1], src: m[2], caption: m[3] ?? '' });
      else out.push(lines[0].startsWith('### ') ? { kind: 'h3', text: lines[0].slice(4) } : { kind: 'h2', text: lines[0].replace(/^##\s+/, '') });
      lines = lines.slice(1);
    }
    if (!lines.length) continue;
    if (lines.length >= 2 && lines.every((l) => /^\s*\|.*\|\s*$/.test(l)) && /^[\s|:-]+$/.test(lines[1])) {
      out.push({ kind: 'table', head: cells(lines[0]), rows: lines.slice(2).map(cells) });
    } else if (lines.every((l) => /^\s*[-*]\s+/.test(l))) {
      out.push({ kind: 'ul', items: lines.map((l) => l.replace(/^\s*[-*]\s+/, '')) });
    } else if (lines.every((l) => /^\s*\d+\.\s+/.test(l))) {
      out.push({ kind: 'ol', items: lines.map((l) => l.replace(/^\s*\d+\.\s+/, '')) });
    } else if (lines.every((l) => /^\s*>\s?/.test(l))) {
      out.push({ kind: 'quote', text: lines.map((l) => l.replace(/^\s*>\s?/, '')).join('\n') });
    } else {
      out.push({ kind: 'p', text: lines.join('\n') });
    }
  }
  return out;
}

/** **bold**, *emphasis*, [text](url) and bare https links, in a line of text. */
export function inline(text: string, key: string, trusted = false): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\*\*([^*]+)\*\*|\[([^\]]+)\]\(((?:https:\/\/|\/)[^\s)]+)\)|(https:\/\/[^\s<>"')\]]+[^\s<>"')\].,;:!?])|\*([^*]+)\*/g;
  const rel = trusted ? 'noopener' : 'noopener nofollow ugc';
  let at = 0, m: RegExpExecArray | null, i = 0;
  while ((m = re.exec(text))) {
    if (m.index > at) out.push(text.slice(at, m.index));
    const k = `${key}-${i++}`;
    if (m[1]) out.push(<strong key={k} className="font-semibold text-fg-1">{m[1]}</strong>);
    else if (m[2] && m[3]) {
      out.push(m[3].startsWith('/')
        ? <a key={k} href={m[3]} className="text-info underline underline-offset-2">{m[2]}</a>
        : <a key={k} href={m[3]} target="_blank" rel={rel} className="text-info underline underline-offset-2 [overflow-wrap:anywhere]">{m[2]}</a>);
    } else if (m[4]) out.push(<a key={k} href={m[4]} target="_blank" rel={rel} className="text-info underline underline-offset-2 [overflow-wrap:anywhere]">{m[4].replace(/^https:\/\/(www\.)?/, '')}</a>);
    else if (m[5]) out.push(<em key={k}>{m[5]}</em>);
    at = m.index + m[0].length;
  }
  if (at < text.length) out.push(text.slice(at));
  return out;
}

export function PostBody({ text, trusted = false }: { text: string; trusted?: boolean }) {
  return (
    <div className="flex max-w-read flex-col gap-5">
      {blocks(text).map((b, i) => {
        const k = String(i);
        const md = (t: string, key: string) => inline(t, key, trusted);
        if (b.kind === 'h2') return <h2 key={k} className="kd-d3 pt-3">{md(b.text, k)}</h2>;
        if (b.kind === 'h3') return <h3 key={k} className="kd-h pt-2">{md(b.text, k)}</h3>;
        if (b.kind === 'ul') return <ul key={k} className="kd-t flex list-disc flex-col gap-2 pl-5 text-fg-2">{b.items.map((it, j) => <li key={j}>{md(it, `${k}-${j}`)}</li>)}</ul>;
        if (b.kind === 'ol') return <ol key={k} className="kd-t flex list-decimal flex-col gap-2 pl-5 text-fg-2">{b.items.map((it, j) => <li key={j}>{md(it, `${k}-${j}`)}</li>)}</ol>;
        if (b.kind === 'quote') return <blockquote key={k} className="kd-t whitespace-pre-line border-l-2 border-info pl-4 text-fg-1">{md(b.text, k)}</blockquote>;
        if (b.kind === 'img') {
          return (
            <figure key={k} className="flex flex-col gap-2">
              <img src={b.src} alt={b.alt} loading="lazy" decoding="async" referrerPolicy="no-referrer" className="aspect-video w-full rounded-card bg-surface-1 object-cover" />
              {b.caption ? <figcaption className="kd-s">{inline(b.caption, `${k}-c`, true)}</figcaption> : null}
            </figure>
          );
        }
        if (b.kind === 'table') {
          // Rows that turn into cards on a phone: nothing scrolls sideways.
          return (
            <div key={k} role="table" className="kd-mdt" style={{ ['--cols' as string]: b.head.length }}>
              <div role="row" className="kd-mdt-head">{b.head.map((h, j) => <span key={j} role="columnheader">{md(h, `${k}-h${j}`)}</span>)}</div>
              {b.rows.map((r, j) => (
                <div key={j} role="row" className="kd-mdt-row">
                  {b.head.map((h, c) => <span key={c} role="cell" data-label={h}>{md(r[c] ?? '', `${k}-${j}-${c}`)}</span>)}
                </div>
              ))}
            </div>
          );
        }
        return <p key={k} className="kd-t whitespace-pre-line text-fg-2">{md(b.text, k)}</p>;
      })}
    </div>
  );
}
