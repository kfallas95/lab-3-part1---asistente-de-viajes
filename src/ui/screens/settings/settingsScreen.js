// Pantalla "Ajustes" (D-092, D-093, wireframe §8). Cada opción abre su propia pantalla:
//   #/trip/{id}/settings/details · /dates · /budget
// También: Duplicar viaje (REQ-F-19) y Eliminar viaje (REQ-F-20, en rojo).
import { h } from '../../dom.js';
import { navigate, toHash } from '../../router.js';
import { Toggle } from '../../components/formField.js';
import { TripDetailsForm } from './tripDetailsForm.js';
import { DatesForm } from './datesForm.js';
import { BudgetForm } from './budgetForm.js';
import { confirmDeleteTrip, openDuplicateDialog } from '../../components/tripActions.js';

export function SettingsScreen(ctx) {
  const { trip, route, services, clock } = ctx;
  if (route.section === 'details') return withBack(trip, 'Datos del viaje', TripDetailsForm(ctx));
  if (route.section === 'dates') return withBack(trip, 'Fechas', DatesForm(ctx));
  if (route.section === 'budget') return withBack(trip, 'Presupuesto', BudgetForm(ctx));

  const link = (section, label, hint) =>
    h(
      'li',
      {},
      h(
        'a',
        { class: 'settings-item', href: toHash({ name: 'trip', tripId: trip.id, tab: 'settings', section }) },
        h('span', {}, label, hint && h('small', { class: 'text-muted settings-item__hint' }, hint)),
        h('span', { 'aria-hidden': 'true' }, '›'),
      ),
    );

  const reminder = Toggle({
    id: 'reminder',
    label: 'Recordatorio matutino',
    checked: trip.isReminderActive,
    onChange: (checked) => services.trips.setReminder(trip.id, checked),
  });

  return h(
    'section',
    {},
    h('h1', {}, `Ajustes · ${trip.name}`),
    h(
      'ul',
      { class: 'settings-list card' },
      link('details', 'Datos del viaje'),
      link('dates', 'Fechas', trip.status === 'FINISHED' ? 'Bloqueadas' : null),
      link('budget', 'Presupuesto', trip.status === 'FINISHED' ? 'Bloqueado' : null),
      h('li', { class: 'settings-item settings-item--toggle' }, reminder),
    ),
    h(
      'p',
      { class: 'text-muted settings-note' },
      'Con el recordatorio apagado no habrá notificación a las 08:00, pero el resumen se seguirá mostrando en Hoy.',
    ),
    h(
      'ul',
      { class: 'settings-list card settings-list--actions' },
      h(
        'li',
        {},
        h(
          'button',
          { class: 'settings-item settings-item--button', type: 'button', onClick: () => openDuplicateDialog({ trip, services, clock }) },
          h('span', {}, 'Duplicar viaje'),
          h('span', { 'aria-hidden': 'true' }, '›'),
        ),
      ),
      h(
        'li',
        {},
        h(
          'button',
          { class: 'settings-item settings-item--button settings-item--danger', type: 'button', onClick: () => confirmDeleteTrip({ trip, services }) },
          'Eliminar viaje',
        ),
      ),
    ),
  );
}

function withBack(trip, title, content) {
  return h(
    'section',
    {},
    h('a', { class: 'link-muted back-link', href: toHash({ name: 'trip', tripId: trip.id, tab: 'settings' }) }, '← Ajustes'),
    h('h1', {}, title),
    content,
  );
}

/** Vuelve a la lista de Ajustes después de guardar. */
export function backToSettings(trip) {
  navigate(toHash({ name: 'trip', tripId: trip.id, tab: 'settings' }));
}
