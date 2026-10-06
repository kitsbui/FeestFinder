import type { Queryable } from '../db/index.ts';
import { many, one } from '../db/index.ts';
import { slugify } from '../lib/contact.ts';
import { plainText } from '../lib/places.ts';
import { randomCode } from '../lib/crypto.ts';
import { GEAR_CATEGORY, GEAR_USE, type GearCategory, type GearUse } from '../lib/network.ts';

/*
 * Gear and software. The catalogue is curated: what an artist names that the catalogue lacks
 * is added unapproved, shown on their own editor but on no public page until the team says yes.
 * An item with an affiliate link points at /go/link/<code>, so the click is counted like any other.
 */

export const gearKey = (name: string) => plainText(name);

export interface GearRow { id: string; slug: string; name: string; brand: string; category: GearCategory; approved: boolean; website: string | null; link_code: string | null }

export const presentGear = (g: GearRow & { used_for?: GearUse }, base: string) => ({
  id: g.id, slug: g.slug, name: g.name, brand: g.brand, category: g.category, categoryLabel: GEAR_CATEGORY.label[g.category],
  approved: g.approved,
  // Where to get it: the tracked link first, the maker's site otherwise.
  url: g.link_code ? `${base}/go/link/${g.link_code}?src=artist` : g.website,
  ...(g.used_for ? { usedFor: g.used_for, usedForLabel: GEAR_USE.label[g.used_for] } : {}),
});

const GEAR = `select g.id, g.slug, g.name, g.brand, g.category, g.approved, g.website, l.code as link_code
                from gear_items g left join affiliate_links l on l.id = g.affiliate_link_id and l.enabled`;

/** The approved catalogue, for pickers and filters. */
export async function searchGear(q: Queryable, f: { q?: string; category?: string; limit: number }) {
  const key = f.q ? `%${gearKey(f.q)}%` : null;
  return many<GearRow>(q,
    `${GEAR} where g.approved and ($1::text is null or g.normalized_name like $1 or lower(g.brand) like $1) and ($2::text is null or g.category = $2)
      order by (select count(*) from artist_gear ag where ag.gear_id = g.id) desc, g.name limit $3`, [key, f.category ?? null, f.limit]);
}

/** What an artist uses; their own editor sees what is still waiting for approval too. */
export async function gearOf(q: Queryable, artistId: string, opts: { includePending: boolean }) {
  return many<GearRow & { used_for: GearUse }>(q,
    `select x.* from (${GEAR.replace('select ', 'select ag.used_for, ag.position, ')} join artist_gear ag on ag.gear_id = g.id where ag.artist_id = $1) x
      where $2 or x.approved order by x.position, x.name`, [artistId, opts.includePending]);
}

/** The item with this name, made unapproved when the catalogue has none. */
export async function ensureGear(q: Queryable, item: { name: string; brand: string; category: GearCategory }, userId: string): Promise<string> {
  const key = gearKey(item.name);
  const found = await one<{ id: string }>(q, 'select id from gear_items where normalized_name = $1', [key]);
  if (found) return found.id;
  let slug = slugify(`${item.brand} ${item.name}`).slice(0, 70) || 'gear';
  if (await one(q, 'select 1 from gear_items where slug = $1', [slug])) slug = `${slug}-${randomCode(4).toLowerCase()}`;
  const row = await one<{ id: string }>(q,
    `insert into gear_items (slug, name, brand, category, normalized_name, suggested_by) values ($1,$2,$3,$4,$5,$6)
     on conflict (normalized_name) do update set name = gear_items.name returning id`,
    [slug, item.name.trim(), item.brand.trim(), item.category, key, userId]);
  return row!.id;
}
