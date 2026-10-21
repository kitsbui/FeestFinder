'use client';
/**
 * /blog's list: the categories as tabs (with their counts), 24 posts at a time. The address keeps
 * the category (?category=); the server renders the first page of all.
 */
import { useEffect, useState } from 'react';
import { FF } from '@/runtime/ff';
import { pick, type Lang } from '../../copy';
import { cx } from '../../cx';
import { inLang } from '../../link';
import { Button, LinkButton } from '../../ui/actions';
import { Card as Panel } from '../../ui/parts';
import { Tabs } from '../../ui/shell';
import { PostCard } from './card';
import { BLOG, CATEGORY_LABEL } from './copy';
import { CATEGORIES, type Category, type PostList } from './model';

const query = (c: Category | null, offset = 0) => {
  const q = new URLSearchParams({ limit: '24' });
  if (c) q.set('category', c);
  if (offset) q.set('offset', String(offset));
  return q.toString();
};

export function BlogBrowser({ lang, first }: { lang: Lang; first: PostList }) {
  const T = pick(BLOG, lang);
  const C = pick(CATEGORY_LABEL, lang);
  const [category, setCategory] = useState<Category | null>(null);
  const [list, setList] = useState<PostList>(first);
  const [busy, setBusy] = useState(false);

  const load = async (c: Category | null, offset = 0) => {
    setBusy(true);
    const out = (await FF.maybe(FF.get('/posts?' + query(c, offset)), null)) as PostList | null;
    setBusy(false);
    if (!out) return;
    setList((cur) => (offset ? { ...out, items: [...cur.items, ...out.items] } : out));
  };
  useEffect(() => {
    const c = new URLSearchParams(location.search).get('category') as Category | null;
    if (c && CATEGORIES.includes(c)) { setCategory(c); void load(c); }
  }, []);
  const choose = (c: Category | null) => {
    setCategory(c);
    const q = new URLSearchParams();
    if (c) q.set('category', c);
    if (lang !== 'vi') q.set('lang', lang);
    history.replaceState(history.state, '', '/blog' + (q.size ? '?' + q : ''));
    void load(c);
  };
  const total = Object.values(list.categories).reduce((a, b) => a + b, 0);

  return (
    <div className="flex flex-col gap-5">
      <Tabs
        label={T.categories}
        current={category ?? 'all'}
        onSelect={(k) => choose(k === 'all' ? null : (k as Category))}
        items={[{ key: 'all', label: T.all, count: total || null }, ...CATEGORIES.map((k) => ({ key: k, label: C[k], count: list.categories[k] || null }))]}
      />
      {list.items.length ? (
        <div className={cx('kd-cards transition-opacity', busy && 'opacity-60')}>
          {list.items.map((p, i) => <PostCard key={p.id} post={p} lang={lang} eager={i === 0 && !category} />)}
        </div>
      ) : busy ? <div className="kd-skel h-40" aria-hidden="true" /> : (
        <Panel role="status" className="flex flex-wrap items-center justify-between gap-4 p-7">
          <span className="kd-h">{category ? T.empty : T.none}</span>
          {category ? <Button onClick={() => choose(null)}>{T.all}</Button> : <LinkButton href={inLang('/blog/new', lang)}>{T.write}</LinkButton>}
        </Panel>
      )}
      {list.nextOffset != null ? <Button className="self-center" disabled={busy} onClick={() => load(category, list.nextOffset!)}>{T.more}</Button> : null}
    </div>
  );
}
