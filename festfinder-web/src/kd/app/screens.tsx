'use client';
/**
 * Each rebuilt app route's screen inside the app root. The route pages (src/app/(kd)/app/…)
 * are server components and render one of these; the screen itself runs in the browser.
 */
import { AppRoot } from './root';
import type { EventDetail } from '../types';
import { Checkout } from './checkout';
import { AppEvent } from './event';
import { Explore } from './explore';
import { AppMap } from './map';
import { Profile } from './profile';
import { Saved } from './saved';
import { Tickets } from './tickets';

export function ExploreScreen() {
  return <AppRoot tab="explore">{(lang) => <Explore lang={lang} />}</AppRoot>;
}

export function EventScreen({ ev }: { ev: EventDetail }) {
  return <AppRoot tab={null}>{(lang) => <AppEvent lang={lang} ev={ev} />}</AppRoot>;
}

export function MapScreen() {
  return <AppRoot tab="map">{(lang) => <AppMap lang={lang} />}</AppRoot>;
}

export function SavedScreen() {
  return <AppRoot tab="saved">{(lang) => <Saved lang={lang} />}</AppRoot>;
}

export function TicketsScreen() {
  return <AppRoot tab="tickets">{(lang) => <Tickets lang={lang} />}</AppRoot>;
}

export function ProfileScreen() {
  return <AppRoot tab="me">{(lang) => <Profile lang={lang} />}</AppRoot>;
}

export function CheckoutScreen({ slug }: { slug: string }) {
  return <AppRoot tab={null}>{(lang) => <Checkout lang={lang} slug={slug} />}</AppRoot>;
}
