// Ajustes → Fechas (flujo 8.3, D-071 a D-073).
//   PLANNED     → inicio y fin editables (inicio ≥ hoy); las actividades se mueven con el viaje (D-072)
//   IN_PROGRESS → inicio bloqueado; solo fin, con fin ≥ hoy (D-071)
//   FINISHED    → fechas bloqueadas; para repetir, duplicar (D-073)
// Si el viaje se acorta, se listan las actividades que quedan fuera y el cliente confirma o cancela todo (REQ-F-13A).
import { h } from '../../dom.js';
import { TextField, showErrors } from '../../components/formField.js';
import { confirmDialog } from '../../components/confirmDialog.js';
import { formatShortDate } from '../../../domain/dates.js';
import { backToSettings } from './settingsScreen.js';

export function DatesForm({ trip, services, clock }) {
  const finished = trip.status === 'FINISHED';
  const inProgress = trip.status === 'IN_PROGRESS';

  const start = TextField({ id: 'startDate', label: 'Inicio', type: 'date', value: trip.startDate, min: clock.today() });
  const end = TextField({ id: 'endDate', label: 'Fin', type: 'date', value: trip.endDate, min: inProgress ? clock.today() : trip.startDate });
  start.input.disabled = finished || inProgress;
  end.input.disabled = finished;
  // El mínimo de "Fin" se actualiza solo al terminar de elegir el inicio (no en cada tecla).
  start.input.addEventListener('change', () => {
    const min = start.input.value || clock.today();
    if (end.input.min !== min) end.input.min = min;
  });

  const note = finished
    ? 'Las fechas de un viaje finalizado no se pueden cambiar. Para repetirlo, duplícalo.'
    : inProgress
      ? 'El viaje está en curso: solo puedes cambiar la fecha de fin, que no puede ser anterior a hoy.'
      : 'Las actividades se moverán con el viaje y conservarán su día (Día 1, Día 2…).';

  const form = h(
    'form',
    { class: 'card', novalidate: true, onSubmit: submit },
    h('p', { class: 'text-muted' }, note),
    h('div', { class: 'field-row' }, start, end),
    h('p', { class: 'form-error', role: 'alert' }),
    !finished && h('div', { class: 'wizard__actions' }, h('span'), h('button', { class: 'btn', type: 'submit' }, 'Guardar')),
  );

  async function submit(event) {
    event.preventDefault();
    const preview = services.trips.previewDateChange(trip.id, { startDate: start.input.value, endDate: end.input.value });
    if (!preview.ok) return showErrors(form, preview.errors);

    if (preview.outOfRange.length > 0) {
      const confirmed = await confirmDialog({
        title: 'Algunas actividades quedarán fuera del viaje',
        message: 'Pasarán a la sección "Fuera del viaje" del Itinerario, donde podrás cambiarles la fecha o eliminarlas.',
        reasons: preview.outOfRange.map((a) => `${a.title} · ${formatShortDate(a.date)}`),
        confirmLabel: 'Cambiar fechas',
      });
      if (!confirmed) return; // se cancela todo el cambio
    }

    const result = services.trips.applyDateChange(preview.plan);
    if (!result.ok) return showErrors(form, result.errors);
    backToSettings(trip);
  }

  return form;
}
