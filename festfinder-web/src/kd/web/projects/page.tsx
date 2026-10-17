/**
 * /p (and ?lang=en): projects looking for backers, and /p/<slug>: one of them. Rendered on the
 * server with their structured data; offering, the owner's tools and the filters come in the
 * browser. FeestFinder connects the people and never handles money (every page says so).
 */
import { api, apiOr, jsonLdHtml, type Lang, type ProjectSeo } from '@/lib/api';
import { fill, pick } from '../../copy';
import { count, dayMonth, money } from '../../format';
import { g } from '../../genre';
import { KdLink as Link, inLang } from '../../link';
import { KdProvider } from '../../runtime';
import { LinkButton } from '../../ui/actions';
import { Accordion, Art, Avatar, SectionHead, Stat } from '../../ui/parts';
import { Crumbs, WebFooter, WebNav } from '../chrome';
import { WEB } from '../copy';
import { ProjectsBrowser } from './browser';
import { PROJ } from './copy';
import { text, type Project, type ProjectList } from './model';
import { OfferBox } from './offer';

const enc = encodeURIComponent;

export async function ProjectsPage({ lang }: { lang: Lang }) {
  const T = pick(PROJ, lang);
  const W = pick(WEB, lang);
  const [first, meta] = await Promise.all([
    apiOr<ProjectList>('/projects?limit=24', { items: [], total: 0, seeking: { investment: 0, sponsorship: 0, artists: 0, venue: 0, partner: 0 }, nextOffset: null }, { lang, revalidate: 120 }),
    apiOr<{ cities: { slug: string; name: { vi: string; en: string } }[] }>('/meta/discovery', { cities: [] }, { revalidate: 300 }),
  ]);
  return (
    <KdProvider lang={lang}>
      <div className="flex min-h-dvh flex-col" lang={lang}>
        <WebNav lang={lang} current="projects" />
        <main className="kd-wrap flex flex-col gap-5 py-8">
          <div className="kd-sec items-end">
            <h1 className="kd-d1">{T.title}</h1>
            <div className="flex flex-wrap gap-2">
              <LinkButton href={inLang('/p/mine', lang)}>{T.mine}</LinkButton>
              <LinkButton tone="acc" href={inLang('/p/new', lang)}>{T.start}</LinkButton>
            </div>
          </div>
          <ProjectsBrowser lang={lang} first={first} cities={meta.cities.map((c) => ({ slug: c.slug, name: c.name }))} />
        </main>
        <div className="mt-auto"><WebFooter lang={lang} otherLang={lang === 'vi' ? { href: '/p?lang=en', label: W.english } : { href: '/p', label: W.vietnamese }} /></div>
      </div>
    </KdProvider>
  );
}

/** A public project and its SEO; null when there is no such page. */
export async function loadProject(slug: string, lang: Lang) {
  const [p, seo] = await Promise.all([
    api<Project>(`/projects/${enc(slug)}`, { lang }),
    api<ProjectSeo>(`/seo/projects/${enc(slug)}${lang === 'en' ? '?lang=en' : ''}`),
  ]);
  return p && seo ? { p, seo } : null;
}

