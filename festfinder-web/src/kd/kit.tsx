'use client';
/**
 * /kit: every Kính đêm part in every state, in the order of design/System.dc.html, for visual
 * review. Not a product page: production builds answer 404 unless FF_KIT=1, and it is in
 * neither the sitemap nor robots. The words here are placeholders, not data.
 */
import { useState } from 'react';
import {
  BellIcon, CalendarBlankIcon, ChartLineUpIcon, CompassIcon, GearIcon, HeartIcon, MagnifyingGlassIcon,
  MapTrifoldIcon, QrCodeIcon, ShareNetworkIcon, TicketIcon, TrayIcon, UserIcon, UsersIcon,
} from '@phosphor-icons/react/ssr';
import { familyOf, FAMILY_LABEL, type Family } from './genre';
import { useKd } from './runtime';
import { Button, Chip, IconButton } from './ui/actions';
import { BarRow, LineChart, StackedBars } from './ui/charts';
import { Clamp } from './ui/clamp';
import { FieldLabel, Input, Option, Segmented, Stepper, Switch, SwitchRow, TextArea } from './ui/forms';
import { Menu, MenuItem, MenuSeparator, Picker } from './ui/menu';
import { MomentsGrid } from './ui/moments';
import {
  Accordion, Art, Avatar, BarTrack, BoneCard, Card, DateBlock, Emblem, Marker, Stamp, Stat, StatRow, Status, Tag,
} from './ui/parts';
import { Sheet } from './ui/sheet';
import { Row, SideNav, Table, Tabs } from './ui/shell';
import { Logo } from './ui/logo';

const FAMILIES: Exclude<Family, 'free'>[] = ['fest', 'live', 'edm', 'cult'];

function Section({ n, title, aside, children }: { n: string; title: string; aside?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-baseline gap-4 border-t border-line-1 pt-4">
        <span className="kd-m">{n}</span>
        <h2 className="kd-d3">{title}</h2>
        {aside ? <span className="kd-s ml-auto hidden desk:inline">{aside}</span> : null}
      </div>
      {children}
    </section>
  );
}

function Swatch({ color, name, note, ring }: { color: string; name: string; note: string; ring?: boolean }) {
  return (
    <div className="grid grid-cols-[40px_minmax(0,1fr)] items-center gap-2.5">
      <span className="h-10 rounded-btn" style={{ background: color, boxShadow: ring ? 'inset 0 0 0 1px var(--color-line-2)' : undefined }} />
      <span className="kd-s"><span className="kd-hs">{name}</span> {note}</span>
    </div>
  );
}

