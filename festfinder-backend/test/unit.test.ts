import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { addWorkingDays, atVn, eventBounds, inQuietHours, quietHoursEnd, timeWindow, vnDate, weekendRange } from '../src/lib/time.ts';
import { buildVietQr, crc16, parseTlv } from '../src/lib/vietqr.ts';
import { imageInfo } from '../src/lib/image.ts';
import { normalizeVnPhone, maskPhone, searchNormalize, slugify } from '../src/lib/contact.ts';
import { toCsv } from '../src/lib/csv.ts';
import { eventScanKey, qrToken, readQrToken, verifyQrSignature } from '../src/services/tickets.ts';
import { qualityScore } from '../src/services/quality.ts';
import { findClashes } from '../src/presenters/timetable.ts';
import { hashPassword, verifyPassword } from '../src/lib/crypto.ts';
import { splitSql } from '../src/db/migrate.ts';

describe('Vietnam time', () => {
  it('finds the coming weekend from a Monday, and the current one on a Saturday', () => {
    assert.deepEqual(weekendRange('2026-09-14'), { from: '2026-09-18', to: '2026-09-20' });
    assert.deepEqual(weekendRange('2026-09-19'), { from: '2026-09-18', to: '2026-09-20' });
    assert.deepEqual(weekendRange('2026-09-20'), { from: '2026-09-18', to: '2026-09-20' });
  });

  it('builds the Explore windows', () => {
    assert.deepEqual(timeWindow('7days', '2026-09-14'), { from: '2026-09-14', to: '2026-09-21' });
    assert.deepEqual(timeWindow('month', '2026-09-14'), { from: '2026-09-14', to: '2026-09-30' });
  });

  it('treats a close before doors as the next morning', () => {
    const { startsAt, endsAt } = eventBounds('2026-09-19', '2026-09-19', '16:00', '02:00');
    assert.equal(startsAt.toISOString(), '2026-09-19T09:00:00.000Z');
    assert.equal(endsAt.toISOString(), '2026-09-19T19:00:00.000Z');
  });

  it('uses the local calendar date, not UTC', () => {
    assert.equal(vnDate(new Date('2026-09-14T18:30:00Z')), '2026-09-15');
  });

  it('skips weekends when settling payouts', () => {
    assert.equal(addWorkingDays('2026-09-19', 3), '2026-09-23');
  });

  it('holds messages from 23:00 to 08:00', () => {
    assert.equal(inQuietHours(atVn('2026-09-14', '23:30')), true);
    assert.equal(inQuietHours(atVn('2026-09-14', '07:59')), true);
    assert.equal(inQuietHours(atVn('2026-09-14', '08:00')), false);
    assert.equal(quietHoursEnd(atVn('2026-09-14', '23:30')).toISOString(), atVn('2026-09-15', '08:00').toISOString());
  });
});

describe('VietQR', () => {
  it('computes CRC-16/CCITT-FALSE', () => {
    assert.equal(crc16('123456789'), '29B1');
  });

  it('encodes bank, account, amount and note with a valid checksum', () => {
    const payload = buildVietQr({ bankBin: '970436', accountNo: '0071008842', amount: 1200000, purpose: 'FF-RAVO-4P Tiền vé' });
    const top = parseTlv(payload);
    assert.equal(top['00'], '01');
    assert.equal(top['01'], '12');
    assert.equal(top['53'], '704');
    assert.equal(top['54'], '1200000');
    assert.equal(top['58'], 'VN');
    const merchant = parseTlv(top['38']);
    assert.equal(merchant['00'], 'A000000727');
    assert.equal(merchant['02'], 'QRIBFTTA');
    assert.deepEqual(parseTlv(merchant['01']), { '00': '970436', '01': '0071008842' });
    assert.equal(parseTlv(top['62'])['08'], 'FF-RAVO-4P Tien ve');
    assert.equal(payload.slice(-4), crc16(payload.slice(0, -4)));
  });
});

