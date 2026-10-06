/** A profile's own links (Spotify, Instagram, its website…), each with its site's mark. */
import type { ComponentType } from 'react';
import {
  AppleLogoIcon, FacebookLogoIcon, GlobeSimpleIcon, InstagramLogoIcon, SoundcloudLogoIcon, SpotifyLogoIcon,
  TiktokLogoIcon, VinylRecordIcon, WaveformIcon, XLogoIcon, YoutubeLogoIcon,
} from '@phosphor-icons/react/ssr';
import type { IconProps } from '@phosphor-icons/react';
import type { Lang, Pair } from '../../copy';

export interface ProfileLink { kind: string; label: Pair; url: string }

const ICON: Record<string, ComponentType<IconProps>> = {
  spotify: SpotifyLogoIcon, apple_music: AppleLogoIcon, soundcloud: SoundcloudLogoIcon, beatport: WaveformIcon, bandcamp: VinylRecordIcon,
  youtube: YoutubeLogoIcon, youtube_music: YoutubeLogoIcon, instagram: InstagramLogoIcon, tiktok: TiktokLogoIcon, facebook: FacebookLogoIcon,
  x: XLogoIcon, website: GlobeSimpleIcon,
};

export function ProfileLinks({ links, lang, label }: { links: ProfileLink[]; lang: Lang; label: string }) {
  return (
    <ul aria-label={label} className="flex flex-wrap gap-1.5 pt-1">
      {links.map((l) => {
        const Icon = ICON[l.kind] ?? GlobeSimpleIcon;
        return (
          <li key={l.kind + l.url}>
            <a className="kd-chip" href={l.url} rel="noopener nofollow me" target="_blank">
              <Icon size={16} aria-hidden="true" />
              {l.label[lang] || l.label.en}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
