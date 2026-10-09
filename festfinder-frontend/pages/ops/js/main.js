/*
 * FeestFinder Ops — the shell: two modes on one page.
 *
 *   /ops/…       FeestFinder team: review queue, catalogue, organisers, venues, reports,
 *                featured shelves, accounts, orders and the audit log.
 *   /ops/org/…   Organisers: their listings, the event form, messages from moderation
 *                and the business profile.
 *
 * The mode follows the URL; the account decides what each mode may open.
 */
import {
  h, Fragment, useState, useEffect, t, tx, cx, get, post, del, emit, on, useEvents, useRoute, navigate, href,
  refreshSession, loadOptions, syncClock, store, isAdmin, isOrganizer, isArtist, adminNeedsGoogle, currentOrg, setOrg, setLang, getLang,
  errorText, toast, initials,
} from './core.js';
import { Icon, Button, Field, Input, Toaster, ConfirmHost, Spinner, Menu, ErrorBox } from './ui.js';

// ---- routes -----------------------------------------------------------------------------------

const TEAM = [
  { key: '', icon: 'squares-four', label: () => t('Tổng quan', 'Overview'), load: () => import('./team/overview.js'), view: 'Overview' },
  { key: 'review', icon: 'stack', label: () => t('Duyệt tin', 'Review queue'), load: () => import('./team/review.js'), view: 'Review', count: 'queue', alert: true },
  { key: 'claims', icon: 'seal-check', label: () => t('Nhận quản lý', 'Claims'), load: () => import('./team/claims.js'), view: 'Claims', count: 'allClaims', alert: true },
  { key: 'events', icon: 'calendar-dots', label: () => t('Sự kiện', 'Events'), load: () => import('./team/events.js'), view: 'Events' },
  { key: 'reports', icon: 'flag', label: () => t('Báo cáo & kháng nghị', 'Reports & appeals'), load: () => import('./team/reports.js'), view: 'Reports', count: 'reportsAppeals', alert: true },
  { section: () => t('Đối tác', 'Partners') },
  { key: 'organizers', icon: 'buildings', label: () => t('Nhà tổ chức', 'Organizers'), load: () => import('./team/organizers.js'), view: 'Organizers', count: 'verification' },
  { key: 'artists', icon: 'microphone-stage', label: () => t('Nghệ sĩ', 'Artists'), load: () => import('./team/artists.js'), view: 'Artists' },
  { key: 'venues', icon: 'map-pin', label: () => t('Địa điểm', 'Venues'), load: () => import('./team/venues.js'), view: 'Venues', count: 'unresolvedVenues' },
  { key: 'sources', icon: 'broadcast', label: () => t('Nguồn dữ liệu', 'Sources'), load: () => import('./team/sources.js'), view: 'Sources' },
  { key: 'partners', icon: 'handshake', label: () => t('Đối tác bán vé', 'Ticket partners'), load: () => import('./team/partners.js'), view: 'Partners' },
  { key: 'brands', icon: 'sparkle', label: () => t('Thương hiệu', 'Brands'), load: () => import('./team/brands.js'), view: 'Brands' },
  { key: 'affiliate', icon: 'link', label: () => t('Affiliate', 'Affiliate'), load: () => import('./team/affiliate.js'), view: 'Affiliate' },
  { section: () => t('Nền tảng', 'Platform') },
  { key: 'featured', icon: 'star', label: () => t('Mục nổi bật', 'Featured shelves'), load: () => import('./team/featured.js'), view: 'Featured' },
  { key: 'users', icon: 'users-three', label: () => t('Người dùng', 'Accounts'), load: () => import('./team/users.js'), view: 'Users' },
  { key: 'orders', icon: 'receipt', label: () => t('Đơn hàng', 'Orders'), load: () => import('./team/orders.js'), view: 'Orders' },
  { key: 'audit', icon: 'scroll', label: () => t('Nhật ký hoạt động', 'Audit log'), load: () => import('./team/audit.js'), view: 'Audit' },
];

const ARTIST = [
  { key: '', icon: 'microphone-stage', label: () => t('Hồ sơ nghệ sĩ', 'Artist profile'), load: () => import('./artist/profile.js'), view: 'ArtistProfile' },
  { key: 'gigs', icon: 'calendar-plus', label: () => t('Lịch diễn', 'Gigs'), load: () => import('./artist/gigs.js'), view: 'ArtistGigs' },
  { key: 'opportunities', icon: 'megaphone', label: () => t('Cơ hội diễn', 'Opportunities'), load: () => import('./artist/opportunities.js'), view: 'ArtistOpportunities' },
  { key: 'gear', icon: 'headphones', label: () => t('Thiết bị', 'Gear'), load: () => import('./artist/gear.js'), view: 'ArtistGear' },
];

