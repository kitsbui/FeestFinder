'use client';
/**
 * "Thêm nhạc" on an artist's own page while it has no playlist and no mix: the one action, for the
 * account that runs the profile only (useViewer's owner, the API's `editable`). Nothing for anyone else.
 */
import { pick, type Lang } from '../../copy';
import { buttonClass } from '../../ui/actions';
import { useViewer, type Source } from '../profile/parts';
import { MIXES } from './copy';

export function AddMusic({ lang, source }: { lang: Lang; source: Source }) {
  const M = pick(MIXES, lang);
  const v = useViewer(source);
  if (!v?.owner) return null;
  return <a className={buttonClass({})} href="/studio/artist/mixes">{M.addMusic}</a>;
}
