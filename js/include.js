/*
 * include.js — renders the shared site header/footer, portrait background,
 * brand 3D mark, theme toggle, and minimalist loader.
 */

const ASSET_VERSION = "119";

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
const FOOTER_HTML = `&copy; ${new Date().getFullYear()} <span class="footer-brand">Bryant Duhart</span>. All rights reserved.`;

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
  return page.startsWith("service-") ? "services.html" : page;
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
  <a class="footer-legal-link footer-legal-link--privacy" href="privacy.html">Privacy Policy</a>
  ${renderFooterSocials(FOOTER_SOCIALS[0], "Social media links")}
  <p>${FOOTER_HTML}</p>
  ${renderFooterSocials(FOOTER_SOCIALS[1], "More social media links")}
  <a class="footer-legal-link footer-legal-link--impressum" href="impressum.html">Legal Notice</a>
</footer>`;
}

function injectPortraitBg() {
  if (document.body.classList.contains("no-portrait")) return;
  if (document.getElementById("portrait-bg")) return;

  const portrait = document.createElement("div");
  portrait.id = "portrait-bg";
  portrait.setAttribute("aria-hidden", "true");
  document.body.appendChild(portrait);
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
  let width = window.innerWidth;
  window.addEventListener("resize", () => {
    if (window.innerWidth === width) return;
    width = window.innerWidth;
    fitServiceTitles();
  }, { passive: true });
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
  initBrand3d();
  initThemeScript();
  runLoader();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}
