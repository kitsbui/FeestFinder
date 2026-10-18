/**
 * A public page in Thai, Japanese or Indonesian (design v2 phase 10): marks it in its language and
 * sends that language's lines (copy/asia) with it, so the browser has them before the page draws.
 * A Japanese page asks for Noto Sans JP at once rather than when ScriptFonts finds CJK text.
 * Vietnamese and English pages pass through untouched.
 */
import type { ReactNode } from 'react';
import { ASIA } from '../copy/asia';
import type { Lang } from '../copy';
import { LangLines } from './lang-lines';

export function InLang({ lang, children }: { lang: Lang; children: ReactNode }) {
  if (lang === 'vi' || lang === 'en') return children;
  const font = lang === 'ja'
    // eslint-disable-next-line @next/next/no-css-tags -- React puts it in <head> (precedence), with this page only.
    ? <link rel="stylesheet" href="/fonts/noto-sans-jp.css" precedence="default" />
    : null;
  return (
    <div lang={lang} className="contents">
      {font}
      <LangLines lang={lang} lines={ASIA[lang]}>{children}</LangLines>
    </div>
  );
}
