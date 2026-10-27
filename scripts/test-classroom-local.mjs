// Run integration checks against an isolated, in-process Cloudflare runtime.
import { createRequire } from 'node:module';
import { realpathSync, readFileSync, mkdirSync } from 'node:fs';
import { createPrivateKey, createPublicKey } from 'node:crypto';
const require = createRequire(realpathSync(new URL('../node_modules/wrangler/package.json', import.meta.url)));
const { build } = require('esbuild');
const { Miniflare } = require('miniflare');
mkdirSync(new URL('../.wrangler/checks', import.meta.url), { recursive: true });
const outfile = new URL('../.wrangler/checks/worker.mjs', import.meta.url).pathname;
await build({ entryPoints: [new URL('../cloudflare/classroom-worker.ts', import.meta.url).pathname], bundle: true, platform: 'browser', format: 'esm', external: ['cloudflare:workers'], outfile });
const privateKey = createPrivateKey({ key: Buffer.from(readFileSync(new URL('../.env.teacher-access', import.meta.url), 'utf8').trim(), 'base64'), format: 'der', type: 'pkcs8' });
const publicKey = createPublicKey(privateKey).export({ format: 'der', type: 'spki' }).subarray(-32).toString('base64');
const runtime = new Miniflare({ modules: true, scriptPath: outfile, compatibilityDate: '2026-05-15', cf: false, durableObjects: { CLASSROOM: { className: 'Classroom', useSQLite: true } }, bindings: { STUDENT_ORIGIN: 'https://ivanporras01.github.io', TEACHER_PUBLIC_KEY: publicKey } });
const fetch = globalThis.fetch;
globalThis.fetch = (url, options) => runtime.dispatchFetch(url, options);
try { await import('./test-classroom.mjs'); }
finally { globalThis.fetch = fetch; await runtime.dispose(); }
