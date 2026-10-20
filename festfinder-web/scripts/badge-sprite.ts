/**
 * Writes public/kd/badges.svg: the badges' signs as one sprite of Phosphor's Regular icons (MIT),
 * one <symbol> per icon name the API's catalogue uses (festfinder-backend/src/services/badges.ts,
 * `icon`), so a profile carries no icon code. Run `node scripts/badge-sprite.ts` after adding a
 * badge with a new icon; festfinder-backend/test/badges.test.ts checks every icon is here.
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createElement, type ComponentType } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import * as Phosphor from '@phosphor-icons/react';

export const ICONS = [
  'Sparkle', 'Moon', 'SunHorizon', 'Sun', 'Repeat', 'Waveform', 'MapPin', 'Buildings', 'GlobeHemisphereEast', 'Airplane', 'Tent', 'Flag', 'Crown', 'Broadcast',
  'ChatCircle', 'ChatsCircle', 'ArrowBendUpLeft', 'Heart', 'Camera', 'Question', 'UsersThree', 'MegaphoneSimple', 'Signpost', 'Handshake', 'Coins', 'Eye',
  'Binoculars', 'Fire', 'BookmarkSimple', 'MusicNotes', 'Star', 'UsersFour', 'BellRinging', 'CheckCircle', 'IdentificationCard', 'Lightning',
  'MicrophoneStage', 'Van', 'MoonStars', 'VinylRecord', 'SealCheck', 'CalendarCheck', 'CalendarPlus',
];

const icons = Phosphor as unknown as Record<string, ComponentType<{ weight: string }>>;
const symbols = ICONS.map((name) => {
  const Icon = icons[name];
  if (!Icon) throw new Error(`no Phosphor icon ${name}`);
  const svg = renderToStaticMarkup(createElement(Icon, { weight: 'regular' }));
  const inner = svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '').replace(/<rect width="256" height="256" fill="none"\/>/, '');
  return `<symbol id="${name}" viewBox="0 0 256 256">${inner.replace(/<path /g, '<path fill="currentColor" ')}</symbol>`;
});
const out = `<svg xmlns="http://www.w3.org/2000/svg">\n<!-- The badges' signs (festfinder-web/src/kd/ui/badges.tsx): Phosphor Icons, Regular weight (MIT), as symbols. Written by scripts/badge-sprite.ts. -->\n${symbols.join('\n')}\n</svg>\n`;
writeFileSync(join(import.meta.dirname, '..', 'public', 'kd', 'badges.svg'), out);
console.log(`badges.svg: ${ICONS.length} icons, ${Math.round(out.length / 1024)} KB`);
