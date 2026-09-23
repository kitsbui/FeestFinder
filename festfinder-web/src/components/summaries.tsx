/**
 * What the server renders for each public URL before the screen takes over: the page's
 * real content as plain, crawlable HTML. People on a fast connection barely see it; search
 * engines, link previews and slow phones get the facts straight away.
 */
import { price, text, when, type EventCard, type EventDetail, type Lang, type Landing, type Organizer } from '@/lib/api';

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

export function EventSummary({ e, lang = 'vi' }: { e: EventDetail; lang?: Lang }) {
  const tiers = e.tickets?.tiers ?? [];
  return (
    <main className="ff-ssr">
      <article>
        <p className="meta">{[e.genre, e.badge ? text(e.badge.label, lang) : null].filter(Boolean).join(' · ')}</p>
        <h1>{e.title}</h1>
        <p>
          <time dateTime={e.startsAt ?? e.startsOn}>{when(e, lang)}</time>
        </p>
        <p>
          {e.venue.name}
          {e.venue.address ? `, ${e.venue.address}` : ''}
          {e.venue.area ? `, ${e.venue.area}` : ''}
        </p>
        <p>{price(e, lang)}</p>
        {e.description ? <p>{text(e.description, lang)}</p> : null}
        {e.lineup?.length ? (
          <>
            <h2>{lang === 'vi' ? 'Đội hình' : 'Lineup'}</h2>
            <p>{e.lineup.join(' · ')}</p>
          </>
        ) : null}
        {tiers.length ? (
          <>
            <h2>{lang === 'vi' ? 'Vé' : 'Tickets'}</h2>
            <ul>
              {tiers.map((t) => (
                <li key={t.id}>
                  {text(t.name, lang)} — {t.price.toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-US')}₫
                </li>
              ))}
            </ul>
          </>
        ) : null}
        <p className="meta">
          {lang === 'vi' ? 'Tổ chức bởi ' : 'Organised by '}
          <a href={`/o/${e.organizer.slug}`}>{e.organizer.name}</a>
        </p>
      </article>
    </main>
  );
}

export function OrganizerSummary({ o, lang = 'vi' }: { o: Organizer; lang?: Lang }) {
  return (
    <main className="ff-ssr">
      <h1>{o.name}</h1>
      {o.bio ? <p>{text(o.bio, lang)}</p> : null}
      <p className="meta">
        {o.stats.events} {lang === 'vi' ? 'sự kiện' : 'events'} · {o.stats.followers.toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-US')}{' '}
        {lang === 'vi' ? 'người theo dõi' : 'followers'}
      </p>
      {o.upcoming.length ? (
        <>
          <h2>{lang === 'vi' ? 'Sắp diễn ra' : 'Coming up'}</h2>
          <ul>
            {o.upcoming.map((e) => (
              <li key={e.id}>
                <a href={`/e/${e.slug}`}>{e.title}</a>
                <div className="meta">{when(e, lang)} · {e.venue.name}</div>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </main>
  );
}

export function LandingSummary({ l, standalone = false }: { l: Landing; standalone?: boolean }) {
  return (
    <main className="ff-ssr">
      {standalone ? (
        <nav className="ff-crumbs">
          <a href="/">FeestFinder</a> · <a href={`/${l.locale}/ho-chi-minh/this-weekend`}>{l.locale === 'vi' ? 'Cuối tuần này' : 'This weekend'}</a>
          {' · '}
          <a href={l.meta.alternates[l.locale === 'vi' ? 'en' : 'vi']?.replace(/^https?:\/\/[^/]+/, '') ?? '/'}>{l.locale === 'vi' ? 'English' : 'Tiếng Việt'}</a>
        </nav>
      ) : null}
      <p className="meta">{l.kicker}</p>
      <h1>{l.h1}</h1>
      <p>{l.intro}</p>
      <ul>
        {l.events.map((e) => (
          <li key={e.id}>
            <a href={`/e/${e.slug}`}>{e.title}</a>
            <div className="meta">
              {when(e, l.locale)} · {e.venue.name} · {price(e, l.locale)}
            </div>
          </li>
        ))}
      </ul>
      {l.answers.length ? (
        <dl className="ff-answers">
          {l.answers.map((a) => (
            <div key={a.label}>
              <dt>{a.label}</dt>
              <dd>{a.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {l.faqs.length ? (
        <>
          <h2>{l.locale === 'vi' ? 'Câu hỏi thường gặp' : 'Questions people ask'}</h2>
          {l.faqs.map((f) => (
            <section key={f.q}>
              <h3>{f.q}</h3>
              <p>{f.a}</p>
            </section>
          ))}
        </>
      ) : null}
      {l.related.length ? (
        <nav>
          <h2>{l.locale === 'vi' ? 'Xem thêm' : 'More'}</h2>
          <ul>
            {l.related.map((r) => (
              <li key={r.href}>
                <a href={r.href}>{r.label}</a>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </main>
  );
}
