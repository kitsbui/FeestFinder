'use client';
/**
 * Workspaces: where an account works. Everyone attends (the site); an account has at most one
 * craft besides (Studio for an organiser, the artist studio for an artist: kd/craft.ts), and the
 * team has the Console. One list, in three places: the account menu, the "Tôi" hub on /profile
 * (web/me.tsx) and the switcher at the head of every back office's rail.
 */
import type { ReactNode } from 'react';
import { CaretUpDownIcon } from '@phosphor-icons/react/ssr';
import { fill, pick, type Lang } from '../copy';
import { CRAFT, WORKSPACE, isTeam, otherCraft, type Craft } from '../craft';
import { inLang } from '../link';
import { useKd } from '../runtime';
import { Menu, MenuHeader, MenuItem } from './menu';

export type Workspace = 'fan' | Craft | 'console';

export interface WorkspaceEntry {
  key: string;
  label: string;
  /** A workspace is a place (href); adding or switching a craft asks first (onSelect). */
  href?: string;
  onSelect?: () => void;
  aside?: string | null;
  current: boolean;
}

/** The workspaces this account can open, in order: attending, its craft (or adding one), the other craft as a switch, the Console. */
export function useWorkspaces(lang: Lang, current: Workspace): WorkspaceEntry[] {
  const kd = useKd();
  const K = pick(CRAFT, lang);
  const craft = kd.session?.craft ?? null;
  const roles = kd.session?.roles;
  const out: WorkspaceEntry[] = [{ key: 'fan', label: K.attendee, href: inLang('/', lang), current: current === 'fan' }];
  // The craft it has; a back office it is in without that craft (a team member's seat) still shows as where it is.
  const here = current === 'organizer' || current === 'artist' ? current : null;
  for (const c of [...new Set([craft, here].filter((x): x is Craft => !!x))]) {
    out.push({ key: c, label: K[c], href: WORKSPACE[c], aside: roles?.[c] === 'pending' ? K.waiting : null, current: current === c });
  }
  if (craft) out.push({ key: 'switch', label: fill(K.switchTo, { r: K[otherCraft(craft)] }), onSelect: () => kd.openRolePicker(otherCraft(craft)), current: false });
  else if (kd.user) out.push({ key: 'add', label: K.add, onSelect: () => kd.openRolePicker(), current: false });
  if (isTeam(kd.user)) out.push({ key: 'console', label: K.console, href: '/console', current: current === 'console' });
  return out;
}

/** One workspace in a menu: where you are is the checked choice; the others lead there, or ask first. */
const item = (w: WorkspaceEntry) => (w.current
  ? <MenuItem key={w.key} checked onSelect={() => {}}>{w.label}</MenuItem>
  : w.href
    ? <MenuItem key={w.key} href={w.href} external aside={w.aside}>{w.label}</MenuItem>
    : <MenuItem key={w.key} onSelect={w.onSelect}>{w.label}</MenuItem>);

/** The workspaces as menu items, under their heading (the account menu). */
export function WorkspaceItems({ lang, current }: { lang: Lang; current: Workspace }) {
  const K = pick(CRAFT, lang);
  const items = useWorkspaces(lang, current);
  return (
    <>
      <MenuHeader><span className="kd-m">{K.workspaces}</span></MenuHeader>
      {items.map(item)}
    </>
  );
}

/** The switcher at the head of a back office's rail: where you are, and the way to every other workspace. */
export function WorkspaceSwitch({ lang, current, className }: { lang: Lang; current: Workspace; className?: string }) {
  const K = pick(CRAFT, lang);
  const items = useWorkspaces(lang, current);
  const here = items.find((w) => w.current)?.label ?? K[current === 'fan' ? 'attendee' : current];
  return (
    <Menu
      label={K.workspaces}
      width={260}
      className={className}
      trigger={(p) => (
        <button type="button" {...p} ref={p.ref} className="kd-sn h-auto min-h-12 w-full py-1.5 text-left shadow-[inset_0_0_0_1px_var(--color-line-1)]">
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="kd-m leading-none">{K.workspace}</span>
            <span className="kd-ell text-fg-1">{here}</span>
          </span>
          <CaretUpDownIcon size={16} aria-hidden="true" />
        </button>
      )}
    >
      {items.map(item)}
    </Menu>
  );
}

/** The workspaces as rows of a page (the "Tôi" hub). */
export function WorkspaceRows({ lang, current, row }: { lang: Lang; current: Workspace; row: (w: WorkspaceEntry) => ReactNode }) {
  const items = useWorkspaces(lang, current);
  return <>{items.map(row)}</>;
}
