import {
  clearErrors,
  delay,
  enableLiveValidation,
  renderSummary,
  setFieldError,
  setSubmitting,
  validate,
} from './form-validation';
import { scrollToElement } from './scroll';

/**
 * Sends a seller inquiry. DEMO ONLY: this resolves after a short delay and sends nothing.
 * To go live, POST `data` to the chosen backend or CRM (e.g. a serverless function) here,
 * and throw on a non-2xx response so the error state is shown.
 */
export async function submitInquiry(data: FormData): Promise<void> {
  void data;
  await delay(900);
  if (new URLSearchParams(location.search).get('preview') === 'error') {
    throw new Error('Simulated failure (?preview=error)');
  }
}

const root = document.querySelector<HTMLElement>('[data-seller-form-root]');
const form = root?.querySelector<HTMLFormElement>('[data-seller-form]');

if (root && form) {
  const success = root.querySelector<HTMLElement>('[data-success]')!;
  const submitError = form.querySelector<HTMLElement>('[data-submit-error]')!;
  const submitBtn = form.querySelector<HTMLButtonElement>('[data-submit]')!;
  const company = form.querySelector<HTMLInputElement>('#seller-company')!;
  const companyLater = form.querySelector<HTMLInputElement>('[data-company-later]')!;
  const phone = form.querySelector<HTMLInputElement>('#seller-phone')!;
  const phoneOptional = form.querySelector<HTMLElement>('[data-phone-optional]')!;

  enableLiveValidation(form);

  // Three-step flow: each step is validated before moving on.
  const stepEls = Array.from(form.querySelectorAll<HTMLFieldSetElement>('[data-form-step]'));
  const segments = Array.from(form.querySelectorAll<HTMLElement>('[data-progress-seg]'));
  const progressText = form.querySelector<HTMLElement>('[data-progress-text]')!;
  const stepNames = segments.map((seg) => seg.textContent?.trim() ?? '');
  let current = 1;

  const goTo = (step: number, { focus = true } = {}) => {
    current = step;
    form.dataset.current = String(step);
    segments.forEach((seg, i) => {
      seg.classList.toggle('is-current', i + 1 === step);
      seg.classList.toggle('is-done', i + 1 < step);
    });
    progressText.textContent = `Step ${step} of ${stepEls.length}: ${stepNames[step - 1]}`;
    form.querySelector<HTMLElement>('.error-summary')!.hidden = true;
    if (!focus) return;
    const fieldset = stepEls[step - 1];
    fieldset.focus({ preventScroll: true });
    if (root.getBoundingClientRect().top < 0) scrollToElement(root);
  };

  const validateStep = () => {
    const errors = validate(form, stepEls[current - 1]);
    renderSummary(form, errors);
    return errors.length === 0;
  };

  form.querySelector('[data-step-next]')?.addEventListener('click', () => {
    if (validateStep()) goTo(current + 1);
  });
  form.querySelector('[data-step-back]')?.addEventListener('click', () => goTo(current - 1));
  goTo(1, { focus: false });

  // Owners can hold back their company name until after the first conversation.
  companyLater.addEventListener('change', () => {
    company.disabled = companyLater.checked;
    if (companyLater.checked) company.value = '';
  });

  // Phone becomes required only when the owner asks to be called.
  form.addEventListener('change', (event) => {
    const target = event.target as HTMLInputElement;
    if (target.name !== 'contactMethod') return;
    const needsPhone = target.value === 'phone';
    phone.required = needsPhone;
    phoneOptional.hidden = needsPhone;
    if (!needsPhone) setFieldError(form, phone.id, '');
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    submitError.hidden = true;

    // Pressing Enter on an earlier step moves forward rather than submitting.
    if (current < stepEls.length) {
      if (validateStep()) goTo(current + 1);
      return;
    }
    if (!validateStep()) return;

    setSubmitting(submitBtn, true);
    try {
      await submitInquiry(new FormData(form));
    } catch {
      setSubmitting(submitBtn, false);
      submitError.hidden = false;
      submitError.focus();
      return;
    }
    setSubmitting(submitBtn, false);

    const firstName = (form.elements.namedItem('name') as HTMLInputElement).value.trim().split(/\s+/)[0];
    root.querySelector('[data-success-name]')!.textContent = firstName ? `, ${firstName}` : '';
    form.hidden = true;
    success.hidden = false;
    success.focus();
  });

  root.querySelector('[data-reset-form]')?.addEventListener('click', () => {
    form.reset();
    clearErrors(form);
    company.disabled = false;
    phone.required = false;
    phoneOptional.hidden = false;
    success.hidden = true;
    form.hidden = false;
    goTo(1, { focus: false });
    form.querySelector<HTMLInputElement>('#seller-name')?.focus();
  });
}
