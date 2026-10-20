/**
 * /advertise (and ?lang=en) in Kính đêm. Not drawn on a board: the legacy screen's "Advertise"
 * sheet as a page of its own, built from the form parts and the profile pages' side column.
 * The enquiry form in the main column (a sign-in card when signed out); the rate card (hidden
 * when the API does not answer) and the partnerships address at the side. Server-rendered; the
 * form is the one client island.
 */
import { EnvelopeSimpleIcon } from '@phosphor-icons/react/ssr';
import { fill, pick, type Lang } from '../../copy';
import { count, money } from '../../format';
import { KdProvider } from '../../runtime';
import { buttonClass } from '../../ui/actions';
import { WebFooter, WebNav } from '../chrome';
import { WEB } from '../copy';
import { loadReach } from '../about/data';
import { ADVERTISE } from './copy';
import { loadRates } from './data';
import { AdEnquiry } from './form';
import { PLACEMENTS } from './model';

const PARTNERS = 'partners@feestfinder.com';

export async function AdvertisePage({ lang }: { lang: Lang }) {
  const T = pick(ADVERTISE, lang);
  const W = pick(WEB, lang);
  const [card, reach] = await Promise.all([loadRates(), loadReach()]);
  const otherLang = lang === 'vi' ? { href: '/advertise?lang=en', label: W.english } : { href: '/advertise', label: W.vietnamese };

  return (
    <KdProvider lang={lang}>
      <div className="flex min-h-dvh flex-col" lang={lang}>
        <WebNav lang={lang} />
        {/* One column in the middle (owner, 2026-10-20: no side column on any page): the rates, the form, the partners. */}
        <main className="kd-wrap flex flex-col pt-[clamp(32px,5vw,64px)]">
          <div className="mx-auto flex w-full max-w-read flex-col gap-10">
            <header className="flex flex-col gap-4">
              <span className="kd-m">{T.kicker}</span>
              <h1 className="kd-d1">{T.title}</h1>
              <p className="kd-t">{T.sub}</p>
              {reach?.events ? (
                <span className="kd-m kd-num">{fill(T.reach, { e: count(reach.events, lang), c: count(reach.withEvents, lang) })}</span>
              ) : null}
            </header>

            {card ? (
              <section aria-labelledby="ad-rates" className="flex flex-col">
                <h2 id="ad-rates" className="kd-m pb-1.5">{T.rates}</h2>
                <dl className="grid grid-cols-1 gap-x-8 tab:grid-cols-2">
                  {PLACEMENTS.map((p) => (
                    <div key={p.key} className="kd-lrow justify-between">
                      <dt className="kd-hs">{T[p.label]}</dt>
                      <dd className="kd-mb kd-num text-fg-1">{fill(T.cpm, { p: money(card.rates[p.key], card.currency, lang) })}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            ) : null}

            <AdEnquiry lang={lang} />

            <section aria-labelledby="ad-partners" className="flex flex-col items-start gap-2 border-t border-line-1 pt-6">
              <h2 id="ad-partners" className="kd-m">{T.partners}</h2>
              <a className={buttonClass({ size: 'sm' }, 'max-w-full')} href={'mailto:' + PARTNERS}>
                <EnvelopeSimpleIcon size={16} aria-hidden="true" />
                <span className="kd-ell">{PARTNERS}</span>
              </a>
            </section>
          </div>
        </main>
        <div className="mt-auto"><WebFooter lang={lang} otherLang={otherLang} /></div>
      </div>
    </KdProvider>
  );
}
