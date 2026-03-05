import http from 'node:http';
import { VERSION } from '@life-game/shared';

const PORT = parseInt(process.env['WS_PORT'] ?? '9001', 10);

const server = http.createServer((_req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ status: 'ok', version: VERSION }));
});

server.listen(PORT, () => {
  console.log(`Life Game server v${VERSION} listening on port ${PORT}`);
});
