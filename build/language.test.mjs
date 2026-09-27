import assert from 'node:assert/strict';
import { chromium, origin } from './browser-fixture.mjs';
import test from 'node:test';
import * as catalog from '../js/language-data.js';
test('Offline catalog has exactly thirteen complete columns', () => {
  assert.equal(catalog.languages.length, 13);
  for (const row of catalog.rows) assert.equal(row.length, 13, row[0]);
  for (const row of catalog.rows) assert.ok(row.every(value => typeof value === 'string' && value.trim()), row[0]);
});

test('Invalid and unavailable local storage fall back safely to English', async () => {
  const browser = await chromium.launch();
  try {
    for (const unavailable of [false, true]) {
      const page = await browser.newPage();
      await page.addInitScript(unavailable => {
        if (unavailable) Object.defineProperty(window, 'localStorage', { get() { throw new Error('Unavailable'); } });
        else localStorage.setItem('bd-portfolio-language', 'invalid');
      }, unavailable);
      await page.goto(origin + '/about.html');
      await page.waitForSelector('#footer-language');
      assert.equal(await page.locator('#footer-language').inputValue(), 'en');
      await page.selectOption('#footer-language', 'de');
      assert.equal(await page.locator('html').getAttribute('lang'), 'de');
      await page.close();
    }
  } finally { await browser.close(); }
});
test('Footer languages restore English, persist, and fit all layouts', async () => {
  const browser = await chromium.launch();
  try {
    for (const [width, height] of [[390,844],[768,1024],[1024,768],[1366,768],[1920,1080],[844,390],[5119,1304]]) {
      const page = await browser.newPage({ viewport: { width, height }, reducedMotion: 'reduce' });
      await page.goto(origin + '/contact.html');
      await page.waitForSelector('#footer-language');
      for (const [code] of catalog.languages) {
        await page.selectOption('#footer-language', code);
        assert.equal(await page.locator('html').getAttribute('lang'), code);
        assert.equal(await page.locator('[data-contact-copy]').textContent(), catalog.rows.find(r => r[0] === 'Copy inquiry')[catalog.languages.findIndex(l => l[0] === code)]);
        const layout = await page.evaluate(() => {
          const rect = element => element.getBoundingClientRect();
          const nav = rect(document.querySelector('.nav-links'));
          const footer = document.querySelector('.site-footer');
          const control = rect(document.querySelector('.footer-language'));
          const groups = [...footer.children].filter(element => !element.classList.contains('footer-language'));
          return {
            centered: Math.abs((nav.left + nav.right) / 2 - innerWidth / 2) < 2,
            fits: [...footer.children].every(element => rect(element).left >= 0 && rect(element).right <= innerWidth),
            separate: groups.every(element => { const r = rect(element); return r.right <= control.left || r.left >= control.right || r.bottom <= control.top || r.top >= control.bottom; }),
          };
        });
        for (const [name, pass] of Object.entries(layout)) assert.ok(pass, `${width}x${height} ${code}: ${name}`);
      }
      await page.selectOption('#footer-language', 'de');
      assert.match(await page.locator('[data-contact-summary]').inputValue(), /Hallo Bryant/);
      await page.locator('[data-contact-description]').fill('Private project detail — keep this unchanged');
      await page.selectOption('#footer-language', 'fr');
      assert.match(await page.locator('[data-contact-summary]').inputValue(), /Private project detail — keep this unchanged/);
      await page.locator('[data-contact-summary]').fill('My edited draft');
      await page.selectOption('#footer-language', 'de');
      assert.equal(await page.locator('[data-contact-summary]').inputValue(), 'My edited draft');
      await page.reload();
      await page.waitForSelector('#footer-language');
      assert.equal(await page.locator('#footer-language').inputValue(), 'de');
      await page.selectOption('#footer-language', 'en');
      const fits = await page.evaluate(() => {
        const control = document.querySelector('#footer-language').getBoundingClientRect();
        return control.left >= 0 && control.right <= innerWidth && document.documentElement.scrollWidth <= innerWidth;
      });
      assert.ok(fits, `${width}x${height}`);
      await page.close();
    }
  } finally { await browser.close(); }
});
