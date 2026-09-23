import type { FastifyInstance } from 'fastify';

/**
 * A small API explorer at `/_console` for local development: click a request, see the JSON,
 * sign in as a demo account to try the organiser and admin endpoints. Not served in production.
 */
const PAGE = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>FeestFinder API</title>
<link rel="icon" href="data:,">
<style>
  :root { --bg:#06080D; --s1:#0A0E1A; --s2:#121826; --s3:#1A2233; --bd:#262F44; --tx:#F3F6FC; --tx2:#C3CBDC; --tx3:#8891A8; --ac:#2AC4E8; --ach:#7FE0F5; --vi:#B9A8FF; --gr:#6FD79B; --am:#FFB35C; --rd:#FF9A9A; }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--bg); color:var(--tx); font:14px/1.5 system-ui, -apple-system, "Segoe UI", sans-serif; }
  header { display:flex; flex-wrap:wrap; gap:12px; align-items:center; justify-content:space-between; padding:14px 18px; border-bottom:1px solid var(--bd); background:var(--s1); position:sticky; top:0; z-index:2; }
  h1 { margin:0; font-size:16px; font-weight:800; letter-spacing:.04em; text-transform:uppercase; }
  h1 span { color:var(--ac); }
  .who { display:flex; flex-wrap:wrap; gap:6px; align-items:center; font-size:12px; color:var(--tx3); }
  button { font:inherit; cursor:pointer; border-radius:999px; border:1px solid var(--bd); background:transparent; color:var(--tx2); padding:5px 11px; font-size:12px; font-weight:600; }
  button:hover { border-color:var(--ac); color:var(--ach); }
  button.on { background:rgba(42,196,232,.14); border-color:var(--ac); color:var(--ach); }
  main { display:grid; grid-template-columns:minmax(260px, 340px) 1fr; min-height:calc(100vh - 57px); }
  nav { border-right:1px solid var(--bd); overflow:auto; padding:10px 0 30px; }
  nav h2 { margin:16px 18px 6px; font-size:10.5px; font-weight:800; letter-spacing:.1em; text-transform:uppercase; color:var(--tx3); }
  nav a { display:flex; gap:8px; align-items:baseline; padding:6px 18px; color:var(--tx2); text-decoration:none; font-size:13px; }
  nav a:hover, nav a.on { background:var(--s2); color:var(--tx); }
  nav a small { color:var(--tx3); font-family:ui-monospace, monospace; font-size:11px; margin-left:auto; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:50%; }
  .lock { color:var(--am); font-size:11px; }
  section { min-width:0; display:flex; flex-direction:column; }
  .bar { display:flex; gap:8px; align-items:center; padding:10px 16px; border-bottom:1px solid var(--bd); background:var(--s1); }
  .bar input { flex:1; min-width:0; background:var(--bg); border:1px solid var(--bd); color:var(--tx); border-radius:10px; padding:7px 10px; font:13px ui-monospace, monospace; }
  .status { font:12px ui-monospace, monospace; padding:3px 8px; border-radius:999px; border:1px solid var(--bd); color:var(--tx3); white-space:nowrap; }
  .ok { color:var(--gr); border-color:rgba(46,158,91,.5); } .err { color:var(--rd); border-color:rgba(224,74,74,.5); }
  pre { margin:0; padding:16px; overflow:auto; flex:1; font:12.5px/1.55 ui-monospace, monospace; color:var(--tx2); white-space:pre-wrap; word-break:break-word; }
  .k { color:var(--ach); } .s { color:var(--gr); } .n { color:var(--am); } .b { color:var(--vi); }
  .hint { padding:22px 16px; color:var(--tx3); }
  .hint code { color:var(--ach); }
  @media (max-width: 760px) { main { grid-template-columns:1fr; grid-template-rows:auto 1fr; } nav { border-right:0; border-bottom:1px solid var(--bd); max-height:40vh; } }
</style>
</head>
<body>
<header>
  <h1>Fest<span>Finder</span> API</h1>
  <div class="who">
    <span id="who">Signed out</span>
    <button data-login="minh@example.com|festfinder123">Attendee</button>
    <button data-login="team@ravolution.vn|ravolution2026">Organizer</button>
    <button data-login="admin@festfinder.vn|festfinder-admin">Admin</button>
    <button id="logout">Sign out</button>
    <button id="lang">EN</button>
  </div>
</header>
<main>
  <nav id="nav"></nav>
  <section>
    <div class="bar">
      <input id="url" spellcheck="false" aria-label="Request path">
      <button id="send">Send</button>
      <span id="status" class="status">GET</span>
    </div>
    <pre id="out"><div class="hint">Pick a request on the left, or type a path and press Send. Requests marked <span class="lock">sign in</span> need one of the demo accounts above. The full reference is in <code>docs/API.md</code>.</div></pre>
  </section>
</main>
<script>
const groups = [
  ['Explore (public)', [
    ['This weekend', '/events?limit=6'],
    ['Tonight', '/events?time=tonight'],
    ['Search "thu duc"', '/events?q=thu%20duc&limit=10'],
    ['Free this month', '/events?time=month&price=free'],
    ['Event detail: Ravolution', '/events/ravo'],
    ['Event detail: HOZO', '/events/hozo'],
    ['Map search, District 7', '/events/map?bbox=106.70,10.70,106.75,10.75'],
    ['Hero stat cards', '/explore/stats?view=venues'],
    ['Organiser profile', '/organizers/ravoent'],
    ['Featured shelves', '/shelves'],
    ['Artists', '/artists'],
    ['Venues', '/venues?q=phu%20tho'],
    ['SEO landing page', '/seo/landing/en/ho-chi-minh/free/this-weekend'],
    ['SEO landing (vi)', '/seo/landing/vi/ho-chi-minh/edm'],
    ['Sponsored card', '/ads?placement=feed'],
    ['Health', '/health'],
  ]],
  ['Attendee (sign in)', [
    ['My profile', '/me', 1],
    ['My tickets', '/me/tickets', 1],
    ['Saved events', '/me/saves', 1],
    ['Friends', '/me/friends', 1],
    ['Group plans', '/me/plans', 1],
    ['Notifications', '/me/notifications', 1],
    ['Notification settings', '/me/notification-preferences', 1],
    ['Smart Alert', '/me/alert', 1],
    ['Following', '/me/follows', 1],
  ]],
  ['Organizer (sign in)', [
    ['Events table', '/organizer/events', 1],
    ['Dashboard 30 days', '/organizer/dashboard?range=30d', 1],
    ['Audience', '/organizer/audience', 1],
    ['Business profile', '/organizer/profile', 1],
    ['Inbox', '/organizer/inbox', 1],
    ['Notification bell', '/organizer/notifications', 1],
    ['Ravolution: performance', '/organizer/events/{ravo}/performance', 1],
    ['Ravolution: attendees', '/organizer/events/{ravo}/attendees', 1],
    ['Ravolution: announcements', '/organizer/events/{ravo}/announcements', 1],
    ['Ravolution: reach estimate', '/organizer/events/{ravo}/announcements/estimate?audience=saved&channels=push,zalo', 1],
    ['Ravolution: door summary', '/door/events/{ravo}/summary', 1],
    ['Ravolution: promos', '/organizer/events/{ravo}/promos', 1],
    ['Ravolution: guests', '/organizer/events/{ravo}/guests', 1],
    ['Ravolution: revenue & payouts', '/organizer/events/{ravo}/revenue', 1],
  ]],
  ['Admin (sign in)', [
    ['Tab counts', '/admin/counts', 1],
    ['Moderation queue', '/admin/queue', 1],
    ['Queue by risk', '/admin/queue?sort=risk', 1],
    ['Appeals', '/admin/appeals', 1],
    ['User reports', '/admin/reports', 1],
    ['Organizer verification', '/admin/organizers', 1],
    ['Featured shelves', '/admin/shelves', 1],
    ['Ads & partners', '/admin/ads', 1],
    ['Insights', '/admin/insights', 1],
    ['Audit log', '/admin/audit', 1],
    ['Verify audit chain', '/admin/audit/verify', 1],
  ]],
];

let token = null, lang = 'en', ravoId = null;
const $ = (id) => document.getElementById(id);
const esc = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);

