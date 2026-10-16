'use client';
/**
 * /console/users: accounts. Search by name, email or phone; filter by kind, sign-up method,
 * city and activity; sort; every filter and the page are in the address. An account opens in
 * a drawer (?id=, or /console/users/<id>) with what it has done, its organiser teams and its
 * recent orders. An admin can make another account an admin or remove it (never their own:
 * the API refuses); the ADMIN_EMAIL allowlist still decides on every boot who keeps it.
 */
import { useCallback } from 'react';
import { fill, pick, type Lang, type Pair } from '../../copy';
import { money } from '../../format';
import { KdLink } from '../../link';
import { Avatar, Stat, StatRow } from '../../ui/parts';
import { Row, Table } from '../../ui/shell';
import { ago, Body, Choice, Drawer, Empty, ErrorBox, FilterBar, KV, Loading, MultiChoice, PageHead, Pager, Pill, qs, SearchField, stamp, useLoad, useOptions, useQuery } from '../kit';
import { useConsole } from '../root';
import { Cell, CHECKOUT_CURRENCY, Section, STATUS_TONE, Two, useTyped } from '../orders/parts';
import { USERS } from './copy';

interface Org { id: string; name: string; role: 'owner' | 'manager' | string }
interface UserRow {
  id: string; name: string | null; email: string | null; phone: string | null; city: string | null; role: 'user' | 'admin'; signupLabel: string;
  createdAt: string; lastActiveAt: string | null; photoUrl: string | null; tickets: number; saves: number; organizers: Org[];
}
interface UserDetail extends Omit<UserRow, 'tickets' | 'saves'> {
  locale: string; interests: string[]; birthYear: number | null; hasPassword: boolean;
  counts: { saves: number; hypes: number; going: number; tickets: number; friends: number; reports: number; orders: number; activeDays: number };
  connections: { provider: string; label: string; name: string | null }[];
  orders: { id: string; code: string; status: string; statusLabel: Pair; total: number; qty: number; createdAt: string; event: string }[];
}

/** Vietnamese numbers read the way people write them (0901 234 567); others stay as stored. */
const phone = (p: string | null) => (p ? p.replace(/^\+84/, '0').replace(/^(0\d{3})(\d{3})(\d+)$/, '$1 $2 $3') : null);
const monthYear = (iso: string, lang: Lang) => new Date(iso).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-GB', { month: '2-digit', year: 'numeric' });
const COLS = 'minmax(240px,1.6fr) minmax(150px,1fr) 120px 120px 110px 120px 90px';

export function Users() {
  const { lang } = useConsole();
  const T = pick(USERS, lang);
  const opts = useOptions();
  const [params, set] = useQuery();
  const get = (k: string) => params.get(k) ?? '';
  const kind = get('kind'), method = get('method'), city = get('city'), active = get('active'), sort = get('sort') || 'new';
  const offset = Number(get('offset') || 0), limit = Number(get('limit') || 25);
  const id = get('id');
  const reset = useCallback((p: Record<string, string | null>) => set({ ...p, offset: null }), [set]);
  const [text, setText] = useTyped(get('q'), useCallback((v: string) => reset({ q: v }), [reset]));
  const path = '/admin/users' + qs({ q: get('q'), kind: kind || 'all', method, city, active: active || 'all', sort, offset, limit });
  const load = useLoad<{ items: UserRow[]; total: number; cities: { value: string; count: number }[] }>(path);
  const filtered = !!(kind || method || city || active || get('q'));

  return (
    <>
      <PageHead title={T.title} />
      <Body>
        <FilterBar onReset={filtered ? () => { setText(''); reset({ q: null, kind: null, method: null, city: null, active: null }); } : null}>
          <SearchField value={text} onChange={setText} label={T.searchLabel} placeholder={T.search} />
          <Choice label={T.kind} value={kind} onChange={(v) => reset({ kind: v })}
            options={[{ value: 'attendee', label: T.kAttendee }, { value: 'organizer', label: T.kOrganizer }, { value: 'admin', label: T.kAdmin }]} />
          <MultiChoice label={T.method} values={method ? method.split(',') : []} onChange={(v) => reset({ method: v.join(',') })}
            options={(opts?.signupMethods ?? []).filter((m: { value: string }) => m.value !== 'staff').map((m: { value: string; label: string }) => ({ value: m.value, label: m.label }))} />
          <Choice label={T.city} value={city} onChange={(v) => reset({ city: v })}
            options={(load.data?.cities ?? (city ? [{ value: city, count: 0 }] : [])).map((c) => ({ value: c.value, label: c.value, aside: c.count ? c.count : undefined }))} />
          <Choice label={T.activity} value={active} onChange={(v) => reset({ active: v })}
            options={[{ value: '7d', label: T.a7 }, { value: '30d', label: T.a30 }, { value: 'dormant', label: T.aDormant }]} />
          <span className="ml-auto">
            <Choice label={T.sort} any={false} value={sort} onChange={(v) => reset({ sort: v === 'new' ? null : v })}
              options={[{ value: 'new', label: T.sNew }, { value: 'active', label: T.sActive }, { value: 'tickets', label: T.sTickets }, { value: 'name', label: T.sName }]} />
          </span>
        </FilterBar>
        {load.error ? <ErrorBox error={load.error} retry={load.reload} /> : null}
        {!load.data ? (load.error ? null : <Loading />) : !load.data.items.length ? <Empty /> : (
          <Table label={T.table} cols={COLS} head={[T.colAccount, T.colKind, T.colMethod, T.colCity, T.colTickets, T.colActive, T.colJoined]}>
            {load.data.items.map((u) => (
              <Row key={u.id} cols={COLS} current={u.id === id} onClick={() => set({ id: u.id })}>
                <Cell>
                  <span className="flex min-w-0 items-center gap-3">
                    <Avatar name={u.name || u.email || '?'} src={u.photoUrl} size={32} />
                    <Two title={u.name || <span className="text-fog">{T.noName}</span>} sub={[u.email, phone(u.phone)].filter(Boolean).join(' · ')} />
                  </span>
                </Cell>
                <Cell>
                  <span className="flex min-w-0 flex-wrap gap-1">
                    {u.role === 'admin' ? <Pill tone="live">{T.kAdmin}</Pill> : null}
                    {u.organizers.length ? <span title={u.organizers.map((o) => o.name).join(', ')}><Pill tone="ok">{u.organizers[0].name}</Pill></span> : null}
                    {u.role !== 'admin' && !u.organizers.length ? <span className="kd-s">{T.attendee}</span> : null}
                  </span>
                </Cell>
                <Cell className="kd-s">{u.signupLabel}</Cell>
                <Cell className="kd-s kd-ell">{u.city || '—'}</Cell>
                <Cell end className="kd-num text-sm text-paper">{u.tickets} · {u.saves}</Cell>
                <Cell className="kd-s text-xs">{ago(u.lastActiveAt, lang)}</Cell>
                <Cell className="kd-s kd-num text-xs">{monthYear(u.createdAt, lang)}</Cell>
              </Row>
            ))}
          </Table>
        )}
        {load.data ? <Pager offset={offset} limit={limit} total={load.data.total} onChange={(o, l) => set({ offset: o ? String(o) : null, limit: l === 25 ? null : String(l) })} /> : null}
      </Body>
      {id ? <UserDrawer key={id} id={id} lang={lang} onClose={() => set({ id: null })} /> : null}
    </>
  );
}

