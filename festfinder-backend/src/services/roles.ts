import type { Queryable } from '../db/index.ts';
import { many, one } from '../db/index.ts';
import { conflict, notFound } from '../lib/errors.ts';
import { L } from '../lib/i18n.ts';
import { initialsOf, searchNormalize, slugify } from '../lib/contact.ts';
import { randomCode } from '../lib/crypto.ts';
import { PROFILE_ARTS } from '../lib/format.ts';
import { cityOf } from '../lib/places.ts';
import type { OrganizerType } from '../lib/network.ts';
import { artistKey, ensureArtists } from './artists.ts';

/*
 * Personas. Every account is a music fan. Some also perform (an artist profile they own) and
 * some also organise (membership of an organiser). Both are opted into from the screens; a
 * profile that already exists in the catalogue is claimed, and the team decides the claim.
 * Admin is never one of these: it comes from the ADMIN_EMAIL allowlist.
 */

export type Persona = 'artist' | 'organizer';
export type RoleStatus = 'active' | 'pending' | 'disabled';

export async function setRole(q: Queryable, userId: string, role: Persona, status: RoleStatus, now: Date): Promise<void> {
  await q.query(
    `insert into user_roles (user_id, role, status, created_at, updated_at) values ($1,$2,$3,$4,$4)
     on conflict (user_id, role) do update set status = excluded.status, updated_at = excluded.updated_at`,
    [userId, role, status, now]);
}

/** Active unless the person turned it off themselves; a claim that came through wakes a pending role. */
export async function activateRole(q: Queryable, userId: string, role: Persona, now: Date): Promise<void> {
  await q.query(
    `insert into user_roles (user_id, role, status, created_at, updated_at) values ($1,$2,'active',$3,$3)
     on conflict (user_id, role) do update set status = 'active', updated_at = excluded.updated_at where user_roles.status = 'pending'`,
    [userId, role, now]);
}

/** What the screens need to know about who someone is, beyond being a fan. */
export async function personasOf(q: Queryable, userId: string) {
  const [roles, artist, artistClaims, orgClaims] = await Promise.all([
    many<{ role: Persona; status: RoleStatus }>(q, 'select role, status from user_roles where user_id = $1', [userId]),
    one<{ id: string; slug: string; name: string }>(q, 'select id, slug, name from artists where owner_user_id = $1', [userId]),
    many<any>(q,
      `select c.id, c.status, c.created_at, a.slug, a.name from artist_claims c join artists a on a.id = c.artist_id
        where c.user_id = $1 and c.status <> 'approved' order by c.created_at desc limit 5`, [userId]),
    many<any>(q,
      `select c.id, c.status, c.created_at, o.slug, o.name from organizer_claims c join organizers o on o.id = c.organizer_id
        where c.user_id = $1 and c.status <> 'approved' order by c.created_at desc limit 5`, [userId]),
  ]);
  const status = (r: Persona) => roles.find((x) => x.role === r)?.status ?? null;
  const claim = (c: any) => ({ id: c.id, status: c.status, createdAt: c.created_at, slug: c.slug, name: c.name });
  return {
    roles: { artist: status('artist'), organizer: status('organizer') },
    artist: artist ? { id: artist.id, slug: artist.slug, name: artist.name } : null,
    claims: { artist: artistClaims.map(claim), organizer: orgClaims.map(claim) },
  };
}

// ---- artists --------------------------------------------------------------------------------

export interface NewArtist { stageName: string; roles: string[]; basedCity: string | null; styles: string[] }

/**
 * A profile of one's own. A name the catalogue already has is a claim instead (its events are
 * that artist's), unless nobody owns it and no event lists it, which happens when the person
 * signed up and left before.
 */
