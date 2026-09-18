/*
 * What the back office loads, and when.
 *
 * The shell fetches the chrome and the current event (FF.loadOrg); every screen below
 * pulls its own data the first time a route opens it, and the rest is warmed in the
 * background once the first screen is up.
 */

/** One inbox message in the shape the thread view reads. */
FF.toMsg = (m) => ({ from: m.fromMe ? 'me' : 'ff', stamp: FF.hhmm(m.createdAt), text: m.body });
const dayLabel = FF.dayLabel, toMsg = FF.toMsg;

/** Notes the screens print verbatim, filled in as the loaders answer. */
const meta = () => (FF.data.org = FF.data.org || {});

/** A draft listing in the shape the wizard's form reads. */
FF.orgForm = function (d, profile) {
  return {
    name: d ? d.title : '', genre: d && d.genre ? d.genre : 'EDM',
    desc: d ? FF.text(d.description, 'en') : '',
    date: d && d.startsOn ? d.startsOn.split('-').reverse().join(' / ') : '',
    time: d && d.startTime ? d.startTime + ' – ' + (d.endTime || '') : '',
    venue: d && d.venue ? d.venue.name || '' : '', venueId: d && d.venue ? d.venue.id : null,
    entry: d ? d.entryMode : 'paid',
    price: d && d.priceFrom ? Number(d.priceFrom).toLocaleString('vi-VN') : '',
    url: d ? d.ticketUrl || '' : '',
    age: d ? d.age || '18+' : '18+', lineup: d ? d.lineup || [] : [],
    logo: d ? d.logoUrl : null, cover: d ? d.coverUrl : null,
    eventUrl: d ? d.eventUrl || '' : '', brandUrl: d ? d.brandUrl || '' : ((profile && profile.website) || '')
  };
};

/** One notification in the shape the bell reads. */
FF.orgNotif = (n) => ({
  id: n.id, kind: n.kind, unread: n.unread, go: n.link && n.link.screen ? n.link.screen : 'dash',
  when: { en: FF.hhmm(n.createdAt), vi: FF.hhmm(n.createdAt) },
  title: n.title, body: n.body, cta: n.cta
});

/* ---- the chrome, on every route ------------------------------------------------- */

FF.loadOrg = async function () {
  const s = FF.session;
  if (!s || !s.organizers || !s.organizers.length) return { authed: false };

  const [profile, events] = await Promise.all([
    FF.get('/organizer/profile'),
    FF.get('/organizer/events')
  ]);

  // Attendees, the door, promos and payouts are all about one event: the live one the
  // organiser is actually running — the one with the most tickets out, soonest first.
  const live = events.items.filter(e => e.status === 'live' && e.hasPerformance);
  const current = live.slice().sort((a, b) => (b.sold - a.sold) || 0)[0]
    || events.items.filter(e => e.status === 'live')[0] || events.items[0] || null;
  const draft = events.items.filter(e => e.status === 'draft')[0]
    || events.items.filter(e => e.status === 'rejected')[0] || null;
  const id = current ? current.id : null;
  const detail = id ? await FF.maybe(FF.get('/organizer/events/' + id), null) : null;
  const tomorrow = new Date(FF.now().getTime() + 86400000);

  return {
    authed: true,
    profile,
    biz: {
      logo: profile.logoUrl, name: profile.name, type: profile.type, bio: FF.text(profile.bio, 'en'),
      website: profile.website || '', legal: profile.legalName || '', tax: profile.taxCode || '',
      address: profile.address || '', email: profile.email || '', hotline: profile.hotline || '',
      zalo: profile.zalo || '', contactName: profile.contactName || '', contactRole: profile.contactRole || ''
    },
    events: events.items,
    venues: [],
    eventId: id, draftId: draft ? draft.id : null,
    venueName: detail && detail.venue ? detail.venue.name : '',
    doorsClose: detail ? detail.endTime : '',
    annDate: FF.vnDate(tomorrow).slice(8) + '/' + FF.vnDate(tomorrow).slice(5, 7)
  };
};

/* ---- one loader per screen ------------------------------------------------------ */

/** Dashboard: the KPI row, the suggested next steps and who is looking. */
FF.orgDash = (cmp) => FF.once('dash', async () => {
  const [dashboard, audience] = await Promise.all([
    FF.maybe(FF.get('/organizer/dashboard?range=30d'), null),
    FF.maybe(FF.get('/organizer/audience'), null)
  ]);
  cmp.setState({
    kpis: dashboard ? dashboard.kpis : [],
    todo: dashboard ? dashboard.todo : [],
    audience: audience || null
  });
  return true;
});

/** The wizard: venues for the autocomplete, and the draft it edits. */
FF.orgWizard = (cmp) => FF.once('wizard', async () => {
  const [venues, draft] = await Promise.all([
    FF.maybe(FF.get('/venues?limit=60'), { items: [] }),
    cmp.state.draftId ? FF.maybe(FF.get('/organizer/events/' + cmp.state.draftId), null) : null
  ]);
  cmp.applyVenues(venues.items);
  if (draft) cmp.setState({ form: FF.orgForm(draft, FF.data.org.profile) });
  return true;
});