const ORG = [
  { key: '', icon: 'squares-four', label: () => t('Tổng quan', 'Overview'), load: () => import('./org/home.js'), view: 'OrgHome' },
  { key: 'events', icon: 'calendar-dots', label: () => t('Sự kiện của tôi', 'My events'), load: () => import('./org/events.js'), view: 'OrgEvents' },
  { key: 'new', icon: 'plus-circle', label: () => t('Tạo sự kiện mới', 'New event'), load: () => import('./org/editor.js'), view: 'OrgEditor', accent: true },
  { key: 'inbox', icon: 'chat-circle-text', label: () => t('Hộp thư kiểm duyệt', 'Moderation inbox'), load: () => import('./org/inbox.js'), view: 'OrgInbox', count: 'unread', alert: true },
  { key: 'gigs', icon: 'megaphone', label: () => 'Gigs', load: () => import('./org/gigs.js'), view: 'OrgGigs' },
  { key: 'profile', icon: 'identification-card', label: () => t('Hồ sơ doanh nghiệp', 'Business profile'), load: () => import('./org/profile.js'), view: 'OrgProfile' },
];

function resolve(parts) {
  const mode = parts[0] === 'org' ? 'org' : parts[0] === 'artist' ? 'artist' : 'team';
  const rest = mode === 'team' ? parts : parts.slice(1);
  const list = LISTS[mode];
  let key = rest[0] ?? '';
  // /ops/org/events/new and /ops/org/events/:id are the editor.
  if (mode === 'org' && key === 'events' && rest[1]) key = 'new';
  const entry = list.find((r) => r.key === key) ?? null;
  return { mode, entry, rest };
}
const LISTS = { team: TEAM, org: ORG, artist: ARTIST };
/** Where a mode's page lives: /ops/<key>, /ops/org/<key>, /ops/artist/<key>. */
const pathFor = (mode, key) => (mode === 'org' ? (key === 'new' ? href('org', 'events', 'new') : href('org', key)) : mode === 'artist' ? href('artist', key) : href(key));
const modeOk = (mode) => (mode === 'team' ? isAdmin() : mode === 'org' ? isOrganizer() : isArtist());

const modules = new Map();
function useModule(entry) {
  const [, bump] = useState(0);
  useEffect(() => {
    if (!entry || modules.has(entry.load)) return;
    let live = true;
    entry.load().then((m) => { modules.set(entry.load, m); if (live) bump((x) => x + 1); }).catch((e) => { modules.set(entry.load, { error: e }); if (live) bump((x) => x + 1); });
    return () => { live = false; };
  }, [entry]);
  return entry ? modules.get(entry.load) : null;
}

// ---- counts in the sidebar ---------------------------------------------------------------------

function useCounts(mode) {
  const [counts, setCounts] = useState({});
  useEffect(() => {
    let live = true;
    const load = async () => {
      try {
        if (mode === 'team' && isAdmin()) {
          const [c, o] = await Promise.all([get('/admin/counts'), get('/admin/overview')]);
          if (live) setCounts({ ...c, reportsAppeals: c.reports + c.appeals, verification: o.verification, unresolvedVenues: o.unresolvedVenues });
        } else if (mode === 'org' && isOrganizer()) {
          const inbox = await get('/organizer/inbox');
          if (live) setCounts({ unread: inbox.unread });
        }
      } catch { /* counts are a nicety */ }
    };
    load();
    const off = on('counts', load);
    const timer = setInterval(load, 60_000);
    return () => { live = false; off(); clearInterval(timer); };
  }, [mode, store.session?.user?.id, store.orgId]);
  return counts;
}
export const refreshCounts = () => emit('counts');

// ---- chrome ---------------------------------------------------------------------------------------

