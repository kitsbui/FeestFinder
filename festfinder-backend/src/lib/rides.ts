import { cityBySlug } from './places.ts';

/*
 * "Đặt xe": the ride apps an event page opens, with the way to the venue. Neither Grab nor
 * Green SM offers a public booking API, so the button opens the app itself on the phone: the
 * address is copied first, for the destination field. A partner deal (a deep link that fills
 * the destination, attribution) only changes what is built here.
 *
 * What each app answers to, as the companies' own web-to-app links use it (checked 2026-10-15):
 *   Grab      grab.com's download links: af_dp=grab://open?screenType=BOOKING, Android
 *             com.grabtaxi.passenger, App Store id647268330.
 *   Green SM  vn.greensm.com's download link: af_dp=xanhsm.com://homepage, Android
 *             com.gsm.customer, App Store id6446425595.
 *   Be        be.com.vn's download link begroup.onelink.me/ZOqn/becustomerapp (checked
 *             2026-10-17): af_dp=xyz.be.customer://home, Android xyz.be.customer, App Store
 *             id1440565902; the OneLink path is in its apple-app-site-association, so on an
 *             iPhone the link itself opens the app (the App Store when it is not installed).
 * Grab's destination parameters are not published: until one is checked on a phone and a
 * partner confirms it, no app claims to fill the destination (prefilled: false).
 */

export const RIDE_APPS = ['grab', 'be', 'greensm'] as const;
export type RideApp = (typeof RIDE_APPS)[number];

interface RideAppSpec {
  name: string;
  /** Where the app takes rides, by country (lib/places.ts codes). Never a hard-coded city. */
  countries: string[];
  /** The app's own link: scheme, and what follows it. */
  scheme: string;
  path: string;
  android: string;
  appStoreId: string;
  /** An https link the app claims on an iPhone (a universal link): opens it with no error page when it is missing. */
  universal?: string;
}

export const RIDE_SPECS: Record<RideApp, RideAppSpec> = {
  grab: { name: 'Grab', countries: ['VN', 'TH', 'SG', 'MY', 'ID', 'PH', 'KH', 'MM'], scheme: 'grab', path: 'open?screenType=BOOKING', android: 'com.grabtaxi.passenger', appStoreId: '647268330' },
  be: { name: 'Be', countries: ['VN'], scheme: 'xyz.be.customer', path: 'home', android: 'xyz.be.customer', appStoreId: '1440565902', universal: 'https://begroup.onelink.me/ZOqn/becustomerapp' },
  // Green SM rides in Vietnam; Laos, Indonesia and the Philippines are added here when a listed city is served.
  greensm: { name: 'Green SM', countries: ['VN'], scheme: 'xanhsm.com', path: 'homepage', android: 'com.gsm.customer', appStoreId: '6446425595' },
};

export interface RideOption {
  key: RideApp;
  name: string;
  /** Whether the app opens with the destination filled in. False for every app until a partner link says otherwise. */
  prefilled: boolean;
  /** What is copied for the destination field: the venue, its address and its city. */
  copyText: string;
  /** Android: the app by its package, or its Play Store page when it is not installed. */
  android: string;
  ios: { app: string; store: string; universal: string | null };
}

export interface RideEvent {
  city: string | null;
  past: boolean;
  status: string;
  venue: { name: string | null; address: string | null; area: string | null; lat: number | null; lng: number | null };
}

/** The ride apps for an event still to come, in its city's country; none for a past or cancelled one, or one without a place. */
export function ridesFor(ev: RideEvent, lang: 'en' | 'vi' = 'vi'): RideOption[] {
  if (ev.past || ev.status !== 'live') return [];
  const city = cityBySlug(ev.city);
  if (!city) return [];
  const cityName = city.name[lang] || city.name.en;
  const copyText = [ev.venue.name, ev.venue.address, ev.venue.area, cityName].filter((x, i, all) => x && all.indexOf(x) === i).join(', ');
  if (!ev.venue.name && !ev.venue.address && ev.venue.lat == null) return [];
  return RIDE_APPS.filter((k) => RIDE_SPECS[k].countries.includes(city.countryCode)).map((key) => {
    const s = RIDE_SPECS[key];
    const store = `https://play.google.com/store/apps/details?id=${s.android}`;
    return {
      key,
      name: s.name,
      prefilled: false,
      copyText,
      android: `intent://${s.path}#Intent;scheme=${s.scheme};package=${s.android};S.browser_fallback_url=${encodeURIComponent(store)};end`,
      ios: { app: `${s.scheme}://${s.path}`, store: `https://apps.apple.com/app/id${s.appStoreId}`, universal: s.universal ?? null },
    };
  });
}
