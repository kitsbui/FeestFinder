/**
 * Entry point on Vercel. Its Fastify preset runs the first of app, index, server, src/app,
 * src/index, src/server that imports fastify. src/app.ts only builds the app, so this file
 * sends the preset to the real server. The type-only import is what the preset looks for.
 */
import type {} from 'fastify';
import './src/server.ts';
