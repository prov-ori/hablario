import { mkdir, readFile, readdir, writeFile, copyFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';

const output = resolve('dist');
const generated = ['index.html', 'styles.css', 'config.js'];
await mkdir(output, { recursive: true });
for (const file of generated) {
  await copyFile(resolve('public', file), resolve(output, file));
}
for (const file of await readdir('src')) {
  if (!file.endsWith('.ts')) continue;
  const input = await readFile(resolve('src', file), 'utf8');
  const name = file.replace(/\.ts$/, '.js');
  await writeFile(resolve(output, name), stripTypeScriptTypes(input).replace(/from (["'])(\.\/[\w-]+)\.ts\1/g, "from '$2.js'"));
  generated.push(name);
}
const recordings = (await readdir('public/audio').catch(error => {
  if (error.code === 'ENOENT') return [];
  throw error;
})).filter(file => /^[a-z0-9-]+\.mp3$/.test(file));
await mkdir(resolve(output, 'audio'), { recursive: true });
for (const file of recordings) {
  const path = 'audio/' + file;
  await copyFile(resolve('public', path), resolve(output, path));
  generated.push(path);
}
await writeFile(resolve(output, 'audio-manifest.js'), 'export default ' + JSON.stringify(recordings) + ';\n');
generated.push('audio-manifest.js');

if (process.argv.includes('--pages')) {
  if (recordings.length) await mkdir(resolve('audio'), { recursive: true });
  const digest = createHash('sha256');
  const assets = new Map();
  for (const file of generated) {
    const contents = await readFile(resolve(output, file));
    assets.set(file, contents);
    digest.update(contents);
  }
  const version = '?v=' + digest.digest('hex').slice(0, 12);
  for (const [file, contents] of assets) {
    if (file === 'index.html') {
      await writeFile(resolve(file), contents.toString().replace(/(\.\/(?:styles\.css|config\.js|app\.js))"/g, '$1' + version + '"'));
    } else if (file.endsWith('.js') && file !== 'config.js') {
      await writeFile(resolve(file), contents.toString().replace(/(['"])(\.\/[a-z-]+\.js)\1/g, '$1$2' + version + '$1'));
    } else {
      await writeFile(resolve(file), contents);
    }
  }
  await writeFile(resolve('.nojekyll'), '');
}

