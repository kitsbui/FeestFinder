const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const isEmail = (s: string) => EMAIL.test(s.trim());
export const normalizeEmail = (s: string) => s.trim().toLowerCase();

/**
 * Vietnamese mobile numbers as typed (0903 118 224, +84 903.118.224) → E.164 (+84903118224).
 * Returns null when it isn't a plausible VN number.
 */
export function normalizeVnPhone(input: string): string | null {
  const s = input.replace(/[\s.()-]/g, '');
  const m = /^(?:\+?84|0)(\d{8,10})$/.exec(s);
  return m ? `+84${m[1]}` : null;
}

/** 0903 118 224 style, for showing a stored E.164 number back to Vietnamese users. */
export function formatVnPhone(e164: string): string {
  if (!e164.startsWith('+84')) return e164;
  const local = '0' + e164.slice(3);
  return local.replace(/^(\d{4})(\d{3})(\d+)$/, '$1 $2 $3');
}

/** 0903 118 224 → 0903 ••• 224 for people who may not see full numbers. */
export function maskPhone(e164: string): string {
  return formatVnPhone(e164).replace(/^(\d{4}) (\d{3}) (\d+)$/, '$1 ••• $3');
}

export function initialsOf(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w.charAt(0).toUpperCase()).join('');
}

export function slugify(s: string): string {
  return s
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    .slice(0, 60);
}

/** Lower-case, diacritic-free text so "thu duc" finds "Thủ Đức". */
export function searchNormalize(s: string): string {
  return s
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase().replace(/\s+/g, ' ').trim();
}
