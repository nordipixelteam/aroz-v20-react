(() => {
  'use strict';

  const forms = [...document.querySelectorAll('form.audit-form[data-avault-form="contact"]')];
  if (!forms.length) return;

  let tokenRequest;
  const fetchToken = () => {
    tokenRequest = fetch('/api/forms/token/', { credentials: 'same-origin' })
      .then(async response => {
        const body = await response.json();
        if (!response.ok || !body.token) throw new Error(body.error || 'Das Formular ist gerade nicht verfügbar.');
        return body.token;
      });
    return tokenRequest;
  };
  fetchToken().catch(() => {});

  const statusFor = form => form.querySelector('.v9-form-status, .form-success, .form-status');
  const setStatus = (form, message, isError = false) => {
    const status = statusFor(form);
    if (!status) return;
    status.hidden = false;
    status.textContent = message;
    status.dataset.state = isError ? 'error' : 'success';
    status.focus?.();
  };

  document.addEventListener('submit', async event => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement) || !form.matches('form.audit-form[data-avault-form="contact"]')) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (!form.reportValidity()) return;

    const submit = form.querySelector('[type="submit"]');
    const previousDisabled = submit?.disabled;
    if (submit) submit.disabled = true;
    try {
      const token = await (tokenRequest || fetchToken());
      const issuedAt = Number(token.split('.')[0]);
      const wait = Math.max(0, 2500 - (Date.now() - issuedAt));
      if (wait) await new Promise(resolve => setTimeout(resolve, wait));
      const payload = Object.fromEntries(new FormData(form).entries());
      payload.request ||= payload.service ? `Projektanfrage: ${payload.service}` : 'AROZ Projektanfrage';
      payload.page = location.href;
      payload.referrer = document.referrer;
      payload.token = token;
      const response = await fetch('/api/forms/submit/', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || 'Die Anfrage konnte nicht übermittelt werden.');
      setStatus(form, result.message || 'Vielen Dank. Ihre Anfrage wurde übermittelt.');
      form.reset();
      fetchToken().catch(() => {});
    } catch (error) {
      setStatus(form, error instanceof Error ? error.message : 'Die Anfrage konnte nicht übermittelt werden.', true);
      fetchToken().catch(() => {});
    } finally {
      if (submit) submit.disabled = previousDisabled;
    }
  }, true);
})();