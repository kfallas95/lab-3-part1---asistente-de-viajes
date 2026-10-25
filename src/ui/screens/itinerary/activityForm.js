// Formulario de actividad (flujo 8.6): crear, editar, eliminar. Se abre como diálogo.
import { h } from '../../dom.js';
import { MoneyInput, parseMoneyInput } from '../../components/moneyInput.js';
import { TextField, showErrors } from '../../components/formField.js';
import { confirmDialog } from '../../components/confirmDialog.js';
import { centsToInputValue } from '../../../domain/money.js';

/**
 * @param {{trip:object, services:object, activity?:object|null, date?:string}} options
 *   activity = actividad a editar · date = fecha sugerida para una nueva
 */
export function openActivityForm({ trip, services, activity = null, date = trip.startDate }) {
  const activityService = services.activities;
  const isEdit = Boolean(activity);

  const title = TextField({ id: 'title', label: 'Título', value: activity?.title ?? '', placeholder: 'Coliseo' });
  const type = TextField({ id: 'type', label: 'Tipo (opcional)', value: activity?.type ?? '', placeholder: 'Museo, tour, comida…' });
  const dateField = TextField({
    id: 'date',
    label: 'Fecha',
    type: 'date',
    // Una actividad "Fuera del viaje" se reubica en una fecha válida (D-089).
    value: activity && !activity.isDetached ? activity.date : activity ? '' : date,
    min: trip.startDate,
    max: trip.endDate,
  });
  const start = TextField({ id: 'startTime', label: 'Inicio', type: 'time', value: activity?.startTime ?? '' });
  const end = TextField({ id: 'endTime', label: 'Fin', type: 'time', value: activity?.endTime ?? '' });
  const location = TextField({ id: 'location', label: 'Lugar', value: activity?.location ?? '', placeholder: 'Piazza del Colosseo' });
  const cost = MoneyInput({ id: 'estimatedCost', ariaLabel: 'Costo estimado en USD' });
  if (isEdit) cost.value = centsToInputValue(activity.estimatedCost);

  const form = h(
    'form',
    { class: 'activity-form', novalidate: true, onSubmit: submit },
    title,
    type,
    dateField,
    h('div', { class: 'field-row' }, start, end),
    location,
    h(
      'div',
      { class: 'field', dataset: { field: 'estimatedCost' } },
      h('label', { for: 'estimatedCost' }, 'Costo estimado (USD)'),
      h('div', { class: 'money-field' }, h('span', { class: 'money-field__prefix', 'aria-hidden': 'true' }, '$'), cost),
      h('small', { class: 'text-muted' }, 'Usa 0 si es gratis.'),
      h('small', { class: 'field-error', role: 'alert' }),
    ),
    h('p', { class: 'form-error', role: 'alert' }),
    h(
      'div',
      { class: 'dialog__actions' },
      isEdit && h('button', { class: 'btn btn--danger', type: 'button', onClick: remove }, 'Eliminar'),
      h('span', { class: 'spacer' }),
      h('button', { class: 'btn', type: 'submit' }, 'Guardar'),
    ),
  );

  const dialog = h(
    'dialog',
    { class: 'dialog dialog--sheet', 'aria-labelledby': 'activity-title' },
    h(
      'div',
      { class: 'row row--between' },
      h('h2', { id: 'activity-title', class: 'dialog__title' }, isEdit ? 'Editar actividad' : 'Nueva actividad'),
      h('button', { class: 'icon-button', type: 'button', 'aria-label': 'Cerrar', onClick: () => dialog.close() }, '✕'),
    ),
    form,
  );
  dialog.addEventListener('close', () => dialog.remove());
  document.body.appendChild(dialog);
  dialog.showModal();
  title.input.focus();

  function submit(event) {
    event.preventDefault();
    const result = activityService.save(
      trip.id,
      {
        title: title.input.value,
        type: type.input.value,
        date: dateField.input.value,
        startTime: start.input.value,
        endTime: end.input.value,
        location: location.input.value,
        estimatedCost: parseMoneyInput(cost.value),
      },
      activity?.id ?? null,
    );
    if (!result.ok) return showErrors(form, result.errors);
    dialog.close();
  }

  async function remove() {
    const confirmed = await confirmDialog({
      title: '¿Eliminar actividad?',
      message: `¿Eliminar '${activity.title}'?`,
      confirmLabel: 'Eliminar',
      danger: true,
    });
    if (!confirmed) return;
    const result = activityService.remove(activity.id);
    if (!result.ok) return showErrors(form, { form: result.error });
    dialog.close();
  }
}
