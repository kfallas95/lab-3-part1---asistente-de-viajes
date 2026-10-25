// Campos de formulario con su mensaje de error (validación estricta, D-002).
import { h } from '../dom.js';

/**
 * Campo de texto, fecha, hora, etc.
 * @param {{id:string, label:string, value?:string, type?:string, placeholder?:string, min?:string, max?:string, multiline?:boolean, hint?:string}} props
 * @returns {HTMLElement & {input:HTMLInputElement}}
 */
export function TextField({ id, label, value = '', type = 'text', placeholder, min, max, multiline = false, hint }) {
  const input = multiline
    ? h('textarea', { id, name: id, class: 'textarea', rows: 3, placeholder })
    : h('input', { id, name: id, class: 'input', type, placeholder, min, max, autocomplete: 'off' });
  input.value = value ?? '';
  const field = h(
    'div',
    { class: 'field', dataset: { field: id } },
    h('label', { for: id }, label),
    input,
    hint && h('small', { class: 'text-muted' }, hint),
    h('small', { class: 'field-error', role: 'alert' }),
  );
  field.input = input;
  return field;
}

/**
 * Interruptor ON/OFF accesible (checkbox con estilo de switch).
 * @param {{id:string, label:string, checked?:boolean, onChange?:(checked:boolean) => void}} props
 */
export function Toggle({ id, label, checked = true, onChange }) {
  const input = h('input', {
    id,
    type: 'checkbox',
    class: 'toggle__input',
    role: 'switch',
    checked,
    onChange: (event) => {
      state.textContent = event.target.checked ? 'ON' : 'OFF';
      onChange?.(event.target.checked);
    },
  });
  const state = h('span', { class: 'toggle__state', 'aria-hidden': 'true' }, checked ? 'ON' : 'OFF');
  const field = h(
    'label',
    { class: 'toggle', for: id },
    h('span', { class: 'toggle__label' }, label),
    h('span', { class: 'toggle__control' }, input, h('span', { class: 'toggle__track' }), state),
  );
  field.input = input;
  return field;
}

/**
 * Muestra los errores de validación en los campos (data-field = clave del error).
 * Un error sin campo visible (p. ej. "form") va al contenedor .form-error.
 * @param {HTMLElement} container
 * @param {Object<string,string>} errors
 * @returns {boolean} true si había errores
 */
export function showErrors(container, errors = {}) {
  container.querySelectorAll('.field-error').forEach((el) => (el.textContent = ''));
  container.querySelectorAll('.field--invalid').forEach((el) => el.classList.remove('field--invalid'));
  const formError = container.querySelector('.form-error');
  if (formError) formError.textContent = '';

  let first = null;
  for (const [key, message] of Object.entries(errors)) {
    const field = container.querySelector(`[data-field="${key}"]`);
    if (field) {
      field.classList.add('field--invalid');
      field.querySelector('.field-error').textContent = message;
      first ??= field.querySelector('input, textarea, select');
    } else if (formError) {
      formError.textContent = formError.textContent ? `${formError.textContent} ${message}` : message;
    }
  }
  first?.focus();
  return Object.keys(errors).length > 0;
}
