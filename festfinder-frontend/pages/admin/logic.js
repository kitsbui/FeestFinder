const ARTS = ['linear-gradient(135deg,#7A55F6,#B6D9FC)','linear-gradient(135deg,#3159D6,#7A55F6)','linear-gradient(135deg,#F0A07F,#E46D4C)','linear-gradient(135deg,#B6D9FC,#269684)'];
/** Icons for the reason codes the API returns. */
const RICON = {
  venue:'ph-fill ph-map-pin-line', ticket:'ph-fill ph-link-break', image:'ph-fill ph-image',
  permit:'ph-fill ph-certificate', duplicate:'ph-fill ph-copy', policy:'ph-fill ph-prohibit'
};
/** Icons and colours for audit actions and report categories. */
const AICON = {
  'listing.approved':      { icon:'ph-fill ph-check-circle', color:'#6CC7B6' },
  'listing.rejected':      { icon:'ph-fill ph-x-circle', color:'#F4A3A3' },
  'listing.submitted':     { icon:'ph-fill ph-upload-simple', color:'#B6D9FC' },
  'listing.held':          { icon:'ph-fill ph-shield-warning', color:'#F0A07F' },
  'listing.taken_down':    { icon:'ph-fill ph-prohibit', color:'#F4A3A3' },
  'organizer.verified':    { icon:'ph-fill ph-seal-check', color:'#6CC7B6' },
  'organizer.unverified':  { icon:'ph-fill ph-seal-warning', color:'#F0A07F' },
  'organizer.warned':      { icon:'ph-fill ph-warning', color:'#F0A07F' },
  'organizer.suspended':   { icon:'ph-fill ph-prohibit', color:'#F4A3A3' },
  'shelf.published':       { icon:'ph-fill ph-eye', color:'#6CC7B6' },
  'shelf.hidden':          { icon:'ph-fill ph-eye-slash', color:'#8A94A8' },
  'shelf.items_changed':   { icon:'ph-fill ph-list', color:'#B6D9FC' },
  'shelf.window_changed':  { icon:'ph-fill ph-calendar-dots', color:'#B6D9FC' },
  'appeal.overturned':     { icon:'ph-fill ph-gavel', color:'#6CC7B6' },
  'appeal.upheld':         { icon:'ph-fill ph-seal-check', color:'#F4A3A3' },
  'report.dismissed':      { icon:'ph-fill ph-x-circle', color:'#8A94A8' },
  'organizer.messaged':    { icon:'ph-fill ph-chat-circle-text', color:'#B6D9FC' },
  'ads.campaign_created':  { icon:'ph-fill ph-megaphone', color:'#6CC7B6' },
  'ads.campaign_paused':   { icon:'ph-fill ph-pause-circle', color:'#F0A07F' },
  'ads.campaign_resumed':  { icon:'ph-fill ph-play-circle', color:'#6CC7B6' },
  'ads.inquiry_declined':  { icon:'ph-fill ph-x-circle', color:'#F4A3A3' },
  'ads.rates_changed':     { icon:'ph-fill ph-currency-circle-dollar', color:'#9D84F8' },
  'impersonation.started': { icon:'ph-fill ph-user-switch', color:'#F0A07F' },
  'impersonation.ended':   { icon:'ph-fill ph-eye-slash', color:'#8A94A8' },
  'payout.released':       { icon:'ph-fill ph-bank', color:'#6CC7B6' }
};
const RCAT = {
  refund: { icon:'ph-fill ph-receipt-x', fg:'#F4A3A3', bg:'rgba(224,74,74,.14)', bd:'rgba(224,74,74,.4)', art:ARTS[2] },
  wrong:  { icon:'ph-fill ph-map-pin-line', fg:'#F0A07F', bg:'rgba(228,109,76,.14)', bd:'rgba(228,109,76,.4)', art:ARTS[1] },
  price:  { icon:'ph-fill ph-tag', fg:'#F0A07F', bg:'rgba(228,109,76,.14)', bd:'rgba(228,109,76,.4)', art:ARTS[3] },
  safety: { icon:'ph-fill ph-warning-octagon', fg:'#F4A3A3', bg:'rgba(224,74,74,.14)', bd:'rgba(224,74,74,.4)', art:ARTS[0] },
  spam:   { icon:'ph-fill ph-trash', fg:'#9DA7BA', bg:'rgba(157,167,186,.128)', bd:'rgba(186,215,247,.12)', art:ARTS[1] },
  other:  { icon:'ph-fill ph-flag', fg:'#9DA7BA', bg:'rgba(157,167,186,.128)', bd:'rgba(186,215,247,.12)', art:ARTS[1] }
};
/* Shared with the preload below, which defines them before this logic runs. */
const whenLine = FF.whenLine, dayLabel = FF.dayLabel;

/** 318 minutes → '5h 18m', the way the queue writes waits. */
const HM = (min, vi) => {
  const m = Math.max(0, Math.round(min || 0));
  return m < 60 ? m + 'm' : Math.floor(m / 60) + 'h ' + String(m % 60).padStart(2, '0') + 'm';
};
const AGO = (min, vi) => {
  const m = Math.max(0, Math.round(min || 0));
  if (m < 60) return m + (vi ? ' phút' : 'm');
  if (m < 1440) return Math.round(m / 60) + (vi ? ' giờ' : 'h');
  return Math.round(m / 1440) + (vi ? ' ngày' : 'd');
};
/** 'dd/mm' as the shelf fields write it, from an ISO date; and back again. */
const DMY = (iso) => iso ? iso.slice(8, 10) + '/' + iso.slice(5, 7) : '';
const ISO = (dm, year) => {
  const m = /^(\d{1,2})\D(\d{1,2})$/.exec((dm || '').trim());
  return m ? year + '-' + String(+m[2]).padStart(2, '0') + '-' + String(+m[1]).padStart(2, '0') : null;
};
const TABS = { 'Moderation queue':'queue', 'Organizer verification':'verify', 'User reports':'reports', 'Featured shelves':'featured', 'Ads & partners':'ads', 'Insights':'insights', 'Audit log':'audit', 'Appeals':'appeals' };

/* ---- routes ------------------------------------------------------------------
 * /console            moderation queue    /console/ads        ads & partners
 * /console/verification organizer badges  /console/insights   platform numbers
 * /console/reports    user reports        /console/audit      audit log
 * /console/featured   featured shelves    /console/appeals    appeals
 */
const ROUTE_TAB = { '': 'queue', 'queue': 'queue', 'verification': 'verify', 'reports': 'reports',
  'featured': 'featured', 'ads': 'ads', 'insights': 'insights', 'audit': 'audit', 'appeals': 'appeals' };
const TAB_ROUTE = { queue: '', verify: 'verification', reports: 'reports', featured: 'featured',
  ads: 'ads', insights: 'insights', audit: 'audit', appeals: 'appeals' };

const AD = (FF.data.admin || {});
const SLA_H = AD.queue ? AD.queue.slaHours : 4;

/** Reject reason codes, with the message the organiser receives. */
const REASONS = (AD.reasons || []).map(r => ({
  k: r.code, icon: RICON[r.code] || 'ph-fill ph-prohibit', appeal: r.appealAllowed,
  label: r.label, msg: { en: r.template.en, vi: r.template.vi }
}));
const RSN = (k) => REASONS.filter(r => r.k === k)[0] || REASONS[0] || { k:'venue', icon:'ph-fill ph-map-pin-line', appeal:true, label:{ en:'', vi:'' }, msg:{ en:'', vi:'' } };
const T_none = (vi) => vi ? 'Chọn một tin để xem tín hiệu' : 'Pick a listing to see its signals';
const T_sort = (vi, k) => k === 'age' ? (vi ? 'Chờ lâu nhất' : 'Oldest first') : k === 'risk' ? (vi ? 'Rủi ro cao nhất' : 'Highest risk') : (vi ? 'Mới nhất' : 'Newest first');
const DEC = (x, vi) => { const s = (Math.round(x*10)/10).toFixed(1).replace(/\.0$/,''); return vi ? s.replace('.',',') : s; };
const CNT = (v, vi) => v >= 1e6 ? DEC(v/1e6, vi) + (vi ? ' tr' : 'M') : v >= 1e3 ? DEC(v/1e3, vi) + 'k' : String(v);
const VND = (v, vi) => v >= 1e9 ? DEC(v/1e9, vi) + (vi ? ' tỷ₫' : 'bn₫') : v >= 1e6 ? DEC(v/1e6, vi) + (vi ? 'tr₫' : 'M₫') : v.toLocaleString(vi ? 'vi-VN' : 'en-US') + '₫';
const NUM = (v, vi, d) => { const s = v.toFixed(d == null ? 1 : d); return vi ? s.replace('.',',') : s; };
const RATES = { feed:180000, banner:240000, live:520000 };  // only a fallback until /admin/ads answers

class Component extends DCLogic {
  state = {
    lang: this.props.language === 'Tiếng Việt' ? 'vi' : 'en',
    tab: ROUTE_TAB[FF.route ? FF.route.name : ''] || 'queue',
    toast: null,
    chat: null,
    threads: {},
    draft: '',
    typing: false,
    qFilter: 'all',
    qSort: 'age',
    sel: {},
    focus: 0,
    shortcutsOpen: false,
    rejectFor: null, rejectCode: (REASONS[0] || {}).k || 'venue', rejectMsg: '', rejectAppeal: true,
    viewAsOpen: false, imp: null, impOptions: AD.impersonation || [],
    auditActor: 'all', auditOpen: {},
    shelfPrev: null,
    appeals: AD.appeals || [],
    hDrill: null,
    queue: AD.queue ? AD.queue.items : [],
    qCounts: AD.queue ? AD.queue.counts : { all:0, breach:0, flagged:0, new:0, clean:0 },
    qBuckets: AD.queue ? AD.queue.ageBuckets : [],
    qOldest: AD.queue ? AD.queue.oldestMinutes : 0,
    orgs: AD.orgs || [],
    reports: AD.reports ? AD.reports.items : [],
    reportStats: AD.reports ? AD.reports.last30Days : [],
    shelves: AD.shelves || [],
    shelfItems: {},
    audit: AD.audit ? AD.audit.items : [],
    auditOk: AD.auditOk || null,
    insights: AD.insights || null,
    risk: {},
    adsSel: AD.ads && AD.ads.inquiries.length ? AD.ads.inquiries[0].id : null,
    inquiries: AD.ads ? AD.ads.inquiries : [],
    campaigns: AD.ads ? AD.ads.campaigns : [],
    setup: { places:{ feed:true, banner:true }, genres:{ EDM:true, Festival:true }, areas:{ 'Quận 7':true, 'Thủ Đức':true }, cpm:180, cap:12,
      rates: Object.assign({}, AD.ads ? AD.ads.rates : {}) }
  };