function ModeSwitch({ mode }) {
  const items = [
    { mode: 'team', to: href(), icon: 'shield-check', label: t('Vận hành · FeestFinder', 'FeestFinder team'), short: t('Vận hành', 'Team') },
    { mode: 'org', to: href('org'), icon: 'storefront', label: t('Nhà tổ chức', 'Organizer'), short: t('Nhà tổ chức', 'Organizer') },
    { mode: 'artist', to: href('artist'), icon: 'microphone-stage', label: t('Nghệ sĩ', 'Artist'), short: t('Nghệ sĩ', 'Artist') },
  ].filter((it) => modeOk(it.mode));
  return h('nav', { className: 'op-modes', 'aria-label': t('Chế độ', 'Mode') }, items.map((it) =>
    h('a', { key: it.mode, href: it.to, className: cx('op-mode', mode === it.mode && 'is-on'), 'aria-current': mode === it.mode ? 'page' : undefined, onClick: (e) => { e.preventDefault(); navigate(it.to); } },
      Icon(it.icon, mode === it.mode), h('span', { className: 'op-mode-long' }, it.label), h('span', { className: 'op-mode-short' }, it.short))));
}

async function signOut() {
  try { await del('/auth/session'); } catch { /* already gone */ }
  await refreshSession();
}

function Topbar({ mode, onMenu }) {
  const s = store.session;
  const orgs = s?.organizers ?? [];
  return h('header', { className: 'op-top' },
    h('button', { type: 'button', className: 'op-burger', onClick: onMenu, 'aria-label': t('Mở menu', 'Open menu') }, Icon('list')),
    h('a', { className: 'op-brand', href: href(), onClick: (e) => { e.preventDefault(); navigate(pathFor(mode, '')); } },
      h('img', { className: 'op-brand-word', src: '/ui/assets/ff-logo.svg', alt: 'FeestFinder', width: 124, height: 21 }),
      h('img', { className: 'op-brand-mark', src: '/ui/assets/ff-mark.svg', alt: 'FeestFinder', width: 26, height: 26 }),
      h('span', { className: 'op-brand-tag' }, 'Ops')),
    [isAdmin(), isOrganizer(), isArtist()].filter(Boolean).length > 1 ? h(ModeSwitch, { mode }) : null,
    h('div', { className: 'op-top-right' },
      mode === 'org' && orgs.length > 1 ? h('div', { className: 'op-orgpick' }, Icon('buildings'),
        h('select', { value: store.orgId ?? '', onChange: (e) => { setOrg(e.target.value); refreshCounts(); }, 'aria-label': t('Nhà tổ chức đang dùng', 'Acting for') },
          orgs.map((o) => h('option', { key: o.id, value: o.id }, o.name)))) : null,
      h('button', { type: 'button', className: 'op-lang', onClick: () => setLang(getLang() === 'vi' ? 'en' : 'vi'), title: t('Chuyển sang tiếng Anh', 'Switch to Vietnamese') }, getLang() === 'vi' ? 'VI' : 'EN'),
      s ? h(Menu, {
        align: 'right',
        trigger: h('button', { type: 'button', className: 'op-account' }, h('span', { className: 'op-account-avatar' }, initials(s.user.name || s.user.email)), h('span', { className: 'op-account-name' }, s.user.name || s.user.email), Icon('caret-down')),
        items: [
          { icon: 'user-circle', label: s.user.email || s.user.phone || s.user.name, hint: isAdmin() ? t('Quyền admin FeestFinder', 'FeestFinder admin') : mode === 'artist' ? s.artist?.name : currentOrg()?.name, disabled: true },
          '-',
          { icon: 'arrow-square-out', label: t('Mở trang công khai', 'Open the public site'), onClick: () => window.open('/', '_blank', 'noopener') },
          isAdmin() ? { icon: 'shield-check', label: t('Console kiểm duyệt', 'Moderation console'), onClick: () => window.open('/console', '_blank', 'noopener') } : null,
          isOrganizer() ? { icon: 'storefront', label: t('Studio đầy đủ (vé, soát vé, doanh thu)', 'Full studio (tickets, door, revenue)'), onClick: () => window.open('/studio', '_blank', 'noopener') } : null,
          '-',
          { icon: 'sign-out', label: t('Đăng xuất', 'Sign out'), onClick: signOut },
        ],
      }) : null));
}

