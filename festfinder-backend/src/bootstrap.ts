import type { Config } from './config.ts';
import type { Ctx } from './context.ts';
import { openDb } from './db/index.ts';
import { migrate } from './db/migrate.ts';
import { fixedClock, systemClock } from './lib/time.ts';
import { ConsoleTransport } from './services/messaging.ts';
import { LocalStorage } from './services/storage.ts';
import { ClaudeGuide, DisabledGuide } from './services/guide.ts';
import { FacebookOAuth, InstagramOAuth, MockOAuth } from './services/oauth.ts';
import { checkLink } from './services/risk.ts';

/** Wires real dependencies from configuration. Tests build their own Ctx instead. */
export async function createContext(config: Config): Promise<Ctx> {
  const log = (msg: string) => console.log(`[festfinder] ${msg}`);
  const db = await openDb(config);
  await migrate(db, log);
  const hasAnthropic = !!(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN || process.env.ANTHROPIC_PROFILE);
  const oauthFor = (provider: 'fb' | 'ig') => {
    const id = process.env[provider === 'fb' ? 'FACEBOOK_APP_ID' : 'INSTAGRAM_APP_ID'];
    const secret = process.env[provider === 'fb' ? 'FACEBOOK_APP_SECRET' : 'INSTAGRAM_APP_SECRET'];
    if (id && secret) return provider === 'fb' ? new FacebookOAuth(id, secret) : new InstagramOAuth(id, secret);
    return config.env === 'production' ? null : new MockOAuth(provider);
  };
  return {
    config,
    db,
    clock: config.fixedNow ? fixedClock(config.fixedNow) : systemClock,
    transport: new ConsoleTransport(log),
    storage: new LocalStorage(config.uploadDir, config.publicBaseUrl),
    guide: config.aiGuideEnabled && hasAnthropic ? new ClaudeGuide(config.anthropicModel) : new DisabledGuide(),
    oauth: { fb: oauthFor('fb'), ig: oauthFor('ig') },
    checkLink,
    log,
  };
}
