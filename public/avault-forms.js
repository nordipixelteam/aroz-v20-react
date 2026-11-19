(() => {
  'use strict';

  const selector = 'form.audit-form[data-avault-form]';
  const forms = [...document.querySelectorAll(selector)];
  if (!forms.length) return;

  const tokens = new WeakMap();
  const pending = new WeakSet();
  const fetchToken = form => {
    const request = fetch('/api/forms/token/', { credentials: 'same-origin' })
      .then(async response => {
        const body = await response.json().catch(() => null);
        if (!response.ok || typeof body?.token !== 'string' || !body.token) throw new Error(body?.error || "The form is temporarily unavailable.");
        return body.token;
      });
    tokens.set(form, request);
    return request;
  };
  for (const form of forms) fetchToken(form).catch(() => {});

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
  for (const form of forms) {
    form.addEventListener('click', event => {
      const choice = event.target.closest('.service-pick[data-value]');
      if (!choice) return;
      const group = choice.closest('fieldset');
      const value = group?.querySelector('input[name="service"]');
      if (!value) return;
      value.value = choice.dataset.value;
      for (const button of group.querySelectorAll('.service-pick')) {
        button.classList.toggle('active', button === choice);
        button.setAttribute('aria-pressed', String(button === choice));
      }
    });
    form.addEventListener('reset', () => {
      for (const choice of form.querySelectorAll('.service-pick[aria-pressed="true"]')) {
        choice.classList.remove('active');
        choice.setAttribute('aria-pressed', 'false');
      }
    });
  }
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
    if (pending.has(form) || !form.reportValidity()) return;
    const requiredChoice = form.querySelector('input[data-required-choice]');
    if (requiredChoice && !requiredChoice.value) {
      setStatus(form, 'Please choose a service.', true);
      requiredChoice.closest('fieldset')?.querySelector('.service-pick')?.focus();
      return;
    }

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
    pending.add(form);
    try {
      const token = await (tokens.get(form) || fetchToken(form));
      const issuedAt = Number(token.split('.')[0]);
      const wait = Math.max(0, 2500 - (Date.now() - issuedAt));
      if (wait) await new Promise(resolve => setTimeout(resolve, wait));
      const payload = Object.fromEntries(new FormData(form).entries());
      payload.request ||= payload.service ? `Project enquiry: ${payload.service}` : "AROZ project enquiry";
      payload.page = location.href;
      payload.referrer = document.referrer;
      payload.formId = form.dataset.avaultForm;
      payload.token = token;
      const response = await fetch('/api/forms/submit/', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || result?.ok !== true) throw new Error(result?.error || "Your enquiry could not be sent. Please try again.");
      setStatus(form, result.message || "Thank you. We’ve received your project enquiry.");
      form.reset();
      if (flow) { flow.review.hidden = true; flow.fields.hidden = false; }
      fetchToken(form).catch(() => {});
    } catch (error) {
      setStatus(form, error instanceof Error ? error.message : "Your enquiry could not be sent.", true);
      fetchToken(form).catch(() => {});
    } finally {
      pending.delete(form);
      if (submit) submit.disabled = previousDisabled;
    }
  }, true);
})();
