// MoneyInput: campo de monto en USD (D-120). Acepta hasta 2 decimales, con punto o coma,
// y entrega centavos enteros (D-121). Un texto inválido entrega NaN para que el
// validador lo rechace (validación estricta, D-002); vacío entrega null.
import { h } from '../dom.js';
import { centsToInputValue, toCents } from '../../domain/money.js';

const PATTERN = /^-?\d+([.,]\d{1,2})?$/; // el signo se acepta para que el validador diga "solo positivos" (REQ-F-06)

/** Convierte el texto del campo a centavos: null si está vacío, NaN si no es válido. */
export function parseMoneyInput(text) {
  const value = (text ?? '').trim();
  if (value === '') return null;
  if (!PATTERN.test(value)) return NaN;
  return toCents(value.replace(',', '.'));
}

/**
 * @param {{id:string, name?:string, value?:number|null, placeholder?:string, ariaLabel?:string}} props
 * @returns {HTMLInputElement & {getCents:() => number|null}}
 */
export function MoneyInput({ id, name = id, value = null, placeholder = '0.00', ariaLabel } = {}) {
  const input = h('input', {
    id,
    name,
    class: 'input money-input',
    type: 'text',
    inputmode: 'decimal',
    autocomplete: 'off',
    placeholder,
    'aria-label': ariaLabel,
    value: value === null || value === undefined ? '' : centsToInputValue(value),
  });
  input.getCents = () => parseMoneyInput(input.value);
  return input;
}

/** Campo con etiqueta "$" delante. */
export function MoneyField({ id, label, value = null, hint } = {}) {
  const input = MoneyInput({ id, value });
  const field = h(
    'div',
    { class: 'field', dataset: { field: id } },
    h('label', { for: id }, label),
    h('div', { class: 'money-field' }, h('span', { class: 'money-field__prefix', 'aria-hidden': 'true' }, '$'), input),
    hint && h('small', { class: 'text-muted' }, hint),
    h('small', { class: 'field-error', role: 'alert' }),
  );
  field.input = input;
  return field;
}
