import { loadConfig } from './config.ts';
import { createContext } from './bootstrap.ts';
import { buildApp } from './app.ts';
import { startJobs } from './jobs.ts';

const config = loadConfig();
const ctx = await createContext(config);
const app = await buildApp(ctx);
const stopJobs = config.jobsEnabled ? startJobs(ctx) : () => {};

// Not awaited. On Vercel the launcher takes over listen() and starts the server only once
// this module has finished loading, so awaiting it here would wait forever.
app.listen({ port: config.port, host: config.host }).then(
  () => ctx.log(`API listening on ${config.publicBaseUrl} (${ctx.db.kind}${config.fixedNow ? `, clock fixed at ${config.fixedNow}` : ''})`),
  (err: Error) => {
    ctx.log(`could not listen: ${err.message}`);
    process.exit(1);
  },
);

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, async () => {
    stopJobs();
    await app.close();
    await ctx.db.close();
    process.exit(0);
  });
}
