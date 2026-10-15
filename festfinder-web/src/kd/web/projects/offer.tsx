'use client';
/**
 * A project page's action: "Đề nghị tham gia" opens a sheet to offer what the project asks for
 * (sponsor with a package, invest an amount, perform as one's artist profile, host it, run it
 * together); an offer already made shows instead; the owner gets "Quản lý".
 */
import { useEffect, useState } from 'react';
import { FF } from '@/runtime/ff';
import { COMMON, fill, pick, type Lang } from '../../copy';
import { useKd } from '../../runtime';
import { Button, Chip, LinkButton } from '../../ui/actions';
import { FieldError, FieldLabel, Input, Select, TextArea } from '../../ui/forms';
import { Sheet } from '../../ui/sheet';
import { PROJ } from './copy';
import { ANSWERS, OFFER_KINDS, OFFER_LABEL, type OfferKind, type Package, type Project } from './model';

export function OfferBox({ lang, slug, status, seeking, packages, currency }: {
  lang: Lang; slug: string; status: Project['status']; seeking: string[]; packages: Package[]; currency: string;
}) {
  const T = pick(PROJ, lang);
  const O = pick(OFFER_LABEL, lang);
  const kd = useKd();
  const [me, setMe] = useState<Pick<Project, 'mine' | 'myOffers'> | null>(null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!kd.user) { setMe(null); return; }
    FF.maybe(FF.get('/projects/' + encodeURIComponent(slug)), null).then((p: Project | null) => p && setMe({ mine: p.mine, myOffers: p.myOffers }));
  }, [kd.user, slug]);

  if (me?.mine) return <LinkButton tone="acc" href={`/p/${encodeURIComponent(slug)}/manage`}>{T.manage}</LinkButton>;
  if (status !== 'open') return status === 'closed' ? <span className="kd-s">{T.closed}</span> : null;
  const kinds = OFFER_KINDS.filter((k) => seeking.includes(ANSWERS[k]));
  return (
    <div className="flex flex-col items-start gap-2">
      {me?.myOffers?.length ? (
        <span className="kd-s">{me.myOffers.map((o) => fill(T.offered, { k: `${O[o.kind]} · ${o.status === 'accepted' ? T.accepted : T.waiting}` })).join(' · ')}</span>
      ) : null}
      <Button tone="acc" onClick={() => { if (kd.requireSignIn()) setOpen(true); }}>{T.offer}</Button>
      {open ? (
        <OfferSheet lang={lang} slug={slug} kinds={kinds} packages={packages} currency={currency}
          onClose={(sent) => {
            setOpen(false);
            if (sent) FF.maybe(FF.get('/projects/' + encodeURIComponent(slug)), null).then((p: Project | null) => p && setMe({ mine: p.mine, myOffers: p.myOffers }));
          }} />
      ) : null}
    </div>
  );
}

function OfferSheet({ lang, slug, kinds, packages, currency, onClose }: {
  lang: Lang; slug: string; kinds: OfferKind[]; packages: Package[]; currency: string; onClose: (sent: boolean) => void;
}) {
  const T = pick(PROJ, lang);
  const C = pick(COMMON, lang);
  const O = pick(OFFER_LABEL, lang);
  const kd = useKd();
  const [kind, setKind] = useState<OfferKind>(kinds[0] ?? 'sponsor');
  const [orgName, setOrgName] = useState('');
  const [packageId, setPackageId] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const artist = kd.session?.craft === 'artist' && kd.session?.roles?.artist === 'active';
  const send = async () => {
    setBusy(true); setErr('');
    try {
      const out = (await FF.post(`/projects/${encodeURIComponent(slug)}/offers`, {
        kind, orgName, message, packageId: kind === 'sponsor' && packageId ? packageId : null,
        amount: (kind === 'sponsor' || kind === 'invest') && amount ? Number(amount.replace(/\D/g, '')) : null,
      })) as { message: unknown };
      kd.toast(FF.text(out.message, lang));
      onClose(true);
    } catch (e) { setErr(FF.errorText(e, lang)); setBusy(false); }
  };
  return (
    <Sheet title={T.offer} closeLabel={C.close} onClose={() => onClose(false)}>
      <form className="flex flex-col gap-3 pt-1" onSubmit={(e) => { e.preventDefault(); send(); }}>
        <fieldset className="flex flex-col gap-2">
          <legend className="kd-flabel mb-2">{T.offerAs}</legend>
          <div className="flex flex-wrap gap-2">
            {kinds.map((k) => <Chip key={k} on={kind === k} onClick={() => setKind(k)}>{O[k]}</Chip>)}
          </div>
        </fieldset>
        {kind === 'perform' && !artist ? <p className="kd-s">{T.performNeedsArtist}</p> : null}
        {kind === 'sponsor' || kind === 'venue' ? (
          <>
            <FieldLabel htmlFor="po-org">{T.orgName}</FieldLabel>
            <Input id="po-org" value={orgName} onChange={(e) => setOrgName(e.target.value)} maxLength={120} required />
          </>
        ) : null}
        {kind === 'sponsor' && packages.length ? (
          <>
            <FieldLabel htmlFor="po-pkg">{T.package}</FieldLabel>
            <Select id="po-pkg" value={packageId} onChange={(e) => setPackageId(e.target.value)}>
              <option value="">{T.noPackage}</option>
              {packages.map((k) => <option key={k.id} value={k.id}>{k.title}</option>)}
            </Select>
          </>
        ) : null}
        {kind === 'sponsor' || kind === 'invest' ? (
          <>
            <FieldLabel htmlFor="po-amount">{fill(T.amount, { c: currency })}</FieldLabel>
            <Input id="po-amount" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </>
        ) : null}
        <FieldLabel htmlFor="po-msg">{T.message}</FieldLabel>
        <TextArea id="po-msg" rows={4} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={2000} />
        <FieldError>{err}</FieldError>
        <Button type="submit" tone="acc" disabled={busy || (kind === 'perform' && !artist)}>{T.send}</Button>
      </form>
    </Sheet>
  );
}