function Sidebar({ mode, active, counts, open, onClose }) {
  const list = LISTS[mode];
  const to = (key) => pathFor(mode, key);
  return h(Fragment, null,
    open ? h('div', { className: 'op-side-scrim', onClick: onClose }) : null,
    h('aside', { className: cx('op-side', open && 'is-open') },
      mode === 'artist' && store.session?.artist ? h('div', { className: 'op-side-org' }, h('span', { className: 'op-side-org-mark' }, initials(store.session.artist.name)), h('div', null, h('div', { className: 'op-side-org-name' }, store.session.artist.name), h('div', { className: 'op-side-org-role' }, t('Nghệ sĩ', 'Artist')))) : null,
      mode === 'org' && currentOrg() ? h('div', { className: 'op-side-org' }, h('span', { className: 'op-side-org-mark' }, initials(currentOrg().name)), h('div', null, h('div', { className: 'op-side-org-name' }, currentOrg().name), h('div', { className: 'op-side-org-role' }, currentOrg().role === 'owner' ? t('Chủ tài khoản', 'Owner') : t('Quản lý', 'Manager')))) : null,
      h('nav', { className: 'op-nav' }, list.map((r, i) => r.section
        ? h('div', { key: 's' + i, className: 'op-nav-section' }, r.section())
        : h('a', {
          key: r.key || 'home', href: to(r.key), className: cx('op-nav-item', active === r && 'is-on', r.accent && 'is-accent'), 'aria-current': active === r ? 'page' : undefined,
          onClick: (e) => { e.preventDefault(); onClose(); navigate(to(r.key)); },
        }, Icon(r.icon, active === r), h('span', null, r.label()), r.count && counts[r.count] ? h('span', { className: cx('op-count', r.alert && 'is-alert') }, counts[r.count]) : null)))));
}

// ---- sign-in, with "forgot password" for accounts the team just opened ---------------------------

/** Google sign-in, which brings the browser back to this page. Shown where Google is set up. */
function GoogleButton() {
  const [on, setOn] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => { get('/auth/providers').then((p) => setOn(!!p.google)).catch(() => {}); }, []);
  if (!on) return null;
  const go = async () => {
    setBusy(true);
    try { const out = await get(`/auth/oauth/google/start?redirectUri=${encodeURIComponent(window.location.href)}`); window.location.href = out.url; }
    catch (e) { setBusy(false); toast(errorText(e), 'error'); }
  };
  return h(Button, { icon: 'google-logo', busy, onClick: go, className: 'op-gate-google' }, t('Tiếp tục với Google', 'Continue with Google'));
}

