// Crear viaje en 3 pasos: Datos · Presupuesto · Recordatorio (D-070, flujo 8.2, wireframe §2).
// El borrador vive en este módulo para que no se pierda si la pantalla se vuelve a dibujar;
// se descarta al guardar o al salir con "Cancelar".
import { h } from '../../dom.js';
import { navigate, toHash } from '../../router.js';
import { MoneyInput, parseMoneyInput } from '../../components/moneyInput.js';
import { TextField, Toggle, showErrors } from '../../components/formField.js';
import { formatMoney } from '../../../domain/money.js';

const DAILY_ROWS = [
  { label: 'Comida', total: 'foodTotal', cap: 'foodExpenseCap', key: 'FOOD' },
  { label: 'Transporte', total: 'transportTotal', cap: 'transportExpenseCap', key: 'TRANSPORT' },
  { label: 'Actividades', total: 'activitiesTotal', cap: 'activitiesExpenseCap', key: 'ACTIVITIES' },
];
const OPTIONAL_ROWS = [
  { label: 'Tiquetes', field: 'ticketsAmount' },
  { label: 'Hospedaje', field: 'lodgingAmount' },
  { label: 'Imprevistos', field: 'otherReserveAmount' },
];
const BUDGET_FIELDS = [...DAILY_ROWS.flatMap((r) => [r.total, r.cap]), ...OPTIONAL_ROWS.map((r) => r.field)];

let draft = newDraft();

function newDraft() {
  return {
    step: 1,
    trip: { name: '', place: '', country: '', startDate: '', endDate: '', preferences: '' },
    showPreferences: false,
    budget: Object.fromEntries(BUDGET_FIELDS.map((f) => [f, ''])), // texto tal como se escribe
    isReminderActive: true, // ON por defecto (D-068)
    pendingErrors: null, // errores que devolvió "Guardar" para mostrarlos en su paso
  };
}

/** Descarta el borrador (al cancelar o al guardar). */
export function resetTripDraft() {
  draft = newDraft();
}

export function TripCreateWizard({ services, clock }) {
  const tripService = services.trips;
  const steps = ['Datos', 'Presupuesto', 'Recordatorio'];
  const body =
    draft.step === 1 ? StepTripData(tripService, clock) : draft.step === 2 ? StepBudget(tripService) : StepReminder(tripService);

  return h(
    'section',
    { class: 'wizard' },
    h(
      'div',
      { class: 'row row--between page-header' },
      h('h1', {}, 'Nuevo viaje'),
      h('a', { href: '#/trips', class: 'link-muted', onClick: () => resetTripDraft() }, 'Cancelar'),
    ),
    h('p', { class: 'wizard__step text-muted' }, `Paso ${draft.step} de 3 · ${steps[draft.step - 1]}`),
    h('div', { class: 'wizard__progress' }, steps.map((_, i) => h('span', { class: ['wizard__dot', i < draft.step && 'wizard__dot--done'] }))),
    body,
  );
}

/** Montos del borrador convertidos a centavos (null vacío, NaN inválido). */
function draftBudgetCents() {
  return Object.fromEntries(BUDGET_FIELDS.map((f) => [f, parseMoneyInput(draft.budget[f])]));
}

/** Muestra los errores pendientes (si "Guardar" devolvió al cliente a este paso). */
function showPending(form) {
  if (!draft.pendingErrors) return;
  const errors = draft.pendingErrors;
  draft.pendingErrors = null;
  queueMicrotask(() => showErrors(form, errors));
}

