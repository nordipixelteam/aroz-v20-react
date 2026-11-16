(() => {
  'use strict';

  const selector = 'form.audit-form:is([data-avault-form="contact"],[data-avault-form="homepage-contact"])';
  const forms = [...document.querySelectorAll(selector)];
  if (!forms.length) return;

  let tokenRequest;
  const fetchToken = () => {
    tokenRequest = fetch('/api/forms/token/', { credentials: 'same-origin' })
      .then(async response => {
        const body = await response.json();
        if (!response.ok || !body.token) throw new Error(body.error || "The form is temporarily unavailable.");
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
    // The imported contact page hides this element with CSS until .show is set.
    if (status.classList.contains('form-success')) status.classList.add('show');
    status.textContent = message;
    status.dataset.state = isError ? 'error' : 'success';
    status.focus?.();
  };

  const reviews = new WeakMap();
  for (const form of forms.filter(f => f.dataset.avaultForm === 'homepage-contact')) {
    const fields = document.createElement('div');
    fields.className = 'home-contact-fields';
    for (const child of [...form.children]) {
      if (!child.matches('.av-hp,.v9-form-status')) fields.append(child);
    }
    form.prepend(fields);
    const review = document.createElement('div');
    review.className = 'home-contact-review';
    review.hidden = true;
    review.innerHTML = '<h3 tabindex="-1">Review your enquiry</h3><dl></dl><p>Please check your details before sending.</p><div class="home-contact-actions"><button type="button" class="home-contact-back">Back to edit</button><button type="submit" class="v9-contact-submit">Send enquiry <span aria-hidden="true">↗</span></button></div>';
    form.append(review);
    reviews.set(form, { fields, review });
    review.querySelector('button[type="button"]').addEventListener('click', () => {
      review.hidden = true;
      fields.hidden = false;
      statusFor(form).hidden = true;
      fields.querySelector('input:not([type="hidden"])')?.focus();
    });
    form.addEventListener('invalid', event => {
      event.target.setAttribute('aria-invalid', 'true');
      setStatus(form, event.target.type === 'checkbox' ? 'Please confirm that you have read the privacy notice.' : 'Please check the highlighted fields.', true);
    }, true);
    form.addEventListener('input', event => event.target.removeAttribute('aria-invalid'));
    form.addEventListener('change', event => event.target.removeAttribute('aria-invalid'));
  }

  document.addEventListener('submit', async event => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement) || !form.matches(selector)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (!form.reportValidity()) return;

    const flow = reviews.get(form);
    if (flow?.review.hidden) {
      const list = flow.review.querySelector('dl');
      list.replaceChildren();
      for (const field of flow.fields.querySelectorAll('input:not([type="hidden"]):not([type="checkbox"]),textarea,select')) {
        const term = document.createElement('dt'), value = document.createElement('dd');
        term.textContent = field.labels?.[0]?.textContent || field.name;
        value.textContent = field.value || 'Not provided';
        list.append(term, value);
      }
      flow.fields.hidden = true;
      flow.review.hidden = false;
      statusFor(form).hidden = true;
      flow.review.querySelector('h3').focus();
      return;
    }

    const submit = flow?.review.querySelector('[type="submit"]') || form.querySelector('[type="submit"]');
    const previousDisabled = submit?.disabled;
    if (submit) submit.disabled = true;
    try {
      const token = await (tokenRequest || fetchToken());
      const issuedAt = Number(token.split('.')[0]);
      const wait = Math.max(0, 2500 - (Date.now() - issuedAt));
      if (wait) await new Promise(resolve => setTimeout(resolve, wait));
      const payload = Object.fromEntries(new FormData(form).entries());
      payload.request ||= payload.service ? `Project enquiry: ${payload.service}` : "AROZ project enquiry";
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
      if (!response.ok || !result.ok) throw new Error(result.error || "Your enquiry could not be sent.");
      setStatus(form, result.message || "Thank you. Your enquiry has been sent.");
      form.reset();
      if (flow) { flow.review.hidden = true; flow.fields.hidden = false; }
      fetchToken().catch(() => {});
    } catch (error) {
      setStatus(form, error instanceof Error ? error.message : "Your enquiry could not be sent.", true);
      fetchToken().catch(() => {});
    } finally {
      if (submit) submit.disabled = previousDisabled;
    }
  }, true);
})();
