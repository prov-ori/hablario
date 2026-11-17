import { mkdir, readFile, readdir, writeFile, copyFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import { resolve } from 'node:path';

const output = resolve('dist');
const generated = ['index.html', 'styles.css'];
await mkdir(output, { recursive: true });
for (const file of generated) {
  await copyFile(resolve('public', file), resolve(output, file));
}
for (const file of await readdir('src')) {
  if (!file.endsWith('.ts')) continue;
  const input = await readFile(resolve('src', file), 'utf8');
  const name = file.replace(/\.ts$/, '.js');
  await writeFile(resolve(output, name), stripTypeScriptTypes(input).replace(/from (["'])(\.\/(?:course|engine))\.ts\1/g, "from '$2.js'"));
  generated.push(name);
}

if (process.argv.includes('--pages')) {
  for (const file of generated) await copyFile(resolve(output, file), resolve(file));
  await writeFile(resolve('.nojekyll'), '');
}

