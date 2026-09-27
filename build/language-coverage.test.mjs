import assert from 'node:assert/strict';
import { chromium, origin } from './browser-fixture.mjs';
import { readdirSync } from 'node:fs';
import test from 'node:test';
test('All English page copy and labels have complete local translations', async () => {
  const browser = await chromium.launch();
  const missing = new Set();
  try {
    const page = await browser.newPage({ reducedMotion: 'reduce' });
    for (const file of readdirSync(new URL('../', import.meta.url)).filter(f => f.endsWith('.html'))) {
      await page.goto(origin + '/' + file);
      await page.waitForSelector('#footer-language');
      const result = await page.evaluate(async () => {
        const { rows } = await import('./js/language-data.js');
        const normalize = text => text.replace(/\s+/g, ' ').trim();
        const sources = new Set(rows.map(row => normalize(row[0])));
        const invariant = /^(?:Bryant Duhart(?: – Shimti Multimedia)?|SHIMTI|Shimti(?: Multimedia)?|Behance|YouTube|Sketchfab|GitHub|LinkedIn|Instagram|Facebook|TikTok|X|Tumblr|Reddit|3D|65203 Wiesbaden|Deutsch|bd-theme|bd-portfolio-language|[\d€.,–+%©\s]+|shimtimultimedia@gmail\.com|name@example\.com|\.)$/i;
        const excluded = element => element.closest('script,style,code,canvas,[translate="no"],body [lang="de"],.footer-language');
        const texts = [];
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        let node;
        while ((node = walker.nextNode())) if (!excluded(node.parentElement)) texts.push(node.data);
        for (const element of document.querySelectorAll('[title],[aria-label],[placeholder]')) {
          if (excluded(element)) continue;
          for (const name of ['title','aria-label','placeholder']) if (element.hasAttribute(name)) texts.push(element.getAttribute(name));
        }
        return texts.map(normalize).filter(text => text && !sources.has(text) && !invariant.test(text));
      });
      for (const source of result) missing.add(source);
    }
  } finally { await browser.close(); }
  assert.deepEqual([...missing].sort(), []);
});
