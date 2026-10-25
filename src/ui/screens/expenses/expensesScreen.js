// Pantalla "Gastos" (D-090, wireframe §5): chips de categoría y gastos agrupados por día.
// Tocar un gasto abre su edición (8.4) o eliminación (8.5).
import { h } from '../../dom.js';
import { CategoryChips } from '../../components/categoryChips.js';
import { openExpenseForm } from './expenseForm.js';
import { formatMoney } from '../../../domain/money.js';
import { addDays, formatShortDate } from '../../../domain/dates.js';
import { selectExpensesByDay } from '../../../state/selectors.js';
import { setUi } from '../../../state/store.js';

export const CATEGORY_ICONS = Object.freeze({ FOOD: '🍽', TRANSPORT: '🚕', ACTIVITIES: '🎟', OTHER: '🧰' });

export function ExpensesScreen({ state, trip, store, services }) {
  if (trip.status === 'PLANNED') {
    return h(
      'section',
      {},
      h('h1', {}, 'Gastos'),
      h('div', { class: 'card' }, h('p', { class: 'text-muted' }, 'Podrás registrar gastos cuando inicie tu viaje.')),
    );
  }

  const filter = state.ui.categoryFilter;
  const groups = selectExpensesByDay(state, `${trip.id}|${filter}`);

  return h(
    'section',
    {},
    h('h1', {}, 'Gastos'),
    CategoryChips({
      selected: filter,
      onSelect: (value) => store.setState((s) => setUi(s, { categoryFilter: value })),
    }),
    groups.length === 0
      ? h('div', { class: 'card empty-state' }, h('p', { class: 'text-muted' }, filter === 'ALL' ? 'Aún no registras gastos.' : 'No hay gastos en esta categoría.'))
      : groups.map((group) =>
          h(
            'div',
            { class: 'expense-day' },
            h(
              'div',
              { class: 'row row--between expense-day__header' },
              h('h2', { class: 'section-title' }, dayLabel(group.date, state.today)),
              h('span', { class: 'expense-day__total' }, formatMoney(group.total)),
            ),
            h(
              'ul',
              { class: 'expense-list' },
              group.items.map((expense) =>
                h(
                  'li',
                  {},
                  h(
                    'button',
                    {
                      class: 'expense-item',
                      type: 'button',
                      onClick: () => openExpenseForm({ trip, services, expense }),
                    },
                    h('span', { class: 'expense-item__icon', 'aria-hidden': 'true' }, CATEGORY_ICONS[expense.category]),
                    h('span', { class: 'expense-item__concept' }, expense.concept),
                    h('span', { class: 'expense-item__amount' }, formatMoney(expense.amount)),
                  ),
                ),
              ),
            ),
          ),
        ),
  );
}

/** "HOY · 6 nov 2026", "AYER · 5 nov 2026" o la fecha. */
function dayLabel(date, today) {
  const short = formatShortDate(date);
  if (date === today) return `Hoy · ${short}`;
  if (today && date === addDays(today, -1)) return `Ayer · ${short}`;
  return short;
}
