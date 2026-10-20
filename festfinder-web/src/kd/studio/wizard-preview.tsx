'use client';
/**
 * The wizard's last step shows the page as people will see it (design v2 phase 16): the hero or
 * the date poster, the four facts, the line-up, and what still looks thin. Loaded with that step.
 */
import { pick, tx, type Lang } from '../copy';
import { cx } from '../cx';
import { dayMonth, weekdayLong, whenShort } from '../format';
import { g, styleLabel } from '../genre';
import { Art } from '../ui/parts';
import { priceLine } from '../web/card';
import { STUDIO } from './copy';

/** This step's own lines (the wizard's dictionary stays lighter). */
const PREVIEW = {
  previewPage: { en: 'The page as people will see it', vi: 'Trang như người xem sẽ thấy' },
  previewNoCover: { en: 'No cover: the page opens on a poster of the date. A 16:9 photo gets more taps.', vi: 'Chưa có ảnh bìa: trang mở bằng poster ngày. Ảnh 16:9 được bấm nhiều hơn.' },
  previewNoPrice: { en: 'No price yet: the page says "price not given yet".', vi: 'Chưa có giá: trang ghi "chưa rõ giá".' },
  previewNoLineup: { en: 'No line-up yet: people decide by who plays.', vi: 'Chưa có lineup: người ta quyết theo ai diễn.' },
  previewShortDesc: { en: 'The description is short: two or three lines help search.', vi: 'Mô tả còn ngắn: hai ba dòng giúp tìm kiếm.' },
  pWhen: { en: 'When', vi: 'Thời gian' },
  pWhere: { en: 'Where', vi: 'Địa điểm' },
  pPrice: { en: 'Price', vi: 'Giá' },
  pPriceUnknown: { en: 'Price not given yet', vi: 'Chưa rõ giá' },
};
import { int, type City, type Form } from './wizard-model';

export function ReviewPreview({ lang, f, cities, currency }: { lang: Lang; f: Form; cities: City[]; currency: string }) {
  const T = { ...pick(STUDIO, lang), ...pick(PREVIEW, lang) };

  const cityName = tx(cities.find((c) => c.slug === f.city)?.name, lang) ?? '';
  const price = int(f.price);
  const priceText = f.entryMode === 'free' ? T.free : price ? priceLine({ isFree: false, entryMode: 'paid', priceFrom: price, currency, priceUnknown: false }, lang) : T.pPriceUnknown;
  const warnings = [
    !f.coverUrl && T.previewNoCover,
    f.entryMode !== 'free' && !price && !f.ticketUrl.trim() && T.previewNoPrice,
    !f.lineup.length && T.previewNoLineup,
    f.description.trim().length < 80 && T.previewShortDesc,
  ].filter((w): w is string => !!w);
  const facts: [string, string][] = [
    [T.pWhen, f.date ? whenShort({ startsOn: f.date, endsOn: f.date, startTime: f.start || null, endTime: f.end || null }, lang) + (f.start ? ' · ' + f.start + (f.end ? ' – ' + f.end : '') : '') : '—'],
    [T.pWhere, [f.venueName, cityName].filter(Boolean).join(' · ') || '—'],
    [T.pPrice, priceText],
    [T.fAge, f.age],
  ];
  return (
    <section aria-labelledby="wprev-h" className="flex flex-col gap-3">
      <h3 id="wprev-h" className="kd-m">{T.previewPage}</h3>
      <div className={cx('flex flex-col gap-3 rounded-card border border-line-1 p-3', g('edm'))}>
        <Art family="edm" cover={f.coverUrl} title={f.title || T.fNamePh} layout="hero" className="aspect-video w-full" kicker={f.styles[0] ? styleLabel(f.styles[0], lang) : null}
          poster={f.date ? { big: dayMonth(f.date, lang), line: [weekdayLong(f.date, lang), f.start || null, cityName || null].filter(Boolean).join(' · ') } : null} />
        <span className="kd-h">{f.title.trim() || T.noTitle}</span>
        <dl className="grid grid-cols-1 border-t border-line-1 tab:grid-cols-2 tab:gap-x-6">
          {facts.map(([k, v]) => (
            <div key={k} className="flex flex-col border-b border-line-1 py-2">
              <dt className="kd-m">{k}</dt>
              <dd className="kd-t text-fg-1">{v}</dd>
            </div>
          ))}
        </dl>
        {f.lineup.length ? <span className="kd-s">{f.lineup.join(' · ')}</span> : null}
      </div>
      {warnings.length ? (
        <ul className="flex flex-col gap-1">
          {warnings.map((w) => <li key={w} className="kd-s flex items-center gap-2"><span className="kd-st kd-warn" aria-hidden="true" />{w}</li>)}
        </ul>
      ) : null}
    </section>
  );
}
