'use client';
/**
 * "Đây là tôi" on a profile nobody runs yet, and on the artist directory's cards. Its own module, so the
 * directory does not load the profile's follow, moments and sheet parts with it.
 */
import { FF } from '@/runtime/ff';
import { pick, type Lang } from '../../copy';
import { useKd } from '../../runtime';
import { buttonClass } from '../../ui/actions';
import { PROFILE } from './copy';

/**
 * "Đây là tôi" on a profile nobody runs yet (D13), outlined beside the page's one action: sign in, then
 * the role picker offers this listing to claim. An account that already runs an artist profile is not
 * offered one (the API answers has_profile); a claim still waiting for the team shows as under review.
 */
export function ClaimButton({ lang, kind, name, size, className, pending }: { lang: Lang; kind: 'organizer' | 'artist'; name: string; size?: 'sm'; className?: string; pending?: boolean }) {
  const kd = useKd();
  const T = pick(PROFILE, lang);
  if (kind === 'artist' && kd.session?.artist) return null;
  if (pending) return <button type="button" disabled className={buttonClass({ size }, className)}>{T.claimPending}</button>;
  const go = () => {
    // Counted (the design plan's gate for phase 3: "Đây là tôi" leads to more profiles claimed).
    FF.track('role_picker_shown', { role: kind, surface: 'claim' });
    if (!kd.requireSignIn(undefined, T.gateClaim)) return;
    kd.openRolePicker(kind, name);
  };
  return <button type="button" onClick={go} className={buttonClass({ size }, className)}>{T.thisIsMe}</button>;
}
