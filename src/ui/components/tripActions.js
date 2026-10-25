// Acciones sobre un viaje: Duplicar (REQ-F-19) y Eliminar (REQ-F-20).
// Se usan desde el menú ⋯ de "Mis viajes" (TripActionsMenu) y desde Ajustes (D-092).
import { h } from '../dom.js';
import { navigate, toHash } from '../router.js';
import { TextField, showErrors } from './formField.js';
import { confirmDialog, infoDialog } from './confirmDialog.js';
import { formatShortDate } from '../../domain/dates.js';

/** Menú ⋯ de una tarjeta de viaje. */
export function openTripActionsMenu({ trip, services, clock }) {
  const dialog = h(
    'dialog',
    { class: 'dialog action-sheet', 'aria-label': `Acciones de ${trip.name}` },
    h('p', { class: 'action-sheet__title' }, trip.name),
    h('button', { class: 'action-sheet__item', type: 'button', onClick: () => { dialog.close(); openDuplicateDialog({ trip, services, clock }); } }, 'Duplicar'),
    h('button', { class: 'action-sheet__item action-sheet__item--danger', type: 'button', onClick: () => { dialog.close(); confirmDeleteTrip({ trip, services }); } }, 'Eliminar'),
    h('button', { class: 'action-sheet__item action-sheet__item--cancel', type: 'button', onClick: () => dialog.close() }, 'Cancelar'),
  );
  dialog.addEventListener('close', () => dialog.remove());
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  document.body.appendChild(dialog);
  dialog.showModal();
}

/**
 * Duplicar: nombre prellenado "Copia de {nombre}" (editable) y fechas nuevas (D-059).
 * Si el viaje nuevo es más corto, avisa qué actividades no se copiaron (D-058).
 */
export function openDuplicateDialog({ trip, services, clock }) {
  const name = TextField({ id: 'dup-name', label: 'Nombre', value: `Copia de ${trip.name}` });
  const start = TextField({ id: 'dup-start', label: 'Inicio', type: 'date', min: clock.today() });
  const end = TextField({ id: 'dup-end', label: 'Fin', type: 'date', min: clock.today() });
  start.input.addEventListener('change', () => {
    const min = start.input.value || clock.today();
    if (end.input.min !== min) end.input.min = min;
  });
  // Los errores del servicio usan las claves name / startDate / endDate.
  name.dataset.field = 'name';
  start.dataset.field = 'startDate';
  end.dataset.field = 'endDate';

  const form = h(
    'form',
    { novalidate: true, onSubmit: submit },
    h('p', { class: 'text-muted' }, 'Se copian el lugar, el presupuesto y las actividades. No se copian los gastos.'),
    name,
    h('div', { class: 'field-row' }, start, end),
    h('p', { class: 'form-error', role: 'alert' }),
    h(
      'div',
      { class: 'dialog__actions' },
      h('button', { class: 'btn btn--secondary', type: 'button', onClick: () => dialog.close() }, 'Cancelar'),
      h('button', { class: 'btn', type: 'submit' }, 'Duplicar'),
    ),
  );
  const dialog = h('dialog', { class: 'dialog dialog--sheet' }, h('h2', { class: 'dialog__title' }, 'Duplicar viaje'), form);
  dialog.addEventListener('close', () => dialog.remove());
  document.body.appendChild(dialog);
  dialog.showModal();
  name.input.focus();

  async function submit(event) {
    event.preventDefault();
    const result = services.trips.duplicate(trip.id, {
      name: name.input.value,
      startDate: start.input.value,
      endDate: end.input.value,
    });
    if (!result.ok) return showErrors(form, result.errors);
    dialog.close();
    if (result.excluded.length > 0) {
      await infoDialog({
        title: 'Algunas actividades no se copiaron',
        message: 'El viaje nuevo es más corto y estas actividades no caben en sus días:',
        items: result.excluded.map((a) => `${a.title} · ${formatShortDate(a.date)}`),
      });
    }
    navigate(toHash({ name: 'trip', tripId: result.trip.id })); // abre el viaje nuevo en su pestaña inicial
  }
}

/** Eliminar viaje con confirmación explícita (8.9). */
export async function confirmDeleteTrip({ trip, services }) {
  const confirmed = await confirmDialog({
    title: `¿Eliminar "${trip.name}"?`,
    message: 'Se eliminarán el viaje, su presupuesto, gastos, actividades y resúmenes. Esta acción no se puede deshacer.',
    confirmLabel: 'Eliminar',
    danger: true,
  });
  if (!confirmed) return;
  const result = services.trips.remove(trip.id);
  if (!result.ok) {
    await infoDialog({ title: 'No se pudo eliminar', message: result.error });
    return;
  }
  navigate('#/trips');
}
