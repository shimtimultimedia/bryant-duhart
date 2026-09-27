/*
 * include.js — renders the shared site header/footer, portrait background,
 * brand 3D mark, theme toggle, and minimalist loader.
 */

const ASSET_VERSION = "120";

const NAV_LINKS = [
  { href: "index.html",     label: "Home"      },
  { href: "about.html",     label: "About"     },
  { href: "portfolio.html", label: "Portfolio" },
  { href: "services.html",  label: "Services"  },
  { href: "social.html",    label: "Social"    },
  { href: "contact.html",   label: "Contact"   },
];

const BRAND_NAME = "Bryant Duhart";
const BRAND_SUB  = "Multimedia Creator";
const FOOTER_HTML = `&copy; ${new Date().getFullYear()} <span class="footer-brand">Bryant Duhart</span>.<span class="footer-rights"> All rights reserved.</span>`;

function readStoredTheme() {
  let theme = "light";

  try {
    const stored = localStorage.getItem("bd-theme");
    if (stored === "dark" || stored === "light") theme = stored;
  } catch {
    theme = "light";
  }

  return theme;
}

function applyStoredThemeEarly() {
  const theme = readStoredTheme();
  document.documentElement.classList.toggle("theme-dark", theme === "dark");
  document.documentElement.classList.toggle("theme-light", theme !== "dark");
  document.documentElement.dataset.theme = theme;
  return theme;
}

function currentPage() {
  const match = location.pathname.match(/([^/]+\.html)$/);
  const page = match ? match[1] : "index.html";
  return page;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[char]));
}

function renderLoader() {
  return `<div class="site-loader" id="site-loader" role="status" aria-live="polite" aria-label="Loading portfolio">
  <div class="site-loader-panel">
    <span class="site-loader-mark" aria-hidden="true"></span>
    <span class="site-loader-title">Loading Portfolio</span>
    <span class="site-loader-bar" aria-hidden="true"><span class="site-loader-fill" id="site-loader-fill"></span></span>
    <span class="site-loader-percent" id="site-loader-percent">0%</span>
  </div>
</div>`;
}

function injectLoader() {
  if (document.getElementById("site-loader")) return;
  document.body.insertAdjacentHTML("afterbegin", renderLoader());
}

function runLoader() {
  const loader = document.getElementById("site-loader");
  const fill = document.getElementById("site-loader-fill");
  const percent = document.getElementById("site-loader-percent");

  if (!loader || !fill || !percent) return;

  let progress = 0;
  let completed = false;
  const startedAt = performance.now();
  const minDuration = 650;
  const maxDuration = 1800;

  const timer = window.setInterval(() => {
    progress = Math.min(progress + Math.max(2, Math.round((100 - progress) * 0.12)), 92);
    fill.style.width = `${progress}%`;
    percent.textContent = `${progress}%`;
  }, 90);

  function complete() {
    if (completed) return;
    completed = true;

    const elapsed = performance.now() - startedAt;
    const wait = Math.max(0, minDuration - elapsed);

    window.setTimeout(() => {
      window.clearInterval(timer);
      fill.style.width = "100%";
      percent.textContent = "100%";

      window.setTimeout(() => {
        loader.classList.add("is-hidden");
        window.setTimeout(() => loader.remove(), 320);
      }, 160);
    }, wait);
  }

  if (document.readyState === "complete") {
    complete();
  } else {
    window.addEventListener("load", complete, { once: true });
    window.setTimeout(complete, maxDuration);
  }
}