function highlight(json) {
  return esc(json).replace(/("(?:[^"\\\\]|\\\\.)*")(\\s*:)?|\\b(true|false|null)\\b|-?\\d+(?:\\.\\d+)?(?:[eE][+-]?\\d+)?/g, (m, str, colon, lit) => {
    if (str) return colon ? '<span class="k">' + str + '</span>' + colon : '<span class="s">' + str + '</span>';
    if (lit) return '<span class="b">' + m + '</span>';
    return '<span class="n">' + m + '</span>';
  });
}

async function resolve(path) {
  if (!path.includes('{ravo}')) return path;
  if (!ravoId) ravoId = (await (await fetch('/events/ravo')).json()).id;
  return path.replace('{ravo}', ravoId);
}

async function send(path) {
  path = await resolve(path);
  $('url').value = path;
  $('status').className = 'status';
  $('status').textContent = 'GET …';
  const t0 = performance.now();
  try {
    const res = await fetch(path, { headers: { 'x-lang': lang, ...(token ? { authorization: 'Bearer ' + token } : {}) } });
    const ms = Math.round(performance.now() - t0);
    const type = res.headers.get('content-type') || '';
    const body = type.includes('json') ? JSON.stringify(await res.json(), null, 2) : await res.text();
    $('status').className = 'status ' + (res.ok ? 'ok' : 'err');
    $('status').textContent = res.status + ' · ' + ms + ' ms';
    $('out').innerHTML = type.includes('json') ? highlight(body) : esc(body);
  } catch (e) {
    $('status').className = 'status err';
    $('status').textContent = 'failed';
    $('out').textContent = String(e);
  }
}

