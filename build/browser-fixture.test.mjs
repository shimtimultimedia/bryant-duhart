import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { origin } from './browser-fixture.mjs';

test('Isolated release server serves raw files and rejects missing or escaping paths', async () => {
  const response = await fetch(origin + '/');
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(await response.text(), await readFile(new URL('../index.html', import.meta.url), 'utf8'));
  const module = await fetch(origin + '/js/site-language.js');
  assert.equal(module.status, 200);
  assert.equal(module.headers.get('content-type'), 'application/javascript');
  assert.equal((await fetch(origin + '/missing-release-file')).status, 404);
  assert.equal((await fetch(origin + '/..%2foutside-release-root')).status, 403);
});