function renderHeader() {
  const current = currentPage();
  const theme = document.documentElement.dataset.theme || readStoredTheme();
  const isDark = theme === "dark";
  const links = NAV_LINKS.map(link => {
    const active = link.href === current
      ? ` aria-current="page" class="active"`
      : "";
    return `      <a href="${escapeHtml(link.href)}"${active}>${escapeHtml(link.label)}</a>`;
  }).join("\n");

  return `<header class="site-header">
  <div class="nav-wrap">
    <a class="brand" href="index.html">
      <span class="brand-mark" aria-hidden="true">
        <span class="brand-mark-fallback">
          <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
            <polygon points="32,9 54,21 32,33 10,21" fill="#FFFFFF"/>
            <polygon points="10,21 32,33 32,55 10,43" fill="#B8B8B8"/>
            <polygon points="54,21 54,43 32,55 32,33" fill="#757575"/>
          </svg>
        </span>
        <canvas class="brand-3d-canvas" id="brand-3d-canvas" width="72" height="72"></canvas>
      </span>
      <span class="brand-text">${escapeHtml(BRAND_NAME)}<span class="brand-sub">${escapeHtml(BRAND_SUB)}</span></span>
      <span class="brand-mark brand-mark--mirror" aria-hidden="true">
        <span class="brand-mark-fallback">
          <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
            <polygon points="32,9 54,21 32,33 10,21" fill="#FFFFFF"/>
            <polygon points="10,21 32,33 32,55 10,43" fill="#B8B8B8"/>
            <polygon points="54,21 54,43 32,55 32,33" fill="#757575"/>
          </svg>
        </span>
        <canvas class="brand-3d-canvas brand-3d-mirror" width="72" height="72"></canvas>
      </span>
    </a>

    <nav class="nav-links" aria-label="Primary">
${links}
    </nav>

    <button class="theme-toggle" type="button" data-theme-toggle data-theme-state="${isDark ? "dark" : "light"}" aria-label="Dark Light color theme: ${isDark ? "switch to light mode" : "switch to dark mode"}" aria-pressed="${String(isDark)}">
      <span class="theme-toggle-label theme-toggle-label-dark" aria-hidden="true">Dark</span>
      <span class="theme-toggle-track" aria-hidden="true">
        <span class="theme-toggle-moon"></span>
        <span class="theme-toggle-thumb"></span>
      </span>
      <span class="theme-toggle-label theme-toggle-label-light" aria-hidden="true">Light</span>
    </button>
  </div>
</header>`;
}

/* Same accounts, order and split as the shimtimultimedia.com footer. */
const FOOTER_SOCIALS = [
  [
    ["Facebook", "facebook", "https://www.facebook.com/shimti.multimedia/"],
    ["Instagram", "instagram", "https://www.instagram.com/shimtimultimedia/"],
    ["X", "x", "https://x.com/Shimtimedia"],
    ["TikTok", "tiktok", "https://www.tiktok.com/@shimtimultimedia1"],
  ],
  [
    ["LinkedIn", "linkedin", "https://www.linkedin.com/in/shimtimultimedia/"],
    ["Tumblr", "tumblr", "https://www.tumblr.com/blog/shimti999-blog"],
    ["YouTube", "youtube", "https://www.youtube.com/@Shimtimultimedia"],
    ["Reddit", "reddit", "https://www.reddit.com/user/Naive_Butterscotch93/"],
  ],
];

function renderFooterSocials(links, label) {
  const items = links.map(([name, icon, url]) =>
    `<a class="footer-social-link" href="${url}" target="_blank" rel="noopener" aria-label="${name}">` +
    `<svg class="footer-social-icon" aria-hidden="true" focusable="false"><use href="images/social-icons.svg#${icon}"></use></svg></a>`
  ).join("\n    ");
  return `<nav class="footer-socials" aria-label="${label}">
    ${items}
  </nav>`;
}

/* Layout mirrors shimtimultimedia.com: legal links bookend the bar, social icons flank
   the centred copyright. css/footer.css rearranges the same five children on phones. */
function renderFooter() {
  return `<footer class="site-footer">
  <a class="footer-legal-link footer-legal-link--privacy" href="privacy.html" title="Privacy Policy"><svg class="footer-legal-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 2 4 5v6c0 5 4 9 8 11 4-2 8-6 8-11V5Z M9 12l2 2 4-5"/></svg><span class="footer-legal-text">Privacy Policy</span></a>
  ${renderFooterSocials(FOOTER_SOCIALS[0], "Social media links")}
  <p>${FOOTER_HTML}</p>
  ${renderFooterSocials(FOOTER_SOCIALS[1], "More social media links")}
  <a class="footer-legal-link footer-legal-link--impressum" href="impressum.html" title="Legal Notice"><svg class="footer-legal-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 2h10l4 4v16H5Z M15 2v5h4 M12 10v1 M12 14v5"/></svg><span class="footer-legal-text">Legal Notice</span></a>
</footer>`;
}