  /** Re-read everything after a decision, so counts and the log stay true. */
  async reloadAdmin(keep) {
    FF.forget();
    const d = await FF.loadAdmin();
    this.setState(Object.assign({
      queue: d.queue ? d.queue.items : [], qCounts: d.queue ? d.queue.counts : this.state.qCounts,
      qBuckets: d.queue ? d.queue.ageBuckets : [], qOldest: d.queue ? d.queue.oldestMinutes : 0,
      sel: {}, focus: 0
    }, keep || {}));
    // Whatever tab is open reloads now; the others reload when they are next opened.
    await this.openTab(this.state.tab);
  }

  async reloadAudit() {
    const a = await FF.maybe(FF.get('/admin/audit?limit=18'), null);
    if (a) this.setState({ audit: a.items });
  }

  fail(e) { this.say(FF.errorText(e, this.state.lang)); }

  /** The preview shows the shelf as Explore would render it, straight from the API. */
  async openShelfPreview(id) {
    this.setState({ shelfPrev: id });
    if (this.state.shelfItems[id]) return;
    const p = await FF.maybe(FF.get('/admin/shelves/' + id + '/preview'), null);
    if (p) this.setState(s => { const x = Object.assign({}, s.shelfItems); x[id] = p.items; return { shelfItems:x }; });
  }

  _msg = React.createRef();

  componentDidMount() {
    this._key = (e) => this.onKey(e);
    if (typeof window !== 'undefined') window.addEventListener('keydown', this._key);
    FF.onRoute = (r) => { const tab = ROUTE_TAB[r.name] || 'queue'; this.setState({ tab }); this.openTab(tab); };
    this.openTab(this.state.tab);
    // The other tabs are ready by the time they are asked for.
    FF.prefetch(() => FF.admRest(this));
  }

  /** Load a tab's data the first time it is opened. */
  openTab(tab) {
    if (tab === 'verify') return FF.admOrgs(this);
    if (tab === 'reports') return FF.admReports(this);
    if (tab === 'featured') return FF.admShelves(this);
    if (tab === 'ads') return FF.admAds(this);
    if (tab === 'insights') return FF.admInsights(this);
    if (tab === 'audit') return FF.admAudit(this);
    if (tab === 'appeals') return FF.admAppeals(this);
  }

  /** Switch tab: the URL follows in componentDidUpdate, the data loads here. */
  go(tab) {
    this.setState({ tab });
    this.openTab(tab);
  }