export async function startArtistProfile(q: Queryable, userId: string, a: NewArtist, now: Date): Promise<{ id: string; slug: string }> {
  const owned = await one<{ id: string; slug: string }>(q, 'select id, slug from artists where owner_user_id = $1', [userId]);
  if (owned) {
    await setRole(q, userId, 'artist', 'active', now);
    return owned;
  }
  const key = artistKey(a.stageName);
  const existing = await one<{ id: string; slug: string; name: string; owner_user_id: string | null; events: number }>(q,
    `select a.id, a.slug, a.name, a.owner_user_id, (select count(*)::int from event_artists ea where ea.artist_id = a.id) as events
       from artists a where a.normalized_name = $1 or $1 = any(a.alias_keys)`, [key]);
  if (existing && (existing.owner_user_id || existing.events > 0)) {
    throw conflict('artist_exists', L(`${existing.name} is already listed. Claim that profile instead.`, `${existing.name} đã có trên FeestFinder. Hãy nhận quản lý hồ sơ đó.`),
      { id: existing.id, slug: existing.slug, name: existing.name, owned: !!existing.owner_user_id });
  }
  const id = existing?.id ?? (await ensureArtists(q, [a.stageName])).get(key)!;
  const city = a.basedCity ? cityOf(a.basedCity) : null;
  const row = await one<{ id: string; slug: string }>(q,
    `update artists set owner_user_id = $2, name = $3, artist_roles = $4, based_city = $5, based_country = $6, styles = $7, updated_at = $8
      where id = $1 returning id, slug`,
    [id, userId, a.stageName.trim(), a.roles, city?.slug ?? null, city?.countryCode ?? null, a.styles, now]);
  await setRole(q, userId, 'artist', 'active', now);
  return row!;
}

export async function claimArtist(q: Queryable, userId: string, artistId: string, note: string, proofUrl: string | null, now: Date): Promise<{ id: string }> {
  const a = await one<{ id: string; owner_user_id: string | null }>(q, 'select id, owner_user_id from artists where id = $1', [artistId]);
  if (!a) throw notFound(L('Artist not found', 'Không tìm thấy nghệ sĩ'));
  if (a.owner_user_id === userId) throw conflict('already_yours', L('This profile is already yours', 'Hồ sơ này đã là của bạn'));
  if (await one(q, 'select 1 from artists where owner_user_id = $1', [userId])) {
    throw conflict('has_profile', L('You already have an artist profile', 'Bạn đã có hồ sơ nghệ sĩ'));
  }
  const row = await one<{ id: string }>(q,
    `insert into artist_claims (artist_id, user_id, note, proof_url, created_at) values ($1,$2,$3,$4,$5)
     on conflict (artist_id, user_id) where status = 'pending' do update set note = excluded.note, proof_url = excluded.proof_url returning id`,
    [artistId, userId, note, proofUrl, now]);
  await q.query(
    `insert into user_roles (user_id, role, status, created_at, updated_at) values ($1,'artist','pending',$2,$2)
     on conflict (user_id, role) do update set status = case when user_roles.status = 'active' then 'active' else 'pending' end, updated_at = excluded.updated_at`,
    [userId, now]);
  return row!;
}

// ---- organisers -----------------------------------------------------------------------------

export interface NewOrganizer { name: string; type: OrganizerType; city: string | null }

