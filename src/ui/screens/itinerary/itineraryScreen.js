// Pantalla "Itinerario" (D-088, D-089, wireframe §4).
// Planificado frente al presupuesto de Actividades (INV-24, D-050), pestañas por día,
// lista del día ordenada por hora y sección plegable "Fuera del viaje".
import { h } from '../../dom.js';
import { DayTabs } from '../../components/dayTabs.js';
import { ProgressBar } from '../../components/categoryCard.js';
import { OverBudgetAlert } from '../../components/overBudgetAlert.js';
import { CollapsibleSection } from '../../components/collapsibleSection.js';
import { openActivityForm } from './activityForm.js';
import { formatMoney } from '../../../domain/money.js';
import { addDays, formatShortDate } from '../../../domain/dates.js';
import {
  selectActivitiesOn,
  selectDetachedActivities,
  selectPlannedVsBudget,
  selectTripDay,
} from '../../../state/selectors.js';
import { setUi } from '../../../state/store.js';

export function ItineraryScreen({ state, trip, store, services }) {
  const tripDay = selectTripDay(state, trip.id);
  const totalDays = tripDay.total;

  // Día seleccionado: el que eligió el cliente; si no, hoy (IN_PROGRESS) o Día 1 (D-088).
  const saved = state.ui.itineraryDay?.[trip.id];
  const initial = trip.status === 'IN_PROGRESS' ? tripDay.day : 1;
  const selected = saved && saved <= totalDays ? saved : initial;
  const selectedDate = addDays(trip.startDate, selected - 1);

  const planned = selectPlannedVsBudget(state, trip.id);
  const activities = selectActivitiesOn(state, `${trip.id}|${selectedDate}`);
  const detached = selectDetachedActivities(state, trip.id);

  const selectDay = (day) =>
    store.setState((s) => setUi(s, { itineraryDay: { ...(s.ui.itineraryDay ?? {}), [trip.id]: day } }));

  return h(
    'section',
    { class: 'itinerary' },
    h('h1', {}, 'Itinerario'),
    planned &&
      h(
        'div',
        { class: ['card', 'planned-header', planned.isOver && 'card--danger'] },
        h(
          'div',
          { class: 'row row--between' },
          h(
            'p',
            { class: 'planned-header__text' },
            'Planificado ',
            h('strong', { class: planned.isOver ? 'text-danger' : '' }, formatMoney(planned.planned)),
            ` de ${formatMoney(planned.budget)}`,
          ),
          planned.isOver && OverBudgetAlert('Excede'),
        ),
        ProgressBar(planned.budget > 0 ? planned.planned / planned.budget : 1, planned.isOver),
      ),
    DayTabs({ totalDays, selected, onSelect: selectDay }),
    h('p', { class: 'text-muted itinerary__date' }, formatShortDate(selectedDate)),
    activities.length === 0
      ? h('p', { class: 'text-muted' }, 'No hay actividades este día.')
      : h('ul', { class: 'activity-list' }, activities.map((a) => ActivityItem(a, () => openActivityForm({ trip, services, activity: a })))),
    h(
      'button',
      { class: 'btn btn--secondary itinerary__add', type: 'button', onClick: () => openActivityForm({ trip, services, date: selectedDate }) },
      '+ Agregar actividad',
    ),
    detached.length > 0 &&
      CollapsibleSection(
        { title: 'Fuera del viaje', count: detached.length },
        h('p', { class: 'text-muted' }, 'Quedaron fuera al acortar el viaje. Cámbiales la fecha para devolverlas al itinerario o elimínalas. No cuentan en lo planificado.'),
        h(
          'ul',
          { class: 'activity-list' },
          detached.map((a) => ActivityItem(a, () => openActivityForm({ trip, services, activity: a }), true)),
        ),
      ),
  );
}

function ActivityItem(activity, onOpen, showDate = false) {
  return h(
    'li',
    {},
    h(
      'button',
      { class: 'activity-item', type: 'button', onClick: onOpen },
      h(
        'span',
        { class: 'activity-item__main' },
        h('span', { class: 'activity-item__time' }, `${activity.startTime}–${activity.endTime}`),
        h('span', { class: 'activity-item__title' }, activity.title),
      ),
      h(
        'span',
        { class: 'activity-item__meta' },
        h('span', { class: 'text-muted' }, `📍 ${activity.location}${showDate ? ` · ${formatShortDate(activity.date)}` : ''}`),
        h('span', { class: 'activity-item__cost' }, formatMoney(activity.estimatedCost)),
      ),
    ),
  );
}
