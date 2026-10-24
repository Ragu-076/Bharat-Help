import { createApp } from './app.js';
import { recordCount, catalogVersion } from './recordStore.js';

const port = Number(process.env.PORT || 3001);
const host = process.env.HOST || '127.0.0.1';
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be between 1 and 65535.');
const server = createApp().listen(port, host, () => {
  console.log(`Bharat Help API: http://${host}:${port} (${recordCount} curated source records; catalog ${catalogVersion})`);
});
server.on('error', (error) => { console.error(`Unable to start API: ${error.message}`); process.exitCode = 1; });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close());
