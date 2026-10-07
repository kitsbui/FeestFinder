/**
 * /about (and ?lang=en) in Kính đêm. Not drawn on a board: built from the organiser page's parts
 * (the stat row, section heads, fact list, chips). What the site is, its numbers and cities
 * (read from the API, hidden when it does not answer), who to write to, where to follow it,
 * the office and support hours. Server-rendered; the nav and footer add the personal layer.
 */
import type { ComponentType } from 'react';
import {
  ArrowRightIcon, BriefcaseIcon, ChatCircleDotsIcon, ChatCircleTextIcon, EnvelopeSimpleIcon, FacebookLogoIcon,
  InstagramLogoIcon, MegaphoneIcon, TiktokLogoIcon,
} from '@phosphor-icons/react/ssr';
import type { IconProps } from '@phosphor-icons/react';
import { fill, pick, type Lang } from '../../copy';
import { count } from '../../format';
import { KdLink as Link, inLang } from '../../link';
import { KdProvider } from '../../runtime';
import { buttonClass, LinkButton } from '../../ui/actions';
import { Fact, Stat } from '../../ui/parts';
import { WebFooter, WebNav } from '../chrome';
import { WEB } from '../copy';
import { ABOUT } from './copy';
import { loadReach } from './data';

type Icon = ComponentType<IconProps>;

const CONTACTS: readonly { title: 'users' | 'org' | 'brand'; body: 'usersBody' | 'orgBody' | 'brandBody'; email: string; Icon: Icon; advertise?: boolean }[] = [
  { title: 'users', body: 'usersBody', email: 'hello@feestfinder.com', Icon: ChatCircleDotsIcon },
  { title: 'org', body: 'orgBody', email: 'organisers@feestfinder.com', Icon: MegaphoneIcon },
  { title: 'brand', body: 'brandBody', email: 'partners@feestfinder.com', Icon: BriefcaseIcon, advertise: true },
];

const SOCIAL: readonly { label: string; handle: string; href: string; Icon: Icon }[] = [
  { label: 'Facebook', handle: '/festfinder.vn', href: 'https://facebook.com/festfinder.vn', Icon: FacebookLogoIcon },
  { label: 'Instagram', handle: '@festfinder.vn', href: 'https://instagram.com/festfinder.vn', Icon: InstagramLogoIcon },
  { label: 'TikTok', handle: '@festfinder', href: 'https://tiktok.com/@festfinder', Icon: TiktokLogoIcon },
  { label: 'Zalo', handle: 'FeestFinder OA', href: 'https://zalo.me/festfinder', Icon: ChatCircleTextIcon },
];

const HOTLINE = { label: '1900 8386', tel: 'tel:19008386' };

export async function AboutPage({ lang }: { lang: Lang }) {
  const T = pick(ABOUT, lang);
  const W = pick(WEB, lang);
  const reach = await loadReach();
  const otherLang = lang === 'vi' ? { href: '/about?lang=en', label: W.english } : { href: '/about', label: W.vietnamese };

  return (
    <KdProvider lang={lang}>
      <div className="flex min-h-dvh flex-col" lang={lang}>
        <WebNav lang={lang} />
        <main className="kd-wrap flex flex-col pt-[clamp(32px,5vw,64px)]">
          <header className="flex max-w-[760px] flex-col gap-4">
            <span className="kd-m">{T.title}</span>
            <h1 className="kd-d1">{T.headline}</h1>
            <p className="kd-t max-w-[620px]">{T.lede}</p>
          </header>

          {/* ---- numbers: the API's, or only the fee when it does not answer ---- */}
          <section aria-label={T.numbers} className="mt-10 grid auto-cols-fr grid-flow-col border-y border-line py-4.5">
            {reach ? <Stat value={count(reach.events, lang)} label={T.statEvents} /> : null}
            {reach ? <Stat value={count(reach.withEvents, lang)} label={T.statCities} /> : null}
            <Stat value="0" label={T.statFee} />
          </section>

          {/* ---- the listed cities (lib/places.ts), each to the list filtered to it ---- */}
          {reach?.cities.length ? (
            <section aria-labelledby="ab-cities" className="mt-12 flex flex-col gap-4">
              <h2 id="ab-cities" className="kd-d3">{T.cities}</h2>
              <ul className="flex flex-wrap gap-2">
                {reach.cities.map((c) => (
                  <li key={c.slug}>
                    {c.n ? (
                      <Link className="kd-chip" href={inLang('/list?city=' + encodeURIComponent(c.slug), lang)} aria-label={fill(T.cityEvents, { c: c.name[lang], n: c.n })}>
                        {c.name[lang]}
                        <span className="kd-chip-n">{count(c.n, lang)}</span>
                      </Link>
                    ) : (
                      <span className="kd-chip pointer-events-none text-fog">
                        {c.name[lang]}
                        <span className="kd-chip-n opacity-100">{T.soon}</span>
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {/* ---- who to write to ---- */}
          <section aria-labelledby="ab-contact" className="mt-12 flex flex-col gap-4">
            <h2 id="ab-contact" className="kd-d3">{T.contact}</h2>
            <ul className="grid gap-4 tab:grid-cols-2 desk:grid-cols-3">
              {CONTACTS.map(({ title, body, email, Icon, advertise }) => (
                <li key={email} className="kd-card flex flex-col gap-3 p-5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-obsidian text-mist" aria-hidden="true">
                      <Icon size={20} />
                    </span>
                    <h3 className="kd-h">{T[title]}</h3>
                  </div>
                  <p className="kd-s">{T[body]}</p>
                  <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
                    <a className={buttonClass({ size: 'sm' }, 'min-w-0 max-w-full')} href={'mailto:' + email} aria-label={fill(T.emailTo, { e: email })}>
                      <EnvelopeSimpleIcon size={16} aria-hidden="true" />
                      <span className="kd-ell">{email}</span>
                    </a>
                    {advertise ? (
                      <LinkButton size="sm" tone="ghost" href={inLang('/advertise', lang)}>
                        {T.advertise}
                        <ArrowRightIcon size={16} aria-hidden="true" />
                      </LinkButton>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* ---- where to follow ---- */}
          <section aria-labelledby="ab-social" className="mt-12 flex flex-col gap-4">
            <h2 id="ab-social" className="kd-d3">{T.social}</h2>
            <ul className="flex flex-wrap gap-2">
              {SOCIAL.map(({ label, handle, href, Icon }) => (
                <li key={label}>
                  <a className="kd-chip" href={href} target="_blank" rel="noopener me">
                    <Icon size={16} aria-hidden="true" />
                    {label}
                    <span className="kd-chip-n">{handle}</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>

          {/* ---- office and support ---- */}
          <section aria-labelledby="ab-details" className="mt-12 flex flex-col gap-4">
            <h2 id="ab-details" className="kd-d3">{T.details}</h2>
            <dl className="grid gap-5 border-y border-line py-5 tab:grid-cols-3">
              <Fact label={T.office}>{T.officeValue}</Fact>
              <Fact label={T.hotline}>
                <a className="kd-num underline decoration-line2 underline-offset-4 hover:text-paper" href={HOTLINE.tel}>{HOTLINE.label}</a>
                {' · '}{T.hotlineValue}
              </Fact>
              <Fact label={T.hours}>{T.hoursValue}</Fact>
            </dl>
            <p className="kd-s max-w-[620px]">{T.note}</p>
          </section>
        </main>
        <div className="mt-auto"><WebFooter lang={lang} otherLang={otherLang} /></div>
      </div>
    </KdProvider>
  );
}
