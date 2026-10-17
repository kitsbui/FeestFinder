import { L, type Localized } from './i18n.ts';

/*
 * Advertising on FeestFinder: what organisers ask for to promote a posted event (posting itself
 * is free and goes through review), and what brands book (food and drink, fashion, health…).
 * The team answers every request in the Console. Advertising is sold in VND.
 */

export const AD_CURRENCY = 'VND';
/** The smallest budget an event ad request takes. */
export const MIN_EVENT_AD_BUDGET = 500_000;

/** Where an organiser's event can be promoted. */
export const EVENT_AD_PLACEMENTS = ['featured', 'banner', 'social'] as const;
export type EventAdPlacement = (typeof EVENT_AD_PLACEMENTS)[number];
export const EVENT_AD_PLACEMENT_LABEL: Record<EventAdPlacement, Localized> = {
  featured: L('Featured shelf', 'Kệ Nổi bật'),
  banner: L('Home page banner', 'Banner trang chủ'),
  social: L('FeestFinder’s social channels', 'Kênh mạng xã hội của FeestFinder'),
};

/** What brands advertise. "Event" is kept for campaigns made from an organiser's request. */
export const AD_CATEGORIES = ['F&B', 'Fashion', 'Healthcare', 'Beauty', 'Tech', 'Travel', 'Lifestyle', 'Other'] as const;
export type AdCategory = (typeof AD_CATEGORIES)[number];
export const AD_CATEGORY_LABEL: Record<AdCategory | 'Event', Localized> = {
  'F&B': L('Food & drink', 'Ăn uống'), Fashion: L('Fashion', 'Thời trang'), Healthcare: L('Healthcare', 'Sức khoẻ'),
  Beauty: L('Beauty', 'Làm đẹp'), Tech: L('Tech', 'Công nghệ'), Travel: L('Travel', 'Du lịch'), Lifestyle: L('Lifestyle', 'Phong cách sống'),
  Other: L('Other', 'Khác'), Event: L('Event', 'Sự kiện'),
};

/** Where a brand's ad can appear (the rate card's CPMs). */
export const BRAND_AD_PLACEMENTS = ['feed', 'banner', 'live'] as const;
export type BrandAdPlacement = (typeof BRAND_AD_PLACEMENTS)[number];
export const BRAND_AD_PLACEMENT_LABEL: Record<BrandAdPlacement, Localized> = {
  feed: L('Feed card', 'Thẻ trong feed'), banner: L('Home page banner', 'Banner trang chủ'), live: L('In-event (live mode)', 'Trong sự kiện (chế độ trực tiếp)'),
};

/** A brand's own channels, by a fixed list of keys. */
export const BRAND_LINKS = ['facebook', 'instagram', 'tiktok', 'youtube', 'zalo', 'shopee'] as const;
export type BrandLink = (typeof BRAND_LINKS)[number];
