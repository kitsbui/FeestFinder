import type { Ctx } from '../context.ts';
import { many } from '../db/index.ts';

/**
 * Pulls the provider's friend list and links anyone who has connected the same provider.
 * Friendship rows are written both ways. Provider failures are logged, never fatal to sign-in.
 */
export async function syncFriends(ctx: Ctx, userId: string, provider: 'fb' | 'ig', accessToken: string): Promise<number> {
  const impl = ctx.oauth[provider];
  if (!impl) return 0;
  let ids: string[];
  try {
    ids = await impl.friendIds(accessToken);
  } catch (e) {
    ctx.log(`friend sync failed for ${provider}: ${e}`);
    return 0;
  }
  if (!ids.length) return 0;
  const matches = await many<{ user_id: string }>(ctx.db,
    'select user_id from social_connections where provider = $1 and external_id = any($2::text[]) and user_id <> $3',
    [provider, ids, userId]);
  for (const m of matches) {
    await ctx.db.query(
      `insert into friendships (user_id, friend_id, source) values ($1,$2,$3), ($2,$1,$3) on conflict do nothing`,
      [userId, m.user_id, provider]);
  }
  return matches.length;
}

export async function areFriends(ctx: Ctx, a: string, b: string): Promise<boolean> {
  const r = await many(ctx.db, 'select 1 from friendships where user_id = $1 and friend_id = $2', [a, b]);
  return r.length > 0;
}