  onKey(e) {
    const t = e.target, tag = t && t.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || (t && t.isContentEditable)) return;
    const st = this.state;
    if (e.key === 'Escape') { this.setState({ rejectFor:null, shortcutsOpen:false, viewAsOpen:false, shelfPrev:null, hDrill:null, chat:null }); return; }
    if (st.rejectFor || st.chat) return;
    if (e.key === '?') { e.preventDefault(); this.setState({ shortcutsOpen: !st.shortcutsOpen }); return; }
    if (st.tab !== 'queue') return;
    const list = this.visibleQueue();
    if (!list.length) return;
    const i = Math.min(st.focus, list.length - 1), q = list[i], k = e.key.toLowerCase();
    if (k === 'j' || e.key === 'ArrowDown') { e.preventDefault(); this.setState({ focus: Math.min(list.length - 1, i + 1) }); }
    else if (k === 'k' || e.key === 'ArrowUp') { e.preventDefault(); this.setState({ focus: Math.max(0, i - 1) }); }
    else if (k === 'x') { e.preventDefault(); this.toggleSel(q.id); }
    else if (k === 'a' && e.shiftKey) { e.preventDefault(); this.toggleAllSel(); }
    else if (k === 'a') { e.preventDefault(); this.approveOne(q); }
    else if (k === 'r') { e.preventDefault(); this.openReject(q.id); }
    else if (k === 'm') { e.preventDefault(); this.openChat(q); }
  }

  visibleQueue() {
    const st = this.state, f = st.qFilter;
    const keep = (q) => f === 'all' ? true
      : f === 'flagged' ? q.flagged
      : f === 'clean' ? !q.flagged
      : f === 'breach' ? q.sla.state === 'breach'
      : f === 'new' ? q.organizer.newOrganizer : true;
    const s = st.qSort;
    return st.queue.filter(keep).slice().sort((a, b) =>
      s === 'age' ? b.waitingMinutes - a.waitingMinutes
      : s === 'risk' ? b.riskScore - a.riskScore
      : a.waitingMinutes - b.waitingMinutes);
  }

  slaOf(q) { return q && q.sla ? q.sla.state : 'ok'; }

  blocked() {
    if (!this.state.imp) return false;
    const vi = this.state.lang === 'vi';
    this.say(vi ? 'Chỉ đọc khi đang xem dưới tài khoản khác' : 'Read-only while viewing as someone else');
    return true;
  }

  toggleSel(id) { this.setState(s => { const x = Object.assign({}, s.sel); x[id] = !x[id]; return { sel:x }; }); }

  toggleAllSel() {
    const list = this.visibleQueue(), st = this.state;
    const all = list.length > 0 && list.every(q => st.sel[q.id]);
    const x = {};
    if (!all) list.forEach(q => { x[q.id] = true; });
    this.setState({ sel:x });
  }

  async approveOne(q) {
    if (this.blocked()) return;
    try {
      const out = await FF.post('/admin/listings/approve', { ids: [q.id] });
      this.say(FF.text(out.message, this.state.lang));
      await this.reloadAdmin();
    } catch (e) { this.fail(e); }
  }

  openReject(id) { if (this.blocked()) return; this.setState({ rejectFor:id, rejectCode:(REASONS[0] || {}).k || 'venue', rejectMsg:'', rejectAppeal:true }); }

  async confirmReject() {
    const st = this.state, g = st.lang;
    const ids = st.rejectFor === 'bulk' ? Object.keys(st.sel).filter(k => st.sel[k]) : [st.rejectFor];
    const r = RSN(st.rejectCode);
    const items = st.queue.filter(q => ids.indexOf(q.id) >= 0);
    if (!items.length) { this.setState({ rejectFor:null }); return; }
    const body = (st.rejectMsg || '').trim() || FF.text(r.msg, g);
    try {
      const out = await FF.post('/admin/listings/reject', {
        ids: items.map(q => q.id), code: r.k, message: body,
        allowAppeal: st.rejectAppeal && r.appeal !== false
      });
      this.setState({ rejectFor:null });
      this.say(FF.text(out.message, g));
      await this.reloadAdmin();
    } catch (e) { this.fail(e); }
  }

  componentDidUpdate(prev, prevState) {
    if (prev.language !== this.props.language) this.setState({ lang: this.props.language === 'Tiếng Việt' ? 'vi' : 'en' });
    FF.navigate(FF.href(TAB_ROUTE[this.state.tab] || ''));
    const st = this.state, ps = prevState || {};
    const qid = st.chat && st.chat.qid;
    const count = qid ? (st.threads[qid] || []).length : 0;
    const wasQid = ps.chat && ps.chat.qid;
    const wasCount = wasQid ? ((ps.threads || {})[wasQid] || []).length : 0;
    if (qid && (qid !== wasQid || count !== wasCount || st.typing !== ps.typing)) {
      const el = this._msg.current;
      if (el) el.scrollTop = el.scrollHeight;
    }
  }
  componentWillUnmount() { clearTimeout(this._tt); clearTimeout(this._rt); if (typeof window !== 'undefined') window.removeEventListener('keydown', this._key); }

  say(msg) { clearTimeout(this._tt); this.setState({ toast: msg }); this._tt = setTimeout(() => this.setState({ toast: null }), 2100); }

  /* The audit log is written by the server; the screen just re-reads it. */

  stamp() {
    const d = new Date();
    return String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0');
  }

  async openChat(q) {
    const initials = FF.initials(q.organizer.name);
    this.setState({ chat: { qid:q.id, org:q.organizer.name, title:q.title, when:whenLine(q, this.state.lang), art:q.art, initials }, draft:'', typing:false });
    const t = await FF.maybe(FF.get('/admin/listings/' + q.id + '/thread'), null);
    if (!t) return;
    this.setState(s => {
      const next = Object.assign({}, s.threads);
      next[q.id] = t.messages.map(m => ({ id:m.id, from: m.fromAdmin ? 'admin' : 'org', text: FF.text(m.body, s.lang), stamp: FF.hhmm(m.createdAt) }));
      return { threads: next, quickAsks: t.quickAsks };
    });
  }

  push(qid, from, text) {
    this.setState(s => {
      const next = Object.assign({}, s.threads);
      next[qid] = (next[qid] || []).concat([{ id:'m' + Date.now() + Math.random(), from, text, stamp: this.stamp() }]);
      return { threads: next };
    });
  }

  async sendMsg(text) {
    const chat = this.state.chat;
    const body = (text || '').trim();
    if (!chat || !body) return;
    this.push(chat.qid, 'admin', body);
    this.setState({ draft:'' });
    try {
      const out = await FF.post('/admin/listings/' + chat.qid + '/thread', { body });
      if (out.message) this.say(FF.text(out.message, this.state.lang));
      const t = await FF.get('/admin/listings/' + chat.qid + '/thread');
      this.setState(s => {
        const next = Object.assign({}, s.threads);
        next[chat.qid] = t.messages.map(m => ({ id:m.id, from: m.fromAdmin ? 'admin' : 'org', text: FF.text(m.body, s.lang), stamp: FF.hhmm(m.createdAt) }));
        return { threads: next };
      });
      await this.reloadAudit();
    } catch (e) { this.fail(e); }
  }

  /** Risk factors for the panel beside the queue, fetched once per listing. */
  async loadRisk(id) {
    if (this.state.risk[id] || this._riskFor === id) return;
    this._riskFor = id;
    const r = await FF.maybe(FF.get('/admin/listings/' + id + '/risk'), null);
    this._riskFor = null;
    if (r) this.setState(s => { const x = Object.assign({}, s.risk); x[id] = r; return { risk:x }; });
  }

  renderVals() {
    const st = this.state, g = st.lang, vi = g === 'vi';
    const pending = st.qCounts.all;
    const flagged = st.qCounts.flagged;
    const ins = st.insights;
    const vis = this.visibleQueue();
    const selIds = Object.keys(st.sel).filter(k => st.sel[k]);
    const focusQ = vis.length ? vis[Math.min(st.focus, vis.length - 1)] : null;
    const riskQ = selIds.length === 1 ? (st.queue.filter(q => q.id === selIds[0])[0] || focusQ) : focusQ;
    const rejectItems = st.rejectFor === 'bulk' ? st.queue.filter(q => st.sel[q.id]) : st.queue.filter(q => q.id === st.rejectFor);
    if (riskQ) this.loadRisk(riskQ.id);
    const rsn = RSN(st.rejectCode);
    const askInfo = vi ? 'Yêu cầu bổ sung' : 'Ask for more';
    const openThread = vi ? 'Mở hội thoại' : 'Open thread';
    const chat = st.chat;
    const thread = chat ? (st.threads[chat.qid] || []) : [];
    const quickAsks = (st.quickAsks || AD.quickAsks || []).map(a => ({
      icon: RICON[a.key] || 'ph-bold ph-chat-circle-text', label: FF.text(a.label, g), text: FF.text(a.text, g)
    }));

    return {
      T: {
        mode: vi ? 'Quản trị nội bộ' : 'Internal admin',
        admin: 'FeestFinder Admin', role: vi ? 'Tài khoản duy nhất' : 'Sole account',
        qKicker: vi ? 'Chờ duyệt' : 'Awaiting review',
        qTitle: vi ? 'Hàng chờ kiểm duyệt' : 'Moderation queue',
        qClear: vi ? 'Hàng chờ trống' : 'Queue is clear',
        qClearSub: vi ? 'Mọi tin đã được xử lý. Tin mới sẽ xuất hiện ở đây.' : 'Everything has been handled. New submissions land here.',
        approve: vi ? 'Duyệt' : 'Approve', reject: vi ? 'Từ chối' : 'Reject', askInfo: askInfo,
        chatWith: vi ? 'Nhắn cho nhà tổ chức' : 'Messaging organizer',
        chatQuick: vi ? 'Yêu cầu thường dùng' : 'Common requests',
        chatPh: vi ? 'Viết cho nhà tổ chức…' : 'Write to the organizer…',
        chatEmpty: vi ? 'Chưa có tin nhắn. Chọn một yêu cầu thường dùng hoặc tự viết — tin đăng vẫn nằm trong hàng chờ cho tới khi anh/chị quyết định.' : 'No messages yet. Pick a common request or write your own — the listing stays in the queue until you decide.',
        chatNote: vi ? 'Mọi tin nhắn đều được ghi vào sổ hoạt động.' : 'Every message is recorded in the audit log.',
        autoChecks: vi ? 'Kiểm tra tự động' : 'Automatic checks',
        slaNote: AD.queue && AD.queue.note ? FF.text(AD.queue.note, g) : '',
        vKicker: vi ? 'Tài khoản' : 'Accounts',
        vTitle: vi ? 'Xác minh nhà tổ chức' : 'Organizer verification',
        vSub: AD.orgNote ? FF.text(AD.orgNote, g) : '',
        viewDocs: vi ? 'Xem giấy tờ' : 'View documents',
        rKicker: vi ? 'Từ người dùng' : 'From users',
        rTitle: vi ? 'Báo cáo' : 'User reports',
        rBreakdown: vi ? 'Phân loại 30 ngày' : 'Last 30 days',
        takeDown: vi ? 'Hạ tin' : 'Take down', warn: vi ? 'Cảnh báo BTC' : 'Warn organizer', dismiss: vi ? 'Bỏ qua' : 'Dismiss',
        fKicker: vi ? 'Biên tập' : 'Editorial',
        fTitle: vi ? 'Mục nổi bật' : 'Featured shelves',
        fSub: vi ? 'Những dãy sự kiện được chọn tay, hiện ở đầu trang Khám phá. Tắt một dãy sẽ ẩn ngay trên app và web.' : 'Hand-picked rows that sit at the top of Explore. Switching a shelf off hides it in the app and on the web immediately.',
        iKicker: vi ? 'Chỉ tài khoản admin' : 'Admin account only',
        iTitle: vi ? 'Số liệu nền tảng' : 'Platform numbers',
        iSub: vi ? 'Một tài khoản admin duy nhất được duy trì. Tài khoản này xem được số liệu chi tiết của từng nhà tổ chức và của người dùng.' : 'One admin account is maintained. It can read the detailed numbers behind every organizer and the user base.',
        iOrgs: vi ? 'Nhà tổ chức' : 'Organizers',
        iUsers: vi ? 'Người dùng' : 'Users',
        iAccounts: vi ? 'Tài khoản gần đây' : 'Recent accounts',
        iCities: vi ? 'Theo thành phố' : 'By city',
        iGenres: vi ? 'Theo thể loại' : 'By genre',
        iPrivacy: ins ? FF.text(ins.privacy, g) : '',
        cOrg: vi ? 'Nhà tổ chức' : 'Organizer', cLive: vi ? 'Đang chạy' : 'Live', cViews: vi ? 'Lượt xem' : 'Views',
        cCtr: 'CTR', cReports: vi ? 'Báo cáo' : 'Reports', cGmv: vi ? 'Doanh thu vé' : 'Ticket GMV',
        cUser: vi ? 'Tài khoản' : 'Account', cCity: vi ? 'Thành phố' : 'City', cJoined: vi ? 'Tham gia' : 'Joined',
        cSaved: vi ? 'Đã lưu' : 'Saved', cHyped: 'Hype', cTickets: vi ? 'Vé đã mua' : 'Tickets',
        aKicker: vi ? 'Lịch sử' : 'History',
        viewAs: vi ? 'Xem dưới' : 'View as',
        viewAsHead: vi ? 'Xem nền tảng dưới tài khoản' : 'View the platform as',
        viewAsNote: vi ? 'Phiên xem hộ là chỉ đọc và được ghi vào sổ hoạt động kèm tên người mở.' : 'An impersonated session is read-only and is written to the audit log against your name.',
        impNote: vi ? 'Chỉ đọc · mọi hành động đều được ghi lại' : 'Read-only · every action is logged',
        impExit: vi ? 'Thoát' : 'Exit',
        ageHead: vi ? 'Tuổi hàng chờ' : 'Queue age',
        shortcuts: vi ? 'Phím tắt' : 'Shortcuts',
        shortcutsTitle: vi ? 'Phím tắt hàng chờ' : 'Queue shortcuts',
        shortcutsNote: vi ? 'Phím tắt hoạt động khi con trỏ không ở trong ô nhập. Dấu ? mở lại bảng này.' : 'Shortcuts work whenever the cursor is not in a field. Press ? to reopen this sheet.',
        selectHint: vi ? 'Chọn tin này (x)' : 'Select this listing (x)',
        selectAll: vi ? 'Chọn tất cả' : 'Select all',
        selectNone: vi ? 'Bỏ chọn' : 'Deselect all',
        clearSel: vi ? 'Bỏ chọn' : 'Clear',
        sortHint: vi ? 'Đổi cách sắp xếp' : 'Change the order',
        sortAge: vi ? 'Chờ lâu nhất' : 'Oldest first',
        sortRisk: vi ? 'Rủi ro cao nhất' : 'Highest risk',
        sortNew: vi ? 'Mới nhất' : 'Newest first',
        riskHead: vi ? 'Tín hiệu rủi ro' : 'Risk signals',
        riskNote: (riskQ && st.risk[riskQ.id] ? FF.text(st.risk[riskQ.id].note, g) : (vi ? 'Điểm chỉ để tham khảo. Không có tin nào tự bị từ chối — người vẫn là người quyết định.' : 'The score is advisory. Nothing is auto-rejected; a human still decides.')),
        riskNone: vi ? 'Chọn một tin để xem tín hiệu' : 'Pick a listing to see its signals',
        rejKicker: vi ? 'Từ chối tin đăng' : 'Reject listing',
        rejReason: vi ? 'Mã lý do' : 'Reason code',
        rejMsg: vi ? 'Nhà tổ chức nhận được' : 'What the organizer receives',
        rejReset: vi ? 'Dùng lại mẫu' : 'Reset to template',
        rejMsgNote: vi ? 'Gửi qua Zalo và email, kèm mã lý do.' : 'Sent over Zalo and email with the reason code attached.',
        rejAppeal: vi ? 'Cho phép khiếu nại trong 7 ngày' : 'Allow an appeal within 7 days',
        cancel: vi ? 'Huỷ' : 'Cancel',
        apKicker: vi ? 'Sau khi từ chối' : 'After rejection',
        apTitle: vi ? 'Khiếu nại' : 'Appeals',
        apSub: vi ? 'Tin bị từ chối kèm mã lý do sẽ nằm ở đây cho tới khi nhà tổ chức phản hồi hoặc hết 7 ngày.' : 'Rejected listings sit here with their reason code until the organizer replies or the seven days run out.',
        apEmpty: vi ? 'Không có khiếu nại nào' : 'No open appeals',
        overturn: vi ? 'Lật lại & duyệt' : 'Overturn & approve',
        uphold: vi ? 'Giữ quyết định' : 'Uphold rejection',
        exportCsv: vi ? 'Xuất CSV' : 'Export CSV',
        dField: vi ? 'Trường' : 'Field', dBefore: vi ? 'Trước' : 'Before', dAfter: vi ? 'Sau' : 'After',
        previewShelf: vi ? 'Xem trong Khám phá' : 'Preview in Explore',
        previewHead: vi ? 'Xem trước dãy' : 'Shelf preview',
        seeAll: vi ? 'Xem tất cả' : 'See all',
        aTitle: vi ? 'Sổ ghi hoạt động' : 'Audit log',
        aSub: (AD.audit && AD.audit.note ? FF.text(AD.audit.note, g) : '')
          + (st.auditOk ? (st.auditOk.ok
              ? (vi ? ' Chuỗi hash đã kiểm: ' + st.auditOk.entries + ' bản ghi khớp.' : ' Hash chain verified across ' + st.auditOk.entries + ' entries.')
              : (vi ? ' Chuỗi hash bị lệch ở bản ghi #' + st.auditOk.brokenAt + '.' : ' Hash chain breaks at entry #' + st.auditOk.brokenAt + '.'))
            : '')
      },
      langLabel: vi ? 'VI' : 'EN',
      toggleLang: () => this.setState({ lang: vi ? 'en' : 'vi' }),
      toast: st.toast,

      impOn: !!st.imp,
      impLabel: st.imp ? (vi ? 'Đang xem dưới ' : 'Viewing as ') + st.imp.name : '',
      impExitLabel: vi ? 'Thoát phiên xem hộ' : 'Exit impersonation',
      impNote: vi ? 'Chỉ đọc · mọi hành động đều được ghi lại' : 'Read-only · every action is logged',
      impExit: async () => {
        try {
          const out = await FF.del('/admin/impersonation');
          this.setState({ imp:null });
          this.say(FF.text(out.message, g));
          await this.reloadAudit();
        } catch (e) { this.fail(e); }
      },
      viewAsOpen: st.viewAsOpen,
      toggleViewAs: () => { this.setState({ viewAsOpen: !st.viewAsOpen }); FF.admImpersonation(this); },
      vaBd: st.imp ? 'rgba(228,109,76,.6)' : 'rgba(186,215,247,.12)',
      vaBg: st.imp ? 'rgba(228,109,76,.12)' : 'transparent',
      vaFg: st.imp ? '#F0A07F' : '#9DA7BA',
      viewAsOpts: st.impOptions.map(v => ({
        name: v.name, role: FF.text(v.role, g),
        icon: v.targetType === 'organizer' ? 'ph-fill ph-buildings' : 'ph-fill ph-user',
        color: v.targetType === 'organizer' ? '#9D84F8' : '#B6D9FC',
        tint: v.targetType === 'organizer' ? 'rgba(102,58,243,.16)' : 'rgba(182,217,252,.14)',
        go: async () => {
          try {
            const out = await FF.post('/admin/impersonation', { targetType: v.targetType, targetId: v.id });
            this.setState({ imp:{ name:v.name }, viewAsOpen:false });
            this.say(FF.text(out.message, g));
            await this.reloadAudit();
          } catch (e) { this.fail(e); }
        }
      })),

      shortcutsOpen: st.shortcutsOpen,
      openShortcuts: () => this.setState({ shortcutsOpen:true }),
      closeShortcuts: () => this.setState({ shortcutsOpen:false }),
      keyRows: [
        { keys:['j','k'], label: vi ? 'Chuyển tin trước / sau' : 'Move between listings' },
        { keys:['a'], label: vi ? 'Duyệt tin đang chọn' : 'Approve the focused listing' },
        { keys:['r'], label: vi ? 'Mở hộp từ chối' : 'Open the reject sheet' },
        { keys:['x'], label: vi ? 'Chọn / bỏ chọn' : 'Select or deselect' },
        { keys:['⇧','A'], label: vi ? 'Chọn tất cả tin đang hiện' : 'Select everything in view' },
        { keys:['m'], label: vi ? 'Nhắn cho nhà tổ chức' : 'Message the organizer' },
        { keys:['?'], label: vi ? 'Mở bảng phím tắt' : 'Open this sheet' },
        { keys:['esc'], label: vi ? 'Đóng mọi bảng' : 'Close any panel' }
      ].map(r => ({ label:r.label, keys:r.keys.map(k => ({ k })) })),

      chatOpen: !!chat,
      msgRef: this._msg,
      chat: chat || {},
      closeChat: () => this.setState({ chat:null }),
      chatEmpty: !!chat && thread.length === 0,
      chatTyping: st.typing,
      chatTypingLabel: chat ? chat.org + (vi ? ' đang trả lời…' : ' is typing…') : '',
      chatMsgs: thread.map(m => m.from === 'admin' ? {
        text:m.text, stamp: (vi ? 'Bạn · ' : 'You · ') + m.stamp,
        align:'flex-end', tAlign:'right', radius:'14px 14px 4px 14px',
        bg:'rgba(182,217,252,.13)', bd:'rgba(182,217,252,.34)', fg:'#E3F0FA'
      } : {
        text:m.text, stamp: (chat ? chat.org : '') + ' · ' + m.stamp,
        align:'flex-start', tAlign:'left', radius:'14px 14px 14px 4px',
        bg:'rgba(13,16,28,.82)', bd:'rgba(186,215,247,.12)', fg:'#C7D3EA'
      }),
      chatQuick: quickAsks.map(x => ({ icon:x.icon, label:x.label, text:x.text, send: () => this.sendMsg(x.text) })),
      draft: st.draft,
      onDraft: (e) => this.setState({ draft: e.target.value }),
      onDraftKey: (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.sendMsg(this.state.draft); } },
      sendDraft: () => this.sendMsg(this.state.draft),
      sendBg: st.draft.trim() ? '#B6D9FC' : 'rgba(186,215,247,.119)',
      sendFg: st.draft.trim() ? '#05060F' : '#8A94A8',

      tabs: [
        { k:'queue', label: vi ? 'Hàng chờ' : 'Queue', icon:'ph-bold ph-stack', count: pending },
        { k:'verify', label: vi ? 'Xác minh' : 'Verification', icon:'ph-bold ph-seal-check', count: st.orgs.filter(o => o.state !== 'verified').length },
        { k:'reports', label: vi ? 'Báo cáo' : 'Reports', icon:'ph-bold ph-flag', count: st.reports.length },
        { k:'featured', label: vi ? 'Nổi bật' : 'Featured', icon:'ph-bold ph-sparkle', count: 0 },
        { k:'ads', label: vi ? 'Quảng cáo' : 'Ads', icon:'ph-bold ph-megaphone', count: st.inquiries.length },
        { k:'insights', label: vi ? 'Số liệu' : 'Insights', icon:'ph-bold ph-chart-line-up', count: 0 },
        { k:'audit', label: vi ? 'Hoạt động' : 'Audit', icon:'ph-bold ph-scroll', count: 0 },
        { k:'appeals', label: vi ? 'Khiếu nại' : 'Appeals', icon:'ph-bold ph-gavel', count: st.appeals.length }
      ].map(t => {
        const on = st.tab === t.k;
        return {
          label:t.label, icon:t.icon, count:String(t.count), hasCount: t.count > 0,
          bg: on ? 'rgba(182,217,252,.14)' : 'rgba(13,16,28,.6)',
          bd: on ? '#B6D9FC' : 'rgba(186,215,247,.12)',
          fg: on ? '#D8ECF8' : '#9DA7BA',
          cBg: on ? '#B6D9FC' : 'rgba(186,215,247,.2)', cFg: on ? '#05060F' : '#C7D3EA',
          pick: () => this.go(t.k)
        };
      }),
      isQueue: st.tab === 'queue', isVerify: st.tab === 'verify', isReports: st.tab === 'reports',
      isFeatured: st.tab === 'featured', isAudit: st.tab === 'audit', isAds: st.tab === 'ads', isInsights: st.tab === 'insights',
      isAppeals: st.tab === 'appeals',
      apEmpty: st.appeals.length === 0,
      appeals: st.appeals.map(a => {
        const stMap = {
          open: { fg:'#F0A07F', bg:'rgba(228,109,76,.14)', bd:'rgba(228,109,76,.4)' },
          replied: { fg:'#D8ECF8', bg:'rgba(182,217,252,.14)', bd:'rgba(182,217,252,.4)' }
        }[a.state] || { fg:'#9DA7BA', bg:'rgba(157,167,186,.128)', bd:'rgba(186,215,247,.12)' };
        const when = a.repliedAt
          ? (vi ? 'Phản hồi ' + FF.dayLabel(FF.vnDate(new Date(a.repliedAt)), g) + ' ' + FF.hhmm(a.repliedAt) : 'Replied ' + FF.dayLabel(FF.vnDate(new Date(a.repliedAt)), g) + ' ' + FF.hhmm(a.repliedAt))
          : (vi ? 'Từ chối ' + FF.dayLabel(FF.vnDate(new Date(a.rejectedAt)), g) : 'Rejected ' + FF.dayLabel(FF.vnDate(new Date(a.rejectedAt)), g));
        const decide = (kind) => async () => {
          if (this.blocked()) return;
          try {
            const out = await FF.post('/admin/appeals/' + a.id + '/' + kind);
            this.say(FF.text(out.message, g));
            await this.reloadAdmin();
          } catch (e) { this.fail(e); }
        };
        return {
          title:a.title, art: a.coverUrl ? 'url("' + a.coverUrl + '") center/cover no-repeat' : a.art,
          meta: a.organizer + ' · ' + when,
          bd: a.state === 'replied' ? 'rgba(182,217,252,.3)' : 'rgba(186,215,247,.12)',
          stLabel: FF.text(a.stateLabel, g), stFg: stMap.fg, stBg: stMap.bg, stBd: stMap.bd,
          reasonHead: (vi ? 'Lý do · ' : 'Reason · ') + FF.text(a.reason, g),
          msg: a.message,
          hasReply: !!a.reply,
          replyHead: vi ? 'Nhà tổ chức trả lời' : 'Organizer reply',
          reply: a.reply || '',
          when: when,
          deadline: (vi ? 'Còn ' : 'Closes in ') + a.closesInDays + (vi ? ' ngày' : 'd'),
          overturn: decide('overturn'),
          uphold: decide('uphold')
        };
      }),

      rejectOpen: !!st.rejectFor,
      closeReject: () => this.setState({ rejectFor:null }),
      rejectTitle: st.rejectFor === 'bulk'
        ? (vi ? rejectItems.length + ' tin đăng' : rejectItems.length + ' listings')
        : (rejectItems[0] ? rejectItems[0].title : ''),
      rejectCodes: REASONS.map(r => {
        const on = st.rejectCode === r.k;
        return { label: FF.text(r.label, g), code:r.k, icon:r.icon,
          bg: on ? 'rgba(182,217,252,.1)' : 'rgba(5,6,15,.6)',
          bd: on ? '#B6D9FC' : 'rgba(186,215,247,.12)',
          fg: on ? '#D8ECF8' : '#C7D3EA',
          iconFg: on ? '#D8ECF8' : '#8A94A8',
          pick: () => this.setState({ rejectCode:r.k, rejectMsg:'', rejectAppeal: r.appeal !== false }) };
      }),
      rejectMsg: st.rejectMsg || FF.text(rsn.msg, g),
      onRejectMsg: (e) => this.setState({ rejectMsg: e.target.value }),
      resetRejectMsg: () => this.setState({ rejectMsg:'' }),
      toggleAppeal: () => { if (rsn.appeal === false) { this.say(vi ? 'Vi phạm chính sách không được khiếu nại' : 'Policy breaches cannot be appealed'); return; } this.setState({ rejectAppeal: !st.rejectAppeal }); },
      appealSw: (st.rejectAppeal && rsn.appeal !== false) ? '#269684' : 'rgba(186,215,247,.2)',
      appealJustify: (st.rejectAppeal && rsn.appeal !== false) ? 'flex-end' : 'flex-start',
      appealBd: (st.rejectAppeal && rsn.appeal !== false) ? 'rgba(38,150,132,.4)' : 'rgba(186,215,247,.12)',
      appealNote: rsn.appeal === false
        ? (vi ? 'Mã lý do này không cho phép khiếu nại.' : 'This reason code does not allow an appeal.')
        : (vi ? 'Nhà tổ chức có thể trả lời một lần; khiếu nại hiện ở tab Khiếu nại.' : 'The organizer can reply once; the appeal shows up in the Appeals tab.'),
      confirmReject: () => this.confirmReject(),
      confirmRejectLabel: st.rejectFor === 'bulk'
        ? (vi ? 'Từ chối ' + rejectItems.length + ' tin' : 'Reject ' + rejectItems.length + ' listings')
        : (vi ? 'Từ chối và gửi tin nhắn' : 'Reject and send the message'),

      bulkOn: selIds.length > 0,
      bulkLabel: vi ? 'Đã chọn ' + selIds.length : selIds.length + ' selected',
      bulkApproveLabel: vi ? 'Duyệt ' + selIds.length : 'Approve ' + selIds.length,
      bulkRejectLabel: vi ? 'Từ chối ' + selIds.length : 'Reject ' + selIds.length,
      bulkClear: () => this.setState({ sel:{} }),
      bulkApprove: async () => {
        if (this.blocked()) return;
        const items = st.queue.filter(q => st.sel[q.id]);
        if (!items.length) return;
        try {
          const out = await FF.post('/admin/listings/approve', { ids: items.map(q => q.id) });
          this.say(FF.text(out.message, g));
          await this.reloadAdmin();
        } catch (e) { this.fail(e); }
      },
      bulkReject: () => { if (this.blocked()) return; this.setState({ rejectFor:'bulk', rejectCode:(REASONS[0] || {}).k || 'venue', rejectMsg:'', rejectAppeal:true }); },

      risk: (() => {
        if (!riskQ) return { title: T_none(vi), score:'—', band: vi ? 'Không có' : 'None', color:'#8A94A8', tint:'rgba(157,167,186,.128)', bd:'rgba(186,215,247,.12)', w:'0%', factors:[] };
        const r = st.risk[riskQ.id];
        const score = r ? r.score : riskQ.riskScore;
        const band = score >= 60 ? { c:'#F4A3A3', t:'rgba(224,74,74,.14)', bd:'rgba(224,74,74,.3)', l: vi ? 'Cao' : 'High' }
          : score >= 25 ? { c:'#F0A07F', t:'rgba(228,109,76,.14)', bd:'rgba(228,109,76,.28)', l: vi ? 'Trung bình' : 'Medium' }
          : { c:'#6CC7B6', t:'rgba(38,150,132,.14)', bd:'rgba(186,215,247,.12)', l: vi ? 'Thấp' : 'Low' };
        return {
          title: riskQ.title, score: String(score), band: r ? FF.text(r.bandLabel, g) : band.l,
          color: band.c, tint: band.t, bd: band.bd, w: Math.min(100, score) + '%',
          factors: (r ? r.factors : []).map(f => ({
            label: FF.text(f.label, g),
            icon: f.bad ? 'ph-fill ph-warning-circle' : 'ph-fill ph-check-circle',
            color: f.bad ? (f.weight >= 20 ? '#F4A3A3' : '#F0A07F') : '#6CC7B6',
            weight: f.bad ? '+' + f.weight : '0'
          }))
        };
      })(),


      adT: {
        kicker: vi ? 'Đối tác thương hiệu' : 'Brand partners',
        title: vi ? 'Quảng cáo & đối tác' : 'Ads & partners',
        sub: vi ? 'Yêu cầu từ các thương hiệu ăn uống, thời trang và sức khoẻ muốn chạy quảng cáo trên FeestFinder. Duyệt một yêu cầu là tạo chiến dịch từ phần cài đặt bên phải.'
          : 'Enquiries from food, fashion and healthcare brands wanting to advertise on FeestFinder. Approving one creates a campaign from the setup panel on the right.',
        inbox: vi ? 'Yêu cầu mới' : 'New enquiries',
        inboxEmpty: vi ? 'Không còn yêu cầu nào đang chờ.' : 'No enquiries waiting.',
        wants: vi ? 'Vị trí họ muốn' : 'Placements requested',
        approve: vi ? 'Tạo chiến dịch' : 'Create campaign',
        decline: vi ? 'Từ chối' : 'Decline',
        reply: vi ? 'Trả lời' : 'Reply',
        live: vi ? 'Chiến dịch đang chạy' : 'Live campaigns',
        colBrand: vi ? 'Thương hiệu' : 'Brand', colPlace: vi ? 'Vị trí' : 'Placement',
        colImp: vi ? 'Hiển thị' : 'Impressions', colCtr: 'CTR', colSpend: vi ? 'Đã tiêu' : 'Spend',
        colPace: vi ? 'Tiến độ' : 'Pacing',
        setup: vi ? 'Cài đặt chiến dịch' : 'Campaign setup',
        setupFor: vi ? 'Cho' : 'For',
        places: vi ? 'Vị trí quảng cáo — giá mỗi 1.000 lượt hiển thị' : 'Placements — rate per 1,000 impressions',
        rateHint: vi ? 'Sửa giá CPM cho vị trí này' : 'Edit the CPM rate for this placement',
        genres: vi ? 'Thể loại nhắm tới' : 'Target genres',
        areas: vi ? 'Khu vực' : 'Districts',
        cpm: vi ? 'Giá CPM' : 'CPM rate',
        cap: vi ? 'Giới hạn ngày' : 'Daily cap',
        capUnit: vi ? 'triệu₫ / ngày' : 'million₫ / day',
        preview: vi ? 'Xem trước thẻ feed' : 'Feed card preview',
        rules: vi ? 'Luật quảng cáo' : 'Ad rules',
        rulesBody: AD.ads && AD.ads.rules ? FF.text(AD.ads.rules, g) : '',
        paused: vi ? 'Tạm dừng' : 'Paused', running: vi ? 'Đang chạy' : 'Running',
        sponsored: vi ? 'Được tài trợ' : 'Sponsored'
      },
      inquiries: st.inquiries.map(q => {
        const on = st.adsSel === q.id;
        const names = { feed: vi ? 'Thẻ feed' : 'Feed card', banner: vi ? 'Banner' : 'Banner', live: vi ? 'Trong sự kiện' : 'In-event' };
        return {
          brand:q.brand, logo:q.logo, email:q.email, budget:q.budget,
          art: q.art, cat:q.category,
          age: vi ? AGO(q.ageMinutes, vi) + ' trước' : AGO(q.ageMinutes, vi) + ' ago',
          msg: q.message,
          wants: q.placements.map(w => ({ label: names[w] || w })),
          bd: on ? '#B6D9FC' : 'rgba(186,215,247,.12)',
          bg: on ? 'rgba(182,217,252,.06)' : 'rgba(13,16,28,.62)',
          pick: () => this.setState({ adsSel:q.id }),
          approve: async () => {
            if (this.blocked()) return;
            const places = Object.keys(st.setup.places).filter(k => st.setup.places[k]);
            try {
              const out = await FF.post('/admin/ads/inquiries/' + q.id + '/approve', {
                placement: places[0] || q.placements[0],
                genres: Object.keys(st.setup.genres).filter(k => st.setup.genres[k]),
                areas: Object.keys(st.setup.areas).filter(k => st.setup.areas[k]),
                dailyCap: st.setup.cap * 1000000
              });
              this.say(FF.text(out.message, g));
              await this.reloadAdmin();
            } catch (e) { this.fail(e); }
          },
          decline: async () => {
            if (this.blocked()) return;
            try {
              const out = await FF.post('/admin/ads/inquiries/' + q.id + '/decline');
              this.say(FF.text(out.message, g));
              await this.reloadAdmin();
            } catch (e) { this.fail(e); }
          },
          reply: () => {
            this.say(vi ? 'Đang mở thư tới ' + q.email : 'Opening a reply to ' + q.email);
            location.href = 'mailto:' + q.email + '?subject=' + encodeURIComponent('FeestFinder · ' + q.brand);
          }
        };
      }),
      inqEmpty: st.inquiries.length === 0,
      campaigns: st.campaigns.map(c => {
        const names = { feed: vi ? 'Thẻ feed' : 'Feed card', banner: vi ? 'Banner Khám phá' : 'Explore banner', live: vi ? 'Trong sự kiện' : 'In-event' };
        return {
          brand:c.brand, logo:c.logo, art: c.art,
          place: names[c.placement] || c.placement,
          imp: c.impressions ? c.impressions.toLocaleString(vi ? 'vi-VN' : 'en-US') : '—',
          ctr: c.impressions ? NUM(c.ctrPct, vi, 2) + '%' : '—',
          spend: VND(c.spend, vi),
          paceW: Math.min(100, c.pacingPct) + '%',
          paceLabel: c.active ? c.pacingPct + '%' : (vi ? 'Dừng' : 'Paused'),
          paceFill: c.active ? (c.pacingPct > 85 ? '#F0A07F' : '#B6D9FC') : '#6E788C',
          brandFg: c.active ? '#D8ECF8' : '#9DA7BA',
          fg: c.active ? '#C7D3EA' : '#9DA7BA',
          ctrFg: c.active ? '#D8ECF8' : '#9DA7BA',
          on: c.active,
          swBg: c.active ? '#269684' : 'rgba(186,215,247,.2)',
          swJustify: c.active ? 'flex-end' : 'flex-start',
          toggle: async () => {
            if (this.blocked()) return;
            try {
              await FF.patch('/admin/ads/campaigns/' + c.id, { active: !c.active });
              this.say(c.active ? (vi ? 'Đã tạm dừng ' + c.brand : c.brand + ' paused') : (vi ? 'Đã chạy lại ' + c.brand : c.brand + ' resumed'));
              await this.reloadAdmin();
            } catch (e) { this.fail(e); }
          }
        };
      }),
      setupFor: (() => {
        const q = st.inquiries.filter(x => x.id === st.adsSel)[0] || st.inquiries[0];
        return q ? { brand:q.brand, logo:q.logo, art: q.art, cat:q.category } : { brand: vi ? 'Chiến dịch mới' : 'New campaign', logo:'—', art:'rgba(186,215,247,.2)', cat:'' };
      })(),
      setupPlaces: [
        { k:'feed', label: vi ? 'Thẻ trong feed' : 'Feed card' },
        { k:'banner', label: vi ? 'Banner Khám phá' : 'Explore banner' },
        { k:'live', label: vi ? 'Trong sự kiện' : 'In-event' }
      ].map(p => {
        const on = !!st.setup.places[p.k];
        const rates = st.setup.rates || RATES;
        const rate = rates[p.k] || 0;
        return { label:p.label,
          icon: on ? 'ph-fill ph-check-square' : 'ph-bold ph-square',
          color: on ? '#B6D9FC' : '#8A94A8',
          fg: on ? '#D8ECF8' : '#C7D3EA',
          rate: rate ? rate.toLocaleString('vi-VN') : '',
          rateFg: on ? '#D8ECF8' : '#9DA7BA',
          setRate: (e) => {
            const v = Math.min(9999000, parseInt(String(e.target.value).replace(/\D/g, ''), 10) || 0);
            const x = Object.assign({}, rates); x[p.k] = v;
            this.setState({ setup: Object.assign({}, st.setup, { rates:x }) });
            clearTimeout(this._rates);
            this._rates = setTimeout(async () => {
              if (!['feed','banner','live'].every(k => x[k] >= 10000)) return;
              try { await FF.put('/admin/ads/rates', x); await this.reloadAudit(); } catch (e2) { this.fail(e2); }
            }, 700);
          },
          toggle: () => { const x = Object.assign({}, st.setup.places); x[p.k] = !on; this.setState({ setup: Object.assign({}, st.setup, { places:x }) }); } };
      }),
      setupGenres: (AD.genres || ['EDM','Festival','Hip-Hop','Indie','Food']).map(gn => {
        const on = !!st.setup.genres[gn];
        return { label:gn,
          bg: on ? 'rgba(182,217,252,.14)' : 'rgba(5,6,15,.6)', bd: on ? '#B6D9FC' : 'rgba(186,215,247,.12)', fg: on ? '#D8ECF8' : '#C7D3EA',
          toggle: () => { const x = Object.assign({}, st.setup.genres); x[gn] = !on; this.setState({ setup: Object.assign({}, st.setup, { genres:x }) }); } };
      }),
      setupAreas: (AD.areas || ['Quận 1','Quận 7','Thủ Đức','Quận 11']).map(ar => {
        const on = !!st.setup.areas[ar];
        return { label:ar,
          bg: on ? 'rgba(102,58,243,.14)' : 'rgba(5,6,15,.6)', bd: on ? '#7A55F6' : 'rgba(186,215,247,.12)', fg: on ? '#C4B8F7' : '#C7D3EA',
          toggle: () => { const x = Object.assign({}, st.setup.areas); x[ar] = !on; this.setState({ setup: Object.assign({}, st.setup, { areas:x }) }); } };
      }),
      cpmValue: st.setup.cpm.toLocaleString('vi-VN') + '₫',
      capValue: String(st.setup.cap),
      cpmDown: () => this.setState({ setup: Object.assign({}, st.setup, { cpm: Math.max(60, st.setup.cpm - 20) }) }),
      cpmUp: () => this.setState({ setup: Object.assign({}, st.setup, { cpm: Math.min(600, st.setup.cpm + 20) }) }),
      capDown: () => this.setState({ setup: Object.assign({}, st.setup, { cap: Math.max(1, st.setup.cap - 1) }) }),
      capUp: () => this.setState({ setup: Object.assign({}, st.setup, { cap: Math.min(60, st.setup.cap + 1) }) }),
      health: (ins ? ins.health : []).map(h => {
        const look = {
          queue:    { label: vi ? 'Chờ duyệt' : 'In queue', unit: vi ? 'tin' : 'listings', icon:'ph-bold ph-stack', color:'#F0A07F' },
          approved: { label: vi ? 'Đã duyệt hôm nay' : 'Approved today', unit:'', icon:'ph-bold ph-check-circle', color:'#6CC7B6' },
          flagged:  { label: vi ? 'Bị gắn cờ' : 'Flagged', unit: vi ? 'tin' : 'listings', icon:'ph-bold ph-warning', color:'#F4A3A3' },
          reports:  { label: vi ? 'Báo cáo mở' : 'Open reports', unit:'', icon:'ph-bold ph-flag', color:'#9D84F8' }
        }[h.key] || { label:h.key, unit:'', icon:'ph-bold ph-chart-line-up', color:'#B6D9FC' };
        return Object.assign({ k:h.key, value:String(h.value), note: FF.text(h.note, g) }, look,
          { open: () => this.setState({ hDrill: h.key }) });
      }),

      drillOpen: !!st.hDrill,
      closeDrill: () => this.setState({ hDrill:null }),
      drill: (() => {
        const found = (ins ? ins.health : []).filter(h => h.key === st.hDrill)[0];
        const d = {
          queue: { kicker: vi ? 'Chờ duyệt' : 'In queue', title: vi ? 'tin đang chờ' : 'listings waiting',
            icon:'ph-fill ph-stack', color:'#F0A07F', tint:'rgba(240,160,127,.14)',
            sub: vi ? 'Xếp theo thời gian chờ. Mục tiêu nội bộ là quyết định trong ' + SLA_H + ' giờ làm việc.' : 'Ordered by wait. The internal target is a decision inside ' + SLA_H + ' working hours.',
            cta: vi ? 'Mở hàng chờ' : 'Open the queue', tab:'queue', filter:'all' },
          approved: { kicker: vi ? 'Đã duyệt hôm nay' : 'Approved today', title: vi ? 'tin đã lên sóng' : 'listings live',
            icon:'ph-fill ph-check-circle', color:'#6CC7B6', tint:'rgba(108,199,182,.14)',
            sub: vi ? 'Những quyết định gần nhất, lấy từ sổ hoạt động.' : 'The most recent decisions, straight from the audit log.',
            cta: vi ? 'Xem hoạt động' : 'View the audit log', tab:'audit', filter:'all' },
          flagged: { kicker: vi ? 'Bị gắn cờ' : 'Flagged', title: vi ? 'tin cần người xem' : 'need a human',
            icon:'ph-fill ph-warning', color:'#F4A3A3', tint:'rgba(255,154,154,.14)',
            sub: vi ? 'Bộ lọc tự động giữ lại những tin này. Số bên phải là tín hiệu không đạt.' : 'Automated checks held these back. The figure on the right is how many signals failed.',
            cta: vi ? 'Xem tin gắn cờ' : 'Review flagged listings', tab:'queue', filter:'flagged' },
          reports: { kicker: vi ? 'Báo cáo mở' : 'Open reports', title: vi ? 'chủ đề chưa xử lý' : 'threads open',
            icon:'ph-fill ph-flag', color:'#9D84F8', tint:'rgba(102,58,243,.14)',
            sub: vi ? 'Nhóm theo tin đăng. Số bên phải là số người dùng đã báo cáo.' : 'Grouped by listing. The figure on the right is how many users reported it.',
            cta: vi ? 'Mở báo cáo' : 'Open reports', tab:'reports', filter:'all' }
        }[st.hDrill];
        if (!d) return { kicker:'', title:'', value:'', icon:'', color:'#B6D9FC', tint:'transparent', sub:'', cta:'' };
        return Object.assign({}, d, { value: String(found ? found.value : ''), go: () => { this.setState({ hDrill:null, qFilter:d.filter }); this.go(d.tab); } });
      })(),
      drillRows: (() => {
        const k = st.hDrill;
        if (k === 'queue' || k === 'flagged') {
          return st.queue.filter(q => k === 'queue' ? true : q.flagged).map(q => ({
            title:q.title, art: q.coverUrl ? 'url("' + q.coverUrl + '") center/cover no-repeat' : q.art,
            meta: q.organizer.name + ' · ' + whenLine(q, g),
            stat: k === 'flagged' ? String(q.signals.filter(s => !s.ok).length) : HM(q.waitingMinutes, vi),
            statFg: k === 'flagged' ? '#F4A3A3' : '#F0A07F',
            statLabel: k === 'flagged' ? (vi ? 'tín hiệu' : 'signals') : (vi ? 'đang chờ' : 'waiting')
          }));
        }
        if (k === 'approved') {
          return st.audit.filter(a => a.action === 'listing.approved').slice(0, 5).map(a => ({
            title: a.target.label, art: ARTS[0], meta: FF.text(a.actor, g),
            stat: FF.hhmm(a.at), statFg:'#6CC7B6', statLabel: vi ? 'đã duyệt' : 'approved'
          }));
        }
        if (k === 'reports') {
          return st.reports.map(r => ({
            title:r.subject, art: (RCAT[r.category] || RCAT.other).art,
            meta: FF.text(r.categoryLabel, g) + ' · ' + AGO(r.ageMinutes, vi),
            stat: String(r.count), statFg:'#9D84F8', statLabel: vi ? 'người báo' : 'reporters'
          }));
        }
        return [];
      })(),

      qFilters: [
        { k:'all', label: vi ? 'Tất cả' : 'All', icon:'ph-bold ph-tray', n: st.qCounts.all },
        { k:'breach', label: vi ? 'Quá hạn' : 'Past SLA', icon:'ph-bold ph-timer', n: st.qCounts.breach },
        { k:'flagged', label: vi ? 'Gắn cờ' : 'Flagged', icon:'ph-bold ph-warning', n: st.qCounts.flagged },
        { k:'new', label: vi ? 'BTC mới' : 'New organizers', icon:'ph-bold ph-user-plus', n: st.qCounts.new },
        { k:'clean', label: vi ? 'Sạch' : 'Clean', icon:'ph-bold ph-check-circle', n: st.qCounts.clean }
      ].map(f => {
        const on = st.qFilter === f.k;
        return { label:f.label, icon:f.icon, count:String(f.n),
          bg: on ? 'rgba(182,217,252,.14)' : 'transparent', bd: on ? '#B6D9FC' : 'rgba(186,215,247,.12)', fg: on ? '#D8ECF8' : '#9DA7BA',
          cBg: on ? '#B6D9FC' : '#131725', cFg: on ? '#05060F' : '#9DA7BA',
          pick: () => this.setState({ qFilter:f.k, focus:0 }) };
      }),
      sortLabel: st.qSort === 'age' ? T_sort(vi,'age') : st.qSort === 'risk' ? T_sort(vi,'risk') : T_sort(vi,'new'),
      cycleSort: () => this.setState({ qSort: st.qSort === 'age' ? 'risk' : st.qSort === 'risk' ? 'new' : 'age', focus:0 }),
      allIcon: vis.length && vis.every(q => st.sel[q.id]) ? 'ph-fill ph-check-square' : selIds.length ? 'ph-fill ph-minus-square' : 'ph-bold ph-square',
      allColor: selIds.length ? '#B6D9FC' : '#8A94A8',
      allFg: selIds.length ? '#D8ECF8' : '#C7D3EA',
      allLabel: vis.length && vis.every(q => st.sel[q.id]) ? (vi ? 'Bỏ chọn' : 'Deselect all') : (vi ? 'Chọn tất cả (' + vis.length + ')' : 'Select all (' + vis.length + ')'),
      toggleAll: () => this.toggleAllSel(),
      ageBuckets: (() => {
        const look = {
          under_1h: { color:'#269684', en:'under 1 hour', vi:'dưới 1 giờ' },
          one_to_two: { color:'#B6D9FC', en:'1 to 2 hours', vi:'1 đến 2 giờ' },
          two_to_sla: { color:'#F0A07F', en:'2 to ' + SLA_H + ' hours', vi:'2 đến ' + SLA_H + ' giờ' },
          past_sla: { color:'#E04A4A', en:'past the ' + SLA_H + ' hour promise', vi:'quá mốc ' + SLA_H + ' giờ' }
        };
        const total = st.qCounts.all || 1;
        return st.qBuckets.map(b => {
          const x = look[b.key] || { color:'#131725', en:b.key, vi:b.key };
          return { w: Math.max(2, Math.round((b.count / total) * 100)) + '%', color: b.count ? x.color : '#131725', hint: b.count + ' · ' + x[g] };
        });
      })(),
      oldestLabel: st.qOldest ? (vi ? 'Cũ nhất ' : 'Oldest ') + HM(st.qOldest, vi) : '—',
      oldestFg: st.qOldest >= SLA_H * 60 ? '#F4A3A3' : '#C7D3EA',
      qEmpty: vis.length === 0,
      queue: vis.map((q, i) => {
        const on = !!st.sel[q.id];
        const focused = focusQ && focusQ.id === q.id;
        const slaLook = {
          ok: { fg:'#6CC7B6', bg:'rgba(38,150,132,.12)', bd:'rgba(38,150,132,.34)', icon:'ph-fill ph-clock' },
          soon: { fg:'#F0A07F', bg:'rgba(228,109,76,.13)', bd:'rgba(228,109,76,.4)', icon:'ph-fill ph-clock-countdown' },
          breach: { fg:'#F4A3A3', bg:'rgba(224,74,74,.14)', bd:'rgba(224,74,74,.45)', icon:'ph-fill ph-timer' }
        }[q.sla.state];
        const score = q.riskScore;
        return {
          title:q.title, art: q.coverUrl ? 'url("' + q.coverUrl + '") center/cover no-repeat' : q.art, flagged:q.flagged,
          flagLabel: q.flag ? FF.text(q.flag.label, g) : '',
          meta: q.organizer.name + ' · ' + whenLine(q, g),
          bg: on ? 'rgba(182,217,252,.06)' : q.flagged ? 'rgba(228,109,76,.05)' : 'rgba(13,16,28,.62)',
          bd: focused ? '#B6D9FC' : on ? 'rgba(182,217,252,.5)' : q.flagged ? 'rgba(228,109,76,.32)' : 'rgba(186,215,247,.12)',
          ring: focused ? '0 0 0 3px rgba(182,217,252,.14)' : 'none',
          selIcon: on ? 'ph-fill ph-check-square' : 'ph-bold ph-square',
          selColor: on ? '#B6D9FC' : '#5C6679',
          riskScore: String(score),
          riskFg: score >= 60 ? '#F4A3A3' : score >= 25 ? '#F0A07F' : '#6CC7B6',
          slaLabel: FF.text(q.sla.label, g), slaFg: slaLook.fg, slaBg: slaLook.bg, slaBd: slaLook.bd, slaIcon: slaLook.icon,
          focusIt: () => this.setState({ focus:i }),
          toggleSel: () => this.toggleSel(q.id),
          signals: q.signals.map(s => ({
            label: FF.text(s.label, g),
            icon: s.ok ? 'ph-fill ph-check-circle' : 'ph-fill ph-x-circle',
            color: s.ok ? '#6CC7B6' : '#F4A3A3'
          })),
          approve: () => this.approveOne(q),
          reject: () => this.openReject(q.id),
          ask: () => this.openChat(q),
          askLabel: (st.threads[q.id] || []).length || q.threadMessages ? openThread : askInfo
        };
      }),
      orgStats: (ins ? ins.organizers : []).map((s, i) => ({
        name:s.name, initials:s.initials, art: ARTS[i % ARTS.length],
        live:String(s.live), views:CNT(s.views, vi), ctr:NUM(s.ctrPct, vi) + '%', gmv:VND(s.gmv, vi), reports:String(s.reports),
        ctrFg: s.reports === 0 ? '#6CC7B6' : '#C7D3EA',
        repFg: s.reports > 5 ? '#F4A3A3' : s.reports > 0 ? '#F0A07F' : '#8A94A8',
        verified: s.verified
      })),
      userStats: (() => {
        const u = ins ? ins.users : null;
        if (!u) return [];
        return [
          { label: vi ? 'Tài khoản' : 'Accounts', value: CNT(u.accounts, vi), note: (vi ? '+' : '+') + CNT(u.newLast7Days, vi) + (vi ? ' trong 7 ngày' : ' in the last 7 days'), icon:'ph-bold ph-users', color:'#B6D9FC' },
          { label: vi ? 'Hoạt động / tuần' : 'Weekly active', value: CNT(u.weeklyActive, vi), note: NUM(u.weeklyActivePct, vi) + (vi ? '% tổng tài khoản' : '% of the base'), icon:'ph-bold ph-pulse', color:'#9D84F8' },
          { label: vi ? 'Lưu / người' : 'Saves per user', value: NUM(u.savesPerUser, vi), note: vi ? 'Trung bình người đang hoạt động' : 'Average active user', icon:'ph-bold ph-heart', color:'#F4A3A3' },
          { label: vi ? 'Hype / người' : 'Hype per user', value: NUM(u.hypesPerUser, vi), note: vi ? 'Chạm nút Hype' : 'Hype taps', icon:'ph-bold ph-fire', color:'#F0A07F' },
          { label: vi ? 'Quay lại 7 ngày' : '7-day return', value: NUM(u.sevenDayReturnPct, vi) + '%', note: vi ? 'Mở lại app trong tuần' : 'Reopen within the week', icon:'ph-bold ph-arrow-u-up-left', color:'#6CC7B6' }
        ];
      })(),
      cityRows: (ins ? ins.cities : []).map(c => ({ label: FF.text(c.label, g), pct: NUM(c.pct, vi) + '%', w: c.pct + '%' })),
      genreRows: (ins ? ins.genres : []).map(c => ({ label: c.label, pct: NUM(c.pct, vi) + '%', w: c.pct + '%' })),
      accounts: (ins ? ins.recentAccounts : []).map(a => ({
        h: a.handle, city: a.city || '—',
        joined: FF.dayLabel(FF.vnDate(new Date(a.joined)), g),
        saved:String(a.saved), hyped:String(a.hyped), tickets:String(a.tickets),
        tFg: a.tickets > 0 ? '#6CC7B6' : '#8A94A8'
      })),

      checks: (() => {
        const failed = [];
        st.queue.forEach(q => q.signals.filter(s => !s.ok).forEach(s => failed.push({ label: FF.text(s.label, g), detail: q.title })));
        const passed = [];
        st.queue.forEach(q => q.signals.filter(s => s.ok).forEach(s => {
          if (!passed.some(x => x.label === FF.text(s.label, g))) passed.push({ label: FF.text(s.label, g), detail: q.title });
        }));
        return failed.slice(0, 3).map(x => ({ icon:'ph-fill ph-warning-circle', color:'#F0A07F', label:x.label, detail:x.detail }))
          .concat(passed.slice(0, 3).map(x => ({ icon:'ph-fill ph-check-circle', color:'#6CC7B6', label:x.label, detail:x.detail })));
      })(),

      orgs: st.orgs.map((o, i) => {
        const s = o.state;
        const stMap = {
          verified: { label: vi ? 'Đã xác minh' : 'Verified', fg:'#6CC7B6', bg:'rgba(38,150,132,.14)', bd:'rgba(38,150,132,.4)' },
          pending:  { label: vi ? 'Chờ xác minh' : 'Pending', fg:'#F0A07F', bg:'rgba(228,109,76,.14)', bd:'rgba(228,109,76,.4)' },
          flagged:  { label: vi ? 'Cần xem lại' : 'Needs review', fg:'#F4A3A3', bg:'rgba(224,74,74,.14)', bd:'rgba(224,74,74,.4)' }
        }[s] || { label: vi ? 'Chờ xác minh' : 'Pending', fg:'#F0A07F', bg:'rgba(228,109,76,.14)', bd:'rgba(228,109,76,.4)' };
        const doc = (ok, en, viL) => ({ label: vi ? viL : en, icon: ok ? 'ph-fill ph-check-circle' : 'ph-fill ph-x-circle', color: ok ? '#6CC7B6' : '#F4A3A3' });
        return {
          name:o.name, initials:o.initials,
          avBg: ARTS[i % ARTS.length],
          status: stMap.label, stFg: stMap.fg, stBg: stMap.bg, stBd: stMap.bd,
          bd: s === 'flagged' ? 'rgba(224,74,74,.3)' : 'rgba(186,215,247,.12)',
          meta: (vi ? o.events + ' sự kiện · Tham gia ' : o.events + ' events · Joined ') + o.since
            + (o.strikes ? (vi ? ' · ' + o.strikes + ' cảnh báo' : ' · ' + o.strikes + ' strikes') : ''),
          docs: [
            doc(o.docs.id, 'ID document', 'Giấy tờ tuỳ thân'),
            doc(o.docs.tax, 'Tax code', 'Mã số thuế'),
            doc(o.docs.bank, 'Bank account', 'Tài khoản ngân hàng')
          ],
          cta: s === 'verified' ? (vi ? 'Thu hồi' : 'Revoke') : (vi ? 'Xác minh' : 'Verify'),
          ctaBg: s === 'verified' ? 'transparent' : '#B6D9FC',
          ctaFg: s === 'verified' ? '#9DA7BA' : '#05060F',
          ctaBd: s === 'verified' ? 'rgba(186,215,247,.12)' : '#B6D9FC',
          verify: async () => {
            if (this.blocked()) return;
            try {
              const next = s === 'verified' ? 'pending' : 'verified';
              await FF.patch('/admin/organizers/' + o.id, { state: next });
              this.say(next === 'verified' ? (vi ? 'Đã xác minh ' + o.name : o.name + ' verified') : (vi ? 'Đã thu hồi ' + o.name : o.name + ' revoked'));
              await this.reloadAdmin();
            } catch (e) { this.fail(e); }
          },
          open: () => this.say(vi
            ? 'Giấy tờ của ' + o.name + (o.legalName ? ' · ' + o.legalName : '') + (o.taxCode ? ' · MST ' + o.taxCode : '')
            : 'Documents for ' + o.name + (o.legalName ? ' · ' + o.legalName : '') + (o.taxCode ? ' · tax ' + o.taxCode : ''))
        };
      }),

      reports: st.reports.map(r => {
        const c = RCAT[r.category] || RCAT.other;
        const act = (kind, path) => async () => {
          if (this.blocked()) return;
          try {
            const out = await FF.post('/admin/reports/' + r.eventId + '/' + path);
            this.say(FF.text(out.message, g));
            await this.reloadAdmin();
          } catch (e) { this.fail(e); }
        };
        return {
          category: FF.text(r.categoryLabel, g), icon: c.icon, catFg: c.fg, catBg: c.bg, catBd: c.bd,
          bd: r.count > 10 ? 'rgba(224,74,74,.3)' : 'rgba(186,215,247,.12)',
          count: vi ? r.count + ' người báo cáo' : r.count + ' reports',
          age: vi ? AGO(r.ageMinutes, vi) + ' trước' : AGO(r.ageMinutes, vi) + ' ago',
          subject: r.subject + (r.heldFromFeed ? (vi ? ' · đang tạm ẩn' : ' · held from the feed') : ''),
          quote: r.quote ? FF.text(r.quote, g) : '',
          takeDown: act('down', 'take-down'),
          warn: act('warn', 'warn'),
          dismiss: act('dismiss', 'dismiss')
        };
      }),
      reportStats: (() => {
        const rows = st.reportStats || [];
        const max = rows.reduce((m, r) => Math.max(m, r.count), 0) || 1;
        const colors = { refund:'#F4A3A3', wrong:'#F0A07F', price:'#7A55F6', safety:'#B6D9FC', spam:'#8A94A8', other:'#8A94A8' };
        return rows.map(r => ({
          label: FF.text(r.label, g), value: String(r.count),
          barW: Math.round(r.count / max * 100) + '%', color: colors[r.category] || '#8A94A8'
        }));
      })(),

      shelves: st.shelves.map((s, i) => {
        const from = DMY(s.startsOn), to = DMY(s.endsOn);
        const pm = {
          off: { label: vi ? 'Đã tắt' : 'Off', fg:'#9DA7BA', bg:'rgba(157,167,186,.128)', icon:'ph-fill ph-eye-slash' },
          always: { label: vi ? 'Đang chạy' : 'Live now', fg:'#6CC7B6', bg:'rgba(38,150,132,.16)', icon:'ph-fill ph-broadcast' },
          live: { label: FF.text(s.phaseLabel, g), fg:'#6CC7B6', bg:'rgba(38,150,132,.16)', icon:'ph-fill ph-broadcast' },
          scheduled: { label: FF.text(s.phaseLabel, g), fg:'#D8ECF8', bg:'rgba(182,217,252,.14)', icon:'ph-fill ph-calendar-dots' },
          ended: { label: FF.text(s.phaseLabel, g), fg:'#F0A07F', bg:'rgba(228,109,76,.14)', icon:'ph-fill ph-calendar-x' }
        }[s.phase] || { label: FF.text(s.phaseLabel, g), fg:'#9DA7BA', bg:'rgba(157,167,186,.128)', icon:'ph-fill ph-eye-slash' };
        const setSched = (key) => (e) => {
          const v = String(e.target.value).slice(0, 5);
          this.setState({ shelves: st.shelves.map(x => x.id === s.id ? Object.assign({}, x, key === 'from' ? { startsOn: ISO(v, FF.now().getFullYear()), fromText:v } : { endsOn: ISO(v, FF.now().getFullYear()), toText:v }) : x) });
          clearTimeout(this._sched);
          this._sched = setTimeout(async () => {
            const cur = this.state.shelves.filter(x => x.id === s.id)[0];
            try { await FF.patch('/admin/shelves/' + s.id, { startsOn: cur.startsOn, endsOn: cur.endsOn }); await this.reloadAdmin(); } catch (e2) { this.fail(e2); }
          }, 800);
        };
        return {
          name: FF.text(s.name, g), note: FF.text(s.note, g),
          swBg: s.enabled ? '#269684' : 'rgba(186,215,247,.2)',
          swJustify: s.enabled ? 'flex-end' : 'flex-start',
          from: s.fromText !== undefined ? s.fromText : from, to: s.toText !== undefined ? s.toText : to,
          setFrom: setSched('from'), setTo: setSched('to'),
          fromPh: 'dd/mm', toPh: 'dd/mm',
          fromTitle: vi ? 'Bắt đầu hiển thị (ngày/tháng)' : 'Starts showing (day/month)',
          toTitle: vi ? 'Ngừng hiển thị (ngày/tháng)' : 'Stops showing (day/month)',
          schLabel: pm.label, schFg: pm.fg, schBg: pm.bg, schIcon: pm.icon,
          preview: () => this.openShelfPreview(s.id),
          toggle: async () => {
            if (this.blocked()) return;
            try {
              await FF.patch('/admin/shelves/' + s.id, { enabled: !s.enabled });
              const name = FF.text(s.name, g);
              this.say(s.enabled ? (vi ? 'Đã ẩn ' + name : name + ' hidden') : (vi ? 'Đã bật ' + name : name + ' is live'));
              await this.reloadAdmin();
            } catch (e) { this.fail(e); }
          },
          items: s.items.map(it => ({
            title: it.title, meta: it.genre + (it.badge ? ' · ' + FF.text(it.badge.label, g) : ''),
            art: it.coverUrl ? 'url("' + it.coverUrl + '") center/cover no-repeat' : it.art,
            remove: async () => {
              if (this.blocked()) return;
              try {
                await FF.put('/admin/shelves/' + s.id + '/items', { eventIds: s.items.filter(x => x.id !== it.id).map(x => x.id) });
                this.say(vi ? 'Đã bỏ ' + it.title : it.title + ' removed');
                await this.reloadAdmin();
              } catch (e) { this.fail(e); }
            }
          }))
        };
      }),

      shelfPreviewOpen: !!st.shelfPrev,
      closeShelfPreview: () => this.setState({ shelfPrev:null }),
      shelfPreview: (() => {
        const s = st.shelves.filter(x => x.id === st.shelfPrev)[0];
        if (!s) return { name:'', when:'', note:'' };
        const from = DMY(s.startsOn), to = DMY(s.endsOn);
        return {
          name: FF.text(s.name, g),
          when: from && to ? (vi ? 'Hiển thị ' + from + ' → ' + to : 'Shows ' + from + ' → ' + to) : (vi ? 'Không giới hạn thời gian' : 'No date window'),
          note: s.enabled
            ? (vi ? 'Đúng thiết kế dãy này trên app và web — vị trí ngay dưới thanh tìm kiếm ở trang Khám phá.' : 'This is the real Explore row on app and web — it sits directly under the search bar.')
            : (vi ? 'Dãy đang tắt. Đây là hình dạng nó sẽ có khi bật.' : 'The shelf is off. This is how it would look once switched on.')
        };
      })(),
      shelfPreviewItems: (() => {
        const rows = st.shelfItems[st.shelfPrev];
        if (!rows) return [];
        return rows.map(it => ({
          title: it.title,
          meta: [FF.dayLabel(it.startsOn, g), it.venue ? it.venue.name : it.genre].filter(Boolean).join(' · '),
          art: it.coverUrl ? 'url("' + it.coverUrl + '") center/cover no-repeat' : it.art,
          tag: FF.text(it.tag, g)
        }));
      })(),

      auditActors: [
        { k:'all', label: vi ? 'Tất cả' : 'All actors', icon:'ph-bold ph-users-three' },
        { k:'admin', label: 'FeestFinder Admin', icon:'ph-bold ph-user-circle' },
        { k:'system', label: vi ? 'Hệ thống tự động' : 'Automatic checks', icon:'ph-bold ph-cpu' }
      ].map(f => {
        const on = st.auditActor === f.k;
        return { label:f.label, icon:f.icon,
          bg: on ? 'rgba(182,217,252,.14)' : 'transparent', bd: on ? '#B6D9FC' : 'rgba(186,215,247,.12)', fg: on ? '#D8ECF8' : '#9DA7BA',
          pick: () => this.setState({ auditActor:f.k }) };
      }),
      exportAudit: () => {
        this.say(vi ? 'Đang xuất sổ hoạt động 30 ngày · CSV' : 'Exporting the last 30 days · CSV');
        FF.download('/admin/audit.csv');
      },
      audit: st.audit
        .filter(a => st.auditActor === 'all' ? true : st.auditActor === 'system' ? a.actorType === 'system' : a.actorType !== 'system')
        .slice(0, 18).map((a) => {
        const key = String(a.seq);
        const open = !!st.auditOpen[key];
        const has = Array.isArray(a.diff) && a.diff.length > 0;
        const look = AICON[a.action] || { icon:'ph-fill ph-dot-outline', color:'#8A94A8' };
        return {
          time: FF.hhmm(a.at), icon: look.icon, color: look.color,
          text: FF.text(a.label, g), target: a.target.label,
          actor: FF.text(a.actor, g),
          iconBg: look.color === '#6CC7B6' ? 'rgba(38,150,132,.14)' : look.color === '#F4A3A3' ? 'rgba(224,74,74,.14)' : look.color === '#F0A07F' ? 'rgba(228,109,76,.14)' : look.color === '#B6D9FC' ? 'rgba(182,217,252,.14)' : look.color === '#7A55F6' ? 'rgba(102,58,243,.16)' : 'rgba(157,167,186,.128)',
          open: open && has,
          diff: has ? a.diff.map(d => ({ field:d.field, before:d.before, after:d.after })) : [],
          hash: (vi ? 'Không sửa được · ' : 'Tamper-evident · ') + a.hash,
          cursor: has ? 'pointer' : 'default',
          chev: has ? (open ? 'ph-bold ph-caret-up' : 'ph-bold ph-caret-down') : 'ph-bold ph-minus',
          chevFg: has ? '#8A94A8' : 'rgba(186,215,247,.2)',
          toggle: () => { if (!has) return; const x = Object.assign({}, st.auditOpen); x[key] = !open; this.setState({ auditOpen:x }); }
        };
      })

    };
  }
}
