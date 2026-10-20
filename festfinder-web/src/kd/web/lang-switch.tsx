'use client';
import type { ReactNode } from 'react';
import { FF } from '@/runtime/ff';
import { LANG_NAME, pick, type Lang } from '../copy';
import { cx } from '../cx';
import { useKd } from '../runtime';
import { UsFlag, VnFlag } from '../ui/flags';
import { WEB } from './copy';
import { rememberLang, useChooseHref } from './lang';

/**
 * The language switch (owner, 2026-10-20): Vietnam's flag for Vietnamese, the United States' for
 * English, the one this page is in ringed; each leads to this page in its language and keeps the
 * choice for every visit after (web/lang.ts rememberLang, kd/lang-pref.ts). Thai, Japanese and
 * Indonesian are in the footer.
 */
export function LangSwitch({ lang, className }: { lang: Lang; className?: string }) {
  const T = pick(WEB, lang);
  const kd = useKd();
  // ?setlang=: the proxy keeps the choice even when the click comes before this page's script runs.
  const vi = useChooseHref(lang, 'vi');
  const en = useChooseHref(lang, 'en');
  const flag = (to: 'vi' | 'en', href: string, children: ReactNode) => (
    <a
      className="kd-flag"
      href={href}
      hrefLang={to}
      lang={to}
      aria-label={LANG_NAME[to]}
      aria-current={lang === to ? 'true' : undefined}
      onClick={() => { FF.track('nav_click', { kind: 'lang', surface: 'nav' }); rememberLang(to, !!kd.user); }}
    >
      {children}
    </a>
  );
  return (
    <div role="group" aria-label={T.language} className={cx('kd-flags', className)}>
      {flag('vi', vi, <VnFlag />)}
      {flag('en', en, <UsFlag />)}
    </div>
  );
}