/** An organiser of one's own, waiting for verification like any new organiser. */
export async function startOrganizer(q: Queryable, userId: string, o: NewOrganizer, now: Date): Promise<{ id: string; slug: string }> {
  const name = o.name.trim();
  const clash = await one<{ id: string; slug: string; name: string }>(q,
    `select id, slug, name from organizers where lower(name) = lower($1) or slug = $2 limit 1`, [name, slugify(name)]);
  if (clash) {
    throw conflict('organizer_exists', L(`${clash.name} is already on FeestFinder. Claim it instead.`, `${clash.name} đã có trên FeestFinder. Hãy nhận quản lý.`),
      { id: clash.id, slug: clash.slug, name: clash.name });
  }
  let slug = slugify(name) || 'organizer';
  if (await one(q, 'select 1 from organizers where slug = $1', [slug])) slug = `${slug}-${randomCode(4).toLowerCase()}`;
  const user = await one<{ email: string | null; name: string }>(q, 'select email, name from users where id = $1', [userId]);
  const city = o.city ? cityOf(o.city) : null;
  const org = await one<{ id: string; slug: string }>(q,
    `insert into organizers (slug, name, initials, type, art, since_year, verification_state, email, contact_name, markets, created_at)
     values ($1,$2,$3,$4,$5,$6,'pending',$7,$8,$9,$10) returning id, slug`,
    [slug, name, initialsOf(name.replace(/[^\p{L}\p{N}\s]/gu, '')) || 'FF', o.type, PROFILE_ARTS[Math.floor(Math.random() * PROFILE_ARTS.length)],
      now.getUTCFullYear(), user?.email ?? null, user?.name || null, city ? [city.slug] : [], now]);
  await q.query(`insert into organizer_members (organizer_id, user_id, role) values ($1,$2,'owner')`, [org!.id, userId]);
  await setRole(q, userId, 'organizer', 'active', now);
  return org!;
}

export async function claimOrganizer(q: Queryable, userId: string, organizerId: string, note: string, proofUrl: string | null, now: Date): Promise<{ id: string }> {
  const o = await one<{ id: string }>(q, 'select id from organizers where id = $1', [organizerId]);
  if (!o) throw notFound(L('Organiser not found', 'Không tìm thấy nhà tổ chức'));
  if (await one(q, 'select 1 from organizer_members where organizer_id = $1 and user_id = $2', [organizerId, userId])) {
    throw conflict('already_member', L('You already manage this organiser', 'Bạn đã quản lý nhà tổ chức này'));
  }
  const row = await one<{ id: string }>(q,
    `insert into organizer_claims (organizer_id, user_id, note, proof_url, created_at) values ($1,$2,$3,$4,$5)
     on conflict (organizer_id, user_id) where status = 'pending' do update set note = excluded.note, proof_url = excluded.proof_url returning id`,
    [organizerId, userId, note, proofUrl, now]);
  await q.query(
    `insert into user_roles (user_id, role, status, created_at, updated_at) values ($1,'organizer','pending',$2,$2)
     on conflict (user_id, role) do update set status = case when user_roles.status = 'active' then 'active' else 'pending' end, updated_at = excluded.updated_at`,
    [userId, now]);
  return row!;
}

/** Profiles someone might be: artists and organisers whose name matches, to claim instead of duplicating. */
export async function claimSuggestions(q: Queryable, text: string) {
  const key = artistKey(text);
  if (key.length < 2) return { artists: [], organizers: [] };
  const like = `%${key}%`;
  const [artists, organizers] = await Promise.all([
    many<any>(q,
      `select a.id, a.slug, a.name, a.owner_user_id is not null as owned, (select count(*)::int from event_artists ea where ea.artist_id = a.id) as events
         from artists a where a.normalized_name like $1 order by (a.normalized_name = $2) desc, events desc limit 8`, [like, key]),
    // Names carry accents ("Đường Sách"): compared the way search compares them.
    many<any>(q,
      `select o.id, o.slug, o.name, o.type, (select count(*)::int from organizer_members m where m.organizer_id = o.id) > 0 as managed
         from organizers o where not o.is_community order by o.followers_count desc limit 5000`),
  ]);
  const needle = searchNormalize(text);
  return {
    artists: artists.map((a) => ({ id: a.id, slug: a.slug, name: a.name, owned: a.owned, events: a.events })),
    organizers: organizers.filter((o) => searchNormalize(o.name).includes(needle) || o.slug.includes(slugify(text))).slice(0, 8)
      .map((o) => ({ id: o.id, slug: o.slug, name: o.name, type: o.type, managed: o.managed })),
  };
}
