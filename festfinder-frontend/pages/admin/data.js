/*
 * What the admin console loads, and when.
 *
 * The queue and the counts come with the shell; each other tab pulls its own data the
 * first time a route opens it, and the rest is warmed in the background.
 */

/** '2026-09-19' → 'Sat 19 Sep', the line under a queued listing. */
FF.whenLine = function (q, g) {
  const d = FF.pd(q.startsOn);
  const days = g === 'vi' ? ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[d.getDay()] + ' ' + FF.dayLabel(q.startsOn, g) + (q.startTime ? ' · ' + q.startTime : '');
};

const meta = () => (FF.data.admin = FF.data.admin || {});

/* ---- the queue and the counts, on every route ----------------------------------- */

FF.loadAdmin = async function () {
  const [queue, reasons, counts] = await Promise.all([
    FF.get('/admin/queue'),
    FF.get('/admin/reject-reasons'),
    FF.maybe(FF.get('/admin/counts'), null)
  ]);
  const first = queue.items[0];
  const thread = first ? await FF.maybe(FF.get('/admin/listings/' + first.id + '/thread'), null) : null;
  return {
    queue, counts, reasons: reasons.items,
    quickAsks: thread ? thread.quickAsks : [],
    orgs: [], reports: null, shelves: [], appeals: [], ads: null, insights: null,
    audit: { items: [] }, auditOk: null, impersonation: [], genres: null, areas: null
  };
};

/* ---- one loader per tab --------------------------------------------------------- */

/** Organizer verification: the accounts waiting on a badge. */
FF.admOrgs = (cmp) => FF.once('orgs', async () => {
  const out = await FF.maybe(FF.get('/admin/organizers'), { items: [] });
  meta().orgNote = out.note;
  cmp.setState({ orgs: out.items });
  return out;
});

/** User reports, grouped by listing, with the 30-day breakdown. */
FF.admReports = (cmp) => FF.once('reports', async () => {
  const out = await FF.maybe(FF.get('/admin/reports'), { items: [], last30Days: [] });
  cmp.setState({ reports: out.items, reportStats: out.last30Days });
  return out;
});

/** Featured shelves and what is on them. */
FF.admShelves = (cmp) => FF.once('shelves', async () => {
  const out = await FF.maybe(FF.get('/admin/shelves'), { items: [] });
  cmp.setState({ shelves: out.items });
  return out;
});

/** Brand enquiries and the campaigns already running. */
FF.admAds = (cmp) => FF.once('ads', async () => {
  const [ads, genres] = await Promise.all([
    FF.maybe(FF.get('/admin/ads'), null),
    FF.maybe(FF.get('/genres'), null)
  ]);
  if (genres) meta().genres = genres.items.map(x => x.genre);
  if (ads) {
    meta().ads = ads;
    cmp.setState({
      inquiries: ads.inquiries, campaigns: ads.campaigns,
      adsSel: ads.inquiries.length ? ads.inquiries[0].id : null,
      setup: Object.assign({}, cmp.state.setup, { rates: Object.assign({}, ads.rates) })
    });
  }
  return ads;
});

/** Platform numbers: health, organizers, the user base. */
FF.admInsights = (cmp) => FF.once('insights', async () => {
  const out = await FF.maybe(FF.get('/admin/insights'), null);
  cmp.setState({ insights: out });
  return out;
});

/** The audit log, plus the hash-chain check printed under the title. */
FF.admAudit = (cmp) => FF.once('audit', async () => {
  const [audit, ok] = await Promise.all([
    FF.maybe(FF.get('/admin/audit?limit=18'), { items: [] }),
    FF.maybe(FF.get('/admin/audit/verify'), null)
  ]);
  meta().audit = audit;
  cmp.setState({ audit: audit.items, auditOk: ok });
  return audit;
});

/** Appeals against a rejection. */
FF.admAppeals = (cmp) => FF.once('appeals', async () => {
  const out = await FF.maybe(FF.get('/admin/appeals'), { items: [] });
  cmp.setState({ appeals: out.items });
  return out;
});

/** Who the View-as menu can open a read-only session as. */
FF.admImpersonation = (cmp) => FF.once('impersonation', async () => {
  const out = await FF.maybe(FF.get('/admin/impersonation/options'), { items: [] });
  meta().impNote = out.note;
  cmp.setState({ impOptions: out.items });
  return out;
});

/** Warmed in the background once the queue is up. */
FF.admRest = (cmp) => Promise.all([
  FF.admOrgs(cmp), FF.admReports(cmp), FF.admShelves(cmp), FF.admAppeals(cmp), FF.admAudit(cmp)
]);

FF.preload = (async () => {
  const isAdmin = (s) => !!(s && s.user && s.user.role === 'admin');
  if (!isAdmin(FF.session)) {
    await FF.gate({
      kicker: 'FestFinder · internal',
      title: 'Sign in to the admin console',
      note: 'Moderation, verification and the audit log. Every decision here is recorded against your account.',
      idPlaceholder: 'Admin email',
      ok: isAdmin,
      wrongAccount: 'That account is not an admin.'
    });
  }
  FF.data.admin = await FF.loadAdmin();
});
