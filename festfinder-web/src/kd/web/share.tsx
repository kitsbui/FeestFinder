'use client';
/**
 * "Chia sẻ" on a page that is not an event (a collection, a project): the button, and the sheet
 * (share-sheet.tsx), which loads the first time it opens.
 */
import { useState } from 'react';
import dynamic from 'next/dynamic';
import { ShareNetworkIcon } from '@phosphor-icons/react/ssr';
import { pick, type Lang } from '../copy';
import { Button } from '../ui/actions';
import { WEB } from './copy';
import type { ShareStory } from './share-sheet';

export type { ShareStory };

const ShareSheet = dynamic(() => import('./share-sheet'), { ssr: false });

export function ShareButton({ lang, name, url, slug, story, source, tone = 'acc' }: {
  lang: Lang; name: string; url: string; slug: string; story: ShareStory; source: string; tone?: 'acc' | 'default';
}) {
  const [open, setOpen] = useState(false);
  const t = pick(WEB, lang);
  return (
    <>
      <Button tone={tone} onClick={() => setOpen(true)} aria-haspopup="dialog">
        <ShareNetworkIcon size={18} aria-hidden="true" />
        {t.share}
      </Button>
      {open ? <ShareSheet lang={lang} name={name} url={url} slug={slug} story={story} source={source} onClose={() => setOpen(false)} /> : null}
    </>
  );
}