function rerender() {
  // Vuelve a dibujar la ruta actual sin agregar historial.
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

// ---------- Paso 1 · Datos ----------

function StepTripData(tripService, clock) {
  const t = draft.trip;
  const name = TextField({ id: 'name', label: 'Nombre', value: t.name, placeholder: 'Roma 2026' });
  const place = TextField({ id: 'place', label: 'Lugar', value: t.place, placeholder: 'Roma' });
  const country = TextField({ id: 'country', label: 'País', value: t.country, placeholder: 'Italia' });
  const start = TextField({ id: 'startDate', label: 'Inicio', type: 'date', value: t.startDate, min: clock.today() });
  const end = TextField({ id: 'endDate', label: 'Fin', type: 'date', value: t.endDate, min: t.startDate || clock.today() });
  const preferences = TextField({ id: 'preferences', label: 'Preferencias (opcional)', value: t.preferences, multiline: true });
  const duration = h('p', { class: 'wizard__duration' });

  const sync = () => {
    Object.assign(draft.trip, {
      name: name.input.value,
      place: place.input.value,
      country: country.input.value,
      startDate: start.input.value,
      endDate: end.input.value,
      preferences: preferences.input.value,
    });
    const days = tripService.durationOf(start.input.value, end.input.value);
    duration.textContent = days ? `Duración: ${days} ${days === 1 ? 'día' : 'días'}` : '';
  };

  // El mínimo del campo Fin se actualiza solo cuando el cliente termina de elegir el inicio ("change").
  // Cambiarlo en cada tecla reiniciaba el campo Fin mientras se escribía la fecha a mano.
  start.input.addEventListener('change', () => {
    const min = start.input.value || clock.today();
    if (end.input.min !== min) end.input.min = min;
  });

  const prefToggle = h(
    'button',
    {
      type: 'button',
      class: 'link-button',
      onClick: () => {
        draft.showPreferences = true;
        prefToggle.replaceWith(preferences);
        preferences.input.focus();
      },
    },
    '+ Agregar preferencias',
  );

  const form = h(
    'form',
    {
      class: 'card',
      novalidate: true,
      onInput: sync,
      onSubmit: (event) => {
        event.preventDefault();
        sync();
        const check = tripService.validateTripData(draft.trip);
        if (showErrors(form, check.errors)) return;
        draft.step = 2;
        rerender();
      },
    },
    name,
    place,
    country,
    h('div', { class: 'field-row' }, start, end),
    draft.showPreferences || t.preferences ? preferences : prefToggle,
    duration,
    h('div', { class: 'wizard__actions' }, h('span'), h('button', { class: 'btn', type: 'submit' }, 'Siguiente →')),
  );
  sync();
  showPending(form);
  return form;
}

// ---------- Paso 2 · Presupuesto ----------

function StepBudget(tripService) {
  const inputs = {};
  const moneyInput = (field, label) => {
    const input = MoneyInput({ id: field, ariaLabel: label });
    input.value = draft.budget[field];
    inputs[field] = input;
    return h(
      'div',
      { class: 'budget-cell', dataset: { field } },
      h('div', { class: 'money-field' }, h('span', { class: 'money-field__prefix', 'aria-hidden': 'true' }, '$'), input),
      h('small', { class: 'field-error', role: 'alert' }),
    );
  };

  const totalText = h('p', { class: 'budget-preview__total' });
  const limitsText = h('p', { class: 'text-muted' });

  const readBudget = () => Object.fromEntries(BUDGET_FIELDS.map((f) => [f, inputs[f].getCents()]));

  const sync = () => {
    for (const f of BUDGET_FIELDS) draft.budget[f] = inputs[f].value;
    const preview = tripService.previewBudget(draft.trip, readBudget());
    totalText.textContent = `Total: ${formatMoney(preview.total)}`;
    limitsText.textContent = preview.dailyLimits
      ? 'Límite diario: ' +
        DAILY_ROWS.map((r) => `${r.label} ${formatMoney(preview.dailyLimits[r.key])}`).join(' · ')
      : '';
  };

  const form = h(
    'form',
    {
      class: 'card',
      novalidate: true,
      onInput: sync,
      onSubmit: (event) => {
        event.preventDefault();
        sync();
        const check = tripService.validateBudget(readBudget());
        if (showErrors(form, check.errors)) return;
        draft.step = 3;
        rerender();
      },
    },
    h('p', { class: 'text-muted' }, 'Montos en USD.'),
    h('h2', { class: 'section-title' }, 'Diarias'),
    h(
      'div',
      { class: 'budget-grid' },
      h('span'),
      h('span', { class: 'budget-grid__head' }, 'Total'),
      h('span', { class: 'budget-grid__head' }, 'Tope por gasto'),
      DAILY_ROWS.map((r) => [
        h('label', { class: 'budget-grid__label', for: r.total }, r.label),
        moneyInput(r.total, `Total de ${r.label}`),
        moneyInput(r.cap, `Tope por gasto de ${r.label}`),
      ]),
    ),
    h('h2', { class: 'section-title' }, 'Opcionales'),
    h(
      'div',
      { class: 'budget-grid budget-grid--optional' },
      OPTIONAL_ROWS.map((r) => [h('label', { class: 'budget-grid__label', for: r.field }, r.label), moneyInput(r.field, r.label)]),
    ),
    h('div', { class: 'budget-preview' }, totalText, limitsText),
    h(
      'div',
      { class: 'wizard__actions' },
      h('button', { class: 'btn btn--secondary', type: 'button', onClick: () => back(sync) }, '← Atrás'),
      h('button', { class: 'btn', type: 'submit' }, 'Siguiente →'),
    ),
  );
  sync();
  showPending(form);
  return form;
}

function back(sync) {
  sync();
  draft.step -= 1;
  rerender();
}

// ---------- Paso 3 · Recordatorio ----------

function StepReminder(tripService) {
  const toggle = Toggle({
    id: 'isReminderActive',
    label: 'Resumen matutino a las 08:00',
    checked: draft.isReminderActive,
    onChange: (checked) => (draft.isReminderActive = checked),
  });

  const form = h(
    'form',
    {
      class: 'card',
      novalidate: true,
      onSubmit: (event) => {
        event.preventDefault();
        const result = tripService.create({
          tripData: draft.trip,
          budgetData: draftBudgetCents(),
          isReminderActive: draft.isReminderActive,
        });
        if (!result.ok) {
          if (result.step !== 3) {
            draft.step = result.step;
            draft.pendingErrors = result.errors;
            rerender();
            return;
          }
          showErrors(form, result.errors);
          return;
        }
        resetTripDraft();
        navigate(toHash({ name: 'trip', tripId: result.trip.id })); // abre en su pestaña inicial (D-061)
      },
    },
    toggle,
    h('p', { class: 'text-muted' }, 'Te pediremos permiso para mostrar notificaciones. Si no lo das, igual verás el resumen al abrir la app.'),
    h('p', { class: 'form-error', role: 'alert' }),
    h(
      'div',
      { class: 'wizard__actions' },
      h('button', { class: 'btn btn--secondary', type: 'button', onClick: () => { draft.step = 2; rerender(); } }, '← Atrás'),
      h('button', { class: 'btn', type: 'submit' }, 'Guardar'),
    ),
  );
  return form;
}
