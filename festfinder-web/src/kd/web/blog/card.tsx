/**
 * A post in the list: its cover (or a text tile with its title), the category in the information
 * colour, the title, the summary, and who wrote it with how long it reads. `cardOf` turns a post of
 * GET /posts into the words one card draws in the page's language, on the server for the first
 * page and in the browser for "Tải thêm": the list's HTML carries nothing else.
 */
import { fill, pick, type Lang } from '../../copy';
import { dayMonth } from '../../format';
import { g } from '../../genre';
import { KdLink as Link, inLang } from '../../link';
import { Art } from '../../ui/parts';
import { BLOG } from './copy';
import { readIn, say, text, type ListedPost } from './model';
import { CARD } from '../card-fit';

export interface CardPost { id: string; href: string; cover: string | null; category: string; l: 'vi' | 'en'; title: string; excerpt: string; meta: string }

export function cardOf(post: ListedPost, lang: Lang): CardPost {
  const T = pick(BLOG, lang);
  const l = readIn(post, lang);
  const meta = [
    post.author.name || T.member,
    post.publishedAt ? dayMonth(post.publishedAt.slice(0, 10), lang) : '',
    post.category.key === 'playlist' && post.trackCount ? fill(T.tracksN, { n: post.trackCount }) : fill(T.minutes, { n: post.minutes[l] }),
  ].filter(Boolean).join(' · ');
  return {
    id: post.id, href: inLang('/blog/' + encodeURIComponent(post.slug), lang), cover: post.coverUrl,
    category: text(post.category.label, lang), l, title: say(post.title, l), excerpt: say(post.excerpt, l), meta,
  };
}

export function PostCard({ post, eager = false }: { post: CardPost; eager?: boolean }) {
  const { href, title, excerpt, l } = post;
  return (
    <article className={`kd-ev ${g('edm')}`}>
      <Link href={href} tabIndex={-1} aria-hidden="true"><Art family="edm" cover={post.cover} title={title} eager={eager} fit={CARD} /></Link>
      <div className="flex flex-col gap-1.5">
        <span className="kd-m flex items-center gap-1.5 text-info"><span className="kd-mk" aria-hidden="true" />{post.category}</span>
        <Link href={href} className="kd-hit kd-h" lang={l}>{title}</Link>
        {excerpt ? <span className="kd-s line-clamp-2" lang={l}>{excerpt}</span> : null}
        <span className="kd-m">{post.meta}</span>
      </div>
    </article>
  );
}
