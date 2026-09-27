import { languages, rows } from './language-data.js';
import { initMotionControl } from './motion-control.js?v=120';

const normalize = value => value.replace(/\s+/g, ' ').trim();
const catalogs = new Map(languages.map(([code], index) => [code,
  new Map(rows.map(row => [normalize(row[0]), row[index] || row[0]]))]));
const originals = new WeakMap();
const attributeSources = new WeakMap();
let language = 'en';
const storageKey = 'bd-portfolio-language';
const originalTitle = document.title;
try {
  const saved = localStorage.getItem(storageKey);
  if (catalogs.has(saved)) language = saved;
} catch { /* Storage is optional, including in private browsing. */ }

export function translate(source) {
  return catalogs.get(language).get(normalize(source)) || source;
}
// Shared with the classic contact script; never sends text anywhere.
window.portfolioTranslate = translate;

const excluded = element => element.closest(
  'script, style, code, canvas, [translate="no"], body [lang="de"], .footer-language');

function apply() {
  observer.disconnect();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    if (!node.parentElement || excluded(node.parentElement) || !normalize(node.data)) continue;
    let record = originals.get(node);
    if (!record || node.data !== record.last) record = { source: node.data, last: node.data };
    const source = record.source;
    // Freeze option values before changing their visible labels.
    if (node.parentElement.tagName === 'OPTION' && !node.parentElement.hasAttribute('value')) {
      node.parentElement.value = node.parentElement.textContent;
    }
    const translated = translate(source);
    node.data = translated === source ? source : source.replace(/\S[\s\S]*\S|\S/, translated);
    if (document.body.classList.contains('legal-page') && node.parentElement.tagName === 'H2' && normalize(source) === 'English') {
      node.data = languages.find(([code]) => code === language)[1];
    }
    record.last = node.data;
    originals.set(node, record);
  }
  for (const element of document.querySelectorAll('[title], [aria-label], [placeholder]')) {
    if (excluded(element)) continue;
    let sources = attributeSources.get(element);
    if (!sources) {
      sources = new Map();
      attributeSources.set(element, sources);
    }
    for (const attribute of ['title', 'aria-label', 'placeholder']) {
      if (!element.hasAttribute(attribute)) continue;
      const current = element.getAttribute(attribute);
      let record = sources.get(attribute);
      if (!record || current !== record.last) record = { source: current, last: current };
      record.last = translate(record.source);
      sources.set(attribute, record);
      element.setAttribute(attribute, record.last);
    }
  }
  document.documentElement.lang = language;
  for (const link of document.querySelectorAll('a[data-service]')) {
    const url = new URL(link.href, location.href);
    if (url.origin !== 'https://shimtimultimedia.com') continue;
    if (language === 'en') url.searchParams.delete('lang');
    else url.searchParams.set('lang', language);
    link.href = url.href;
  }
  document.title = originalTitle.split(/(\s[—–-]\s)/).map(translate).join('');
  const selector = document.querySelector('#footer-language');
  if (selector) selector.setAttribute('aria-label', translate('Language'));
  const caption = document.querySelector('.footer-language-label');
  if (caption) caption.textContent = translate('Language');
  observer.observe(document.body, { childList: true, characterData: true, subtree: true,
    attributes: true, attributeFilter: ['title', 'aria-label', 'placeholder'] });
}

const observer = new MutationObserver(apply);
const footer = document.querySelector('.site-footer');
if (footer) {
  const label = document.createElement('label');
  label.className = 'footer-language';
  label.translate = false;
  const caption = document.createElement('span');
  caption.className = 'footer-language-label';
  caption.textContent = 'Language';
  const select = document.createElement('select');
  select.id = 'footer-language';
  select.setAttribute('aria-label', 'Language');
  for (const [code, name] of languages) {
    const option = document.createElement('option');
    option.value = code;
    option.lang = code;
    option.textContent = name;
    select.append(option);
  }
  select.value = language;
  select.addEventListener('change', () => {
    language = select.value;
    try { localStorage.setItem(storageKey, language); } catch { /* Optional. */ }
    apply();
    document.dispatchEvent(new CustomEvent('portfolio-languagechange', { detail: { language } }));
  });
  label.append(caption, select);
  footer.append(label);
  initMotionControl('.site-footer', () => language);
  apply();
  document.dispatchEvent(new CustomEvent('portfolio-languagechange', { detail: { language } }));
}