function renderNav() {
  $('nav').innerHTML = groups.map(([title, items]) =>
    '<h2>' + title + '</h2>' + items.map(([label, path, auth]) =>
      '<a href="#" data-path="' + path + '">' + label + (auth && !token ? ' <span class="lock">sign in</span>' : '') + '<small>' + esc(path) + '</small></a>').join('')).join('');
}

$('nav').addEventListener('click', (e) => {
  const a = e.target.closest('a[data-path]');
  if (!a) return;
  e.preventDefault();
  document.querySelectorAll('nav a.on').forEach((x) => x.classList.remove('on'));
  a.classList.add('on');
  send(a.dataset.path);
});
$('send').onclick = () => send($('url').value || '/health');
$('url').addEventListener('keydown', (e) => { if (e.key === 'Enter') send($('url').value); });

document.querySelectorAll('[data-login]').forEach((btn) => btn.onclick = async () => {
  const [identifier, password] = btn.dataset.login.split('|');
  const res = await fetch('/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ identifier, password }) });
  const body = await res.json();
  if (!res.ok) { $('who').textContent = body.error?.message || 'Sign-in failed'; return; }
  token = body.token;
  document.querySelectorAll('[data-login]').forEach((b) => b.classList.toggle('on', b === btn));
  $('who').textContent = 'Signed in as ' + (body.user.name || identifier);
  renderNav();
});
$('logout').onclick = () => {
  token = null;
  document.querySelectorAll('[data-login]').forEach((b) => b.classList.remove('on'));
  $('who').textContent = 'Signed out';
  renderNav();
};
$('lang').onclick = () => { lang = lang === 'en' ? 'vi' : 'en'; $('lang').textContent = lang.toUpperCase(); };

renderNav();
</script>
</body>
</html>`;

export default async function devConsoleRoutes(app: FastifyInstance) {
  if (app.ctx.config.env === 'production') return;
  // Development only, and its script is inline, so it gets a policy of its own.
  app.get('/_console', async (_req, reply) => reply.type('text/html; charset=utf-8').header('cache-control', 'no-store')
    .header('content-security-policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; frame-ancestors 'none'")
    .send(PAGE));
}
