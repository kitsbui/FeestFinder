'use client';
/**
 * The news feed under /blog?category=news: the latest headlines of the EDM press (festfinder-backend
 * services/news.ts), each a card with the picture its feed carried, its publisher and date, and a
 * digest in the page's language (machine-written from the headline and summary, and labelled so)
 * or the feed's own summary. A headline opens the publisher's page; nothing is copied. Chips filter
 * by topic.
 */
import { useEffect, useState } from 'react';
import { ArrowSquareOutIcon } from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { fill, pick, type Lang } from '../../copy';
import { cx } from '../../cx';
import { dayMonth } from '../../format';
import { g } from '../../genre';
import { Button, Chip } from '../../ui/actions';
import { Art, Card as Panel } from '../../ui/parts';
import { BLOG, NEWS_TOPIC_LABEL } from './copy';
import { NEWS_TOPICS, type NewsItem, type NewsList, type NewsTopic } from './model';

const PAGE = 12;
const query = (topic: NewsTopic | null, offset = 0) => {
  const q = new URLSearchParams({ limit: String(PAGE) });
  if (topic) q.set('topic', topic);
  if (offset) q.set('offset', String(offset));
  return q.toString();
};

export function NewsFeed({ lang }: { lang: Lang }) {
  const T = pick(BLOG, lang);
  const C = pick(NEWS_TOPIC_LABEL, lang);
  const [topic, setTopic] = useState<NewsTopic | null>(null);
  const [list, setList] = useState<NewsList | null>(null);
  const [busy, setBusy] = useState(false);
  const load = async (t: NewsTopic | null, offset = 0) => {
    setBusy(true);
    const out = (await FF.maybe(FF.get('/news?' + query(t, offset)), null)) as NewsList | null;
    setBusy(false);
    if (!out) return;
    setList((cur) => (offset && cur ? { ...out, items: [...cur.items, ...out.items] } : out));
  };
  useEffect(() => { void load(null); }, []);
  const choose = (t: NewsTopic | null) => { setTopic(t); void load(t); };
  const counts = list?.topics;
  return (
    <section className="flex flex-col gap-4" aria-labelledby="news-h">
      <h2 id="news-h" className="kd-d3">{T.newsTitle}</h2>
      <div className="kd-hscroll flex flex-wrap gap-2" role="group" aria-label={T.newsTopics}>
        <Chip on={topic === null} onClick={() => choose(null)}>{T.newsAll}</Chip>
        {NEWS_TOPICS.map((t) => <Chip key={t} on={topic === t} count={counts?.[t] || null} onClick={() => choose(t)}>{C[t]}</Chip>)}
      </div>
      {!list ? <div className="kd-skel h-40" aria-hidden="true" /> : list.items.length ? (
        <div className={cx('kd-cards transition-opacity', busy && 'opacity-60')}>
          {list.items.map((n) => <NewsCard key={n.id} item={n} lang={lang} />)}
        </div>
      ) : <Panel role="status" className="p-7"><span className="kd-h">{T.newsNone}</span></Panel>}
      {list?.nextOffset != null ? <Button className="self-center" disabled={busy} onClick={() => load(topic, list.nextOffset!)}>{T.more}</Button> : null}
    </section>
  );
}

function NewsCard({ item, lang }: { item: NewsItem; lang: Lang }) {
  const T = pick(BLOG, lang);
  const C = pick(NEWS_TOPIC_LABEL, lang);
  const digest = item.digest ? (lang === 'vi' ? item.digest.vi : item.digest.en) || item.digest.en : '';
  const text = digest || item.summary || '';
  const open = () => FF.track('news_click', { source: item.source.host, kind: item.topic });
  const rel = 'noopener';
  return (
    <article className={`kd-ev ${g('edm')}`}>
      <a href={item.url} target="_blank" rel={rel} tabIndex={-1} aria-hidden="true" onClick={open}>
        <Art family="edm" cover={item.imageUrl} title={item.title} kicker={item.source.name} meta={dayMonth(item.publishedAt.slice(0, 10), lang)} />
      </a>
      <div className="flex min-w-0 flex-col gap-1.5">
        <span className="kd-m flex items-center gap-1.5 text-info"><span className="kd-mk" aria-hidden="true" />{C[item.topic]} · {item.source.name} · {dayMonth(item.publishedAt.slice(0, 10), lang)}</span>
        <a href={item.url} target="_blank" rel={rel} className="kd-hit kd-h" lang={item.source.lang} onClick={open}>{item.title}</a>
        {text ? <span className="kd-s line-clamp-3" lang={digest ? lang : item.source.lang}>{text}</span> : null}
        <span className="kd-m flex flex-wrap items-center gap-x-2">
          {digest ? <span>{T.newsAuto}</span> : null}
          <a href={item.url} target="_blank" rel={rel} className="inline-flex items-center gap-1 text-fg-2 underline-offset-2 hover:underline" onClick={open}>
            {fill(T.newsRead, { s: item.source.host })}<ArrowSquareOutIcon size={12} aria-hidden="true" />
          </a>
        </span>
      </div>
    </article>
  );
}
