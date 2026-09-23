/* Live data for this page. FF.loadWeb runs before the design runtime mounts, and again after sign-in / sign-out. */
FF.webEvent = function (c) {
  return {
    id: c.id, slug: c.slug, title: c.title, genre: c.genre, ds: c.startsOn, de: c.endsOn,
    time: (c.startTime || '') + ' – ' + (c.endTime || ''),
    venue: c.venue.name || '', area: c.venue.area || '', lat: c.venue.lat, lng: c.venue.lng,
    price: c.priceFrom, hype: c.hypeCount, featured: c.featured, soldOut: c.soldOut, past: c.past, dist: c.distanceKm,
    badge: c.badge ? c.badge.label : undefined,
    art: c.coverUrl ? 'url("' + c.coverUrl + '") center/cover no-repeat' : (c.art || 'linear-gradient(135deg,#7A55F6,#B6D9FC)'),
    lineup: c.lineup || []
  };
};
FF.loadWeb = async function () {
  const signed = !!(FF.session && FF.session.user);
  const empty = { items: [] };
  const [events, ad, me, friends, saves, going, follows, prefs] = await Promise.all([
    FF.get('/events?time=all&limit=60'),
    FF.maybe(FF.get('/ads?placement=banner'), { ad: null }),
    signed ? FF.maybe(FF.get('/me'), null) : null,
    signed ? FF.maybe(FF.get('/me/friends'), empty) : empty,
    signed ? FF.maybe(FF.get('/me/saves?limit=100'), empty) : empty,
    signed ? FF.maybe(FF.get('/me/going?limit=100'), empty) : empty,
    signed ? FF.maybe(FF.get('/me/follows'), null) : null,
    signed ? FF.maybe(FF.get('/me/notification-preferences'), null) : null
  ]);
  const cards = events.items;
  const orgs = {}, orgOf = {};
  cards.forEach(c => {
    orgOf[c.id] = c.organizer.id;
    if (!orgs[c.organizer.id]) orgs[c.organizer.id] = { id: c.organizer.id, slug: c.organizer.slug, name: c.organizer.name, initials: c.organizer.initials,
      verified: c.organizer.verified, art: c.organizer.art || c.art, followers: 0, since: '', bio: { en: '', vi: '' } };
  });
  const flags = (list) => { const m = {}; list.forEach(c => { m[c.id] = true; }); return m; };
  const following = {};
  if (follows) {
    follows.organizers.following.forEach(o => { following['org:' + o.id] = true; });
    follows.artists.forEach(a => { following['art:' + a] = true; });
  }
  const u = me && me.user;
  const socials = me ? me.connections.map(c => c.provider) : [];
  const ravo = cards.find(c => c.slug === 'ravo');
  return {
    events: cards.map(FF.webEvent),
    friends: friends.items.map(f => ({ id: f.id, name: f.name, src: f.source, color: FF.colorFor(f.id),
      going: cards.filter(c => c.friends && c.friends.going.some(x => x.id === f.id)).map(c => c.id),
      interested: cards.filter(c => c.friends && c.friends.interested.some(x => x.id === f.id)).map(c => c.id) })),
    orgs, orgOf,
    ads: ad && ad.ad ? [{ id: ad.ad.id, brand: ad.ad.brand, logo: ad.ad.logo, art: ad.ad.art, head: ad.ad.headline, body: ad.ad.body, cta: ad.ad.cta }] : [],
    user: u ? { handle: u.email || u.phone || u.name, method: u.signupMethod, name: u.name || '', email: u.email || '', zalo: u.phone || '',
      city: u.city || '', photo: u.photoUrl || '', socials, social: socials[0] || '' } : null,
    saved: flags(saves.items), going: flags(going.items), following,
    notifM: prefs ? prefs.matrix : null,
    faqs: [],
    mapSel: ravo ? ravo.id : (cards[0] ? cards[0].id : null)
  };
};
/** The city landing page: the questions people ask, in both languages. */
FF.webLanding = (cmp) => FF.once('landing', async () => {
  const [en, vi] = await Promise.all([
    FF.maybe(FF.get('/seo/landing/en/ho-chi-minh/this-weekend'), null),
    FF.maybe(FF.get('/seo/landing/vi/ho-chi-minh/this-weekend'), null)
  ]);
  if (en && vi) cmp.applyFaqs(en.faqs.map((f, i) => ({ q: { en: f.q, vi: (vi.faqs[i] || f).q }, a: { en: f.a, vi: (vi.faqs[i] || f).a } })));
  return true;
});

FF.preload = (async () => { FF.data.web = await FF.loadWeb(); });
