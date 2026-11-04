/** The boxes of an event's card (web/card.tsx; kd/img.ts), from kd.css: a module of their own, which the list's days and the blog's and projects' cards share. */
import { fit } from '../img';

/** A 16:10 card in a grid (.kd-cards, 260 to 400px; one across a phone). */
export const CARD = fit('(max-width: 567px) 100vw, 400px', 384, 1080, 'card');
/** A blog post's card: the same box, its copies capped at 640px (six of them sit within a phone's lazy distance; Lighthouse 2026-11-04). */
export const BLOG_CARD = fit('(max-width: 567px) 100vw, 400px', 384, 640, 'card');
/** A card in the list's days (.kd-days): an 88px row under 600px of list (a 632px screen), else a 16:10 card of at most 400px. */
export const DAY = fit('(max-width: 631px) 88px, 400px', 96, 828, 'card');
/** A day's lead: an 88px row on a phone, then 3 of 5 parts of the list (16:9), half of it from 1100px of list (2:1). */
export const LEAD = fit('(max-width: 631px) 88px, (max-width: 1163px) 58vw, 48vw', 96, 1600, 'wide');
