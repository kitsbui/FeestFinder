'use client';
/**
 * Each rebuilt app route's screen inside the app root. The route pages (src/app/(kd)/app/…)
 * are server components and render one of these; the screen itself runs in the browser.
 */
import { AppRoot } from './root';
import type { EventDetail } from '../types';
import { Checkout } from './checkout';
import { GuideScreen as Guide } from './guide';
import { Alerts, Notifications, NotifSettings } from './inbox';
import { LiveMode } from './live';
import { RecapScreen as Recap } from './recap';
import { ChatScreen as Chat, Following, Hyped, PlanScreen as Plan } from './social';
import { Tickets } from './tickets';

export function TicketsScreen() {
  return <AppRoot tab="tickets">{(lang) => <Tickets lang={lang} />}</AppRoot>;
}

export function CheckoutScreen({ slug }: { slug: string }) {
  return <AppRoot tab={null}>{(lang) => <Checkout lang={lang} slug={slug} />}</AppRoot>;
}

export function LiveScreen({ ev }: { ev: EventDetail }) {
  return <AppRoot tab="tickets">{(lang) => <LiveMode lang={lang} ev={ev} />}</AppRoot>;
}

export function RecapScreen({ ev }: { ev: EventDetail }) {
  return <AppRoot tab={null}>{(lang) => <Recap lang={lang} ev={ev} />}</AppRoot>;
}

export function NotificationsScreen() {
  return <AppRoot tab="me">{(lang) => <Notifications lang={lang} />}</AppRoot>;
}

export function AlertsScreen() {
  return <AppRoot tab="me">{(lang) => <Alerts lang={lang} />}</AppRoot>;
}

export function SettingsScreen() {
  return <AppRoot tab="me">{(lang) => <NotifSettings lang={lang} />}</AppRoot>;
}

export function PlanScreen({ ev }: { ev: EventDetail }) {
  return <AppRoot tab={null}>{(lang) => <Plan lang={lang} ev={ev} />}</AppRoot>;
}

export function ChatScreen({ friendId }: { friendId: string }) {
  return <AppRoot tab={null}>{(lang) => <Chat lang={lang} friendId={friendId} />}</AppRoot>;
}

export function HypedScreen() {
  return <AppRoot tab="me">{(lang) => <Hyped lang={lang} />}</AppRoot>;
}

export function FollowingScreen() {
  return <AppRoot tab="me">{(lang) => <Following lang={lang} />}</AppRoot>;
}

export function GuideScreen({ ev }: { ev: EventDetail }) {
  return <AppRoot tab={null}>{(lang) => <Guide lang={lang} ev={ev} />}</AppRoot>;
}