function UserDrawer({ id, lang, onClose }: { id: string; lang: Lang; onClose: () => void }) {
  const T = pick(USERS, lang);
  const load = useLoad<UserDetail>('/admin/users/' + id);
  const u = load.data;
  const name = u ? u.name || u.email || phone(u.phone) || '—' : T.loading;
  return (
    <Drawer
      wide
      title={name}
      sub={u ? (
        <span className="flex flex-wrap items-center gap-2">
          {u.role === 'admin' ? <Pill tone="live">{T.kAdminFrom}</Pill> : null}
          {u.organizers.length ? <Pill tone="ok">{T.organizer}</Pill> : null}
          <span>{fill(T.joined, { m: u.signupLabel, d: stamp(u.createdAt, lang, false) })}</span>
        </span>
      ) : null}
      onClose={onClose}
    >
      {load.error && !u ? <ErrorBox error={load.error} retry={load.reload} /> : !u ? <Loading /> : (
        <>
          <div className="flex items-center gap-4">
            <Avatar name={u.name || u.email || '?'} src={u.photoUrl} size={44} />
            <StatRow className="flex-1">
              <Stat value={u.counts.tickets} label={fill(T.sTicketsN, { n: u.counts.orders })} />
              <Stat value={`${u.counts.saves} · ${u.counts.hypes}`} label={T.sSaves} />
              <Stat value={u.counts.friends} label={T.sFriends} />
              <Stat value={u.counts.activeDays} label={fill(T.sDays, { a: ago(u.lastActiveAt, lang) })} />
            </StatRow>
          </div>
          <Section title={T.account}>
            <KV rows={[
              [T.kEmail, u.email ?? '—'],
              [T.kPhone, phone(u.phone) ?? '—'],
              [T.kCity, u.city || '—'],
              [T.kLang, u.locale === 'vi' ? 'Tiếng Việt' : 'English'],
              [T.kBirth, u.birthYear ?? '—'],
              [T.kPassword, u.hasPassword ? T.pwSet : T.pwNone],
              [T.kInterests, u.interests.length ? <span key="i" className="flex flex-wrap gap-1">{u.interests.map((x) => <Pill key={x}>{x}</Pill>)}</span> : '—'],
              [T.kConnections, u.connections.length ? u.connections.map((c) => c.label).join(', ') : '—'],
              ...(u.counts.reports ? [[T.kReports, u.counts.reports] as [string, number]] : []),
            ]} />
          </Section>
          {u.organizers.length ? (
            <Section title={T.teams}>
              <ul className="flex flex-col">
                {u.organizers.map((o) => (
                  <li key={o.id} className="flex min-h-11 items-center gap-3 border-b border-line">
                    <KdLink className="kd-ell flex-1 text-sm text-paper hover:underline" href={'/console/organizers?id=' + o.id}>{o.name}</KdLink>
                    <Pill>{o.role === 'owner' ? T.owner : T.manager}</Pill>
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}
          <Section title={T.orders}>
            {u.orders.length ? (
              <ul className="flex flex-col">
                {u.orders.map((o) => (
                  <li key={o.id} className="border-b border-line">
                    <KdLink className="flex items-center gap-3 py-2.5 hover:bg-white/[0.03]" href={'/console/orders?id=' + o.id}>
                      <Two title={o.event} sub={fill(T.orderLine, { c: o.code, d: stamp(o.createdAt, lang), n: o.qty })} />
                      <span className="ml-auto flex shrink-0 items-center gap-2">
                        <span className="kd-num text-sm text-paper">{money(o.total, CHECKOUT_CURRENCY, lang)}</span>
                        <Pill tone={STATUS_TONE[o.status] ?? 'none'}>{o.statusLabel[lang]}</Pill>
                      </span>
                    </KdLink>
                  </li>
                ))}
              </ul>
            ) : <p className="kd-s">{T.noOrders}</p>}
          </Section>
        </>
      )}
    </Drawer>
  );
}
