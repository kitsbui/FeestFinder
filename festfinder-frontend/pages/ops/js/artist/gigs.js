/*
 * Artist mode: gigs the artist reports. Each one is matched against the catalogue like an
 * import: it joins the event already listed, or waits for a moderator as a new listing.
 * Nothing here publishes, and the organiser decides who is on their lineup.
 */
import { h, Fragment, useState, t, post, useFetch, toast, errorText, tx, day } from '../core.js';
import { PageHeader, Button, Card, Field, Input, Select, DateInput, ChipsInput, Pill, Spinner, ErrorBox, Empty, DataTable, StatusPill } from '../ui.js';
import { cityOptions } from '../opts.js';

const blank = () => ({ title: '', startsOn: '', startTime: '', city: 'ho-chi-minh', venueName: '', address: '', ticketUrl: '', with: [] });

export function ArtistGigs() {
  const { data, error, loading, reload } = useFetch('/me/artist/gigs');
  const [f, setF] = useState(blank);
  const [busy, setBusy] = useState(false);
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }));
  const timeOk = !f.startTime || /^([01]\d|2[0-3]):[0-5]\d$/.test(f.startTime);
  const ok = f.title.trim().length >= 3 && f.startsOn && f.city && f.venueName.trim().length >= 2 && timeOk;
  const send = async () => {
    setBusy(true);
    try {
      const out = await post('/me/artist/gigs', {
        title: f.title.trim(), startsOn: f.startsOn, startTime: f.startTime || null, city: f.city, venueName: f.venueName.trim(),
        address: f.address.trim() || null, ticketUrl: f.ticketUrl.trim() || null, with: f.with,
      });
      toast(tx(out.message));
      setF(blank());
      reload(true);
    } catch (e) { toast(errorText(e), 'error'); } finally { setBusy(false); }
  };
  const columns = [
    { key: 'gig', label: t('Lịch diễn', 'Gig'), width: 260, render: (r) => h('div', null,
      r.event ? h('a', { href: `/e/${r.event.slug}`, target: '_blank', rel: 'noopener' }, r.event.title) : h('strong', null, r.report.title),
      h('div', { className: 'op-cell-sub' }, [day(r.event?.startsOn ?? r.report.startsOn), r.report.venueName].filter(Boolean).join(' · '))) },
    { key: 'state', label: t('Trạng thái', 'Status'), width: 160, render: (r) => r.event ? h(StatusPill, { status: r.event.status }) : h(Pill, { tone: 'danger' }, t('Không nhận', 'Not taken')) },
    { key: 'lineup', label: t('Lineup', 'Lineup'), width: 200, render: (r) => !r.event ? null
      : r.onLineup ? h(Pill, { tone: 'ok', icon: 'check' }, t('Có tên bạn', 'You are on it'))
      : h(Pill, { tone: 'warn', icon: 'hourglass' }, t('Chờ BTC thêm tên', 'Waiting for the organiser')) },
  ];
  return h(Fragment, null,
    h(PageHeader, { title: t('Lịch diễn', 'Gigs') }),
    h(Card, { title: t('Báo lịch diễn', 'Report a gig'), icon: 'calendar-plus' },
      h('div', { className: 'op-form-grid' },
        h(Field, { label: t('Tên sự kiện', 'Event name'), required: true, className: 'is-wide' }, h(Input, { value: f.title, onChange: set('title') })),
        h(Field, { label: t('Ngày', 'Date'), required: true }, h(DateInput, { value: f.startsOn, onChange: set('startsOn') })),
        h(Field, { label: t('Giờ bắt đầu', 'Start time'), optional: true, hint: 'HH:MM', error: timeOk ? null : 'HH:MM' }, h(Input, { value: f.startTime, onChange: set('startTime'), placeholder: '22:00', invalid: !timeOk })),
        h(Field, { label: t('Thành phố', 'City'), required: true }, h(Select, { value: f.city, onChange: (v) => set('city')(v || 'ho-chi-minh'), options: cityOptions() })),
        h(Field, { label: t('Địa điểm', 'Venue'), required: true }, h(Input, { value: f.venueName, onChange: set('venueName') })),
        h(Field, { label: t('Địa chỉ', 'Address'), optional: true, className: 'is-wide' }, h(Input, { value: f.address, onChange: set('address') })),
        h(Field, { label: t('Link vé hoặc sự kiện', 'Ticket or event link'), optional: true, className: 'is-wide' }, h(Input, { value: f.ticketUrl, onChange: set('ticketUrl'), icon: 'link', placeholder: 'https://' })),
        h(Field, { label: t('Diễn cùng', 'Playing with'), optional: true, className: 'is-wide' }, h(ChipsInput, { value: f.with, onChange: set('with'), max: 30 }))),
      h('div', { className: 'op-row-actions', style: { marginTop: 14 } }, h(Button, { variant: 'cta', icon: 'paper-plane-tilt', busy, disabled: !ok, onClick: send }, t('Gửi', 'Send')))),
    error ? h(ErrorBox, { error, onRetry: reload }) : loading && !data ? h(Spinner)
      : h(DataTable, { columns, rows: data.items, minWidth: 640, empty: h(Empty, { icon: 'calendar-blank', title: t('Chưa báo lịch diễn nào', 'No gigs reported yet') }) }));
}
