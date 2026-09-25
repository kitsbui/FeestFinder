/**
 * Checks a database URL the way the API connects with it, before it goes into a deployment.
 * Reads DATABASE_URL, or asks for it without echoing. Prints what it found and whether the
 * connection works, never the password.
 *
 *   npm run db:check
 */
import pg from 'pg';
import { poolConfig } from '../src/db/index.ts';

function askHidden(question: string): Promise<string> {
  return new Promise((resolve) => {
    process.stdout.write(question);
    const stdin = process.stdin;
    let value = '';
    stdin.setRawMode?.(true);
    stdin.resume();
    stdin.setEncoding('utf8');
    const onData = (chunk: string) => {
      for (const ch of chunk) {
        if (ch === '\r' || ch === '\n') {
          stdin.setRawMode?.(false);
          stdin.pause();
          stdin.off('data', onData);
          process.stdout.write('\n');
          return resolve(value);
        }
        if (ch === '\u0003') process.exit(130);
        if (ch === '\u007f') value = value.slice(0, -1);
        else value += ch;
      }
    };
    stdin.on('data', onData);
  });
}

const url = process.env.DATABASE_URL || (await askHidden('Paste the database URL (hidden): '));
const problems: string[] = [];
if (url !== url.trim()) problems.push('spaces or a line break at the start or end');
if (/^["']|["']$/.test(url.trim())) problems.push('quotes around the URL');
let parsed: URL;
try {
  parsed = new URL(url.trim());
} catch {
  console.log('Not a URL. It should look like postgresql://USER:PASSWORD@HOST:6543/postgres');
  process.exit(1);
}
const password = decodeURIComponent(parsed.password);
if (!password) problems.push('no password');
if (/\[|\]|YOUR-PASSWORD/i.test(password)) problems.push('the password still has [ ] or YOUR-PASSWORD in it');
console.log(`user ${decodeURIComponent(parsed.username)}, host ${parsed.hostname}, port ${parsed.port || 5432}, database ${parsed.pathname.slice(1)}, password ${password.length} characters`);
for (const p of problems) console.log(`problem: ${p}`);

const pool = new pg.Pool(poolConfig(url.trim()));
try {
  const r = await pool.query<{ who: string }>('select current_user as who');
  console.log(`OK: connected as ${r.rows[0].who}. Put this exact URL in DATABASE_URL.`);
} catch (e) {
  console.log(`Could not connect: ${(e as Error).message}`);
  process.exitCode = 1;
} finally {
  await pool.end();
}
