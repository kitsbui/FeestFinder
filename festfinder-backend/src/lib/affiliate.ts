/*
 * The referrer's share of FeestFinder's affiliate commission (growth plan card D, decision D8).
 * FeestFinder sells no tickets: a partner seller pays FeestFinder a commission for a sale that a
 * /go click brought, and the person whose share link brought the buyer earns SHARE_PCT of it.
 * Nobody pays FeestFinder or the referrer anything; the team pays referrers by period.
 */

/** Percent of FeestFinder's commission that goes to the person who referred the buyer. */
export const SHARE_PCT = 50;
/** The smallest balance the team pays out, in VND. */
export const MIN_PAYOUT = 50_000;
/** How long a share link's referrer is remembered on the visitor's phone (last click wins). */
export const REF_DAYS = 30;
/** A referral code (users.ref_code, randomCode(6)). */
export const REF_RE = /^[2-9A-HJ-NP-Z]{6}$/;

/** The referrer's share of a commission, in the same unit. */
export const shareOf = (commission: number) => Math.round((commission * SHARE_PCT) / 100);

/** What a referrer sees: FeestFinder's commission on a partner, then their share of it, in percent. */
export const sharePct = (partnerCommissionPct: number) => Math.round(partnerCommissionPct * SHARE_PCT) / 100;
