'use client';
/** "Sửa" on a post, for its author and the team only: asked in the browser, so the page stays one cached copy for everyone. */
import { useEffect, useState } from 'react';
import { PencilSimpleIcon } from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { pick, type Lang } from '../../copy';
import { KdLink as Link, inLang } from '../../link';
import { useKd } from '../../runtime';
import { BLOG } from './copy';
import type { Post } from './model';

export function EditLink({ lang, slug }: { lang: Lang; slug: string }) {
  const T = pick(BLOG, lang);
  const kd = useKd();
  const [mine, setMine] = useState(false);
  useEffect(() => {
    if (!kd.user) { setMine(false); return; }
    FF.maybe(FF.get('/posts/' + encodeURIComponent(slug)), null).then((p: Post | null) => setMine(!!p?.mine));
  }, [kd.user, slug]);
  if (!mine) return null;
  return (
    <Link href={inLang(`/blog/${encodeURIComponent(slug)}/edit`, lang)} className="kd-nl -mx-2.5">
      <PencilSimpleIcon size={16} aria-hidden="true" />{T.edit}
    </Link>
  );
}
