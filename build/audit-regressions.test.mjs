import assert from 'node:assert/strict';
import test from 'node:test';
import { chromium, origin } from './browser-fixture.mjs';

test('Footer targets, fallback links and visitor motion control remain accessible', async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ reducedMotion: 'no-preference' });
    await page.addInitScript(() => {
      const getContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function(type, ...args) {
        return /webgl/i.test(type) ? null : getContext.call(this, type, ...args);
      };
    });
    for (const [width, height] of [[320,844],[390,844],[768,1024],[844,390],[1024,768],[1366,768],[1920,1080],[5119,1304]]) {
      await page.setViewportSize({ width, height });
      await page.goto(origin + '/index.html');
      await page.waitForSelector('[data-motion-control]');
      const targets = await page.locator('.footer-social-link').evaluateAll(links => links.map(a => {
        const r = a.getBoundingClientRect();
        return { width:r.width, height:r.height, left:r.left, right:r.right };
      }));
      for (const r of targets) assert.ok(r.width >= 24 && r.height >= 24 && r.left >= 0 && r.right <= width);
      for (let i=0;i<targets.length;i++) for (let j=i+1;j<targets.length;j++)
        assert.ok(targets[i].right <= targets[j].left || targets[j].right <= targets[i].left);
      assert.match(await page.locator('.plaque-bio a').first().evaluate(a => getComputedStyle(a).textDecorationLine), /underline/);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    }
    await page.setViewportSize({ width:844, height:390 });
    await page.goto(origin + '/services.html');
    await page.waitForSelector('[data-motion-control]');
    assert.equal(await page.locator('#main').getAttribute('tabindex'), '0');
    await page.locator('[data-motion-control]').click();
    assert.equal(await page.locator('html').getAttribute('data-motion'), 'reduce');
    assert.equal(new URL(page.url()).searchParams.get('motion'), 'reduce');
    await page.reload();
    await page.waitForSelector('[data-motion-control][aria-pressed="true"]');
    await page.selectOption('#footer-language', 'de');
    assert.equal(await page.locator('[data-motion-control]').getAttribute('aria-label'), 'Bewegung reduzieren');
    await page.locator('[data-motion-control]').click();
    assert.equal(await page.locator('html').getAttribute('data-motion'), 'normal');
    await page.emulateMedia({ reducedMotion:'reduce' });
    await page.waitForSelector('[data-motion-control]:disabled');
  } finally { await browser.close(); }
});
