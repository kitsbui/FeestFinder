/** One paid order from /me/tickets, in the shape the wallet screen reads. */
FF.appTicket = function (o) {
  const first = o.tickets[0] || {};
  return {
    id: first.code || o.code, ticketId: first.id, orderId: o.id, eventId: o.event.id,
    qty: o.qty, checked: o.tickets.every(t => t.status === 'used'),
    qr: first.qr || '', wallet: first.wallet || { apple:false, google:false }
  };
};

/*
 * The feed screen and the chrome around it. Tickets, plans, chats, notifications and
 * the settings panels each load on their own, when a route asks for them.
 */
FF.loadApp = async function () {
  const signed = !!(FF.session && FF.session.user);
  const none = { items: [] };
  const [events, genres, feedAd, me, friends, saves, hypes, going, follows] = await Promise.all([
    FF.get('/events?time=all&limit=60'),
    FF.maybe(FF.get('/genres'), none),
    FF.maybe(FF.get('/ads?placement=feed'), { ad: null }),
    signed ? FF.maybe(FF.get('/me'), null) : null,
    signed ? FF.maybe(FF.get('/me/friends'), none) : none,
    signed ? FF.maybe(FF.get('/me/saves?limit=100'), none) : none,
    signed ? FF.maybe(FF.get('/me/hypes?limit=100'), none) : none,
    signed ? FF.maybe(FF.get('/me/going?limit=100'), none) : none,
    signed ? FF.maybe(FF.get('/me/follows'), null) : null
  ]);

  const cards = events.items;
  const flags = (list) => { const m = {}; list.forEach(c => { m[c.id] = true; }); return m; };
  const on = (arr) => { const m = {}; (arr || []).forEach(k => { m[k] = true; }); return m; };

  // Friends carry the events they are going to and the ones they are interested in.
  const srcOf = (s) => (['fb','ig','zalo','wa'].indexOf(s) >= 0 ? s : 'zalo');
  const people = friends.items.map(f => ({
    id: f.id, name: f.name, initials: f.initials, src: srcOf(f.source), online: !!f.online,
    color: f.photoUrl ? 'url("' + f.photoUrl + '") center/cover no-repeat' : FF.colorFor(f.id),
    going: cards.filter(c => c.friends && c.friends.going.some(x => x.id === f.id)).map(c => c.id),
    interested: cards.filter(c => c.friends && c.friends.interested.some(x => x.id === f.id)).map(c => c.id)
  }));

  const u = me && me.user;
  const socials = me ? me.connections.map(c => c.provider === 'whatsapp' ? 'wa' : c.provider) : [];
  const orgFollow = {};
  if (follows) follows.organizers.following.forEach(o => { orgFollow[o.id] = true; });

  const areas = [];
  cards.forEach(c => { const a = c.venue.area; if (a && areas.indexOf(a) < 0) areas.push(a); });
  const artists = [];
  cards.forEach(c => (c.artists || []).forEach(a => { if (artists.indexOf(a) < 0) artists.push(a); }));
  const organizers = [];
  cards.forEach(c => { if (!organizers.some(o => o.id === c.organizer.id)) organizers.push({ id: c.organizer.id, name: c.organizer.name }); });

  return {
    events: cards,
    genres: genres.items.map(x => x.genre),
    artists: artists.sort(), areas: areas.sort(),
    organizers: organizers,
    ads: feedAd.ad ? [feedAd.ad] : [],
    friends: people,
    user: u ? {
      handle: u.email || u.phone || u.name, method: u.signupMethod === 'email' ? 'email' : u.signupMethod === 'wa' ? 'wa' : 'zalo',
      name: u.name || '', email: u.email || '', zalo: u.phone || '', city: u.city || '', photo: u.photoUrl || '',
      socials, social: socials[0] || ''
    } : null,
    saved: flags(saves.items), hyped: flags(hypes.items), going: flags(going.items),
    interests: on(u ? u.interests : []),
    orgFollow,
    here: null
  };
};

/* ---- the rest, per route ------------------------------------------------------- */

const flagsOf = (arr) => { const m = {}; (arr || []).forEach(k => { m[k] = true; }); return m; };
const signedIn = () => !!(FF.session && FF.session.user);

/** Wallet: the paid orders behind My tickets. */
FF.appTickets = (cmp) => signedIn() && FF.once('tickets', async () => {
  const out = await FF.maybe(FF.get('/me/tickets'), { items: [] });
  cmp.setState({ tickets: out.items.map(FF.appTicket) });
  return out;
});

/** Group plans: the ones this account is part of, with their members and split. */
FF.appPlans = (cmp) => signedIn() && FF.once('plans', async () => {
  const list = await FF.maybe(FF.get('/me/plans'), { items: [] });
  const planIds = {}, plans = {};
  list.items.forEach(pl => { planIds[pl.event.id] = pl.id; });
  const full = await Promise.all(list.items.map(pl => FF.maybe(FF.get('/plans/' + pl.id), null)));
  full.forEach(pl => { if (pl) plans[pl.event.id] = pl; });
  cmp.setState({ plans, planIds });
  return list;
});

/** The bell. */
FF.appNotifs = (cmp) => signedIn() && FF.once('notifs', async () => {
  const out = await FF.maybe(FF.get('/me/notifications?limit=20'), { items: [] });
  cmp.setState({ notifs: out.items });
  return out;
});

/** Profile, Smart Alert and the notification matrix. */
FF.appSettings = (cmp) => signedIn() && FF.once('settings', async () => {
  const [alert, prefs, chats] = await Promise.all([
    FF.maybe(FF.get('/me/alert'), null),
    FF.maybe(FF.get('/me/notification-preferences'), null),
    FF.maybe(FF.get('/me/chats'), { items: [] })
  ]);
  const patch = {};
  if (alert) Object.assign(patch, {
    alertOn: alert.enabled, alGenres: flagsOf(alert.genres), alArtists: flagsOf(alert.artists),
    alOrgs: flagsOf(alert.organizerIds), alAreas: flagsOf(alert.areas),
    alCap: alert.priceCap === null ? 9e9 : alert.priceCap, alMatches: alert.matches
  });
  if (prefs) patch.notifM = prefs.matrix;
  const threads = {};
  chats.items.forEach(c => {
    if (c.lastMessage) threads[c.friendId] = [{ t: c.lastMessage.body, me: c.lastMessage.fromMe }];
  });
  patch.chats = Object.assign({}, threads, cmp.state.chats);
  cmp.setState(patch);
  return true;
});

/** The in-event ad shown in live mode. */
FF.appLiveAd = () => FF.once('liveAd', async () => {
  const out = await FF.maybe(FF.get('/ads?placement=live'), { ad: null });
  return out.ad;
});

/** Everything a tab other than the feed needs — warmed while the feed is read. */
FF.appRest = (cmp) => Promise.all([FF.appSettings(cmp), FF.appTickets(cmp), FF.appPlans(cmp), FF.appNotifs(cmp)]);

FF.preload = (async () => {
  try {
    FF.data.app = await FF.loadApp();
  } catch (e) {
    FF.data.appError = e;
    FF.data.app = {};
  }
});
