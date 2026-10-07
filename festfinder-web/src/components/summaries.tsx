/**
 * What the server renders for each public URL before the screen takes over: the page's
 * real content as plain, crawlable HTML. People on a fast connection barely see it; search
 * engines, link previews and slow phones get the facts straight away.
 */
import type { ReactNode } from 'react';
import { price, when, type EventCard, type EventSeo, type Lang, type OrganizerSeo, type PageSeo, type CollectionSeo, type ArtistSeo, type DirectorySeo } from '@/lib/api';

export function EventList({ title, intro, events, lang = 'vi' }: { title: string; intro?: string; events: EventCard[]; lang?: Lang }) {
  return (
    <main className="ff-ssr">
      <h1>{title}</h1>
      {intro ? <p>{intro}</p> : null}
      <ul>
        {events.map((e) => (
          <li key={e.id}>
            <a href={`/e/${e.slug}`}>{e.title}</a>
            <div className="meta">
              {when(e, lang)} · {e.venue.name}
              {e.venue.area ? `, ${e.venue.area}` : ''} · {price(e, lang)}
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}

/**
 * The event page's facts, from the same EventSeo the API's own event pages render: an answer
 * first, then the details, the organiser's updates and answers, and where to go next.
 */
export function EventSummary({ seo }: { seo: EventSeo }) {
  const p = seo.page, h = seo.headings;
  return (
    <PageFrame seo={seo} facts={h.facts} about={h.about} updated={h.updated}>
      {p.lineup.length ? (<section><h2>{h.lineup}</h2><ul>{p.lineup.map((a) => <li key={a}>{a}</li>)}</ul></section>) : null}
      {p.timetable.length ? (
        <section>
          <h2>{h.timetable}</h2>
          {p.timetable.map((d) => (
            <div key={d.day}>
              <h3>{d.day}</h3>
              <ul>{d.sets.map((x) => <li key={x.time + x.artist}>{x.time} · {x.artist}{x.stage ? ` · ${x.stage}` : ''}</li>)}</ul>
            </div>
          ))}
        </section>
      ) : null}
      {p.tickets.length ? (<section><h2>{h.tickets}</h2><ul>{p.tickets.map((x) => <li key={x.name}>{x.name}: {x.price} · {x.state}</li>)}</ul></section>) : null}
      {p.updates.length ? (
        <section>
          <h2>{h.updates}</h2>
          <ul>{p.updates.map((u) => <li key={u.at + u.body}><time dateTime={u.at}>{u.atLabel}</time> · {u.kind}: {u.body}</li>)}</ul>
        </section>
      ) : null}
      {p.faq.length ? (
        <section>
          <h2>{h.faq}</h2>
          <dl>{p.faq.map((f) => (<div key={f.question}><dt>{f.question}</dt><dd>{f.answer}</dd></div>))}</dl>
        </section>
      ) : null}
      {p.editions.length ? (
        <section>
          <h2>{h.editions}</h2>
          <ul>{p.editions.map((x) => <li key={x.path}>{x.label}: <a href={x.path}>{x.title}</a> · {x.line}</li>)}</ul>
        </section>
      ) : null}
      {p.related.length ? (
        <section>
          <h2>{h.related}</h2>
          <ul>{p.related.map((x) => <li key={x.path}><a href={x.path}>{x.title}</a> · {x.line}</li>)}</ul>
        </section>
      ) : null}
    </PageFrame>
  );
}

/** An organiser page's facts, from the same OrganizerSeo the API's own pages render. */
export function OrganizerSummary({ seo }: { seo: OrganizerSeo | CollectionSeo | ArtistSeo | DirectorySeo }) {
  const p = seo.page, h = seo.headings;
  const list = (items: OrganizerSeo['page']['upcoming']) => (
    <ul>{items.map((x) => <li key={x.path}><a href={x.path}>{x.title}</a> · {x.line}</li>)}</ul>
  );
  return (
    <PageFrame seo={seo} facts={h.facts} about={h.about} updated={h.updated}>
      {p.upcoming.length ? (<section><h2>{h.upcoming}</h2>{list(p.upcoming)}</section>) : null}
      {p.past.length ? (<section><h2>{h.past}</h2>{list(p.past)}</section>) : null}
    </PageFrame>
  );
}

/** What every page shares: breadcrumbs, the answer first, the key facts, what it is about, when it changed. */
function PageFrame({ seo, facts, about, updated, children }: { seo: PageSeo; facts: string; about: string; updated: string; children: ReactNode }) {
  const p = seo.page;
  const ext = (href: string) => (/^https?:/.test(href) ? { rel: 'noopener' } : {});
  return (
    <main className="ff-ssr" lang={seo.lang}>
      <nav aria-label="Breadcrumb">
        {p.crumbs.slice(0, -1).map((c, i) => (
          <span key={c.path}>
            {i ? ' › ' : ''}
            <a href={c.path}>{c.name}</a>
          </span>
        ))}
      </nav>
      <article>
        <p className="meta">{p.kicker}</p>
        <h1>{p.h1}</h1>
        <p className="lede">{p.summary}</p>
        <section>
          <h2>{facts}</h2>
          <dl>
            {p.facts.map((f) => (
              <div key={f.label}>
                <dt>{f.label}</dt>
                <dd>{f.datetime ? <time dateTime={f.datetime}>{f.value}</time> : f.href ? <a href={f.href} {...ext(f.href)}>{f.value}</a> : f.value}</dd>
              </div>
            ))}
          </dl>
        </section>
        {p.about ? (<section><h2>{about}</h2><p>{p.about}</p></section>) : null}
        {children}
        <p className="meta">
          {updated} <time dateTime={seo.updatedAt}>{`${seo.updatedAt.slice(11, 16)} ${seo.updatedAt.slice(8, 10)}/${Number(seo.updatedAt.slice(5, 7))}/${seo.updatedAt.slice(0, 4)}`}</time>
          {' · '}
          <a href={p.otherLang.path}>{p.otherLang.label}</a>
        </p>
      </article>
    </main>
  );
}
