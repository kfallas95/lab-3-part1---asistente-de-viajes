// MoneyText: centavos → "$1 234.50", siempre 2 decimales (INV-25). Negativo en rojo.
import { h } from '../dom.js';
import { formatMoney } from '../../domain/money.js';

/**
 * @param {number} cents
 * @param {{className?:string}} [options]
 */
export function MoneyText(cents, { className = '' } = {}) {
  return h('span', { class: ['money', cents < 0 && 'text-danger', className] }, formatMoney(cents));
}
