// CategoryCard: "Te quedan $X" (principal) y "de $Y" (secundario) con barra de progreso (D-062).
// Si el disponible es negativo: rojo y alerta de sobrecosto (REQ-F-04B).
import { h } from '../dom.js';
import { formatMoney } from '../../domain/money.js';
import { OverBudgetAlert } from './overBudgetAlert.js';

/**
 * @param {{label:string, remaining:number, limit:number}} props centavos
 */
export function CategoryCard({ label, remaining, limit }) {
  const over = remaining < 0;
  const used = limit > 0 ? Math.min(Math.max((limit - remaining) / limit, 0), 1) : over ? 1 : 0;
  return h(
    'article',
    { class: ['card', 'category-card', over && 'card--danger'] },
    h('div', { class: 'row row--between' }, h('h3', { class: 'category-card__title' }, label), over && OverBudgetAlert()),
    h('p', { class: ['amount-main', over && 'text-danger'] }, `Te quedan ${formatMoney(remaining)}`),
    h(
      'div',
      { class: 'row row--between' },
      h('span', { class: 'text-muted' }, `de ${formatMoney(limit)}`),
      ProgressBar(used, over),
    ),
  );
}

/** Barra de progreso: fracción usada entre 0 y 1. */
export function ProgressBar(fraction, danger = false) {
  const percent = Math.round(Math.min(Math.max(fraction, 0), 1) * 100);
  return h(
    'div',
    {
      class: ['progress', danger && 'progress--danger'],
      role: 'progressbar',
      'aria-valuemin': '0',
      'aria-valuemax': '100',
      'aria-valuenow': String(percent),
    },
    h('div', { class: 'progress__bar', style: { width: `${percent}%` } }),
  );
}
