// Preview the same Worker and Durable Object API used by the public classroom.
import { spawn } from 'node:child_process';
const portArg = process.argv.indexOf('--port');
const port = portArg >= 0 ? process.argv[portArg + 1] : process.env.PORT || '5173';
const child = spawn(process.execPath, ['node_modules/wrangler/bin/wrangler.js', 'dev', '--config', 'wrangler.json', '--local', '--ip', '0.0.0.0', '--port', port, '--inspector-port', '0'], { stdio: 'inherit', env: { ...process.env, CLOUDFLARE_CF_FETCH_ENABLED: 'false', WRANGLER_SEND_METRICS: 'false' } });
for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => child.kill(signal));
child.on('exit', code => process.exit(code ?? 1));
