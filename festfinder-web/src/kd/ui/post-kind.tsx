'use client';
/**
 * "Đăng sự kiện" posts one of two things: an event (a date and a venue: Studio's wizard,
 * /studio/new) or a project (an idea looking for backers: /p/new). The switch at the top of
 * both forms moves between them; the nav's "Đăng sự kiện" asks first (web/chrome.tsx PostSheet).
 */
import { pick, type Lang } from '../copy';
import { WEB } from '../web/copy';
import { Segmented } from './forms';

export type PostKind = 'event' | 'project';
export const POST_HREF: Record<PostKind, string> = { event: '/studio/new', project: '/p/new' };

export function PostKindSwitch({ lang, current, className }: { lang: Lang; current: PostKind; className?: string }) {
  const T = pick(WEB, lang);
  return (
    <Segmented
      label={T.postKind}
      value={current}
      className={className}
      onChange={(k) => { if (k !== current) location.assign(POST_HREF[k] + (lang === 'en' && k === 'project' ? '?lang=en' : '')); }}
      options={[{ value: 'event', label: T.postEvent }, { value: 'project', label: T.postProject }]}
    />
  );
}