function SignIn({ mode }) {
  const [step, setStep] = useState('login');
  const [f, setF] = useState({ id: '', pw: '', code: '', pw2: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [challenge, setChallenge] = useState(null);
  const [token, setToken] = useState(null);
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }));
  const run = async (fn) => { setBusy(true); setErr(null); try { await fn(); } catch (e) { setErr(errorText(e)); } finally { setBusy(false); } };
  const submit = (e) => {
    e.preventDefault();
    if (step === 'login') run(async () => { await post('/auth/login', { identifier: f.id.trim(), password: f.pw }); await refreshSession(); });
    if (step === 'forgot') run(async () => {
      const out = await post('/auth/password/reset', { email: f.id.trim() });
      setChallenge(out.challengeId);
      setStep('code');
    });
    if (step === 'code') run(async () => {
      if (!challenge) throw new Error(t('Mã không đúng hoặc đã hết hạn', 'That code is wrong or has expired'));
      const out = await post('/auth/password/reset/verify', { challengeId: challenge, code: f.code.trim() });
      setToken(out.resetToken);
      setStep('password');
    });
    if (step === 'password') run(async () => { await post('/auth/password', { token, password: f.pw, passwordConfirm: f.pw2 }); await refreshSession(); toast(t('Đã đặt mật khẩu', 'Password set')); });
  };
  const team = mode === 'team';
  const title = step === 'login'
    ? (team ? t('Đăng nhập khu vận hành', 'Sign in to operations') : t('Đăng nhập cho nhà tổ chức', 'Organizer sign-in'))
    : t('Đặt mật khẩu', 'Set your password');
  return h('div', { className: 'op-gate' },
    h('form', { className: 'op-gate-card ff-deep ff-in', onSubmit: submit },
      h('h1', { className: 'op-gate-title ff-skywash' }, title),
      step === 'login' ? h(GoogleButton, null) : null,
      step === 'login' ? h('div', { className: 'op-gate-or' }, h('span', null, t('hoặc dùng email', 'or with email'))) : null,
      step === 'code' ? h('p', { className: 'op-gate-note' }, t(`Mã 6 số đã gửi tới ${f.id}.`, `6-digit code sent to ${f.id}.`)) : null,
      step === 'login' || step === 'forgot' ? h(Field, { label: 'Email', id: 'g-id' }, h(Input, { id: 'g-id', value: f.id, onChange: set('id'), autoComplete: 'username', type: step === 'forgot' ? 'email' : 'text', placeholder: team ? 'you@feestfinder.com' : 'team@yourbrand.vn', autoFocus: true, required: true })) : null,
      step === 'login' ? h(Field, { label: t('Mật khẩu', 'Password'), id: 'g-pw' }, h(Input, { id: 'g-pw', type: 'password', value: f.pw, onChange: set('pw'), autoComplete: 'current-password', required: true })) : null,
      step === 'code' ? h(Field, { label: t('Mã xác nhận', 'Code'), id: 'g-code' }, h(Input, { id: 'g-code', value: f.code, onChange: set('code'), inputMode: 'numeric', autoComplete: 'one-time-code', maxLength: 6, autoFocus: true, required: true })) : null,
      step === 'password' ? h(Fragment, null,
        h(Field, { label: t('Mật khẩu mới', 'New password'), id: 'g-p1', hint: t('Tối thiểu 8 ký tự', 'At least 8 characters') }, h(Input, { id: 'g-p1', type: 'password', value: f.pw, onChange: set('pw'), autoComplete: 'new-password', minLength: 8, autoFocus: true, required: true })),
        h(Field, { label: t('Nhập lại mật khẩu', 'Repeat password'), id: 'g-p2' }, h(Input, { id: 'g-p2', type: 'password', value: f.pw2, onChange: set('pw2'), autoComplete: 'new-password', minLength: 8, required: true }))) : null,
      err ? h('div', { className: 'op-field-error op-gate-err', role: 'alert' }, Icon('warning-circle', true), err) : null,
      h(Button, { variant: 'cta', type: 'submit', busy, className: 'op-gate-submit' },
        step === 'login' ? t('Đăng nhập', 'Sign in') : step === 'forgot' ? t('Gửi mã', 'Send code') : step === 'code' ? t('Xác nhận', 'Verify') : t('Lưu mật khẩu', 'Save password')),
      h('div', { className: 'op-gate-links' },
        step === 'login'
          ? h('button', { type: 'button', className: 'op-link', onClick: () => { setStep('forgot'); setErr(null); } }, t('Quên mật khẩu / lần đầu đăng nhập?', 'Forgot password / first sign-in?'))
          : h('button', { type: 'button', className: 'op-link', onClick: () => { setStep('login'); setErr(null); } }, Icon('caret-left'), t('Quay lại đăng nhập', 'Back to sign-in')),
        h('a', { className: 'op-link', href: team ? href('org') : href(), onClick: (e) => { e.preventDefault(); navigate(team ? href('org') : href()); } },
          team ? t('Bạn là nhà tổ chức?', 'Are you an organizer?') : t('Đội FeestFinder?', 'FeestFinder team?')))));
}

/** Signed in, but this account has no access to the mode in the URL. */
function WrongMode({ mode }) {
  const s = store.session;
  if (mode === 'team' && adminNeedsGoogle()) {
    return h('div', { className: 'op-gate' },
      h('div', { className: 'op-gate-card ff-deep ff-in' },
        h('div', { className: 'op-gate-icon' }, Icon('google-logo', true)),
        h('h1', { className: 'op-gate-title ff-skywash' }, t('Quyền admin cần đăng nhập Google', 'Admin rights need Google sign-in')),
        h('div', { className: 'op-gate-actions' }, h(GoogleButton, null), h(Button, { icon: 'sign-out', onClick: signOut }, t('Đổi tài khoản', 'Switch account')))));
  }
  if (mode === 'artist') {
    return h('div', { className: 'op-gate' },
      h('div', { className: 'op-gate-card ff-deep ff-in' },
        h('div', { className: 'op-gate-icon' }, Icon('microphone-stage', true)),
        h('h1', { className: 'op-gate-title ff-skywash' }, s.roles?.artist === 'pending' ? t('Yêu cầu nhận hồ sơ đang chờ duyệt', 'Your profile claim is waiting for review') : t('Tài khoản này chưa có hồ sơ nghệ sĩ', 'This account has no artist profile')),
        h('div', { className: 'op-gate-actions' },
          s.roles?.artist === 'pending' ? null : h(Button, { variant: 'cta', icon: 'plus', onClick: () => { window.location.href = s.roles?.artist === 'disabled' ? '/?role=artist-on' : '/?role=artist'; } },
            s.roles?.artist === 'disabled' ? t('Bật lại hồ sơ nghệ sĩ', 'Turn your artist profile back on') : t('Tạo hồ sơ nghệ sĩ', 'Create an artist profile')),
          h(Button, { icon: 'sign-out', onClick: signOut }, t('Đổi tài khoản', 'Switch account')))));
  }
  const team = mode === 'team';
  const canOther = team ? isOrganizer() : isAdmin();
  return h('div', { className: 'op-gate' },
    h('div', { className: 'op-gate-card ff-deep ff-in' },
      h('div', { className: 'op-gate-icon' }, Icon(team ? 'shield-warning' : 'storefront', true)),
      h('h1', { className: 'op-gate-title ff-skywash' }, team ? t('Khu vực dành cho đội FeestFinder', 'For the FeestFinder team') : t('Tài khoản này chưa thuộc nhà tổ chức nào', 'This account is not on an organizer team')),
      team || !isAdmin() ? h('p', { className: 'op-gate-note' }, team
        ? t(`${s.user.email || s.user.name} là tài khoản nhà tổ chức.`, `${s.user.email || s.user.name} is an organizer account.`)
        : t('Liên hệ FeestFinder để được mở tài khoản nhà tổ chức.', 'Ask FeestFinder to open an organizer account.')) : null,
      h('div', { className: 'op-gate-actions' },
        canOther || isAdmin() ? h(Button, { variant: 'cta', onClick: () => navigate(team ? href('org') : isAdmin() ? href('events', 'new') : href()) }, team ? t('Sang chế độ Nhà tổ chức', 'Go to Organizer mode') : t('Tạo sự kiện thay nhà tổ chức', 'Create a listing for an organizer')) : null,
        h(Button, { icon: 'sign-out', onClick: signOut }, t('Đổi tài khoản', 'Switch account')))));
}