export function ProjectPage({ p, seo, lang }: { p: Project; seo: ProjectSeo; lang: Lang }) {
  const T = pick(PROJ, lang);
  const W = pick(WEB, lang);
  const owner = p.owner.name || T.member;
  const onBoard = Object.values(p.onBoard).reduce((a, b) => a + b, 0);
  const otherLang = { href: seo.page.otherLang.path, label: lang === 'vi' ? W.english : W.vietnamese };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdHtml(seo.jsonLd) }} />
      <KdProvider lang={lang}>
        <div className="flex min-h-dvh flex-col" lang={lang}>
          <WebNav lang={lang} current="projects" />
          <Crumbs label={W.crumbs} items={seo.page.crumbs.map((c, i, a) => (i === a.length - 1 ? { name: c.name } : { name: c.name, href: c.path }))} />
          <main className="flex flex-col">
            <div className="kd-wrap"><Art title={p.title} family="edm" cover={p.coverUrl} alt={p.title} className="h-[clamp(200px,28vw,380px)]" /></div>

            <section className="kd-wrap pt-7" aria-labelledby="p-h">
              <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
                <div className={`flex min-w-0 max-w-read flex-col gap-2 ${g('edm')}`}>
                  <span className="kd-m flex items-center gap-1.5"><span className="kd-mk" aria-hidden="true" />{[T.kicker, text(p.city.label, lang), p.eventType ? text(p.eventType.label, lang) : ''].filter(Boolean).join(' · ')}</span>
                  <h1 id="p-h" className="kd-d1 [overflow-wrap:anywhere]">{p.title}</h1>
                  {p.pitch ? <p className="kd-t text-fg-2">{p.pitch}</p> : null}
                  <span className="kd-s flex items-center gap-2 pt-1">
                    {p.owner.name ? <Avatar name={p.owner.name} size={28} /> : null}
                    {fill(T.by, { n: owner })}
                  </span>
                </div>
                <OfferBox lang={lang} slug={p.slug} status={p.status} seeking={p.seeking.map((s) => s.key)} packages={p.packages} currency={p.currency} />
              </div>
              <div className="mt-7 grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-y-4 border-y border-line-1 py-4.5">
                {p.targetOn ? <Stat value={dayMonth(p.targetOn, lang) + (lang === 'vi' ? '.' : ' ') + p.targetOn.slice(0, 4)} label={T.target} /> : null}
                {p.budget != null ? <Stat value={money(p.budget, p.currency, lang)} label={T.budget} /> : null}
                {p.raiseAmount != null ? <Stat value={money(p.raiseAmount, p.currency, lang)} label={T.raise} /> : null}
                {p.capacity ? <Stat value={fill(T.people, { n: count(p.capacity, lang) })} label={T.capacity} /> : null}
                {onBoard ? <Stat value={count(onBoard, lang)} label={T.onBoard} /> : null}
              </div>
            </section>

            <div className="kd-wrap pt-8">
              <div className="kd-split gap-[clamp(28px,4vw,56px)]">
                <div className="kd-main flex flex-col gap-10">
                  {p.event ? (
                    <Link href={inLang('/e/' + enc(p.event.slug), lang)} className="kd-card flex flex-col gap-1 p-5 hover:bg-white/[0.04]">
                      <span className="kd-m">{T.became}</span>
                      <span className="kd-h">{p.event.title}</span>
                    </Link>
                  ) : null}
                  <section aria-labelledby="p-idea" className="flex max-w-read flex-col gap-4">
                    <SectionHead id="p-idea" title={T.idea} />
                    <p className="kd-t whitespace-pre-line text-fg-2">{p.story}</p>
                    {p.seeking.length ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="kd-m">{T.seeking}</span>
                        {p.seeking.map((s) => <span key={s.key} className="kd-tag">{text(s.label, lang)}</span>)}
                      </div>
                    ) : null}
                  </section>
                  {p.packages.length ? (
                    <section aria-labelledby="p-pk" className="flex flex-col gap-4">
                      <SectionHead id="p-pk" title={T.packages} aside={<span className="kd-m kd-num">{p.packages.length}</span>} />
                      <ul className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3">
                        {p.packages.map((k) => (
                          <li key={k.id} className="kd-card flex flex-col gap-1.5 p-5">
                            <span className="kd-hs">{k.title}</span>
                            <span className="kd-mb kd-num text-fg-1">{money(k.amount, p.currency, lang)}</span>
                            {k.perks ? <span className="kd-s whitespace-pre-line">{k.perks}</span> : null}
                            {k.slots ? <span className="kd-m">{fill(T.slots, { n: k.slots })}</span> : null}
                          </li>
                        ))}
                      </ul>
                    </section>
                  ) : null}
                  <p className="kd-s max-w-read border-t border-line-1 pt-4 text-fg-3">{text(p.disclaimer, lang)}</p>
                </div>
                <aside className="kd-side flex flex-col border-t border-line-1">
                  <Accordion small summary={seo.headings.facts} open>
                    <div className="flex flex-col gap-3">
                      <p className="kd-s">{seo.page.summary}</p>
                      <dl className="grid grid-cols-1 gap-y-2">
                        {seo.page.facts.map((f) => (
                          <div key={f.label} className="flex flex-col gap-0.5">
                            <dt className="kd-m">{f.label}</dt>
                            <dd className="kd-s text-fg-2">{f.value}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  </Accordion>
                </aside>
              </div>
            </div>
          </main>
          <div className="mt-auto"><WebFooter lang={lang} otherLang={otherLang} /></div>
        </div>
      </KdProvider>
    </>
  );
}