function injectPortraitBg() {
  if (document.body.classList.contains("no-portrait")) return;
  if (document.getElementById("portrait-bg")) return;

  const portrait = document.createElement("div");
  portrait.id = "portrait-bg";
  portrait.setAttribute("aria-hidden", "true");
  document.body.appendChild(portrait);
  startPortraitCycle(portrait);
}

/*
 * Background portrait slideshow.
 *
 * Six aligned cutouts (images/portraits/, built by build/build_portraits.py) crossfade
 * in a random order: every portrait is shown once before any repeats, never the same
 * one twice in a row. The first frame is always portrait-1, which the pages preload,
 * so the first paint is as fast as the single portrait it replaced.
 *
 * Two .portrait-frame layers alternate; each inherits #portrait-bg's size and
 * position, so every responsive placement rule keeps applying unchanged. The next
 * image is decoded before its fade starts, so a fade never reveals a half-loaded
 * picture. Nothing cycles while the tab is hidden, while the portrait is hidden by
 * the phone layout (no extra downloads there), or when the visitor prefers reduced
 * motion.
 */
const PORTRAIT_COUNT = 6;
const PORTRAIT_HOLD_MS = 8000;

function portraitUrl(index) {
  return `images/portraits/portrait-${index + 1}.webp?v=${ASSET_VERSION}`;
}

function startPortraitCycle(portrait) {
  const frames = [document.createElement("div"), document.createElement("div")];
  frames.forEach(frame => {
    frame.className = "portrait-frame";
    portrait.appendChild(frame);
  });
  let visible = 0;
  let current = 0;
  frames[0].style.backgroundImage = `url("${portraitUrl(current)}")`;
  frames[0].classList.add("is-visible");
  portrait.classList.add("is-cycling");

  // Fade length comes from .portrait-frame's transition in base.css, so the next hold
  // always starts after the fade has actually finished.
  const fadeMs = (parseFloat(getComputedStyle(frames[0]).transitionDuration) || 0) * 1000;
  const shown = window.matchMedia("(min-width: 901px)");
  const still = window.matchMedia("(prefers-reduced-motion: reduce)");
  let bag = [];

  function draw() {
    if (!bag.length) {
      bag = Array.from({ length: PORTRAIT_COUNT }, (_, index) => index).filter(index => index !== current);
      for (let i = bag.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [bag[i], bag[j]] = [bag[j], bag[i]];
      }
    }
    return bag.pop();
  }

  async function advance() {
    if (document.hidden || !shown.matches || still.matches || document.documentElement.dataset.motion === 'reduce') {
      window.setTimeout(advance, PORTRAIT_HOLD_MS);
      return;
    }
    const next = draw();
    const url = portraitUrl(next);
    const image = new Image();
    image.src = url;
    try { await image.decode(); } catch { /* fall through: the fade still shows whatever loaded */ }

    const incoming = frames[1 - visible];
    incoming.style.backgroundImage = `url("${url}")`;
    window.requestAnimationFrame(() => {
      incoming.classList.add("is-visible");
      frames[visible].classList.remove("is-visible");
      visible = 1 - visible;
      current = next;
      window.setTimeout(advance, PORTRAIT_HOLD_MS + fadeMs);
    });
  }

  window.setTimeout(advance, PORTRAIT_HOLD_MS);
}

/*
 * The 3D header mark.
 *
 * This is the largest main-thread cost on the site: Lighthouse attributes a single
 * 9,300ms task to brand-3d.js on contact.html, a page that renders no 3D of its own, and
 * main-thread "Other" work of 10,400ms against only 650ms of script evaluation. That
 * shape - one long synchronous block, almost none of it script - is WebGL shader
 * compilation for the mark's clearcoat MeshPhysicalMaterial under Lighthouse's CPU
 * throttling. It is a one-time cost, not per-frame work.
 *
 * Deferring the injection to requestIdleCallback was tried and made things measurably
 * worse: Total Blocking Time counts long tasks between FCP and TTI, so moving the block
 * later pushed it INTO the measured window rather than ahead of it. TBT rose from ~6,600ms
 * to ~9,500ms on every page and contact's LCP went from 1.1s to 5.2s. Injecting early,
 * where the compile lands before first paint, is the better of the two. Do not "optimise"
 * this by deferring it again without measuring.
 *
 * The real lever is the material, not the timing.
 */
