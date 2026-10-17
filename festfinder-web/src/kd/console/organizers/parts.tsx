'use client';
/**
 * What the organisers screens share: the head with its tab row (the directory at
 * /console/organizers, verification at /console/verification), the stat tiles that filter,
 * the verification pill and an accent-free search fold.
 */
import type { ReactNode } from 'react';
import { pick, type Lang } from '../../copy';
import { cx } from '../../cx';
import { Tabs } from '../../ui/shell';
import { PageHead, Pill } from '../kit';
import { ORGS } from './copy';

export type OrgState = 'pending' | 'verified' | 'flagged';

/** Lower case without accents, so "dien" finds "Điền". */
export const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();

export function OrgHead({ lang, current, actions }: { lang: Lang; current: 'directory' | 'verification'; actions?: ReactNode }) {
  const T = pick(ORGS, lang);
  return (
    <>
      <PageHead title={T.title} actions={actions} />
      <div className="px-[var(--kd-gutter)] pb-4">
        <Tabs
          label={T.tabs}
          current={current}
          items={[
            { key: 'directory', label: T.tabDirectory, href: '/console/organizers' },
            { key: 'verification', label: T.tabVerification, href: '/console/verification' },
          ]}
        />
      </div>
    </>
  );
}

export function StatePill({ state, lang }: { state: OrgState; lang: Lang }) {
  const T = pick(ORGS, lang);
  return state === 'verified' ? <Pill tone="ok">{T.verified}</Pill> : state === 'flagged' ? <Pill tone="bad">{T.flagged}</Pill> : <Pill tone="warn">{T.pending}</Pill>;
}

/** A number tile that toggles a filter. */
export function StatFilter({ label, value, on, tone, onClick }: { label: string; value: number; on: boolean; tone?: 'ok' | 'warn' | 'bad'; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cx(
        'flex min-w-0 flex-col items-start gap-1 rounded-lg px-4 py-3 text-left shadow-[inset_0_0_0_1px_var(--color-line-1)] transition-colors hover:bg-white/[0.03]',
        on && 'bg-white/[0.06] shadow-[inset_0_0_0_1px_var(--color-line-2)]',
      )}
    >
      <span className={cx('kd-num text-[22px] font-medium leading-tight', value && tone === 'warn' ? 'text-warn' : value && tone === 'bad' ? 'text-bad' : tone === 'ok' ? 'text-ok' : 'text-fg-1')}>{value}</span>
      <span className="kd-m">{label}</span>
    </button>
  );
}
