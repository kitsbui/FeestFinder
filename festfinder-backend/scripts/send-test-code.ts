/**
 * Sends one real one-time code to a phone with the providers configured in the environment, so
 * the owner can see delivery work before turning a way in on:
 *
 *   SMS_PROVIDER=esms ESMS_API_KEY=… ESMS_SECRET_KEY=… ESMS_BRANDNAME=… node scripts/send-test-code.ts +84912345678 sms
 *   ZALO_OA_APP_ID=… ZALO_OA_SECRET_KEY=… ZALO_OA_REFRESH_TOKEN=… ZALO_ZNS_OTP_TEMPLATE_ID=… node scripts/send-test-code.ts +84912345678 zalo
 *
 * It prints the code it sent (compare it with what arrives) and the provider's answer. Nothing is
 * written to any database: the Zalo token it refreshes is kept in memory only, so set the rotated
 * refresh token it prints as ZALO_OA_REFRESH_TOKEN before the API uses the Official Account.
 */
import { loadConfig } from '../src/config.ts';
import { EsmsTransport, MemoryTokenStore, TwilioSmsTransport, ZaloZnsTransport } from '../src/services/sms.ts';
import { normalizeVnPhone } from '../src/lib/contact.ts';
import { sixDigitCode } from '../src/lib/crypto.ts';

const [rawPhone, channel = 'sms'] = process.argv.slice(2);
const phone = rawPhone ? normalizeVnPhone(rawPhone) : null;
if (!phone || !['sms', 'zalo'].includes(channel)) {
  console.error('usage: node scripts/send-test-code.ts <phone> [sms|zalo]');
  process.exit(2);
}
const config = loadConfig();
const code = sixDigitCode();
const msg = { id: `test-${Date.now()}`, channel: channel as 'sms' | 'zalo', address: phone, template: 'otp', payload: { code, lang: 'vi' } };
const store = new MemoryTokenStore();
const transport = channel === 'zalo'
  ? config.zns ? new ZaloZnsTransport(config.zns, store) : null
  : config.sms?.provider === 'twilio' ? new TwilioSmsTransport(config.sms) : config.sms?.provider === 'esms' ? new EsmsTransport(config.sms) : null;
if (!transport) {
  console.error(channel === 'zalo' ? 'Zalo is not configured: set ZALO_OA_APP_ID, ZALO_OA_SECRET_KEY, ZALO_OA_REFRESH_TOKEN, ZALO_ZNS_OTP_TEMPLATE_ID' : 'SMS is not configured: set SMS_PROVIDER=twilio|esms and its keys');
  process.exit(2);
}
console.log(`sending code ${code} to ${phone} by ${channel}…`);
try {
  await transport.send(msg);
  console.log('sent: the provider accepted it; the code should arrive within a minute.');
  const t = store.tokens.get('zalo');
  if (t) console.log(`Zalo rotated its refresh token: set ZALO_OA_REFRESH_TOKEN=${t.refreshToken}`);
} catch (e) {
  console.error(`not sent: ${(e as Error).message}`);
  process.exit(1);
}
