'use strict';

/* Contact page: turns the project brief into an editable email draft.
   Ported from shimtimultimedia.com assets/scripts/pages/contact-inquiry.js with the
   local translation layer. Nothing is sent by the page itself: "Prepare email" opens
   the visitor's own mail program, "Copy inquiry" writes to their clipboard. */
(() => {
  const RECIPIENT = 'shimtimultimedia@gmail.com';
  const service = document.querySelector('[data-contact-service]');
  const description = document.querySelector('[data-contact-description]');
  const date = document.querySelector('[data-contact-date]');
  const budget = document.querySelector('[data-contact-budget]');
  const method = document.querySelector('[data-contact-method]');
  const email = document.querySelector('[data-contact-email]');
  const summary = document.querySelector('[data-contact-summary]');
  const emailLink = document.querySelector('[data-contact-email-link]');
  const copyButton = document.querySelector('[data-contact-copy]');
  const status = document.querySelector('[data-contact-status]');
  const controls = [service, description, date, budget, method, email].filter(Boolean);

  if (!service || !summary || !emailLink) return;
  const t = source => window.portfolioTranslate?.(source) || source;
  const template = (source, value) => t(source).replace('{service}', value);
  let manuallyEdited = false;

  const showStatus = (text) => {
    if (status) status.textContent = text;
  };

  const formattedDate = () => {
    if (!date?.value) return t('Flexible / not specified');
    const [year, month, day] = date.value.split('-');
    return `${day}.${month}.${year}`;
  };

  const updateEmailLink = () => {
    const subject = template('Project inquiry: {service}', t(service.value));
    emailLink.href = `mailto:${RECIPIENT}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(summary.value)}`;
  };

  const buildInquiry = () => {
    manuallyEdited = false;
    const project = description?.value.trim()
      || t('I would like to discuss an idea and determine the right scope with you.');
    summary.value = [
      t('Hello Bryant,'),
      '',
      template('I am interested in {service}.', t(service.value)),
      '',
      `${t('Project')}: ${project}`,
      `${t('Target date')}: ${formattedDate()}`,
      `${t('Budget')}: ${t(budget?.value || 'Not specified')}`,
      `${t('Preferred contact')}: ${t(method?.value || 'Email')}`,
      `${t('Reply email')}: ${email?.value.trim() || t('Not provided yet')}`,
      '',
      t('Thank you.'),
    ].join('\n');
    showStatus('');
    updateEmailLink();
  };

  controls.forEach((control) => {
    control.addEventListener('input', buildInquiry);
    control.addEventListener('change', buildInquiry);
  });
  summary.addEventListener('input', () => { manuallyEdited = true; updateEmailLink(); });
  document.addEventListener('portfolio-languagechange', () => {
    if (manuallyEdited) updateEmailLink();
    else buildInquiry();
  });

  copyButton?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(summary.value);
      showStatus('Inquiry copied.');
    } catch {
      summary.focus();
      summary.select();
      const copied = document.execCommand('copy');
      showStatus(copied ? 'Inquiry copied.' : 'Select the inquiry and copy it manually.');
    }
  });

  buildInquiry();
})();
