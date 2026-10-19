'use client';
/**
 * Every line of the public pages in the five languages, on one page (design v2 phase 15): what a
 * native speaker reviews, and what `scripts/check-copy.ts` holds complete. "Tải CSV" gives the
 * table as a file to send; `npm run copy:import` reads the corrections back.
 */
import { useMemo } from 'react';
import { DownloadSimpleIcon } from '@phosphor-icons/react/ssr';
import * as COMMON_COPY from './copy';
import * as SIGN_IN_COPY from './sign-in-copy';
import { ID } from './copy/asia/id';
import { JA } from './copy/asia/ja';
import { TH } from './copy/asia/th';
import { Button } from './ui/actions';
import { Row, Table } from './ui/shell';
import * as ABOUT_COPY from './web/about/copy';
import * as ARTIST_COPY from './web/artist/copy';
import * as WEB_COPY from './web/copy';
import * as DIRECTORY_COPY from './web/directory/copy';
import * as EVENT_COPY from './web/event/copy';
import * as LIST_COPY from './web/list/copy';

const COLS = 'minmax(160px,1.3fr) minmax(160px,1.3fr) minmax(140px,1fr) minmax(140px,1fr) minmax(140px,1fr)';
const isPair = (v: unknown): v is { en: string; vi: string } => !!v && typeof v === 'object' && typeof (v as { en?: unknown }).en === 'string' && typeof (v as { vi?: unknown }).vi === 'string';

/** The dictionaries of the public pages, flattened to their lines. */
function lines(): { en: string; vi: string; from: string }[] {
  const out = new Map<string, { en: string; vi: string; from: string }>();
  const mods: [string, Record<string, unknown>][] = [['copy', COMMON_COPY], ['sign-in', SIGN_IN_COPY], ['web', WEB_COPY], ['list', LIST_COPY], ['event', EVENT_COPY], ['artist', ARTIST_COPY], ['directory', DIRECTORY_COPY], ['about', ABOUT_COPY]];
  for (const [from, mod] of mods) {
    for (const dict of Object.values(mod)) {
      if (!dict || typeof dict !== 'object') continue;
      for (const v of Object.values(dict as Record<string, unknown>)) if (isPair(v) && !out.has(v.en)) out.set(v.en, { en: v.en, vi: v.vi, from });
    }
  }
  return [...out.values()];
}

const cell = (s: string) => (/[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s);

export function Microcopy() {
  const rows = useMemo(lines, []);
  const download = () => {
    const head = ['English (khóa)', 'Tiếng Việt', 'ไทย (th)', '日本語 (ja)', 'Bahasa Indonesia (id)', 'Ghi chú / bản sửa của người rà soát'];
    const body = rows.map((r) => [r.en, r.vi, TH[r.en] ?? '', JA[r.en] ?? '', ID[r.en] ?? '', ''].map(cell).join(','));
    const blob = new Blob(['﻿' + [head.map(cell).join(','), ...body].join('\n') + '\n'], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'feestfinder-microcopy.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  };
  return (
    <div className="flex flex-col gap-4">
      <Button className="self-start" onClick={download}><DownloadSimpleIcon size={16} aria-hidden="true" />Tải CSV</Button>
      <Table label="Microcopy" cols={COLS} fold="lg" head={['English', 'Tiếng Việt', 'ไทย', '日本語', 'Bahasa Indonesia']}>
        {rows.map((r) => (
          <Row key={r.en} cols={COLS} className="py-1.5">
            <span role="cell" className="kd-s text-fg-1">{r.en}</span>
            <span role="cell" className="kd-s text-fg-1">{r.vi}</span>
            <span role="cell" className="kd-s">{TH[r.en] ?? '—'}</span>
            <span role="cell" className="kd-s" lang="ja">{JA[r.en] ?? '—'}</span>
            <span role="cell" className="kd-s">{ID[r.en] ?? '—'}</span>
          </Row>
        ))}
      </Table>
    </div>
  );
}
