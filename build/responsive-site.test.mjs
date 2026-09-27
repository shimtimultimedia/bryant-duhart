import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { chromium, origin } from './browser-fixture.mjs';
import test from 'node:test';

const pages = readdirSync(new URL('../', import.meta.url)).filter(p => p.endsWith('.html'));
const sizes = [[390, 844], [768, 1024], [1024, 768], [1366, 768],
  [1920, 1080], [844, 390], [5119, 1304]];

test('Shared portfolio layouts hold across every page and preview size', async () => {
  const browser = await chromium.launch();
  let checked = 0;
  try {
    for (const [width, height] of sizes) {
      const page = await browser.newPage({ viewport: { width, height }, reducedMotion: 'reduce' });
      for (const file of pages) {
        await page.goto(origin + '/' + file);
        await page.waitForSelector('.site-footer');
        const result = await page.evaluate(() => {
          const rect = el => el.getBoundingClientRect();
          const style = el => getComputedStyle(el);
          const footer = document.querySelector('.site-footer');
          const nav = rect(document.querySelector('.nav-links'));
          const portrait = document.querySelector('#portrait-bg');
          const stack = document.querySelector('.plaque-stack');
          const plain = innerWidth <= 900 && innerHeight <= 500 && innerWidth > innerHeight;
          return {
            legalIcons: [...footer.querySelectorAll('.footer-legal-icon')].every(el => style(el).display !== 'none'),
            footerFits: [...footer.children].every(el => rect(el).left >= 0 && rect(el).right <= innerWidth),
            centeredNav: Math.abs((nav.left + nav.right) / 2 - innerWidth / 2) < 2,
            portraitHidden: !portrait || innerWidth > 900 || style(portrait).display === 'none',
            centeredPlaque: !stack || plain || Math.abs((rect(stack).left + rect(stack).right) / 2 - innerWidth / 2) < 3,
            plainCanvas: !plain || !stack || style(document.querySelector('.hero-3d-canvas')).display === 'none',
            plainText: !plain || [...document.querySelectorAll('main, main *')].every(el => style(el).filter === 'none' && style(el).textShadow === 'none'),
          };
        });
        for (const [name, passes] of Object.entries(result)) {
          assert.ok(passes, `${file} ${width}x${height}: ${name}`);
        }
        checked++;
      }
      await page.close();
    }
    console.log(`PASS ${checked} page/layout combinations`);
  } finally { await browser.close(); }
});
