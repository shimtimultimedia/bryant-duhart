/*
 * theme-toggle.js — global monochrome light/dark mode controller.
 * Runs on every page through include.js.
 */

const THEME_STORAGE_KEY = "bd-theme";
const DARK_CLASS = "theme-dark";
const LIGHT_CLASS = "theme-light";

function getStoredTheme() {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY);
  } catch {
    return null;
  }
}

function storeTheme(theme) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* localStorage can be unavailable in hardened/private contexts. */
  }
}

function preferredInitialTheme() {
  const stored = getStoredTheme();
  if (stored === "dark" || stored === "light") return stored;
  return "light";
}

function applyTheme(theme) {
  const root = document.documentElement;
  const isDark = theme === "dark";

  root.classList.toggle(DARK_CLASS, isDark);
  root.classList.toggle(LIGHT_CLASS, !isDark);
  root.dataset.theme = isDark ? "dark" : "light";

  const toggle = document.querySelector("[data-theme-toggle]");
  if (toggle) {
    toggle.setAttribute("aria-pressed", String(isDark));
    toggle.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
    toggle.dataset.themeState = isDark ? "dark" : "light";
  }
}

function initThemeToggle() {
  applyTheme(preferredInitialTheme());

  const toggle = document.querySelector("[data-theme-toggle]");
  if (!toggle) return;

  toggle.addEventListener("click", () => {
    const nextTheme = document.documentElement.classList.contains(DARK_CLASS) ? "light" : "dark";
    applyTheme(nextTheme);
    storeTheme(nextTheme);
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initThemeToggle, { once: true });
} else {
  initThemeToggle();
}