/** Attendees: one row per ticket, with the KPI row above it. */
FF.orgAttendees = (cmp, id) => id ? FF.once('attendees', async () => {
  const out = await FF.maybe(FF.get('/organizer/events/' + id + '/attendees?limit=10'), null);
  if (out) cmp.applyAttendees(out);
  return out;
}) : Promise.resolve(null);

/** Announcements: what went out, and how far a new one would reach. */
FF.orgAnnounce = (cmp, id) => id ? FF.once('announce', async () => {
  const at = '/organizer/events/' + id + '/announcements';
  const [sent, sizes, est] = await Promise.all([
    FF.maybe(FF.get(at), null),
    Promise.all(['saved', 'holders', 'vip', 'past'].map(a =>
      FF.maybe(FF.get(at + '/estimate?audience=' + a + '&channels='), null))),
    FF.maybe(FF.get(at + '/estimate?audience=saved&channels=push,zalo'), null)
  ]);
  const annSizes = {};
  ['saved', 'holders', 'vip', 'past'].forEach((a, i) => { annSizes[a] = sizes[i] ? sizes[i].audienceSize : 0; });
  if (sent) meta().annRule = sent.rule;
  cmp.setState({ annSent: sent ? sent.items : [], annSizes, annEst: est });
  return true;
}) : Promise.resolve(null);

/** The door: who is inside, the recent scans and the gate crew. */
FF.orgDoor = (cmp, id) => id ? FF.once('door', async () => {
  const door = await FF.maybe(FF.get('/door/events/' + id + '/summary'), null);
  if (door) {
    meta().offlineNote = door.offlineNote;
    cmp.setState({
      doorInside: door.inside, doorCap: door.capacity, doorRate: door.throughputPerHour,
      doorLog: door.recent, staff: door.staff, scanners: door.scannersActive,
      syncedAt: door.lastSyncedAt ? FF.hhmm(door.lastSyncedAt) : null
    });
  }
  return door;
}) : Promise.resolve(null);

/** Promo codes and the guest list. */
FF.orgPromos = (cmp, id) => id ? FF.once('promos', async () => {
  const [promos, guests] = await Promise.all([
    FF.maybe(FF.get('/organizer/events/' + id + '/promos'), null),
    FF.maybe(FF.get('/organizer/events/' + id + '/guests'), null)
  ]);
  if (promos) meta().promoTip = promos.tip;
  cmp.setState({
    promos: promos ? promos.items : [], promoStats: promos ? promos.stats : null,
    guests: guests ? guests.items : [], guestLine: guests ? guests.countLine : null
  });
  return true;
}) : Promise.resolve(null);

/** Revenue, fees and the payout ladder. */
FF.orgMoney = (cmp, id) => id ? FF.once('money', async () => {
  const revenue = await FF.maybe(FF.get('/organizer/events/' + id + '/revenue'), null);
  cmp.setState({ revenue });
  return revenue;
}) : Promise.resolve(null);

/** Messages from moderation and partnerships, with the first thread open. */
FF.orgInbox = (cmp) => FF.once('inbox', async () => {
  const inbox = await FF.maybe(FF.get('/organizer/inbox'), { items: [] });
  const first = inbox.items[0] ? await FF.maybe(FF.get('/organizer/inbox/' + inbox.items[0].id), null) : null;
  meta().inboxNote = inbox.responseNote || null;
  const threads = inbox.items.map((t, i) => ({
    id: t.id, unread: t.unread, who: t.who, subj: t.subject,
    about: (t.about ? t.about.title + ' · ' + FF.dayLabel(t.about.startsOn, 'en') : ''),
    when: FF.hhmm(t.updatedAt), snippet: t.snippet,
    msgs: i === 0 && first ? first.messages.map(FF.toMsg) : []
  }));
  cmp.setState({ threads, inboxSel: threads.length ? threads[0].id : null });
  return inbox;
});

/** The bell: notifications and which topics are switched on. */
FF.orgBell = (cmp) => FF.once('bell', async () => {
  const [notifs, prefs] = await Promise.all([
    FF.maybe(FF.get('/organizer/notifications'), { items: [] }),
    FF.maybe(FF.get('/organizer/notification-preferences'), null)
  ]);
  cmp.setState({
    notifs: notifs.items.map(FF.orgNotif),
    notifPrefs: prefs
      ? prefs.topics.reduce((o, t) => { o[t.key] = t.enabled; return o; }, {})
      : cmp.state.notifPrefs
  });
  return true;
});

/** Warmed in the background once the first screen is up. */
FF.orgRest = function (cmp) {
  const id = cmp.state.eventId;
  return Promise.all([
    FF.orgDash(cmp), FF.orgBell(cmp), FF.orgInbox(cmp),
    FF.orgAttendees(cmp, id), FF.orgDoor(cmp, id), FF.orgPromos(cmp, id), FF.orgMoney(cmp, id)
  ]);
};

FF.preload = (async () => {
  try {
    FF.data.org = await FF.loadOrg();
  } catch (e) {
    FF.data.orgError = e;
    FF.data.org = { authed: false };
  }
});
