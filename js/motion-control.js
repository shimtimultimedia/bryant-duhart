// Local, URL-scoped preference: no storage, services, or visitor data sharing.
export function initMotionControl(footerSelector, language) {
  if (document.querySelector('[data-motion-control]')) return;
  const labels = {"en":"Reduce motion","de":"Bewegung reduzieren","fr":"Réduire les animations","it":"Riduci le animazioni","es":"Reducir animaciones","pl":"Ogranicz animacje","ro":"Reduce animațiile","nl":"Animaties verminderen","pt":"Reduzir animações","el":"Μείωση κίνησης","cs":"Omezit animace","hu":"Animációk csökkentése","sv":"Minska rörelser"};
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  let chosen = new URL(location.href).searchParams.get('motion') === 'reduce';
  const button = document.createElement('button');
  button.type = 'button'; button.className = 'motion-control'; button.dataset.motionControl = '';
  button.setAttribute('translate', 'no');
  const sync = () => {
    const reduced = chosen || media.matches;
    document.documentElement.dataset.motion = reduced ? 'reduce' : 'normal';
    button.textContent = 'Ⅱ';
    button.setAttribute('aria-label', labels[language()] || labels.en);
    button.title = labels[language()] || labels.en;
    button.lang = language();
    button.setAttribute('aria-pressed', String(reduced));
    button.disabled = media.matches; // Never override the visitor's OS accessibility preference.
    window.dispatchEvent(new CustomEvent('site-motion-change', { detail: { reduced } }));
  };
  button.addEventListener('click', () => {
    chosen = !chosen;
    const url = new URL(location.href);
    if (chosen) url.searchParams.set('motion', 'reduce');
    else url.searchParams.delete('motion');
    history.replaceState(history.state, '', url);
    sync();
  });
  window.addEventListener('site-language-change', sync);
  document.addEventListener('portfolio-languagechange', sync);
  window.addEventListener('popstate', () => { chosen = new URL(location.href).searchParams.get('motion') === 'reduce'; sync(); });
  media.addEventListener('change', sync);
  document.addEventListener('click', event => {
    const link = event.target.closest?.('a[href]');
    if (!chosen || !link || link.hasAttribute('download')) return;
    const url = new URL(link.href, location.href);
    if (url.origin === location.origin && (url.pathname.endsWith('.html') || url.pathname.endsWith('/'))) {
      url.searchParams.set('motion', 'reduce'); link.href = url.href;
    }
  }, { capture: true });
  const footer = document.querySelector(footerSelector);
  (footer?.querySelector('p') || footer || document.body).append(button);
  sync();
}
