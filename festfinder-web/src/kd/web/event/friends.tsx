'use client';
/**
 * "Đi cùng bạn bè" on an event page (design v2 phase 9): the row into the group plan, with the faces
 * of the viewer's friends going (the friends they connected, festfinder-backend presenters/event.ts),
 * three at most and how many. The same height with or without them, so nothing moves when they come.
 */
import { CaretRightIcon, UsersThreeIcon } from '@phosphor-icons/react/ssr';
import { fill, pick, type Lang } from '../../copy';
import { Avatar } from '../../ui/parts';
import { WEB } from '../copy';
import { useEvent } from './context';
import { square } from '../../img';

export function GoTogetherRow({ lang, href }: { lang: Lang; href: string }) {
  const { personal } = useEvent();
  const T = pick(WEB, lang);
  const going = personal?.friends?.going ?? [];
  return (
    <a className="kd-lrow min-h-13" href={href}>
      <UsersThreeIcon size={18} className="text-fg-3" aria-hidden="true" />
      <span className="kd-t flex-1 text-fg-1">{T.goTogether}</span>
      {going.length ? (
        <span className="flex items-center gap-2">
          <span className="flex -space-x-2" aria-hidden="true">{going.slice(0, 3).map((f) => <Avatar key={f.id} name={f.name} src={f.photoUrl} size={24} ring fit={square(24)} />)}</span>
          <span className="kd-s kd-num">{fill(T.friendsGoing, { n: going.length })}</span>
        </span>
      ) : null}
      <CaretRightIcon size={16} className="text-fg-3" aria-hidden="true" />
    </a>
  );
}
