/*
 * include.js — renders the shared site header/footer, portrait background,
 * brand 3D mark, theme toggle, and minimalist loader.
 */

const ASSET_VERSION = "116";

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

    <button class="theme-toggle" type="button" data-theme-toggle data-theme-state="${isDark ? "dark" : "light"}" aria-label="${isDark ? "Switch to light mode" : "Switch to dark mode"}" aria-pressed="${String(isDark)}">
      <span class="theme-toggle-label theme-toggle-label-dark">Dark</span>
      <span class="theme-toggle-track" aria-hidden="true">
        <span class="theme-toggle-moon"></span>
        <span class="theme-toggle-thumb"></span>
      </span>
      <span class="theme-toggle-label theme-toggle-label-light">Light</span>
    </button>
  </div>
</header>`;
}

function renderFooter() {
  return `<footer class="site-footer">
  <p>${FOOTER_HTML}</p>
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

  initBrand3d();
  initThemeScript();
  runLoader();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}
