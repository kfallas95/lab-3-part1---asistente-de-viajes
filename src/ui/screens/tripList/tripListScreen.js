// Pantalla "Mis viajes" (D-085, wireframe §1).
// En curso (máximo uno) · Planificados (más próximo primero) · Finalizados (más reciente primero).
import { h } from '../../dom.js';
import { selectTotals, selectTripDay, selectTripsGrouped } from '../../../state/selectors.js';
import { daysBetween, formatDateRange } from '../../../domain/dates.js';
import { formatMoney } from '../../../domain/money.js';
import { toHash } from '../../router.js';
import { openTripActionsMenu } from '../../components/tripActions.js';

export function TripListScreen({ state, services, clock }) {
  const actions = { services, clock };
  const { inProgress, planned, finished } = selectTripsGrouped(state);
  const total = inProgress.length + planned.length + finished.length;

  const header = h(
    'div',
    { class: 'row row--between page-header' },
    h('h1', {}, 'Mis viajes'),
    total > 0 && h('a', { class: 'btn', href: '#/trips/new' }, '+ Nuevo'),
  );

  if (total === 0) {
    return h(
      'section',
      {},
      header,
      h(
        'div',
        { class: 'card empty-state' },
        h('p', { class: 'empty-state__title' }, 'Aún no tienes viajes'),
        h('a', { class: 'btn', href: '#/trips/new' }, 'Crear mi primer viaje'),
      ),
    );
  }

  return h(
    'section',
    {},
    header,
    group('En curso', inProgress, state, actions),
    group('Planificados', planned, state, actions),
    group('Finalizados', finished, state, actions),
  );
}

function group(title, trips, state, actions) {
  if (trips.length === 0) return null;
  return h(
    'div',
    { class: 'trip-group' },
    h('h2', { class: 'section-title' }, title),
    trips.map((trip) => TripCard(trip, state, actions)),
  );
}

/** Tarjeta: nombre · país, fechas, un dato según el estado y menú ⋯ (Duplicar · Eliminar). */
function TripCard(trip, state, { services, clock }) {
  return h(
    'div',
    { class: 'card trip-card' },
    h(
      'a',
      { class: 'trip-card__link', href: toHash({ name: 'trip', tripId: trip.id }) },
      h('p', { class: 'trip-card__title' }, `${trip.name} · ${trip.country}`),
      h(
        'p',
        { class: 'text-muted trip-card__meta' },
        `${formatDateRange(trip.startDate, trip.endDate)} · ${statusDetail(trip, state)}`,
      ),
    ),
    h(
      'button',
      {
        class: 'icon-button trip-card__menu',
        type: 'button',
        'aria-label': `Acciones de ${trip.name}`,
        onClick: () => openTripActionsMenu({ trip, services, clock }),
      },
      '⋯',
    ),
  );
}

function statusDetail(trip, state) {
  if (trip.status === 'IN_PROGRESS') {
    const info = selectTripDay(state, trip.id);
    return info ? `Día ${info.day} de ${info.total}` : 'En curso';
  }
  if (trip.status === 'PLANNED') {
    if (!state.today) return 'Planificado';
    const days = daysBetween(state.today, trip.startDate);
    return days === 1 ? 'en 1 día' : `en ${days} días`;
  }
  const totals = selectTotals(state, trip.id);
  return totals ? `Gastaste ${formatMoney(totals.spent)}` : 'Finalizado';
}
