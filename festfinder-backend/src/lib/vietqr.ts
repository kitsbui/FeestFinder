/**
 * VietQR (NAPAS 247) payloads — EMVCo merchant-presented QR with a bank transfer to an account.
 * Every Vietnamese banking app, Momo and ZaloPay can scan these.
 */

const tlv = (id: string, value: string) => `${id}${String(value.length).padStart(2, '0')}${value}`;

/** CRC-16/CCITT-FALSE (poly 0x1021, init 0xFFFF), as EMVCo requires. */
export function crc16(data: string): string {
  let crc = 0xffff;
  for (const byte of Buffer.from(data, 'utf8')) {
    crc ^= byte << 8;
    for (let i = 0; i < 8; i++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export interface VietQrInput {
  bankBin: string;      // 6-digit NAPAS BIN, e.g. 970436 Vietcombank
  accountNo: string;
  amount?: number;      // VND; omit for a static QR
  purpose?: string;     // transfer note, shown to the payer and matched on reconciliation
}

export function buildVietQr({ bankBin, accountNo, amount, purpose }: VietQrInput): string {
  if (!/^\d{6}$/.test(bankBin)) throw new Error('bankBin must be 6 digits');
  if (!/^[0-9A-Za-z]{1,19}$/.test(accountNo)) throw new Error('accountNo must be 1–19 alphanumerics');
  const beneficiary = tlv('00', bankBin) + tlv('01', accountNo);
  const merchant = tlv('00', 'A000000727') + tlv('01', beneficiary) + tlv('02', 'QRIBFTTA');
  let payload =
    tlv('00', '01') +
    tlv('01', amount ? '12' : '11') +
    tlv('38', merchant) +
    tlv('53', '704') +
    (amount ? tlv('54', String(Math.round(amount))) : '') +
    tlv('58', 'VN');
  if (purpose) payload += tlv('62', tlv('08', asciiNote(purpose).slice(0, 25)));
  payload += '6304';
  return payload + crc16(payload);
}

/** Banks reject diacritics in transfer notes. */
export function asciiNote(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').replace(/[^0-9A-Za-z -]/g, '');
}

/** Parses the top-level TLVs back out — used by tests and by reconciliation. */
export function parseTlv(payload: string): Record<string, string> {
  const out: Record<string, string> = {};
  let i = 0;
  while (i < payload.length) {
    const id = payload.slice(i, i + 2);
    const len = Number(payload.slice(i + 2, i + 4));
    out[id] = payload.slice(i + 4, i + 4 + len);
    i += 4 + len;
  }
  return out;
}

/** Common NAPAS BINs so clients can show a bank name. */
export const BANKS: Record<string, string> = {
  '970436': 'Vietcombank',
  '970415': 'VietinBank',
  '970418': 'BIDV',
  '970405': 'Agribank',
  '970407': 'Techcombank',
  '970422': 'MB Bank',
  '970432': 'VPBank',
  '970416': 'ACB',
  '970403': 'Sacombank',
  '970423': 'TPBank',
};
