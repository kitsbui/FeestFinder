import { L, type Localized } from './i18n.ts';

/*
 * The fixed lists the artist and organiser network is described with. Each value is what the
 * database stores; each label is what the screens show. The migrations check the same values.
 */

const list = <K extends string>(entries: [K, string, string][]) => ({
  keys: entries.map(([k]) => k),
  label: Object.fromEntries(entries.map(([k, en, vi]) => [k, L(en, vi)])) as Record<K, Localized>,
});

export const ARTIST_ROLE = list([
  ['dj', 'DJ', 'DJ'], ['producer', 'Producer', 'Producer'], ['live', 'Live act', 'Live act'], ['band', 'Band', 'Ban nhạc'], ['vocalist', 'Vocalist', 'Ca sĩ'],
]);
export type ArtistRole = (typeof ARTIST_ROLE.keys)[number];

export const BOOKING_STATUS = list([
  ['available', 'Available for bookings', 'Đang nhận booking'], ['limited', 'Limited dates', 'Còn ít ngày trống'],
  ['touring', 'On tour', 'Đang lưu diễn'], ['unavailable', 'Not taking bookings', 'Tạm ngừng nhận booking'],
]);
export type BookingStatus = (typeof BOOKING_STATUS.keys)[number];

export const TRAVEL_SCOPE = list([
  ['local', 'Home city', 'Trong thành phố'], ['domestic', 'Anywhere in the country', 'Trong nước'],
  ['southeast_asia', 'Southeast Asia', 'Đông Nam Á'], ['asia', 'Asia', 'Châu Á'], ['worldwide', 'Worldwide', 'Toàn cầu'],
]);
export type TravelScope = (typeof TRAVEL_SCOPE.keys)[number];
/** Wider includes narrower: an artist who tours Asia plays Southeast Asia too. */
export const TRAVEL_ORDER: TravelScope[] = ['local', 'domestic', 'southeast_asia', 'asia', 'worldwide'];

export const GIG_TYPE = list([
  ['club', 'Club', 'Club'], ['festival', 'Festival', 'Lễ hội'], ['rave', 'Rave', 'Rave'], ['concert', 'Concert', 'Concert'],
  ['brand_event', 'Brand event', 'Sự kiện thương hiệu'], ['private', 'Private', 'Riêng tư'], ['support', 'Support slot', 'Diễn mở màn'],
  ['headline', 'Headline', 'Diễn chính'], ['b2b', 'B2B', 'B2B'],
]);
export type GigType = (typeof GIG_TYPE.keys)[number];

export const SET_LENGTH = list([
  ['60', '60 min', '60 phút'], ['90', '90 min', '90 phút'], ['120', '120 min', '120 phút'],
  ['open_format', 'Open format', 'Linh hoạt'], ['all_night_long', 'All night long', 'Cả đêm'],
]);
export type SetLength = (typeof SET_LENGTH.keys)[number];

/** Where an artist's music and channels are, in the order a profile shows them. */
export const ARTIST_LINK = list([
  ['spotify', 'Spotify', 'Spotify'], ['apple_music', 'Apple Music', 'Apple Music'], ['soundcloud', 'SoundCloud', 'SoundCloud'],
  ['beatport', 'Beatport', 'Beatport'], ['bandcamp', 'Bandcamp', 'Bandcamp'], ['youtube', 'YouTube', 'YouTube'], ['youtube_music', 'YouTube Music', 'YouTube Music'],
  ['instagram', 'Instagram', 'Instagram'], ['tiktok', 'TikTok', 'TikTok'], ['facebook', 'Facebook', 'Facebook'], ['x', 'X', 'X'],
]);
export type ArtistLink = (typeof ARTIST_LINK.keys)[number];
/** The sites each link must be on, so a profile cannot point "Spotify" somewhere else. */
export const LINK_HOSTS: Record<ArtistLink, string[]> = {
  spotify: ['open.spotify.com', 'spotify.com'], apple_music: ['music.apple.com'], soundcloud: ['soundcloud.com'], beatport: ['beatport.com'],
  bandcamp: ['bandcamp.com'], youtube: ['youtube.com', 'youtu.be'], youtube_music: ['music.youtube.com'], instagram: ['instagram.com'],
  tiktok: ['tiktok.com'], facebook: ['facebook.com', 'fb.com'], x: ['x.com', 'twitter.com'],
};

export const ORGANIZER_TYPE = list([
  ['promoter', 'Promoter', 'Đơn vị tổ chức'], ['venue', 'Club or venue', 'Club / địa điểm'], ['festival', 'Festival', 'Lễ hội'],
  ['agency', 'Agency', 'Agency'], ['collective', 'Collective', 'Collective'], ['independent', 'Independent organiser', 'Tổ chức độc lập'],
  ['company', 'Company', 'Doanh nghiệp'], ['public', 'Public body', 'Cơ quan công'],
]);
export type OrganizerType = (typeof ORGANIZER_TYPE.keys)[number];

/** A link's address, when it is on one of that kind's sites; otherwise null. */
export function cleanLink(kind: ArtistLink, value: string): string | null {
  try {
    const u = new URL(value.trim());
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
    const host = u.hostname.replace(/^www\./, '').toLowerCase();
    if (!LINK_HOSTS[kind].some((h) => host === h || host.endsWith(`.${h}`))) return null;
    u.protocol = 'https:';
    return u.toString();
  } catch {
    return null;
  }
}