function initBrand3d() {
  if (document.body.classList.contains("no-portrait")) return;
  if (!document.getElementById("brand-3d-canvas")) return;
  if (window.__brand3dLoaded) return;

  window.__brand3dLoaded = true;

  const script = document.createElement("script");
  script.type = "module";
  script.src = `js/brand-3d.js?v=${ASSET_VERSION}`;
  document.head.appendChild(script);
}

function initThemeScript() {
  if (window.__themeToggleLoaded) return;
  window.__themeToggleLoaded = true;

  const script = document.createElement("script");
  script.src = `js/theme-toggle.js?v=${ASSET_VERSION}`;
  script.defer = true;
  document.head.appendChild(script);
}

/*
 * Service titles are set large and never break inside a word, so on a phone a long word
 * ("DEVELOPMENT") can be wider than the screen. Each title is shrunk only by the amount
 * its longest word overflows; titles that already fit keep their designed size. Runs
 * again once the web font has loaded and whenever the window width changes.
 */
function fitServiceTitles() {
  document.querySelectorAll(".service-detail-hero h1").forEach(title => {
    title.style.fontSize = "";
    // The limit is what the title would actually collide with: the hero's inner edge, or
    // 16px short of the hero image beside it. Overhanging its own 15ch box into empty
    // space is part of the design and is left alone.
    const hero = title.closest(".service-detail-hero");
    const heroBox = hero.getBoundingClientRect();
    const titleLeft = title.getBoundingClientRect().left;
    let limit = heroBox.right - parseFloat(getComputedStyle(hero).paddingRight);
    for (const neighbour of hero.children) {
      if (neighbour.contains(title)) continue;
      const box = neighbour.getBoundingClientRect();
      if (box.width && box.left > titleLeft + 1) limit = Math.min(limit, box.left - 16);
    }
    const text = document.createRange();
    text.selectNodeContents(title);
    for (let pass = 0; pass < 4; pass += 1) {
      const box = text.getBoundingClientRect();
      if (box.right <= limit + 1) break;
      const size = parseFloat(getComputedStyle(title).fontSize);
      const scale = (limit - box.left) / (box.right - box.left);
      title.style.fontSize = `${Math.floor(size * scale * 0.98 * 10) / 10}px`;
    }
  });
}

function initServiceTitleFit() {
  if (!document.querySelector(".service-detail-hero h1")) return;
  fitServiceTitles();
  document.fonts?.ready.then(fitServiceTitles);
  document.addEventListener('portfolio-languagechange', fitServiceTitles);
  let width = window.innerWidth;
  window.addEventListener("resize", () => {
    if (window.innerWidth === width) return;
    width = window.innerWidth;
    fitServiceTitles();
  }, { passive: true });
}

/*
 * Home/About biography scroll window (see "Home/About biography" in hero.css).
 * Marks whether the text overflows the window and which edges have more text beyond
 * them, so CSS fades only the edges where text is actually hidden: no top fade at the
 * start, no bottom fade at the end, no fades at all when the text fits. A window that
 * scrolls becomes keyboard-focusable and is announced as a region, so it can be read
 * without a mouse.
 */
function initPlaqueBioScroll() {
  document.querySelectorAll(".plaque-size-standard .plaque-bio-area").forEach(area => {
    const update = () => {
      const max = area.scrollHeight - area.clientHeight;
      const scrollable = max > 1;
      area.toggleAttribute("data-scrollable", scrollable);
      area.toggleAttribute("data-fade-top", scrollable && area.scrollTop > 1);
      area.toggleAttribute("data-fade-bottom", scrollable && area.scrollTop < max - 1);
      if (scrollable) {
        area.tabIndex = 0;
        area.setAttribute("role", "region");
        area.setAttribute("aria-label", "Biography");
      } else {
        area.removeAttribute("tabindex");
        area.removeAttribute("role");
        area.removeAttribute("aria-label");
      }
    };
    area.addEventListener("scroll", update, { passive: true });
    if ("ResizeObserver" in window) {
      const observer = new ResizeObserver(update);
      observer.observe(area);
      Array.from(area.children).forEach(child => observer.observe(child));
    }
    window.addEventListener("resize", update, { passive: true });
    document.fonts?.ready.then(update);
    update();
  });
}

