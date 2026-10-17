/**
 * A project in the list: its art (cover, or the EDM shapes), what it is and where, and the
 * needs it is asking for as tags.
 */
import { pick, type Lang } from '../../copy';
import { dayMonth } from '../../format';
import { g } from '../../genre';
import { KdLink as Link, inLang } from '../../link';
import { Art } from '../../ui/parts';
import { PROJ } from './copy';
import { text, type Project } from './model';

export function ProjectCard({ p, i, lang }: { p: Project; i: number; lang: Lang }) {
  const T = pick(PROJ, lang);
  const href = inLang('/p/' + encodeURIComponent(p.slug), lang);
  const where = [text(p.city.label, lang) || p.city.slug, p.targetOn ? `${T.target.toLowerCase()} ${dayMonth(p.targetOn, lang)}` : ''].filter(Boolean).join(' · ');
  return (
    <article className={`kd-ev ${g('edm')}`}>
      <Link href={href} tabIndex={-1} aria-hidden="true"><Art family="edm" cover={p.coverUrl} title={p.title} /></Link>
      <div className="flex flex-col gap-1.5">
        <Link href={href} className="kd-h">{p.title}</Link>
        {p.pitch ? <span className="kd-s line-clamp-2">{p.pitch}</span> : null}
        <span className="kd-m">{where}</span>
        {p.seeking.length ? (
          <span className="flex flex-wrap gap-1.5 pt-0.5">
            {p.seeking.map((s) => <span key={s.key} className="kd-tag">{text(s.label, lang)}</span>)}
          </span>
        ) : null}
      </div>
    </article>
  );
}
