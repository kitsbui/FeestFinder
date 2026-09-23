/*
 * Organizer mode: the business profile moderation verifies against, and the payout account.
 * Type and bank are picked from lists; the tax code is checked as it is typed.
 */
import { h, Fragment, useState, useEffect, t, tx, useFetch, patch, put, toast, errorText, store, useLeaveGuard, options } from '../core.js';
import { PageHeader, Button, Card, Field, Input, TextArea, Select, Combobox, Uploader, Pill, Spinner, ErrorBox, Icon, KV } from '../ui.js';
import { orgTypeOptions, bankOptions } from '../opts.js';

const FIELDS = ['name', 'type', 'website', 'legalName', 'taxCode', 'address', 'email', 'hotline', 'zalo', 'contactName', 'contactRole', 'logoUrl'];

export function OrgProfile() {
  const { data, error, loading, reload } = useFetch('/organizer/profile', [store.orgId]);
  const [f, setF] = useState(null);
  const [base, setBase] = useState('');
  const [bank, setBank] = useState({ bankBin: '', accountNo: '', accountName: '' });
  const [busy, setBusy] = useState(null);
  const [errors, setErrors] = useState({});
  useEffect(() => {
    if (!data) return;
    const next = Object.fromEntries(FIELDS.map((k) => [k, data[k] ?? '']));
    next.bioVi = data.bio?.vi ?? '';
    next.bioEn = data.bio?.en ?? '';
    setF(next);
    setBase(JSON.stringify(next));
  }, [data]);
  const dirty = f && JSON.stringify(f) !== base;
  useLeaveGuard(!!dirty);
  if (loading && !data) return h(Spinner);
  if (error) return h(ErrorBox, { error, onRetry: reload });
  if (!f) return null;
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }));
  const owner = data.myRole === 'owner';
  const tax = f.taxCode.replace(/[\s-]/g, '');

  const save = async () => {
    const e = {};
    if (!f.name.trim()) e.name = t('Cần tên thương hiệu', 'A brand name is required');
    if (f.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) e.email = t('Email chưa đúng định dạng', 'That email does not look right');
    if (tax && !/^\d{10,14}$/.test(tax)) e.taxCode = t('Mã số thuế gồm 10–14 chữ số', 'Tax codes are 10–14 digits');
    if (f.website && !/^https?:\/\/\S+\.\S+/.test(f.website.trim())) e.website = t('Link cần bắt đầu bằng https://', 'Links start with https://');
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy('profile');
    try {
      const body = Object.fromEntries(FIELDS.map((k) => [k, typeof f[k] === 'string' ? f[k].trim() : f[k]]));
      body.logoUrl = f.logoUrl || null;
      body.website = f.website.trim() || '';
      body.bio = { vi: f.bioVi, en: f.bioEn };
      const out = await patch('/organizer/profile', body);
      toast(tx(out.message));
      setBase(JSON.stringify(f));
    } catch (err) { toast(errorText(err), 'error'); } finally { setBusy(null); }
  };
  const saveBank = async () => {
    setBusy('bank');
    try { const out = await put('/organizer/bank', { ...bank, accountNo: bank.accountNo.replace(/\s/g, '') }); toast(tx(out.message)); setBank({ bankBin: '', accountNo: '', accountName: '' }); reload(true); } catch (err) { toast(errorText(err), 'error'); } finally { setBusy(null); }
  };

  return h(Fragment, null,
    h(PageHeader, {
      eyebrow: t('Nhà tổ chức · hồ sơ', 'Organizer · profile'), title: t('Hồ sơ doanh nghiệp', 'Business profile'),
      sub: t('Khán giả chỉ thấy phần thương hiệu; thông tin pháp lý và liên hệ dùng để đội FeestFinder xác minh.', 'Attendees see the brand block only; legal and contact details are for FeestFinder verification.'),
      actions: h(Fragment, null, data.verified ? h(Pill, { tone: 'ok', icon: 'seal-check' }, t('Đã xác minh', 'Verified')) : h(Pill, { tone: 'warn', icon: 'seal-warning' }, t('Chờ xác minh', 'Pending verification')),
        h(Button, { variant: 'cta', icon: 'floppy-disk', busy: busy === 'profile', disabled: !dirty, onClick: save }, dirty ? t('Lưu thay đổi', 'Save changes') : t('Đã lưu', 'Saved'))),
    }),
    h('div', { className: 'op-grid op-grid--main' },
      h('div', null,
        h(Card, { title: t('Thương hiệu', 'Brand'), icon: 'storefront', sub: t('Hiện công khai', 'Public') },
          h('div', { className: 'op-form-grid' },
            h(Field, { label: t('Tên thương hiệu', 'Brand name'), required: true, error: errors.name }, h(Input, { value: f.name, onChange: set('name'), maxLength: 80, invalid: !!errors.name })),
            h(Field, { label: t('Loại nhà tổ chức', 'Organizer type') }, h(Select, { value: f.type, onChange: set('type'), options: orgTypeOptions() })),
            h(Field, { label: t('Giới thiệu (tiếng Việt)', 'About (Vietnamese)'), className: 'is-wide', counter: [f.bioVi.length, 400], hint: t('Hai dòng khán giả đọc trước khi quyết định mua vé.', 'Two lines attendees read before they trust you with a ticket.') }, h(TextArea, { rows: 3, value: f.bioVi, onChange: set('bioVi'), maxLength: 400 })),
            h(Field, { label: t('Giới thiệu (tiếng Anh)', 'About (English)'), optional: true, className: 'is-wide' }, h(TextArea, { rows: 2, value: f.bioEn, onChange: set('bioEn'), maxLength: 400 })),
            h(Field, { label: 'Website', optional: true, error: errors.website }, h(Input, { value: f.website, onChange: set('website'), icon: 'globe', placeholder: 'https://', invalid: !!errors.website })),
            h(Field, { label: t('Logo', 'Logo'), optional: true }, h(Uploader, { purpose: 'logo', value: f.logoUrl || null, onChange: set('logoUrl'), compact: true })))),
        h(Card, { title: t('Pháp nhân', 'Legal entity'), icon: 'buildings', sub: t('Chỉ dùng cho kiểm duyệt', 'Moderation only') },
          h('div', { className: 'op-form-grid' },
            h(Field, { label: t('Tên đăng ký kinh doanh', 'Registered name'), className: 'is-wide' }, h(Input, { value: f.legalName, onChange: set('legalName'), placeholder: t('vd: Công ty TNHH …', 'e.g. Công ty TNHH …') })),
            h(Field, { label: t('Mã số thuế', 'Tax code'), error: errors.taxCode, hint: tax ? (/^\d{10,14}$/.test(tax) ? t(`✓ ${tax.length} chữ số`, `✓ ${tax.length} digits`) : t(`${tax.length} chữ số — cần 10 đến 14`, `${tax.length} digits — needs 10 to 14`)) : t('10 hoặc 13 chữ số (chi nhánh có gạch nối).', '10 or 13 digits (branches use a dash).') },
              h(Input, { value: f.taxCode, onChange: set('taxCode'), inputMode: 'numeric', placeholder: '0316548792', invalid: !!errors.taxCode })),
            h(Field, { label: t('Địa chỉ đăng ký', 'Registered address') }, h(Input, { value: f.address, onChange: set('address') })))),
        h(Card, { title: t('Liên hệ', 'Contact'), icon: 'address-book' },
          h('div', { className: 'op-form-grid' },
            h(Field, { label: t('Email doanh nghiệp', 'Business email'), error: errors.email }, h(Input, { type: 'email', value: f.email, onChange: set('email'), icon: 'envelope-simple', invalid: !!errors.email })),
            h(Field, { label: 'Hotline' }, h(Input, { value: f.hotline, onChange: set('hotline'), icon: 'phone', inputMode: 'tel', placeholder: '1900 …' })),
            h(Field, { label: 'Zalo OA', optional: true }, h(Input, { value: f.zalo, onChange: set('zalo') })),
            h(Field, { label: t('Người liên hệ', 'Contact person') }, h(Input, { value: f.contactName, onChange: set('contactName') })),
            h(Field, { label: t('Chức danh', 'Role'), optional: true }, h(Input, { value: f.contactRole, onChange: set('contactRole'), placeholder: t('vd: Trưởng phòng Marketing', 'e.g. Head of Marketing') }))))),
      h('div', null,
        h(Card, { title: t('Tài khoản nhận tiền', 'Payout account'), icon: 'bank' },
          data.bank ? h(KV, { cols: 1, items: [[t('Ngân hàng', 'Bank'), data.bank.bankName], [t('Số tài khoản', 'Account'), data.bank.accountMasked], [t('Chủ tài khoản', 'Holder'), data.bank.accountName], [t('Trạng thái', 'Status'), data.bank.verified ? h(Pill, { tone: 'ok', icon: 'check-circle' }, t('Đã xác minh', 'Verified')) : h(Pill, { tone: 'warn' }, t('Chờ chuyển thử 1.000₫', 'Awaiting a 1,000₫ test transfer'))]] }) : h('p', { className: 'op-card-text' }, t('Chưa có tài khoản nhận tiền.', 'No payout account yet.')),
          owner ? h('div', { className: 'op-bank-form' },
            h('div', { className: 'op-section-title' }, data.bank ? t('Đổi tài khoản', 'Change account') : t('Thêm tài khoản', 'Add an account')),
            h(Field, { label: t('Ngân hàng', 'Bank') }, h(Combobox, { value: bank.bankBin, options: bankOptions(), icon: 'bank', placeholder: t('Chọn ngân hàng', 'Pick a bank'), onChange: (v) => setBank((b) => ({ ...b, bankBin: v ?? '' })) })),
            h(Field, { label: t('Số tài khoản', 'Account number') }, h(Input, { value: bank.accountNo, onChange: (v) => setBank((b) => ({ ...b, accountNo: v.replace(/[^\d\s]/g, '') })), inputMode: 'numeric' })),
            h(Field, { label: t('Tên chủ tài khoản', 'Account holder'), hint: t('Viết hoa không dấu, đúng như trên ngân hàng.', 'Capitals without accents, as the bank shows it.') }, h(Input, { value: bank.accountName, onChange: (v) => setBank((b) => ({ ...b, accountName: v.toUpperCase() })) })),
            h(Button, { busy: busy === 'bank', disabled: !bank.bankBin || bank.accountNo.replace(/\s/g, '').length < 6 || bank.accountName.trim().length < 2, onClick: saveBank }, t('Lưu tài khoản', 'Save account'))) : h('p', { className: 'op-hint' }, t('Chỉ chủ tài khoản đổi được tài khoản nhận tiền.', 'Only the account owner can change the payout account.'))),
        h(Card, { title: t('Thành viên', 'Team'), icon: 'users-three' },
          h('ul', { className: 'op-people' }, data.members.map((m) => h('li', { key: m.id }, h('span', { className: 'op-people-name' }, m.name || m.email, h('small', null, m.email)), h(Pill, { tone: m.role === 'owner' ? 'violet' : 'neutral' }, m.role === 'owner' ? t('Chủ tài khoản', 'Owner') : t('Quản lý', 'Manager'))))),
          h('p', { className: 'op-hint' }, t('Cần thêm người? Nhắn đội FeestFinder trong Hộp thư.', 'Need to add someone? Message the FeestFinder team in the inbox.'))))));
}
