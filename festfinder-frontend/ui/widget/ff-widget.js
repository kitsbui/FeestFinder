/*
 * FeestFinder calendar widget (growth plan card 1): an organiser's upcoming nights on their own
 * website. Paste where the list should go:
 *
 *   <div data-ff-org="<slug>" data-ff-lang="vi" data-ff-theme="dark" data-ff-limit="6"></div>
 *   <script src="https://feestfinder.com/ui/widget/ff-widget.js" async></script>
 *
 * Reads /embed/organizers/<slug> (open to every site), draws inside a Shadow DOM so the page's
 * styles and ours never meet, loads no font and tracks nobody. data-ff-api points at another API
 * (tests, previews).
 */
(function () {
  var me = document.currentScript;
  var origin = me && me.src ? new URL(me.src).origin : 'https://feestfinder.com';
  var CSS =
    ':host{all:initial;display:block;font:15px/1.4 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}' +
    '.w{border-radius:14px;padding:6px 16px;background:var(--bg);color:var(--fg);border:1px solid var(--line)}' +
    '.d{--bg:#08090a;--fg:#f2f3f5;--mut:#a3a8b0;--line:#26292e;--acc:#E4F222}' +
    '.l{--bg:#fff;--fg:#111316;--mut:#5c626b;--line:#e3e5e8;--acc:#111316}' +
    'a{color:inherit;text-decoration:none}' +
    '.r{display:flex;gap:14px;align-items:center;padding:12px 0;border-bottom:1px solid var(--line);min-height:44px}' +
    '.r:hover .t{text-decoration:underline}' +
    '.dt{flex:none;width:58px;text-align:center;font-variant-numeric:tabular-nums}' +
    '.dt b{display:block;font-size:13px;color:var(--mut);font-weight:600}' +
    '.dt span{font-size:15px;font-weight:700}' +
    '.t{font-weight:650;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
    '.m{color:var(--mut);font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
    '.x{min-width:0;flex:1}' +
    '.f{display:block;padding:12px 0;font-size:13px;font-weight:650;color:var(--acc)}' +
    '.e{padding:12px 0;color:var(--mut);font-size:13px}';

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function draw(host) {
    if (host.__ff) return;
    host.__ff = true;
    var slug = host.getAttribute('data-ff-org');
    if (!slug) return;
    var lang = host.getAttribute('data-ff-lang') === 'en' ? 'en' : 'vi';
    var theme = host.getAttribute('data-ff-theme') === 'light' ? 'l' : 'd';
    var limit = Math.min(20, Math.max(1, parseInt(host.getAttribute('data-ff-limit') || '6', 10) || 6));
    var api = (host.getAttribute('data-ff-api') || origin).replace(/\/$/, '');
    var root = host.attachShadow ? host.attachShadow({ mode: 'open' }) : host;
    var style = el('style');
    style.textContent = CSS;
    var box = el('div', 'w ' + theme);
    box.setAttribute('lang', lang);
    root.appendChild(style);
    root.appendChild(box);
    fetch(api + '/embed/organizers/' + encodeURIComponent(slug) + '?lang=' + lang + '&limit=' + limit, { credentials: 'omit' })
      .then(function (r) { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
      .then(function (data) {
        var list = el('div');
        list.setAttribute('role', 'list');
        list.setAttribute('aria-label', data.organizer.name);
        (data.events || []).forEach(function (e) {
          var a = el('a', 'r');
          a.href = e.url;
          a.target = '_blank';
          a.rel = 'noopener';
          a.setAttribute('role', 'listitem');
          var dt = el('span', 'dt');
          var parts = String(e.dateLabel).split(' ');
          dt.appendChild(el('b', null, parts[0]));
          dt.appendChild(el('span', null, parts.slice(1).join(' ')));
          var x = el('span', 'x');
          x.appendChild(el('div', 't', e.title));
          x.appendChild(el('div', 'm', [e.timeLabel, e.place, e.price].filter(Boolean).join(' · ')));
          a.appendChild(dt);
          a.appendChild(x);
          list.appendChild(a);
        });
        if (!(data.events || []).length) list.appendChild(el('div', 'e', lang === 'vi' ? 'Chưa có sự kiện sắp tới' : 'No upcoming events'));
        box.appendChild(list);
        var all = el('a', 'f', data.all.label + ' →');
        all.href = data.all.url;
        all.target = '_blank';
        all.rel = 'noopener';
        box.appendChild(all);
      })
      .catch(function () { box.appendChild(el('div', 'e', 'FeestFinder')); });
  }

  function run() {
    var hosts = document.querySelectorAll('[data-ff-org]');
    for (var i = 0; i < hosts.length; i++) draw(hosts[i]);
  }
  // Pages that add a host later (a preview) ask again.
  window.FeestFinderWidget = { run: run };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();
