import type { Lang } from './i18n.ts';

/** 1,200,000₫ / 1.200.000₫ */
export function vnd(amount: number, lang: Lang): string {
  return amount.toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-US') + '₫';
}

export function count(n: number, lang: Lang): string {
  return n.toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-US');
}

/** The gradients a new organiser or artist profile starts with, before it has a logo. */
export const PROFILE_ARTS = ['linear-gradient(135deg,#8C6BFF,#2AC4E8)', 'linear-gradient(135deg,#1B6BD6,#8C6BFF)', 'linear-gradient(135deg,#FFB35C,#FF8A3D)',
  'linear-gradient(135deg,#2AC4E8,#2E9E5B)', 'linear-gradient(135deg,#FF8A3D,#8A2BE2)', 'linear-gradient(135deg,#2E9E5B,#FFD35C)'];
