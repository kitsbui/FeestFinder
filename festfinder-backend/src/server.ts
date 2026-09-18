import { loadConfig } from './config.ts';
import { createContext } from './bootstrap.ts';
import { buildApp } from './app.ts';
import { startJobs } from './jobs.ts';

const config = loadConfig();
const ctx = await createContext(config);
const app = await buildApp(ctx);
const stopJobs = config.jobsEnabled ? startJobs(ctx) : () => {};

await app.listen({ port: config.port, host: config.host });
ctx.log(`API listening on ${config.publicBaseUrl} (${ctx.db.kind}${config.fixedNow ? `, clock fixed at ${config.fixedNow}` : ''})`);

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, async () => {
    stopJobs();
    await app.close();
    await ctx.db.close();
    process.exit(0);
  });
}
