import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readdirSync } from 'node:fs';
import test from 'node:test';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, sep, extname } from 'node:path';
import { languages } from '../js/language-data.js';
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); }
catch { ({ chromium } = require(process.env.APPDATA + '/npm/node_modules/playwright')); }
test('Every page supports every locale at all seven target screen sizes offline', async () => {
  // Serve the same files without the preview server's development reload injection.
  const root = fileURLToPath(new URL('../', import.meta.url));
  const mime = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.woff': 'font/woff' };
  const server = createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      const file = resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
      if (!file.startsWith(resolve(root) + sep)) { response.writeHead(403).end(); return; }
      const data = await readFile(file);
      response.writeHead(200, { 'Content-Type': mime[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      response.end(data);
    } catch { response.writeHead(404).end(); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch();
  let checked = 0;
  const externalRequests = new Set();
  const errors = new Set();
  try {
    for (const [width, height] of [[390,844],[768,1024],[1024,768],[1366,768],[1920,1080],[844,390],[5119,1304]]) {
      const page = await browser.newPage({ viewport: { width, height }, reducedMotion: 'reduce' });
      page.on('request', request => {
        if (/^https?:/.test(request.url()) && !request.url().startsWith(origin + '/')) externalRequests.add(request.url());
      });
      page.on('pageerror', error => errors.add(error.message));
      for (const file of readdirSync(new URL('../', import.meta.url)).filter(f => f.endsWith('.html'))) {
        await page.goto(origin + '/' + file);
        await page.waitForSelector('#footer-language');
        for (const [code] of languages) {
          await page.selectOption('#footer-language', code);
          const result = await page.evaluate(() => {
            const rect = el => el.getBoundingClientRect();
            const nav = rect(document.querySelector('.nav-links'));
            const footer = document.querySelector('.site-footer');
            const h1 = document.querySelector('.service-detail-hero h1');
            const main = document.querySelector('main');
            const range = document.createRange();
            if (h1) range.selectNodeContents(h1);
            const heading = h1 ? range.getBoundingClientRect() : null;
            return {
              centeredNav: Math.abs((nav.left + nav.right) / 2 - innerWidth / 2) < 2,
              footerFits: [...footer.children].every(el => rect(el).left >= -1 && rect(el).right <= innerWidth + 1),
              // Titles intentionally overhang their 15ch box, but must stay inside the hero.
              headingFits: !heading || (heading.left >= rect(h1.closest('.service-detail-hero')).left - 1 && heading.right <= rect(h1.closest('.service-detail-hero')).right + 1),
              pageFits: document.documentElement.scrollWidth <= innerWidth,
              mainFits: !main || main.scrollWidth <= main.clientWidth + 1,
              legalPlain: !document.body.classList.contains('legal-page') || getComputedStyle(main).backgroundColor === 'rgb(255, 255, 255)',
            };
          });
          for (const [name, pass] of Object.entries(result)) assert.ok(pass, `${file} ${width}x${height} ${code}: ${name}`);
          checked++;
        }
      }
      await page.close();
      console.log(`PASS ${width}x${height}: every page and locale`);
    }
    assert.deepEqual([...externalRequests], []);
    assert.deepEqual([...errors], []);
    console.log(`PASS ${checked} page/locale/layout combinations; zero external requests or page errors`);
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
});
