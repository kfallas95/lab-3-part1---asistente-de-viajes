// Pantalla "Resumen" (D-091, wireframe §7, CLAUDE.md §7.6).
// - Encabezado: TotalTripSpent "de" totalAmount; "Te quedan $X" o "Te pasaste $X" en rojo.
// - Por categoría: Comida, Transporte y Actividades con "Gastado / Planificado" y barra
//   (rojo + alerta si se excede); Tiquetes y Hospedaje como montos fijos sin barra (D-037).
// - Fondo de imprevistos: "Usado $X de $Y · Quedan $Z"; oculto si no existe (D-025).
// - PLANNED: solo el presupuesto planificado, sin "Gastado".
// Es solo lectura: abrirla no modifica datos.
import { h } from '../../dom.js';
import { ProgressBar } from '../../components/categoryCard.js';
import { OverBudgetAlert } from '../../components/overBudgetAlert.js';
import { formatMoney } from '../../../domain/money.js';
import { DAILY_CATEGORIES, EXPENSE_CATEGORY_LABELS } from '../../../domain/types.js';
import { selectCategoryBreakdown, selectReserve, selectTotals } from '../../../state/selectors.js';

const FIXED_ROWS = [
  { key: 'TICKETS', label: 'Tiquetes' },
  { key: 'LODGING', label: 'Hospedaje' },
];

export function SummaryScreen({ state, trip }) {
  const totals = selectTotals(state, trip.id);
  const breakdown = selectCategoryBreakdown(state, trip.id);
  const reserve = selectReserve(state, trip.id);
  if (!totals) return h('p', { class: 'text-muted' }, 'No hay presupuesto para este viaje.');

  const planned = trip.status === 'PLANNED';
  return h(
    'section',
    { class: 'summary' },
    h('h1', {}, 'Resumen'),
    planned ? PlannedHeader(totals) : SpentHeader(totals),
    h('h2', { class: 'section-title summary__heading' }, h('span', {}, 'Por categoría'), !planned && h('span', {}, 'Gastado / Planificado')),
    h(
      'ul',
      { class: 'summary-list card' },
      DAILY_CATEGORIES.map((category) => CategoryRow(EXPENSE_CATEGORY_LABELS[category], breakdown[category], planned)),
      FIXED_ROWS.filter((row) => breakdown[row.key] !== null).map((row) =>
        h('li', { class: 'summary-row' }, h('span', { class: 'summary-row__label' }, row.label), h('span', { class: 'summary-row__amount' }, formatMoney(breakdown[row.key]))),
      ),
    ),
    reserve && ReserveCard(reserve, planned),
  );
}

function SpentHeader({ planned, spent, left }) {
  const over = left < 0;
  return h(
    'div',
    { class: ['card', 'summary-total', over && 'card--danger'] },
    h('p', { class: 'text-muted summary-total__label' }, 'Costo total del viaje'),
    h('p', { class: 'summary-total__amount' }, h('span', { class: 'amount-main' }, formatMoney(spent)), h('span', { class: 'text-muted' }, ` de ${formatMoney(planned)}`)),
    over
      ? h('p', { class: 'text-danger summary-total__left' }, `Te pasaste ${formatMoney(-left)} `, OverBudgetAlert())
      : h('p', { class: 'summary-total__left' }, `Te quedan ${formatMoney(left)}`),
  );
}

function PlannedHeader({ planned }) {
  return h(
    'div',
    { class: 'card summary-total' },
    h('p', { class: 'text-muted summary-total__label' }, 'Presupuesto planificado'),
    h('p', { class: 'summary-total__amount' }, h('span', { class: 'amount-main' }, formatMoney(planned))),
  );
}

function CategoryRow(label, { spent, planned: plannedAmount }, isPlanned) {
  if (isPlanned) {
    return h('li', { class: 'summary-row' }, h('span', { class: 'summary-row__label' }, label), h('span', { class: 'summary-row__amount' }, formatMoney(plannedAmount)));
  }
  const over = spent > plannedAmount;
  return h(
    'li',
    { class: ['summary-row', 'summary-row--bar', over && 'summary-row--over'] },
    h(
      'div',
      { class: 'summary-row__top' },
      h('span', { class: 'summary-row__label' }, label, over && ' ', over && OverBudgetAlert()),
      h('span', { class: ['summary-row__amount', over && 'text-danger'] }, `${formatMoney(spent)} / ${formatMoney(plannedAmount)}`),
    ),
    ProgressBar(plannedAmount > 0 ? spent / plannedAmount : 1, over),
  );
}

function ReserveCard({ amount, used, remaining }, isPlanned) {
  return h(
    'div',
    { class: ['card', 'summary-reserve', remaining < 0 && 'card--danger'] },
    h('h2', { class: 'section-title' }, 'Fondo de imprevistos'),
    isPlanned
      ? h('p', {}, formatMoney(amount))
      : h(
          'p',
          {},
          `Usado ${formatMoney(used)} de ${formatMoney(amount)} · `,
          h('span', { class: remaining < 0 ? 'text-danger' : '' }, `Quedan ${formatMoney(remaining)}`),
        ),
  );
}
