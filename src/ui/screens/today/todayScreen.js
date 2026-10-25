// Pantalla "Hoy" (D-062, wireframe §3).
// IN_PROGRESS: encabezado, total disponible hoy, una tarjeta por categoría diaria y actividades de hoy.
// PLANNED: "Tu viaje comienza en X días" + límite diario que tendrá cada categoría.
// FINISHED: "Tu viaje terminó" + enlace a Resumen.
// El resumen matutino del día aparece arriba, en una tarjeta que se puede cerrar (REQ-F-02, D-062).
import { h } from '../../dom.js';
import { toHash } from '../../router.js';
import { CategoryCard } from '../../components/categoryCard.js';
import { OverBudgetAlert } from '../../components/overBudgetAlert.js';
import { MorningSummaryCard } from '../../components/morningSummaryCard.js';
import { setUi } from '../../../state/store.js';
import { formatMoney } from '../../../domain/money.js';
import { DAILY_CATEGORIES, EXPENSE_CATEGORY_LABELS } from '../../../domain/types.js';
import {
  selectActivitiesOn,
  selectDailySnapshot,
  selectDaysUntilStart,
  selectForecastAlert,
  selectInitialDailyLimits,
  selectTripDay,
} from '../../../state/selectors.js';

export function TodayScreen({ state, trip, store }) {
  if (trip.status === 'PLANNED') return Planned(state, trip);
  if (trip.status === 'FINISHED') return Finished(trip);
  return InProgress(state, trip, store);
}

function InProgress(state, trip, store) {
  const snapshot = selectDailySnapshot(state, trip.id);
  const tripDay = selectTripDay(state, trip.id);
  const activities = selectActivitiesOn(state, `${trip.id}|${state.today}`);
  if (!snapshot) return h('p', { class: 'text-muted' }, 'No hay presupuesto para este viaje.');

  const totalOver = snapshot.total.remaining < 0;
  const alert = selectForecastAlert(state, trip.id);
  const dismissed = state.ui.dismissedSummary?.[trip.id] === state.today;
  const dismiss = () =>
    store.setState((s) => setUi(s, { dismissedSummary: { ...s.ui.dismissedSummary, [trip.id]: s.today } }));

  return h(
    'section',
    { class: 'today' },
    h('h1', {}, `${trip.place} · Día ${tripDay.day} de ${tripDay.total}`),
    alert && !dismissed && MorningSummaryCard({ message: alert.assistantMessage, onClose: dismiss }),
    h(
      'div',
      { class: ['today-total', totalOver && 'today-total--danger'] },
      h('p', { class: 'text-muted today-total__label' }, 'Total disponible hoy', totalOver && ' ', totalOver && OverBudgetAlert()),
      h(
        'p',
        { class: 'today-total__amount' },
        h('span', { class: ['amount-main', totalOver && 'text-danger'] }, formatMoney(snapshot.total.remaining)),
        h('span', { class: 'text-muted' }, ` de ${formatMoney(snapshot.total.limit)}`),
      ),
    ),
    h(
      'div',
      { class: 'card-grid' },
      DAILY_CATEGORIES.map((category) =>
        CategoryCard({
          label: EXPENSE_CATEGORY_LABELS[category],
          remaining: snapshot[category].remaining,
          limit: snapshot[category].limit,
        }),
      ),
    ),
    h('h2', { class: 'section-title' }, 'Actividades de hoy'),
    activities.length === 0
      ? h('p', { class: 'text-muted' }, 'No tienes actividades para hoy.')
      : h(
          'ul',
          { class: 'activity-mini-list' },
          activities.map((a) => h('li', {}, h('span', { class: 'activity-mini-list__time' }, a.startTime), ` ${a.title}`)),
        ),
  );
}

function Planned(state, trip) {
  const days = selectDaysUntilStart(state, trip.id);
  const limits = selectInitialDailyLimits(state, trip.id);
  return h(
    'section',
    { class: 'today' },
    h('h1', {}, trip.place),
    h(
      'div',
      { class: 'card' },
      h('p', { class: 'today-message' }, days === 1 ? 'Tu viaje comienza en 1 día' : `Tu viaje comienza en ${days} días`),
      limits &&
        h(
          'div',
          {},
          h('p', { class: 'text-muted' }, 'Límite diario que tendrá cada categoría:'),
          h(
            'ul',
            { class: 'limit-list' },
            DAILY_CATEGORIES.map((c) =>
              h('li', {}, h('span', {}, EXPENSE_CATEGORY_LABELS[c]), h('strong', {}, formatMoney(limits[c]))),
            ),
          ),
        ),
    ),
  );
}

function Finished(trip) {
  return h(
    'section',
    { class: 'today' },
    h('h1', {}, trip.place),
    h(
      'div',
      { class: 'card' },
      h('p', { class: 'today-message' }, 'Tu viaje terminó'),
      h('a', { class: 'btn', href: toHash({ name: 'trip', tripId: trip.id, tab: 'summary' }) }, 'Ver resumen'),
    ),
  );
}