/*
 * Edge panel (phones): a handle on the right screen edge, like Samsung's Edge Panel.
 * Tap it (or swipe it inward) to slide out a small panel; drag it up or down to move it
 * along the edge. On phones the light/dark switch lives in this panel instead of taking
 * a row of the header; on wider screens it moves back into the header. The handle's
 * position is kept only for the current page view - nothing is stored.
 */
function initEdgePanel() {
  const toggle = document.querySelector("[data-theme-toggle]");
  const headerSlot = toggle?.parentElement;
  if (!toggle || !headerSlot) return;

  const edge = document.createElement("div");
  edge.className = "edge-panel";
  edge.innerHTML = `
    <button class="edge-handle" type="button" aria-controls="edge-panel-body" aria-expanded="false" aria-label="Light and dark theme">
      <svg class="edge-icon edge-icon-moon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M20.4 14.6A8.5 8.5 0 0 1 9.4 3.6a8.5 8.5 0 1 0 11 11Z"/></svg>
      <svg class="edge-icon edge-icon-sun" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6"/></svg>
    </button>
    <div class="edge-panel-body" id="edge-panel-body" hidden>
      <p class="edge-panel-label">Theme</p>
    </div>`;
  document.body.appendChild(edge);

  const handle = edge.querySelector(".edge-handle");
  const body = edge.querySelector(".edge-panel-body");
  const phone = window.matchMedia("(max-width: 720px), (min-width: 721px) and (max-width: 900px) and (orientation: portrait)");

  function place() {
    if (phone.matches) body.appendChild(toggle);
    else if (toggle.parentElement !== headerSlot) headerSlot.appendChild(toggle);
    if (!phone.matches) setOpen(false);
  }

  function setOpen(open) {
    edge.classList.toggle("is-open", open);
    handle.setAttribute("aria-expanded", String(open));
    body.hidden = !open;
  }

  let y = null;
  function moveTo(clientY) {
    const half = handle.offsetHeight / 2;
    const top = document.querySelector(".site-header")?.getBoundingClientRect().bottom ?? 0;
    y = Math.min(window.innerHeight - half - 8, Math.max(top + half + 8, clientY));
    edge.style.setProperty("--edge-y", `${Math.round(y)}px`);
  }

  let start = null;
  handle.addEventListener("pointerdown", event => {
    start = { x: event.clientX, y: event.clientY, dragging: false, swiped: false };
    handle.setPointerCapture(event.pointerId);
  });
  handle.addEventListener("pointermove", event => {
    if (!start) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (!start.dragging && !start.swiped) {
      if (dx < -24 && Math.abs(dx) > Math.abs(dy)) { start.swiped = true; setOpen(true); }
      else if (Math.abs(dy) > 6) start.dragging = true;
    }
    if (start.dragging) moveTo(event.clientY);
  });
  handle.addEventListener("pointerup", () => {
    if (start && !start.dragging && !start.swiped) setOpen(!edge.classList.contains("is-open"));
    start = null;
  });
  handle.addEventListener("pointercancel", () => { start = null; });
  handle.addEventListener("click", event => {
    // Pointer handlers already acted; keyboard activation (no pointer) toggles here.
    if (event.detail === 0) setOpen(!edge.classList.contains("is-open"));
  });

  document.addEventListener("pointerdown", event => {
    if (edge.classList.contains("is-open") && !edge.contains(event.target)) setOpen(false);
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && edge.classList.contains("is-open")) {
      setOpen(false);
      handle.focus();
    }
  });
  window.addEventListener("resize", () => { if (y !== null) moveTo(y); }, { passive: true });
  phone.addEventListener("change", place);
  place();
}

function init() {
  applyStoredThemeEarly();
  injectLoader();
  injectPortraitBg();

  document.querySelectorAll('[data-include="header"]').forEach(element => {
    element.outerHTML = renderHeader();
  });

  document.querySelectorAll('[data-include="footer"]').forEach(element => {
    element.outerHTML = renderFooter();
  });

  initServiceTitleFit();
  initPlaqueBioScroll();
  initEdgePanel();
  initBrand3d();
  initThemeScript();
  import(`./site-language.js?v=${ASSET_VERSION}`).catch(error => console.error('Local language module:', error));
  runLoader();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}
