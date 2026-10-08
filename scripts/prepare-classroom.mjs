import { mkdir, readFile, writeFile } from 'node:fs/promises';
// Keep the conventional Workers Builds deploy command and older configured commands working.
const config = JSON.parse(await readFile(new URL('../wrangler.json', import.meta.url), 'utf8'));
await mkdir(new URL('../dist/server/', import.meta.url), { recursive: true });
await writeFile(new URL('../dist/server/wrangler.json', import.meta.url), JSON.stringify({
  ...config,
  main: '../../cloudflare/classroom-worker.ts',
  assets: { ...config.assets, directory: '../../docs' },
}, null, 2) + '\n');
