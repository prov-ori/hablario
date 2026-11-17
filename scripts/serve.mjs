import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve('dist');
const port = Number(process.env.PORT || 4173);
const files = new Map([
  ['/', ['index.html', 'text/html']], ['/index.html', ['index.html', 'text/html']],
  ['/styles.css', ['styles.css', 'text/css']],
  ...['app', 'course', 'engine', 'account', 'config', 'recording', 'audio-manifest'].map(name => ['/' + name + '.js', [name + '.js', 'text/javascript']])
]);
createServer(async (request, response) => {
  const url = new URL(request.url || '/', 'http://localhost');
  const entry = files.get(url.pathname) ?? (/^\/audio\/[a-z0-9-]+\.mp3$/.test(url.pathname)
    ? [url.pathname.slice(1), 'audio/mpeg'] : undefined);
  if (!entry || !['GET', 'HEAD'].includes(request.method)) {
    response.writeHead(404).end();
    return;
  }
  const file = resolve(root, entry[0]);
  try {
    const { size } = await stat(file);
    response.writeHead(200, {
      'Content-Type': entry[1] + '; charset=utf-8', 'Content-Length': size, 'Cache-Control': 'no-cache'
    });
    if (request.method === 'HEAD') response.end();
    else createReadStream(file).pipe(response);
  } catch {
    response.writeHead(503).end('Run npm run build first.');
  }
}).listen(port, '127.0.0.1', () => console.log('Hablario: http://127.0.0.1:' + port));

