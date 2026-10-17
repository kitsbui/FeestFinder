import type { Queryable } from '../db/index.ts';
import { many, one } from '../db/index.ts';

/*
 * Followers and following, read from real follows only (migration 042): people follow profiles
 * (artist_follows by artist_id, organizer_follows) and people (user_follows). Nothing is stored or
 * seeded. A profile's "following" is what the accounts that run it follow: the artist's owner,
 * the organiser's owners. Counts are shown, never used to rank anyone.
 */

export interface FollowCounts { followers: number; following: number }

/** How many profiles and people these accounts follow, each counted once. */
export async function followingOf(q: Queryable, userIds: string[]): Promise<number> {
  if (!userIds.length) return 0;
  const r = await one<{ n: number }>(q,
    `select ((select count(distinct artist_id) from artist_follows where user_id = any($1::uuid[]) and artist_id is not null)
           + (select count(distinct organizer_id) from organizer_follows where user_id = any($1::uuid[]))
           + (select count(distinct user_id) from user_follows where follower_id = any($1::uuid[]) and user_id <> all($1::uuid[])))::int as n`,
    [userIds]);
  return Number(r?.n ?? 0);
}

/** A person's own counts: the people who follow them, and what they follow. */
export async function personCounts(q: Queryable, userId: string): Promise<FollowCounts> {
  const followers = await one<{ n: number }>(q, 'select count(*)::int as n from user_follows where user_id = $1', [userId]);
  return { followers: followers?.n ?? 0, following: await followingOf(q, [userId]) };
}

/** An artist profile's counts; nobody runs an unclaimed one, so it follows nothing. */
export async function artistCounts(q: Queryable, artistId: string, ownerUserId: string | null): Promise<FollowCounts> {
  const followers = await one<{ n: number }>(q, 'select count(*)::int as n from artist_follows where artist_id = $1', [artistId]);
  return { followers: followers?.n ?? 0, following: ownerUserId ? await followingOf(q, [ownerUserId]) : 0 };
}

/** An organiser's counts: its followers, and what its owners follow together. */
export async function organizerCounts(q: Queryable, organizerId: string): Promise<FollowCounts> {
  const followers = await one<{ n: number }>(q, 'select count(*)::int as n from organizer_follows where organizer_id = $1', [organizerId]);
  const owners = await many<{ user_id: string }>(q, `select user_id from organizer_members where organizer_id = $1 and role = 'owner'`, [organizerId]);
  return { followers: followers?.n ?? 0, following: await followingOf(q, owners.map((o) => o.user_id)) };
}