export function Kit() {
  const kd = useKd();
  const [chip, setChip] = useState<string>('all');
  const [seg, setSeg] = useState<'tonight' | 'weekend' | 'month'>('tonight');
  const [time, setTime] = useState('weekend');
  const [tier, setTier] = useState('ga');
  const [qty, setQty] = useState(2);
  const [sw, setSw] = useState(true);
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState('upcoming');
  const [badge, setBadge] = useState<number | null>(0);
  const [stampFilter, setStampFilter] = useState<Family | null>(null);
  const [sheet, setSheet] = useState(false);
  const [pin, setPin] = useState(1);

  const days = Array.from({ length: 14 }, (_, i) => ({ label: `${i + 5}/9`, value: Math.round(120 + 80 * Math.sin(i / 2) + i * 18) }));

  return (
    <main className="kd-wrap flex flex-col gap-18 py-16 tab:py-18">
      <header className="grid grid-cols-1 gap-12 desk:grid-cols-2 desk:items-end">
        <div className="flex flex-col gap-5">
          <Logo height={28} className="self-start" />
          <span className="kd-m">Hệ thống thiết kế · Kính đêm</span>
          <h1 className="kd-d0">Kính đêm</h1>
        </div>
        <p className="kd-tl max-w-[560px]">Nền tối, đường kẻ mảnh. Màu nói một câu: turquoise là thông tin, dải turquoise → lime là hành động chính, trạng thái chỉ là chấm kèm chữ. Kính mờ chỉ đặt trên ảnh hoặc bản đồ.</p>
      </header>

      <Section n="01" title="Màu">
        <div className="grid grid-cols-1 gap-8 tab:grid-cols-2 desk:grid-cols-4">
          <div className="flex flex-col gap-2.5">
            <span className="kd-m">Bề mặt &amp; đường kẻ</span>
            <Swatch color="var(--color-surface-0)" name="surface-0" note="nền trang" ring />
            <Swatch color="var(--color-surface-1)" name="surface-1" note="nav, rail, panel, thẻ" ring />
            <Swatch color="var(--color-surface-2)" name="surface-2" note="ô nhập, chip, tile chữ" />
            <Swatch color="var(--color-line-1)" name="line-1" note="kẻ, viền panel" />
            <Swatch color="var(--color-line-2)" name="line-2" note="nút phụ, viền khi hover" />
          </div>
          <div className="flex flex-col gap-2.5">
            <span className="kd-m">Chữ</span>
            <Swatch color="var(--color-fg-1)" name="fg-1" note="tiêu đề, giá, tên" />
            <Swatch color="var(--color-fg-2)" name="fg-2" note="nội dung" />
            <Swatch color="var(--color-fg-3)" name="fg-3" note="meta, nhãn, icon trang trí" />
          </div>
          <div className="flex flex-col gap-2.5">
            <span className="kd-m">Thông tin &amp; hành động</span>
            <Swatch color="var(--color-info)" name="info" note="style, link, mục đang chọn, số đếm" />
            <Swatch color="var(--gradient-accent)" name="gradient-accent" note="một nút chính, tag Nổi bật, cờ logo" />
            <Swatch color="var(--color-lime)" name="lime" note="focus ring, glow" />
            <Swatch color="var(--color-inverse)" name="inverse" note="avatar, thẻ vé" />
          </div>
          <div className="flex flex-col gap-2.5">
            <span className="kd-m">Trạng thái · luôn kèm chữ</span>
            <Swatch color="var(--color-ok)" name="ok" note="ổn, đã đăng" />
            <Swatch color="var(--color-warn)" name="warn" note="lưu ý, sắp hết vé" />
            <Swatch color="var(--color-bad)" name="bad" note="lỗi, trực tiếp, hết" />
          </div>
        </div>
      </Section>

      <Section n="02" title="Ảnh và tile chữ" aside="Không có ảnh: tên đặt lớn; dưới 160px: hai chữ cái">
        <div className="grid grid-cols-1 gap-4 tab:grid-cols-2 desk:grid-cols-4">
          <div className="flex flex-col gap-2"><Art family="edm" title="Headsmasher 5" kicker="Hard techno" meta="T7 24.10" className="aspect-[16/10]" /><span className="kd-m">Thẻ 16:10</span></div>
          <div className="flex flex-col gap-2"><Art family="edm" title="Asia Tech produced by 2K21 Records Japan" kicker="Techno" meta="WOMB" className="aspect-[16/10]" /><span className="kd-m">Tên dài · 3 dòng</span></div>
          <div className="flex flex-col gap-2"><Art family="edm" title="Zamna" kicker="Melodic techno" meta="Bali" off className="aspect-[16/10]" /><span className="kd-m">Hết vé · off</span></div>
          <div className="flex items-end gap-3">
            <div className="flex flex-col gap-2"><Art family="edm" title="Headsmasher 5" kicker="Hard" className="size-19" /><span className="kd-m">Thumb</span></div>
            <div className="flex flex-col gap-2"><Art family="edm" title="Zamna Bali October 2026" className="size-12" /><span className="kd-m">48</span></div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          {FAMILIES.map((f) => <span key={f} className="kd-s flex items-center gap-2"><Marker family={f} />{FAMILY_LABEL[f].vi}</span>)}
          <span className="kd-s">Mọi thể loại cùng một màu thông tin: FeestFinder chỉ có EDM.</span>
        </div>
      </Section>

      <Section n="03" title="Chữ" aside="Noto Sans · một họ chữ cho chữ và số">
        <div className="flex flex-col">
          {[
            ['D0 · hero', <span key="d0" className="kd-d0">Tối nay</span>],
            ['D1 · tiêu đề trang', <span key="d1" className="kd-d1">Cuối tuần này có gì chơi?</span>],
            ['D2 · 32', <span key="d2" className="kd-d2">Tiêu đề sự kiện</span>],
            ['D3 · 24', <span key="d3" className="kd-d3">Hai sân khấu, mười tiếng</span>],
            ['Tiêu đề thẻ · 17', <span key="h" className="kd-h">Tên sự kiện trên thẻ</span>],
            ['Nội dung · 15', <span key="t" className="kd-t">Mở cửa 16:00, set cuối 02:00. Vé cho phép ra vào lại đến 22:00.</span>],
            ['Phụ · 13', <span key="s" className="kd-s">T7 19.09 · Địa điểm · Quận 7</span>],
            ['Nhãn · 11', <span key="m" className="kd-m text-fg-2">Cuối tuần · 28 sự kiện · ABC-26-4F8K</span>],
            ['Số · 13', <span key="mb" className="kd-mb kd-num">1.200.000₫</span>],
          ].map(([k, v]) => (
            <div key={k as string} className="grid grid-cols-1 items-baseline gap-2 border-b border-line-1 py-3.5 desk:grid-cols-[220px_minmax(0,1fr)] desk:gap-6">
              <span className="kd-m">{k}</span>
              {v}
            </div>
          ))}
        </div>
      </Section>

      <Section n="04" title="Thành phần">
        <div className="grid grid-cols-1 gap-10 desk:grid-cols-3">
          <div className="flex flex-col gap-3.5">
            <span className="kd-m">Nút · 4 giọng · bo 8 · cao 44 / 36 / 52</span>
            <div className="flex flex-wrap gap-2">
              <Button tone="acc" glow>Mua vé</Button>
              <Button>Chỉ đường</Button>
              <Button tone="ghost">Thêm lịch</Button>
              <Button tone="danger">Xoá</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" tone="acc">Đăng sự kiện</Button>
              <Button size="sm">Theo dõi</Button>
              <Button size="sm" tone="ghost">Lưu nháp</Button>
              <Button size="sm" disabled>Quay lại</Button>
            </div>
            <Button tone="acc" size="lg" block>Mua 2 vé · 2.400.000₫</Button>
            <span className="kd-s">Một nút chính mỗi màn hình; glow chỉ ở nút dẫn đầu trang.</span>
            <div className="flex gap-2">
              <IconButton label={saved ? 'Đã lưu' : 'Lưu'} line pressed={saved} onClick={() => setSaved((s) => !s)}>
                <HeartIcon size={20} weight={saved ? 'fill' : 'regular'} aria-hidden="true" />
              </IconButton>
              <IconButton label="Chia sẻ" line><ShareNetworkIcon size={20} aria-hidden="true" /></IconButton>
              <IconButton label="Tìm" size="sm"><MagnifyingGlassIcon size={18} aria-hidden="true" /></IconButton>
            </div>
          </div>
          <div className="flex flex-col gap-3.5">
            <span className="kd-m">Chip, nhãn, trạng thái</span>
            <div className="flex flex-wrap gap-2">
              <Chip on={chip === 'all'} onClick={() => setChip('all')}>Tất cả</Chip>
              {(['fest', 'edm', 'free'] as Family[]).map((f) => (
                <Chip key={f} family={f} on={chip === f} count={f === 'edm' ? 12 : 4} onClick={() => setChip(f)}>{FAMILY_LABEL[f].vi}</Chip>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <Tag>18+</Tag><Tag tone="line">Trong nhà</Tag><Tag tone="bone">Mới đăng</Tag><Tag tone="acc">Mới</Tag><Tag tone="featured">Nổi bật</Tag><Tag tone="bad">Sắp hết vé</Tag>
            </div>
            <div className="flex flex-wrap gap-4">
              <Status tone="ok">Đang đăng</Status><Status tone="warn">Đang duyệt</Status><Status tone="bad">Quá mốc</Status><Status tone="live">Trực tiếp</Status><Status>Nháp</Status>
            </div>
          </div>
          <div className="flex flex-col gap-3.5">
            <span className="kd-m">Ô nhập, đoạn chọn, lựa chọn</span>
            <Input icon={<MagnifyingGlassIcon size={18} aria-hidden="true" />} placeholder="Sự kiện, nghệ sĩ, địa điểm…" aria-label="Ví dụ ô tìm kiếm" />
            <Segmented label="Ví dụ đoạn chọn" value={seg} onChange={setSeg} options={[{ value: 'tonight', label: 'Tối nay' }, { value: 'weekend', label: 'Cuối tuần' }, { value: 'month', label: '30 ngày tới' }]} />
            <div role="radiogroup" aria-label="Hạng vé" className="flex flex-col gap-2">
              <Option checked={tier === 'ga'} onSelect={() => setTier('ga')} title="Phổ thông" price="1.200.000₫" note="Ra vào lại đến 22:00" status={<Status tone="warn">Còn ít</Status>} />
              <Option checked={tier === 'vip'} onSelect={() => setTier('vip')} title="VIP" price="2.500.000₫" note="Khu riêng" status={<Status tone="ok">Còn vé</Status>} />
              <Option checked={false} disabled title="Early bird" price="900.000₫" note="Đã đóng" status={<Status tone="bad">Hết vé</Status>} />
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="kd-flabel">Số lượng</span>
              <Stepper value={qty} max={6} onChange={setQty} label="Số lượng vé" decLabel="Bớt một" incLabel="Thêm một" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-10 desk:grid-cols-3">
          <div className="flex flex-col gap-3">
            <FieldLabel htmlFor="kit-name" hint="18 / 60">Tên sự kiện</FieldLabel>
            <Input id="kit-name" defaultValue="Đêm nhạc ngoài trời" />
            <FieldLabel htmlFor="kit-desc">Mô tả</FieldLabel>
            <TextArea id="kit-desc" rows={3} defaultValue="Hai sân khấu trên bãi cỏ." />
            <Input aria-label="Ô lỗi" invalid defaultValue="sai@" />
          </div>
          <div className="flex flex-col">
            <SwitchRow label="Nhắc trước show" note="Thông báo đẩy" checked={sw} onChange={setSw} />
            <SwitchRow label="Hồ sơ công khai" checked={!sw} onChange={(v) => setSw(!v)} />
            <div className="flex items-center gap-3 pt-3"><Switch checked={sw} onChange={setSw} label="Công tắc" /><span className="kd-s">{sw ? 'Bật' : 'Tắt'}</span></div>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <DateBlock top="T7" day={19} bottom="Th9" hi />
              <DateBlock top="CN" day={20} bottom="Th9" />
              <DateBlock top="T6" day={2} bottom="Th10" />
            </div>
            <StatRow>
              <Stat value="12,4K" label="Theo dõi" />
              <Stat value="41" label="Show" />
              <Stat value="6" label="Thành phố" />
            </StatRow>
            <div className="flex items-center gap-3">
              <Avatar name="Nguyễn Minh" size={48} />
              <Avatar name="Đêm Trắng" size={48} org />
              <Avatar name="Bạn" size={40} acc />
            </div>
          </div>
        </div>
      </Section>

      <Section n="05" title="Kính">
        <div className="grid grid-cols-1 gap-12 desk:grid-cols-2">
          <div className="relative h-[280px]">
            <Art family="edm" title="Headsmasher 5" kicker="Hard techno" meta="My House" className="absolute inset-0" />
            <div className="kd-glass absolute inset-x-4 bottom-4 flex flex-col gap-1.5 rounded-card p-4">
              <span className="kd-m text-fg-2">Công thức</span>
              <span className="kd-hs">rgba(15, 16, 17, .5) · blur 22 · saturate 170%</span>
            </div>
            <div className="absolute left-4 top-4 flex gap-2">
              <span className="kd-tag kd-tag-glass">18+</span>
              <span className="kd-tag kd-tag-glass"><span className="kd-pulse" />Còn 3 ngày</span>
            </div>
          </div>
          <div className="relative h-[280px] overflow-hidden rounded-card bg-map">
            <span className="kd-area absolute left-[20%] top-[18%]">Quận 1</span>
            <span className="kd-area absolute left-[62%] top-[70%]">Thủ Đức</span>
            {[{ x: 30, y: 40, t: '350K', f: 'live' }, { x: 55, y: 30, t: 'Miễn phí', f: 'free' }, { x: 70, y: 55, t: '1,2TR', f: 'edm' }].map((p, i) => (
              <button
                key={i}
                type="button"
                className={`kd-ppin kd-g-${p.f} absolute -translate-x-1/2 -translate-y-1/2`}
                style={{ left: p.x + '%', top: p.y + '%' }}
                aria-pressed={pin === i}
                onClick={() => setPin(i)}
              >
                <span className="kd-mk" aria-hidden="true" />{p.t}
              </button>
            ))}
            <span className="kd-me absolute left-[42%] top-[62%]" role="img" aria-label="Vị trí của bạn" />
          </div>
        </div>
      </Section>

      <Section n="06" title="Kích thước & chuyển động">
        <div className="flex flex-col">
          {[
            ['Bo góc', '4 nhãn · 6 nút, ô nhập · 8 đoạn chọn · 10 lựa chọn · 12 thẻ · 14 nhà tổ chức · 20 thanh tab · tròn cho chip'],
            ['Khoảng cách', '4 · 8 · 12 · 16 · 24 · 32 · 48 · 96'],
            ['Lề', '16 px · 32 px từ 760 px · vùng chạm tối thiểu 44 px'],
            ['Đổ bóng', 'Không, trừ glow của nút chính. Tách lớp bằng bề mặt và đường kẻ 1px.'],
            ['Chuyển động', '150 ms, cubic-bezier(.4, 0, .2, 1). Tắt khi bật giảm chuyển động.'],
          ].map(([k, v]) => (
            <div key={k} className="grid grid-cols-1 gap-1 border-b border-line-1 py-3 desk:grid-cols-[160px_minmax(0,1fr)] desk:gap-4">
              <span className="kd-m">{k}</span>
              <span className="kd-t">{v}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section n="07" title="Mở & gập" aside="Hiện thứ giúp quyết định ngay, phần tra cứu gập lại">
        <div className="grid grid-cols-1 items-start gap-10 desk:grid-cols-3">
          <div className="flex flex-col gap-3.5">
            <span className="kd-m">Dropdown · một lựa chọn</span>
            <h3 className="kd-d3">
              <Picker
                tone="inline"
                label="Thời gian"
                value={time}
                onChange={setTime}
                options={[
                  { value: 'tonight', label: 'Tối nay', aside: 8 },
                  { value: 'weekend', label: 'Cuối tuần này', aside: 28 },
                  { value: '7days', label: '7 ngày tới', aside: 41 },
                  { value: 'month', label: '30 ngày tới', aside: 96 },
                ]}
              />{' '}
              có gì chơi?
            </h3>
            <div className="flex flex-wrap gap-2">
              <Picker label="Sắp xếp" value="date" onChange={() => {}} options={[{ value: 'date', label: 'Gần nhất' }, { value: 'hype', label: 'Được quan tâm' }, { value: 'price', label: 'Giá thấp trước' }]} />
              <Picker tone="button" label="Thành phố" value="hcm" onChange={() => {}} options={[{ value: 'hcm', label: 'TP.HCM' }, { value: 'hn', label: 'Hà Nội' }, { value: 'dn', label: 'Đà Nẵng', aside: 'Sắp có', disabled: true }]} />
              <Menu label="Tài khoản" align="end" trigger={(p) => <button type="button" {...p} ref={p.ref} className="kd-ib kd-ib-line" aria-label="Tài khoản"><UserIcon size={20} aria-hidden="true" /></button>}>
                <MenuItem aside={2} onSelect={() => {}}>Vé của tôi</MenuItem>
                <MenuItem aside={14} onSelect={() => {}}>Đã lưu</MenuItem>
                <MenuSeparator />
                <MenuItem onSelect={() => kd.toast('Đã đăng xuất')}>Đăng xuất</MenuItem>
              </Menu>
            </div>
          </div>
          <div className="flex flex-col gap-3.5">
            <span className="kd-m">Accordion · nội dung phụ</span>
            <div className="border-t border-line-1">
              <Accordion summary="Đã diễn" aside="41 show" open name="kit-acc"><span className="kd-s">Danh sách chỉ hiện khi mở.</span></Accordion>
              <Accordion summary="Cài đặt" name="kit-acc"><span className="kd-s">Thông báo, quyền riêng tư, thành phố.</span></Accordion>
              <Accordion summary="Quy định vào cổng" small><span className="kd-s">Mang giấy tờ tuỳ thân.</span></Accordion>
            </div>
          </div>
          <div className="flex flex-col gap-3.5">
            <span className="kd-m">Cắt dòng · xem thêm</span>
            <Clamp lines={2} more="Xem thêm" less="Thu gọn" className="kd-t">
              Đêm nhạc ngoài trời thường niên lần thứ sáu. Hai sân khấu trên bãi cỏ, set cuối khép đêm lúc hai giờ sáng, vé cho phép ra vào lại đến 21:00. Mang theo áo mưa, khu ăn uống mở từ 16:00.
            </Clamp>
          </div>
        </div>
      </Section>

      <Section n="08" title="Điều hướng">
        <Tabs label="Ví dụ tab" current={tab} onSelect={setTab} items={[{ key: 'upcoming', label: 'Sắp diễn', count: 4 }, { key: 'past', label: 'Đã diễn', count: 41 }]} />
        <div className="grid grid-cols-1 gap-8 desk:grid-cols-2">
          <div className="overflow-hidden rounded-card shadow-[inset_0_0_0_1px_var(--color-line-1)]">
            <SideNav
              label="Ví dụ side nav"
              current="dash"
              items={[
                { key: 'dash', label: 'Bảng điều khiển', href: '/kit', icon: <ChartLineUpIcon size={18} aria-hidden="true" /> },
                { key: 'people', label: 'Người tham dự', href: '/kit', icon: <UsersIcon size={18} aria-hidden="true" /> },
                { key: 'door', label: 'Check-in', href: '/kit', icon: <QrCodeIcon size={18} aria-hidden="true" /> },
                { key: 'inbox', label: 'Hộp thư', href: '/kit', icon: <TrayIcon size={18} aria-hidden="true" />, count: 3 },
                { key: 'set', label: 'Cài đặt', href: '/kit', icon: <GearIcon size={18} aria-hidden="true" />, hideSmall: true },
              ]}
            />
          </div>
          <div className="relative h-[180px] overflow-hidden rounded-card">
            <Art family="edm" title="Zamna Bali" className="absolute inset-0" />
            <nav aria-label="Ví dụ thanh tab" className="kd-tabbar kd-glass !absolute">
              {[['Khám phá', CompassIcon], ['Bản đồ', MapTrifoldIcon], ['Đã lưu', HeartIcon], ['Vé', TicketIcon], ['Tôi', UserIcon]].map(([l, I], i) => {
                const Icon = I as typeof CompassIcon;
                return <a key={l as string} href="#" className="kd-tb" aria-current={i === 0 ? 'page' : undefined}><Icon size={22} aria-hidden="true" /><span>{l as string}</span></a>;
              })}
            </nav>
          </div>
        </div>
        <Table cols="minmax(0,2fr) 1fr 1fr 120px" head={['Sự kiện', 'Ngày', 'Trạng thái', '']} label="Ví dụ bảng">
          <Row cols="minmax(0,2fr) 1fr 1fr 120px" onClick={() => {}} current>
            <span role="cell" className="kd-hs kd-ell flex items-center gap-2"><Marker family="edm" />Đêm EDM ngoài trời</span>
            <span role="cell" className="kd-s kd-num">19/09</span>
            <span role="cell"><Status tone="ok">Đang đăng</Status></span>
            <span role="cell" className="kd-mb kd-num text-right">412 / 600</span>
          </Row>
          <Row cols="minmax(0,2fr) 1fr 1fr 120px">
            <span role="cell" className="kd-hs kd-ell flex items-center gap-2"><Marker family="edm" />Chợ đêm cuối tuần</span>
            <span role="cell" className="kd-s kd-num">27/09</span>
            <span role="cell"><Status>Nháp</Status></span>
            <span role="cell" className="text-right"><Button size="sm">Tiếp tục</Button></span>
          </Row>
        </Table>
      </Section>

      <Section n="09" title="Hồ sơ">
        <div className="grid grid-cols-1 gap-10 desk:grid-cols-3">
          <div className="flex flex-col gap-3">
            <span className="kd-m">Huy hiệu</span>
            <div className="grid grid-cols-3 gap-2">
              {[{ f: 'fest' as Family, n: null, t: 'Lần đầu' }, { f: 'edm' as Family, n: 10, t: 'Hộ chiếu 10' }, { f: 'cult' as Family, n: null, t: 'Đủ 4 gu' }].map((b, i) => (
                <button key={b.t} type="button" className="kd-bdg" aria-pressed={badge === i} onClick={() => setBadge(badge === i ? null : i)}>
                  <Emblem family={b.f} n={b.n} />
                  <span className="kd-hs">{b.t}</span>
                  {i === 2 ? <span className="kd-tag kd-tag-acc">Mới</span> : null}
                </button>
              ))}
            </div>
            {badge != null ? (
              <Card className="flex flex-col gap-1 p-4">
                <span className="kd-m">Đạt ngày 12/09/2026 · 18% fan có</span>
                <span className="kd-t">Đi sự kiện đầu tiên có vé quét tại cổng.</span>
              </Card>
            ) : null}
            <Accordion summary="Đang làm" aside="2" small>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3"><Emblem family="live" small off /><div className="flex flex-1 flex-col gap-1.5"><span className="kd-hs">Hộ chiếu 25</span><BarTrack value={11} max={25} label="11 / 25" /><span className="kd-s">11 / 25 sự kiện</span></div></div>
              </div>
            </Accordion>
          </div>
          <div className="flex flex-col gap-3">
            <span className="kd-m">Hộ chiếu</span>
            <div className="kd-hscroll">
              <Chip on={stampFilter == null} onClick={() => setStampFilter(null)}>Tất cả</Chip>
              {FAMILIES.map((f) => <Chip key={f} family={f} on={stampFilter === f} onClick={() => setStampFilter(f)}>{FAMILY_LABEL[f].vi}</Chip>)}
            </div>
            <div className="grid grid-cols-4 gap-2">
              {(['fest', 'live', 'edm', 'cult', 'edm', 'live', 'fest', 'cult'] as Family[]).map((f, i) => (
                <Stamp key={i} family={f} date={`${10 + i}.0${(i % 9) + 1}`} name={FAMILY_LABEL[f].vi} dim={stampFilter != null && stampFilter !== f} />
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <span className="kd-m">Khoảnh khắc</span>
            <MomentsGrid
              owner
              items={['fest', 'live', 'edm', 'cult', 'free'].map((genre, i) => ({ id: String(i), url: null, genre: genre === 'free' ? null : ['Festival', 'Indie', 'EDM', 'Culture'][i], caption: 'Khoảnh khắc ' + (i + 1) }))}
              onAdd={() => kd.toast('Thêm ảnh')}
              onRemove={() => kd.toast('Đã xoá ảnh')}
              labels={{ add: 'Thêm', open: 'Mở ảnh', close: 'Đóng', prev: 'Ảnh trước', next: 'Ảnh sau', remove: 'Xoá ảnh' }}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 desk:grid-cols-2">
          <BoneCard className="flex items-center gap-4 p-4">
            <DateBlock top="T7" day={19} bottom="Th9" hi />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="kd-m">Vé · Phổ thông</span>
              <span className="kd-h kd-ell">Vé trên thẻ Bone</span>
              <span className="kd-s">Mở cửa 16:00 · còn 3 ngày</span>
            </div>
            <QrCodeIcon size={40} aria-hidden="true" />
          </BoneCard>
          <Card className="flex flex-col gap-3 p-4">
            <span className="kd-m">Thẻ · hairline</span>
            <div className="flex items-center gap-3"><CalendarBlankIcon size={18} className="text-fg-3" aria-hidden="true" /><span className="kd-t">Icon trang trí dùng màu fg-3</span></div>
            <div className="flex items-center gap-3"><BellIcon size={18} className="text-fg-3" aria-hidden="true" /><span className="kd-s">Không có đổ bóng</span></div>
          </Card>
        </div>
      </Section>

      <Section n="10" title="Biểu đồ">
        <div className="grid grid-cols-1 gap-8 desk:grid-cols-2">
          <Card className="flex flex-col gap-4 p-5">
            <span className="kd-m">Lượt xem mỗi ngày</span>
            <LineChart label="Lượt xem mỗi ngày" points={days} format={(n) => n.toLocaleString('vi-VN')} />
          </Card>
          <Card className="flex flex-col gap-4 p-5">
            <span className="kd-m">Sự kiện mỗi tuần theo thể loại</span>
            <StackedBars
              lang="vi"
              label="Sự kiện mỗi tuần theo thể loại"
              weeks={['T1', 'T2', 'T3', 'T4', 'T5', 'T6'].map((l, i) => ({ label: l, values: { fest: 3 + (i % 3), live: 6 + i, edm: 4 + ((i * 2) % 5), cult: 2 + (i % 4) } }))}
            />
          </Card>
        </div>
        <div className="grid grid-cols-1 gap-4 desk:grid-cols-3">
          <BarRow label="Quận 1" value={48} max={60} />
          <BarRow label="Thủ Đức" value={22} max={60} family="edm" />
          <BarRow label="Quận 7" value={9} max={60} family={familyOf('Food')} />
        </div>
      </Section>

      <Section n="11" title="Lớp nổi">
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setSheet(true)}>Mở tấm</Button>
          <Button onClick={() => kd.toast('Đã lưu')}>Thông báo</Button>
          <Button onClick={() => kd.toast('Đã duyệt · Sự kiện', { label: 'Hoàn tác', run: () => kd.toast('Đã hoàn tác') })}>Thông báo + hoàn tác</Button>
          <Button onClick={() => kd.openSignIn()}>Đăng nhập</Button>
        </div>
        {sheet ? (
          <Sheet title="Tấm đáy" closeLabel="Đóng" onClose={() => setSheet(false)}>
            <div className="flex flex-col gap-3 pt-2">
              <p className="kd-t">Trên điện thoại là tấm đáy; từ 760 px là thẻ giữa màn hình.</p>
              <Button tone="acc" block onClick={() => setSheet(false)}>Xong</Button>
            </div>
          </Sheet>
        ) : null}
      </Section>
    </main>
  );
}
