import { mkdir, readFile, readdir, writeFile, copyFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import { resolve } from 'node:path';

const output = resolve('dist');
await mkdir(output, { recursive: true });
for (const file of ['index.html', 'styles.css']) {
  await copyFile(resolve('public', file), resolve(output, file));
}
for (const file of await readdir('src')) {
  if (!file.endsWith('.ts')) continue;
  const input = await readFile(resolve('src', file), 'utf8');
  await writeFile(resolve(output, file.replace(/\.ts$/, '.js')), stripTypeScriptTypes(input).replace(/from (["'])(\.\/(?:course|engine))\.ts\1/g, "from '$2.js'"));
}

