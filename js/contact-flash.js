'use strict';

/* Contact page: the studio's occasional "lightning" flash, ported from
   shimtimultimedia.com assets/scripts/pages/contact-lightning.js. Runs only while the
   flash layer is displayed (dark theme; see css/contact.css), never while the tab is
   hidden, and never for visitors who prefer reduced motion. */
(() => {
  const flashLayer = document.querySelector('[data-contact-flash]');
  if (!flashLayer) return;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  let timeout = 0;
  let animation = null;
  let seed = 0x5b19a4d3;

  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  const schedule = () => {
    window.clearTimeout(timeout);
    if (document.hidden || reducedMotion.matches || document.documentElement.dataset.motion === 'reduce') return;
    timeout = window.setTimeout(runFlash, 6000 + random() * 14000);
  };

  const runFlash = () => {
    if (document.hidden || reducedMotion.matches || document.documentElement.dataset.motion === 'reduce' || getComputedStyle(flashLayer).display === 'none') {
      schedule();
      return;
    }

    const doubleFlash = random() > 0.58;
    const strength = 0.065 + random() * 0.055;
    const keyframes = doubleFlash
      ? [
          { opacity: 0, offset: 0 },
          { opacity: strength * 0.72, offset: 0.1 },
          { opacity: strength * 0.08, offset: 0.25 },
          { opacity: strength, offset: 0.46 },
          { opacity: strength * 0.14, offset: 0.67 },
          { opacity: 0, offset: 1 },
        ]
      : [
          { opacity: 0, offset: 0 },
          { opacity: strength, offset: 0.18 },
          { opacity: strength * 0.2, offset: 0.48 },
          { opacity: 0, offset: 1 },
        ];

    animation?.cancel();
    animation = flashLayer.animate(keyframes, {
      duration: doubleFlash ? 760 + random() * 420 : 520 + random() * 360,
      easing: 'linear',
      fill: 'none',
    });
    animation.addEventListener('finish', schedule, { once: true });
    animation.addEventListener('cancel', schedule, { once: true });
  };

  const reset = () => {
    window.clearTimeout(timeout);
    animation?.cancel();
    animation = null;
    schedule();
  };
  window.addEventListener('site-motion-change', reset);

  document.addEventListener('visibilitychange', reset);
  reducedMotion.addEventListener('change', reset);
  schedule();
})();
