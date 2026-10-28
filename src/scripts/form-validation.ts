// Accessible client-side validation shared by the seller inquiry and buyer request forms.
//
// Markup contract:
// - Each control has an id and a matching error element: <p class="field-error" id="{key}-error">,
//   where key is the control id (or the `name` for radio groups, which live in a <fieldset>).
// - Custom messages come from data-error-required / data-error-format on the control (or the fieldset).
// - The form contains an `.error-summary` element with a <ul> and an element with [data-error-count].

type Control = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

export interface FieldError {
  key: string;
  /** Element focused when the summary link is followed. */
  target: Control;
  message: string;
}

const isControl = (el: Element): el is Control =>
  el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement;

function keyFor(control: Control): string {
  return control instanceof HTMLInputElement && control.type === 'radio' ? control.name : control.id;
}

function messageFor(control: Control): string {
  const { validity } = control;
  if (validity.valid) return '';
  const group = control instanceof HTMLInputElement && control.type === 'radio' ? control.closest('fieldset') : null;
  const source = group ?? control;
  if (validity.valueMissing) return source.dataset.errorRequired ?? 'Please answer this question.';
  if (validity.typeMismatch || validity.patternMismatch) {
    return source.dataset.errorFormat ?? 'Please check the format of this answer.';
  }
  if (validity.tooShort) return `Please enter at least ${control.getAttribute('minlength')} characters.`;
  if (validity.tooLong) return `Please keep this under ${control.getAttribute('maxlength')} characters.`;
  return control.validationMessage;
}

function controlsFor(form: HTMLFormElement, key: string): Control[] {
  const byId = form.querySelector<HTMLElement>(`#${CSS.escape(key)}`);
  if (byId && isControl(byId)) return [byId];
  return Array.from(form.querySelectorAll<HTMLInputElement>(`input[name="${CSS.escape(key)}"]`));
}

export function setFieldError(form: HTMLFormElement, key: string, message: string): void {
  const errorEl = form.querySelector<HTMLElement>(`#${CSS.escape(key)}-error`);
  const controls = controlsFor(form, key);
  for (const control of controls) {
    if (message) control.setAttribute('aria-invalid', 'true');
    else control.removeAttribute('aria-invalid');
  }
  if (!errorEl) return;
  errorEl.replaceChildren();
  if (message) {
    const prefix = document.createElement('span');
    prefix.className = 'visually-hidden';
    prefix.textContent = 'Error: ';
    errorEl.append(prefix, message);
  }
}

/** Validates every enabled control in `scope` and returns one error per field or radio group. */
export function validate(form: HTMLFormElement, scope: ParentNode = form): FieldError[] {
  const errors: FieldError[] = [];
  const seen = new Set<string>();
  for (const el of Array.from(scope.querySelectorAll('input, select, textarea'))) {
    if (!isControl(el) || el.disabled || el.type === 'hidden') continue;
    const key = keyFor(el);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    const message = messageFor(el);
    setFieldError(form, key, message);
    if (message) errors.push({ key, target: el, message });
  }
  return errors;
}

export function renderSummary(form: HTMLFormElement, errors: FieldError[]): void {
  const summary = form.querySelector<HTMLElement>('.error-summary');
  if (!summary) return;
  if (!errors.length) {
    summary.hidden = true;
    return;
  }
  const list = summary.querySelector('ul');
  const count = summary.querySelector('[data-error-count]');
  if (count) {
    count.textContent =
      errors.length === 1 ? 'Please fix 1 answer before continuing' : `Please fix ${errors.length} answers before continuing`;
  }
  list?.replaceChildren(
    ...errors.map(({ target, message }) => {
      const li = document.createElement('li');
      const link = document.createElement('a');
      link.href = `#${target.id}`;
      link.textContent = message;
      link.addEventListener('click', (event) => {
        event.preventDefault();
        target.focus();
        target.scrollIntoView({ block: 'center' });
      });
      li.append(link);
      return li;
    }),
  );
  summary.hidden = false;
  summary.focus();
}

/** After the first failed submit, re-check each field as the user fixes it. */
export function enableLiveValidation(form: HTMLFormElement): void {
  const recheck = (event: Event) => {
    const el = event.target as Element;
    if (!isControl(el)) return;
    const key = keyFor(el);
    const wasInvalid = controlsFor(form, key).some((c) => c.getAttribute('aria-invalid') === 'true');
    if (wasInvalid) setFieldError(form, key, messageFor(el));
  };
  form.addEventListener('input', recheck);
  form.addEventListener('change', recheck);
}

export function clearErrors(form: HTMLFormElement): void {
  form.querySelectorAll('[aria-invalid]').forEach((el) => el.removeAttribute('aria-invalid'));
  form.querySelectorAll('.field-error').forEach((el) => el.replaceChildren());
  const summary = form.querySelector<HTMLElement>('.error-summary');
  if (summary) summary.hidden = true;
}

export function setSubmitting(button: HTMLButtonElement, submitting: boolean, busyLabel = 'Sending…'): void {
  const label = button.querySelector<HTMLElement>('[data-label]');
  if (submitting) {
    button.dataset.idleLabel = label?.textContent ?? '';
    if (label) label.textContent = busyLabel;
    button.setAttribute('aria-disabled', 'true');
    button.disabled = true;
  } else {
    if (label && button.dataset.idleLabel) label.textContent = button.dataset.idleLabel;
    button.removeAttribute('aria-disabled');
    button.disabled = false;
  }
  button.querySelector<HTMLElement>('[data-spinner]')?.toggleAttribute('hidden', !submitting);
}

export const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
