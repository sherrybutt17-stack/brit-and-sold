import { clearErrors, delay, enableLiveValidation, renderSummary, setSubmitting, validate } from './form-validation';

/**
 * Sends a buyer's request for details. DEMO ONLY: resolves after a short delay and sends nothing.
 * To go live, POST the qualification answers and NDA acceptance to the backend or CRM here.
 */
export async function submitRequest(data: FormData): Promise<void> {
  void data;
  await delay(900);
}

const dialog = document.querySelector<HTMLDialogElement>('[data-request-dialog]');

if (dialog) {
  const steps = Array.from(dialog.querySelectorAll<HTMLElement>('[data-step]'));
  const stepLabel = dialog.querySelector<HTMLElement>('[data-step-label]')!;
  const progress = Array.from(dialog.querySelectorAll<HTMLElement>('[data-progress]'));
  const qualify = dialog.querySelector<HTMLFormElement>('form[data-step="1"]')!;
  const nda = dialog.querySelector<HTMLFormElement>('form[data-step="2"]')!;
  const done = dialog.querySelector<HTMLElement>('[data-step="3"]')!;
  const submitBtn = nda.querySelector<HTMLButtonElement>('[data-submit]')!;
  const submitError = nda.querySelector<HTMLElement>('[data-submit-error]')!;
  let current = 1;

  const show = (step: number) => {
    current = step;
    for (const el of steps) el.hidden = el.dataset.step !== String(step);
    stepLabel.textContent = `Step ${step} of 3`;
    progress.forEach((item, i) => {
      if (i + 1 === step) item.setAttribute('aria-current', 'step');
      else item.removeAttribute('aria-current');
      item.classList.toggle('is-done', i + 1 < step);
    });
    dialog.scrollTop = 0;
  };

  const reset = () => {
    for (const form of [qualify, nda]) {
      form.reset();
      clearErrors(form);
    }
    submitError.hidden = true;
    show(1);
  };

  enableLiveValidation(qualify);
  enableLiveValidation(nda);

  document.querySelectorAll<HTMLElement>('[data-open-request]').forEach((trigger) => {
    trigger.addEventListener('click', () => {
      if (current === 3) reset();
      dialog.showModal();
    });
  });

  dialog.querySelectorAll('[data-dialog-close]').forEach((btn) => btn.addEventListener('click', () => dialog.close()));

  qualify.addEventListener('submit', (event) => {
    event.preventDefault();
    const errors = validate(qualify);
    renderSummary(qualify, errors);
    if (errors.length) return;
    show(2);
    nda.querySelector<HTMLElement>('.nda')?.focus();
  });

  nda.querySelector('[data-back]')?.addEventListener('click', () => {
    show(1);
    qualify.querySelector<HTMLInputElement>('#req-name')?.focus();
  });

  nda.addEventListener('submit', async (event) => {
    event.preventDefault();
    submitError.hidden = true;
    const errors = validate(nda);
    renderSummary(nda, errors);
    if (errors.length) return;

    setSubmitting(submitBtn, true);
    try {
      const data = new FormData(qualify);
      for (const [key, value] of new FormData(nda)) data.append(key, value);
      await submitRequest(data);
    } catch {
      setSubmitting(submitBtn, false);
      submitError.hidden = false;
      submitError.focus();
      return;
    }
    setSubmitting(submitBtn, false);
    show(3);
    done.focus();
  });
}
