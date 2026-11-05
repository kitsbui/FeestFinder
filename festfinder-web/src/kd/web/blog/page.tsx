/**
 * /blog (and ?lang=en): posts about music styles, news, playlists, DJ skills, clubs and cafés;
 * /blog/<slug>: one post, with its structured data. Rendered on the server; the category tabs
 * and "Sửa" for its author come in the browser.
 */
import { api, apiOr, jsonLdHtml, type BlogSeo, type Lang } from '@/lib/api';
import { fill, pick } from '../../copy';
import { dayMonth } from '../../format';
import { g } from '../../genre';
import { inLang } from '../../link';
import { KdProvider } from '../../runtime';
import { InLang } from '../../ui/in-lang';
import { LinkButton } from '../../ui/actions';
import { Accordion, Art, Avatar } from '../../ui/parts';
import { WebFooter, WebNav } from '../chrome';
import { Crumbs } from '../crumbs';
import { WEB } from '../copy';
import { inline, keepSign, PostBody } from './body';
import { BlogBrowser } from './browser';
import { cardOf } from './card';
import { BLOG } from './copy';
import { EditLink } from './edit-link';
import { readIn, say, text, type Post, type PostList } from './model';
import { StyleHub } from './style-hub';
import { PostTracks } from './tracks';
import { FIT } from '../../fits';

const enc = encodeURIComponent;
/** "20.10.2026" / "20 Oct 2026". */
const fullDate = (iso: string, lang: Lang) => dayMonth(iso, lang) + (lang === 'vi' ? '.' : ' ') + iso.slice(0, 4);
const EMPTY: PostList = { items: [], total: 0, categories: { styles: 0, news: 0, playlist: 0, dj: 0, venues: 0 }, nextOffset: null };

export async function BlogPage({ lang }: { lang: Lang }) {
  const T = pick(BLOG, lang);
  const W = pick(WEB, lang);
  const got = await apiOr<PostList>('/posts?limit=24', EMPTY, { lang, revalidate: 120 });
  // Each card's words in this page's language, nothing more: the browser gets only what it draws.
  const first = { ...got, items: got.items.map((p) => cardOf(p, lang)) };
  return (
    <InLang lang={lang}>
      <KdProvider lang={lang}>
        <div className="flex min-h-dvh flex-col" lang={lang}>
          <WebNav lang={lang} current="blog" />
          <main id="main" className="kd-wrap flex flex-col gap-5 py-8">
            <div className="kd-sec items-end">
              <h1 className="kd-d2">{T.title}</h1>
              <div className="flex flex-wrap gap-2">
                <LinkButton href={inLang('/blog/mine', lang)}>{T.mine}</LinkButton>
                <LinkButton tone="acc" href={inLang('/blog/new', lang)}>{T.write}</LinkButton>
              </div>
            </div>
            <BlogBrowser lang={lang} first={first} />
          </main>
          <div className="mt-auto"><WebFooter lang={lang} otherLang={lang === 'vi' ? { href: '/blog?lang=en', label: W.english } : { href: '/blog', label: W.vietnamese }} /></div>
        </div>
      </KdProvider>
    </InLang>
  );
}

/** A published post and its SEO; null when there is no such page. */
export async function loadPost(slug: string, lang: Lang) {
  const [post, seo] = await Promise.all([
    api<Post>(`/posts/${enc(slug)}`, { lang }),
    api<BlogSeo>(`/seo/blog/${enc(slug)}${lang === 'vi' ? '' : '?lang=en'}`),
  ]);
  return post && seo ? { post, seo } : null;
}

