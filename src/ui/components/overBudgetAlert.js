// OverBudgetAlert: indicador visual de sobrecosto reutilizable (REQ-F-04B, D-050).
// Solo visual: nunca envía notificaciones (D-008).
import { h } from '../dom.js';

/**
 * @param {string} [label] texto corto; por defecto "Sobrecosto"
 */
export function OverBudgetAlert(label = 'Sobrecosto') {
  return h('span', { class: 'over-budget', role: 'status' }, h('span', { 'aria-hidden': 'true' }, '⚠'), ` ${label}`);
}