describe('helpers', () => {
  it('reads PNG and JPEG dimensions from headers', () => {
    const png = Buffer.alloc(33);
    png.writeUInt32BE(0x89504e47, 0); png.write('IHDR', 12, 'ascii'); png.writeUInt32BE(1600, 16); png.writeUInt32BE(900, 20);
    assert.deepEqual(imageInfo(png), { mime: 'image/png', width: 1600, height: 900 });
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xc0, 0x00, 0x11, 0x08, 0x03, 0x84, 0x06, 0x40, 0x03, 0x01, 0x22, 0x00]);
    assert.deepEqual(imageInfo(jpeg), { mime: 'image/jpeg', width: 1600, height: 900 });
    assert.equal(imageInfo(Buffer.from('not an image')), null);
  });

  it('normalises Vietnamese phone numbers and masks them', () => {
    assert.equal(normalizeVnPhone('0903 118 224'), '+84903118224');
    assert.equal(normalizeVnPhone('+84 903.118.224'), '+84903118224');
    assert.equal(normalizeVnPhone('12345'), null);
    assert.equal(maskPhone('+84903118224'), '0903 ••• 224');
  });

  it('searches and slugs without diacritics', () => {
    assert.equal(searchNormalize('Thủ Đức'), 'thu duc');
    assert.equal(slugify('Những Thành Phố Mơ Màng'), 'nhung-thanh-pho-mo-mang');
  });

  it('escapes CSV and neutralises formulas', () => {
    const csv = toCsv(['a', 'b'], [['=SUM(A1)', 'x,"y"']]);
    assert.ok(csv.startsWith('﻿'));
    assert.ok(csv.includes(`'=SUM(A1),"x,""y"""`));
  });

  it('splits SQL scripts without breaking function bodies', () => {
    const parts = splitSql(`create table a (x int); -- note; here\ncreate function f() returns trigger language plpgsql as $$ begin raise exception 'a;b'; end $$;`);
    assert.equal(parts.length, 2);
    assert.ok(parts[1].includes(`'a;b'`));
  });

  it('hashes passwords with scrypt', async () => {
    const h = await hashPassword('festfinder123');
    assert.equal(await verifyPassword('festfinder123', h), true);
    assert.equal(await verifyPassword('wrong', h), false);
  });
});

describe('tickets & listings', () => {
  it('signs QR tokens per event so scanners can verify offline', () => {
    const token = qrToken('secret', 'event-1', 'FF-RAVO-7K2Q');
    const { code, sig } = readQrToken(token);
    assert.equal(code, 'FF-RAVO-7K2Q');
    assert.equal(verifyQrSignature(eventScanKey('secret', 'event-1'), code, sig!), true);
    assert.equal(verifyQrSignature(eventScanKey('secret', 'event-2'), code, sig!), false);
  });

  it('scores listing quality out of 100', () => {
    const full = qualityScore({
      title: 'Ravolution Music Festival 2026', genre: 'EDM', description: { en: 'x'.repeat(90), vi: '' }, logoUrl: 'https://a/l.png',
      coverUrl: 'https://a/c.jpg', venueResolved: true, entryMode: 'paid', priceFrom: 1200000, ticketUrl: 'https://ticketbox.vn/r',
      lineup: ['a', 'b', 'c'], eventUrl: 'https://festfinder.vn/e/r',
    });
    assert.equal(full.score, 100);
    assert.equal(full.band, 'strong');
    const thin = qualityScore({ title: 'Rave', genre: null, description: { en: '', vi: '' }, logoUrl: null, coverUrl: null,
      venueResolved: false, entryMode: 'paid', priceFrom: 0, ticketUrl: null, lineup: [], eventUrl: null });
    assert.equal(thin.score, 0);
    assert.equal(thin.band, 'at_risk');
    assert.equal(thin.checks.find((c) => c.key === 'cover')!.step, 1);
  });

  it('finds overlapping sets', () => {
    const t = (h: number, m: number) => atVn('2026-09-19', `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    const clashes = findClashes([
      { id: 'a', artist: 'Hoaprox', startsAt: t(20, 0), endsAt: t(21, 30) },
      { id: 'b', artist: 'SlimV', startsAt: t(19, 0), endsAt: t(20, 45) },
      { id: 'c', artist: 'Alan Walker', startsAt: t(22, 0), endsAt: t(23, 45) },
    ]);
    assert.equal(clashes.length, 1);
    assert.equal(clashes[0].minutes, 45);
    assert.equal(clashes[0].line.en, 'SlimV and Hoaprox overlap by 45 minutes');
  });
});
