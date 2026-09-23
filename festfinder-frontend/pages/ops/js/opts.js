/*
 * Option lists for selects and filters, all from /meta/form-options, plus the searchable
 * sources (organisers, venues, events, artists) the comboboxes ask as the person types.
 */
import { h, t, tx, get, qs, options, isAdmin, day } from './core.js';
import { Avatar, Pill } from './ui.js';

export const genreOptions = () => options().genres.map((g) => ({ value: g.value, label: tx(g.label), short: g.value, hint: tx(g.hint) }));
export const entryOptions = () => options().entryModes.map((e) => ({ value: e.value, label: tx(e.label), hint: tx(e.hint) }));
export const ageOptions = () => options().ages.map((a) => ({ value: a.value, label: tx(a.label) }));
export const orgTypeOptions = () => options().organizerTypes.map((o) => ({ value: o.value, label: tx(o.label) }));
export const statusOptions = (counts) => options().statuses.map((s) => ({ value: s.value, label: tx(s.label), count: counts ? counts[s.value] ?? 0 : undefined }));
export const badgeOptions = () => options().badges.map((b) => ({ value: b.value, label: tx(b.label) }));
export const bankOptions = () => options().banks.map((b) => ({ value: b.bin, label: b.name, sub: b.bin }));
export const rejectOptions = () => options().rejectReasons.map((r) => ({ value: r.code, label: tx(r.label) }));
export const orderStatusOptions = () => options().orderStatuses.map((s) => ({ value: s.value, label: tx(s.label) }));
export const payMethodOptions = () => options().paymentMethods.map((m) => ({ value: m.value, label: m.label }));
export const signupOptions = () => options().signupMethods.filter((m) => m.value !== 'staff').map((m) => ({ value: m.value, label: m.label }));

/** Districts, grouped (Central, East, South…), for filters and comboboxes alike. */
export const areaOptions = () => options().areaGroups.flatMap((g) => g.areas.map((a) => ({ value: a, label: a, group: tx(g.label) })));

export const genreLabel = (g) => (g ? tx(options().genres.find((x) => x.value === g)?.label) || g : '—');
export const entryLabel = (e) => tx(options().entryModes.find((x) => x.value === e)?.label) || e;
export const orgTypeLabel = (v) => tx(options().organizerTypes.find((x) => x.value === v)?.label) || v || '—';
const TYPE_SHORT = { promoter: ['Đơn vị tổ chức', 'Promoter'], venue: ['Địa điểm', 'Venue'], company: ['Doanh nghiệp', 'Company'], agency: ['Agency', 'Agency'], public: ['Tổ chức công', 'Public body'] };
/** The organiser type in a word or two, for table cells. */
export const orgTypeShort = (v) => (TYPE_SHORT[v] ? t(TYPE_SHORT[v][0], TYPE_SHORT[v][1]) : v || '—');

/** Organisers, for the team: name, verification and how many listings they run. */
export async function loadOrganizers(q) {
  const out = await get('/admin/organizers' + qs({ q }));
  return out.items.slice(0, 40).map((o) => ({
    value: o.id, label: o.name, sub: [orgTypeLabel(o.type), t(`${o.allEvents} tin`, `${o.allEvents} listings`)].join(' · '),
    avatar: h(Avatar, { name: o.name, src: o.logoUrl, art: o.art, size: 26, square: true }),
    badge: o.state === 'verified' ? h(Pill, { tone: 'ok', icon: 'seal-check' }, t('Đã xác minh', 'Verified')) : o.suspended ? h(Pill, { tone: 'danger' }, t('Tạm dừng', 'Suspended')) : null,
  }));
}

/** Saved venues. Organisers search the public list; the team sees every venue. */
export async function loadVenues(q) {
  const out = await get('/venues' + qs({ q, limit: 30 }));
  return out.items.map((v) => ({ value: v.id, label: v.name, sub: `${v.address} · ${v.area}`, raw: v }));
}

/** Listings for pickers (shelves, order filters). */
export async function loadEvents(q, extra = {}) {
  if (!isAdmin()) return [];
  const out = await get('/admin/events' + qs({ q, limit: 20, sort: 'date', ...extra }));
  return out.items.map((e) => ({ value: e.id, label: e.title, sub: [day(e.startsOn), e.venueName, e.organizer.name].filter(Boolean).join(' · '), raw: e }));
}

/** Artists already on live listings, so the same name is spelled the same way everywhere. */
export async function suggestArtists(q) {
  const out = await get('/artists' + qs({ q }));
  return out.items.map((a) => ({ value: a.name, sub: t(`${a.events} sự kiện`, `${a.events} events`) }));
}