// ---- the app ---------------------------------------------------------------------------------------

function App() {
  useEvents('session', 'lang');
  const route = useRoute();
  const [menu, setMenu] = useState(false);
  const { mode, entry, rest } = resolve(route.parts);
  const counts = useCounts(mode);
  const allowed = !!store.session && modeOk(mode);
  const mod = useModule(allowed && entry ? entry : null);

  // /ops for an organiser-only or artist-only account goes to their side.
  useEffect(() => {
    if (store.session && !route.parts.length && !isAdmin()) {
      if (isOrganizer()) navigate(href('org'), { replace: true });
      else if (isArtist()) navigate(href('artist'), { replace: true });
    }
  }, [store.session, route.path]);
  useEffect(() => {
    const label = entry ? entry.label() : '';
    document.title = `${label ? label + ' · ' : ''}FeestFinder Ops`;
  }, [entry, getLang()]);

  let body;
  if (!store.session) body = h(SignIn, { mode });
  else if (!modeOk(mode)) body = h(WrongMode, { mode });
  else if (!entry) body = h('div', { className: 'op-main' }, h(ErrorBox, { error: new Error(t('Không có trang này', 'There is no such page')) }));
  else if (!mod) body = null;
  else if (mod.error) body = h('div', { className: 'op-main' }, h(ErrorBox, { error: mod.error, onRetry: () => location.reload() }));
  else body = null;

  const signedIn = allowed;
  const View = mod && !mod.error ? mod[entry.view] : null;
  return h(Fragment, null,
    h('div', { className: 'ff-atmos', 'aria-hidden': true }, h('div', { className: 'ff-aurora' }), h('div', { className: 'ff-grain' })),
    h(Topbar, { mode, onMenu: () => setMenu((m) => !m) }),
    signedIn && entry
      ? h('div', { className: 'op-frame' },
        h(Sidebar, { mode, active: entry, counts, open: menu, onClose: () => setMenu(false) }),
        h('main', { className: 'op-main', key: (mode === 'team' ? '' : mode + ':') + (entry.key || 'home') + (entry.key === 'new' ? ':' + (rest[1] ?? '') : '') },
          View ? h(View, { rest, route, counts }) : body ?? h(Spinner)))
      : body,
    h(Toaster), h(ConfirmHost));
}

async function boot() {
  const root = document.getElementById('ops-root');
  try {
    await Promise.all([syncClock(), refreshSession(), loadOptions()]);
  } catch (e) {
    root.className = 'op-main';
    root.textContent = t('Không tải được trang. Tải lại để thử lại.', 'This page could not load. Reload to try again.');
    console.error('[ops]', e);
    return;
  }
  on('unauthorized', () => refreshSession());
  root.className = '';
  root.removeAttribute('aria-busy');
  window.ReactDOM.createRoot(root).render(h(App));
}
boot();
