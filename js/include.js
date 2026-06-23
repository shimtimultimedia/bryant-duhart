/*
 * include.js — renders the shared site header and footer.
 *
 * To change nav links, edit NAV_LINKS below. Every HTML page picks up
 * the change automatically through <div data-include="header"></div>
 * and <div data-include="footer"></div> insertion points.
 */

const ASSET_VERSION = "74";

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

function currentPage() {
  const match = location.pathname.match(/([^/]+\.html)$/);
  return match ? match[1] : "index.html";
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

function renderHeader() {
  const current = currentPage();
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
  </div>
</header>`;
}

function renderFooter() {
  return `<footer class="site-footer">
  <p>${FOOTER_HTML}</p>
</footer>`;
}

function injectPortraitBg() {
  if (document.getElementById("portrait-bg")) return;

  const portrait = document.createElement("div");
  portrait.id = "portrait-bg";
  portrait.setAttribute("aria-hidden", "true");
  document.body.appendChild(portrait);
}

function initBrand3d() {
  if (!document.getElementById("brand-3d-canvas")) return;
  if (window.__brand3dLoaded) return;

  window.__brand3dLoaded = true;

  const script = document.createElement("script");
  script.type = "module";
  script.src = `js/brand-3d.js?v=${ASSET_VERSION}`;
  document.head.appendChild(script);
}

function init() {
  injectPortraitBg();

  document.querySelectorAll('[data-include="header"]').forEach(element => {
    element.outerHTML = renderHeader();
  });

  document.querySelectorAll('[data-include="footer"]').forEach(element => {
    element.outerHTML = renderFooter();
  });

  initBrand3d();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}