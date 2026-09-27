import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { chromium, origin } from './browser-fixture.mjs';
import test from 'node:test';
import { rows, languages } from '../js/language-data.js';
import { extendTitleFont } from '../js/title-font.js';

test('Bundled title font covers every localized plaque heading without replacement glyphs', () => {
  const source = readFileSync(new URL('../js/hero-3d.js', import.meta.url), 'utf8');
  const headings = [...source.matchAll(/(?:title|subtitle): "([^"]+)"/g)].map(match => match[1]);
  const font = { data: JSON.parse(readFileSync(new URL('../js/vendor/fonts/helvetiker_bold.typeface.json', import.meta.url))) };
  font.data.glyphs.A._cachedOutline = ['cached base'];
  extendTitleFont(font, 'Á');
  assert.equal(font.data.glyphs['Á']._cachedOutline, undefined);
  assert.notEqual(font.data.glyphs['Á'].o, font.data.glyphs.A.o);
  for (const row of rows.filter(row => headings.includes(row[0].toUpperCase()))) {
    for (const text of row) {
      extendTitleFont(font, text.toUpperCase());
      for (const character of text.toUpperCase()) assert.ok(font.data.glyphs[character], character);
    }
  }
});

test('Language switching retains rendered 3D headings on all five plaque pages', async () => {
  const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
    page.on('pageerror', error => errors.push(error.message));
    for (const file of ['index','about','portfolio','services','social']) {
      await page.goto(`${origin}/${file}.html`);
      await page.waitForSelector('#hero-plaque.plaque-active');
      for (const [code] of languages) {
        await page.selectOption('#footer-language', code);
        await page.waitForFunction(() => document.querySelector('.hero-title-text')?.classList.contains('hidden-by-3d'));
        assert.equal(await page.locator('.localized-title').count(), 0, `${file} ${code}`);
        const geometry = await page.evaluate(async () => {
          const { FontLoader } = await import('/js/vendor/jsm/loaders/FontLoader.js');
          const { TextGeometry } = await import('/js/vendor/jsm/geometries/TextGeometry.js');
          const { extendTitleFont } = await import('/js/title-font.js');
          const font = await new FontLoader().loadAsync('/js/vendor/fonts/helvetiker_bold.typeface.json');
          return [...document.querySelectorAll('.hero-title-text,.hero-subtitle-text')].every(element => {
            const text = element.textContent.trim().toUpperCase();
            const g = new TextGeometry(text, { font: extendTitleFont(font, text), size: 1, depth: .1 });
            g.computeBoundingBox();
            const valid = g.attributes.position.count > 0 && Number.isFinite(g.boundingBox.max.x);
            g.dispose();
            return valid;
          });
        });
        assert.ok(geometry, `${file} ${code}: real text geometry`);
      }
    }
    await page.setViewportSize({ width: 844, height: 390 });
    await page.goto(origin + '/index.html');
    await page.waitForSelector('#footer-language');
    await page.selectOption('#footer-language', 'ro');
    assert.notEqual(await page.locator('.hero-title-text').evaluate(el => getComputedStyle(el).opacity), '0');
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});
