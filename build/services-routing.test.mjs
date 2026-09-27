import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import test from 'node:test';
import { chromium, origin } from './browser-fixture.mjs';
import { languages } from '../js/language-data.js';

const destinations = {
  'web-design': '#bench-responsive', 'graphic-design': '#bench-graphic-design',
  video: '#bench-video', 'three-d': '#bench-model', audio: '#bench-audio',
  ai: '#bench-workflow', apps: '#bench-app', posters: '#bench-graphic-design',
  'ai-visuals': '#bench-ai-images', 'three-d-game': '#bench-game', direction: '',
};
test('Portfolio has no service detail pages, sitemap entries, or regeneration entries', () => {
  assert.equal(readdirSync(new URL('../', import.meta.url)).filter(f => /^service-.+\.html$/.test(f)).length, 0);
  for (const file of ['services.html', 'sitemap.xml', 'build/update_site_refs.py']) {
    assert.doesNotMatch(readFileSync(new URL('../' + file, import.meta.url), 'utf8'), /service-[a-z-]+\.html/);
  }
});
test('Every service links directly to the studio and preserves language and destination', async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.goto(origin + '/services.html');
    await page.waitForSelector('#footer-language');
    assert.equal(await page.locator('a[data-service]').count(), 11);
    for (const [code] of languages) {
      await page.selectOption('#footer-language', code);
      for (const [key, hash] of Object.entries(destinations)) {
        const url = new URL(await page.locator(`a[data-service="${key}"]`).getAttribute('href'));
        assert.equal(url.origin, 'https://shimtimultimedia.com');
        assert.equal(url.pathname, key === 'direction' ? '/contact.html' : '/services.html');
        assert.equal(url.hash, hash);
        assert.equal(url.searchParams.get('lang'), code === 'en' ? null : code);
      }
    }
  } finally { await browser.close(); }
});