export function BlogPostPage({ post, seo, lang }: { post: Post; seo: BlogSeo; lang: Lang }) {
  const T = pick(BLOG, lang);
  const W = pick(WEB, lang);
  // The words in the frame's language when written, else the other's (the page says which with lang=).
  const l = readIn(post, lang);
  const title = say(post.title, l), excerpt = say(post.excerpt, l), body = say(post.body, l);
  const category = text(post.category.label, lang);
  const trusted = post.author.editorial;
  const otherLang = { href: seo.page.otherLang.path, label: lang === 'vi' ? W.english : W.vietnamese };
  return (
    <InLang lang={lang}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdHtml(seo.jsonLd) }} />
      <KdProvider lang={lang}>
        <div className="flex min-h-dvh flex-col" lang={lang}>
          <WebNav lang={lang} current="blog" />
          <Crumbs width="read" label={W.crumbs} items={seo.page.crumbs.map((c, i, a) => (i === a.length - 1 ? { name: c.name } : { name: c.name, href: c.path }))} />
          {/* The article in the middle of the page on every width (owner, 2026-10-20). */}
          <main id="main" className="kd-wrap flex flex-col pb-4">
            <article className="mx-auto flex w-full max-w-read flex-col" lang={l}>
              <header className={`flex flex-col gap-3 pt-4 ${g('edm')}`}>
                <a href={inLang(`/blog?category=${post.category.key}`, lang)} className="kd-m kd-hit flex items-center gap-1.5 self-start text-info" lang={lang}>
                  <span className="kd-mk" aria-hidden="true" />{category}
                </a>
                <h1 className="kd-d1 [overflow-wrap:anywhere]">{title}</h1>
                {excerpt ? <p className="kd-t text-fg-2">{keepSign(excerpt)}</p> : null}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1" lang={lang}>
                  <span className="kd-s flex items-center gap-2">
                    <Avatar name={post.author.name} size={28} />
                    {fill(T.by, { n: post.author.name })}
                  </span>
                  <span className="kd-s kd-num">
                    {[post.publishedAt ? fullDate(post.publishedAt.slice(0, 10), lang) : '', fill(T.minutes, { n: post.minutes[l] }), post.city ? text(post.city.label, lang) : ''].filter(Boolean).join(' · ')}
                  </span>
                  <EditLink lang={lang} slug={post.slug} />
                </div>
                {post.styles.length ? (
                  <span className="flex flex-wrap gap-x-1.5 gap-y-2" lang={lang}>
                    {/* The link takes the 44px to tap, the tag's ground stays around its words: wrapped rows never overlap. */}
                    {post.styles.map((s) => <a key={s.key} href={inLang(`/?style=${s.key}`, lang)} className="kd-hit inline-flex items-center"><span className="kd-tag">{text(s.label, lang)}</span></a>)}
                  </span>
                ) : null}
              </header>
              {post.coverUrl ? (
                <figure className="flex flex-col gap-2 pt-6">
                  <Art title={title} family="edm" cover={post.coverUrl} alt={title} eager fit={FIT.read} className="aspect-video w-full" />
                  {post.coverCredit ? <figcaption className="kd-s" lang={lang}>{T.cover} · {inline(post.coverCredit, 'cover', true)}</figcaption> : null}
                </figure>
              ) : null}
              <div className="flex flex-col gap-10 pt-8">
                {post.facts.length ? (
                  <section aria-labelledby="facts-h" className="flex max-w-read flex-col gap-3">
                    <h2 id="facts-h" className="kd-h">{T.facts}</h2>
                    <dl className="grid grid-cols-1 gap-x-6 gap-y-3 border-y border-line-1 py-4 tab:grid-cols-2">
                      {post.facts.map((f, i) => (
                        <div key={i} className="flex flex-col gap-0.5">
                          <dt className="kd-m">{say(f.label, l)}</dt>
                          <dd className="kd-s text-fg-1">{keepSign(say(f.value, l))}</dd>
                        </div>
                      ))}
                    </dl>
                  </section>
                ) : null}
                <PostBody text={body} trusted={trusted} />
                <PostTracks lang={lang} tracks={post.tracks} />
                {post.faq.length ? (
                  <section id="faq" aria-labelledby="faq-h" className="flex max-w-read flex-col gap-3">
                    <h2 id="faq-h" className="kd-d3">{T.faq}</h2>
                    <div className="flex flex-col border-t border-line-1">
                      {post.faq.map((f, i) => (
                        <Accordion key={i} summary={<h3 className="kd-hs">{say(f.q, l)}</h3>} open={i === 0}>
                          <p className="kd-t text-fg-2">{say(f.a, l)}</p>
                        </Accordion>
                      ))}
                    </div>
                  </section>
                ) : null}
                {post.styles[0] ? <StyleHub style={post.styles[0].key} lang={lang} except={post.slug} /> : null}
                {post.children.length ? (
                  <section aria-labelledby="in-h" className="flex max-w-read flex-col gap-3" lang={lang}>
                    <h2 id="in-h" className="kd-d3">{T.inThis}</h2>
                    <ul className="grid grid-cols-1 gap-x-6 tab:grid-cols-2">
                      {post.children.map((c) => (
                        <li key={c.slug}><a href={inLang(`/blog/${enc(c.slug)}`, lang)} className="kd-lrow kd-hs hover:text-info">{say(c.title, lang)}</a></li>
                      ))}
                    </ul>
                  </section>
                ) : null}
                {post.parent ? (
                  <a href={inLang(`/blog/${enc(post.parent.slug)}`, lang)} className="kd-s kd-hit max-w-read self-start text-info underline underline-offset-2" lang={lang}>
                    {fill(T.partOf, { t: say(post.parent.title, lang) })}
                  </a>
                ) : null}
                {post.sources.length ? (
                  <section aria-labelledby="src-h" className="flex max-w-read flex-col gap-3">
                    <h2 id="src-h" className="kd-h">{T.sources}</h2>
                    <ol className="kd-s flex list-decimal flex-col gap-1.5 pl-5">
                      {post.sources.map((x) => (
                        <li key={x.url}>
                          <a href={x.url} target="_blank" rel={trusted ? 'noopener' : 'noopener nofollow ugc'} className="kd-hit text-fg-2 underline underline-offset-2 hover:text-fg-1">{x.title}</a>
                          {x.publisher ? <span className="text-fg-3"> · {x.publisher}</span> : null}
                        </li>
                      ))}
                    </ol>
                  </section>
                ) : null}
              </div>
            </article>
          </main>
          <div className="mt-auto"><WebFooter lang={lang} otherLang={otherLang} /></div>
        </div>
      </KdProvider>
    </InLang>
  );
}
