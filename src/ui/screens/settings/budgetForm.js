// Ajustes → Presupuesto (flujo 8.7). Montos en USD (D-120).
// Los campos bloqueados según el estado se muestran deshabilitados (D-039, D-081).
// Si una categoría queda por debajo de lo gastado, se avisa en la confirmación única (D-079, INV-15).
import { h } from '../../dom.js';
import { MoneyInput, parseMoneyInput } from '../../components/moneyInput.js';
import { showErrors } from '../../components/formField.js';
import { confirmDialog } from '../../components/confirmDialog.js';
import { centsToInputValue } from '../../../domain/money.js';
import { selectBudget } from '../../../state/selectors.js';
import { backToSettings } from './settingsScreen.js';

const DAILY_ROWS = [
  { label: 'Comida', total: 'foodTotal', cap: 'foodExpenseCap' },
  { label: 'Transporte', total: 'transportTotal', cap: 'transportExpenseCap' },
  { label: 'Actividades', total: 'activitiesTotal', cap: 'activitiesExpenseCap' },
];
const OPTIONAL_ROWS = [
  { label: 'Tiquetes', field: 'ticketsAmount' },
  { label: 'Hospedaje', field: 'lodgingAmount' },
  { label: 'Imprevistos', field: 'otherReserveAmount' },
];

export function BudgetForm({ state, trip, services }) {
  const budget = selectBudget(state, trip.id);
  const editable = services.budgets.editableFields(trip);
  const inputs = {};

  const cell = (field, label) => {
    const input = MoneyInput({ id: field, ariaLabel: label });
    input.value = budget[field] === null ? '' : centsToInputValue(budget[field]);
    input.disabled = !editable.includes(field);
    inputs[field] = input;
    return h(
      'div',
      { class: 'budget-cell', dataset: { field } },
      h('div', { class: 'money-field' }, h('span', { class: 'money-field__prefix', 'aria-hidden': 'true' }, '$'), input),
      h('small', { class: 'field-error', role: 'alert' }),
    );
  };

  const note =
    trip.status === 'FINISHED'
      ? 'El presupuesto de un viaje finalizado no se puede editar. El fondo de imprevistos solo se puede crear desde un gasto de Otros.'
      : trip.status === 'IN_PROGRESS'
        ? 'Durante el viaje, Tiquetes y Hospedaje no se pueden editar. Los cambios en Comida, Transporte y Actividades ajustan el límite desde hoy.'
        : 'Montos en USD.';

  const form = h(
    'form',
    { class: 'card', novalidate: true, onSubmit: submit },
    h('p', { class: 'text-muted' }, note),
    h('h2', { class: 'section-title' }, 'Diarias'),
    h(
      'div',
      { class: 'budget-grid' },
      h('span'),
      h('span', { class: 'budget-grid__head' }, 'Total'),
      h('span', { class: 'budget-grid__head' }, 'Tope por gasto'),
      DAILY_ROWS.map((r) => [
        h('label', { class: 'budget-grid__label', for: r.total }, r.label),
        cell(r.total, `Total de ${r.label}`),
        cell(r.cap, `Tope por gasto de ${r.label}`),
      ]),
    ),
    h('h2', { class: 'section-title' }, 'Opcionales'),
    h(
      'div',
      { class: 'budget-grid budget-grid--optional' },
      OPTIONAL_ROWS.map((r) => [h('label', { class: 'budget-grid__label', for: r.field }, r.label), cell(r.field, r.label)]),
    ),
    h('p', { class: 'form-error', role: 'alert' }),
    editable.length > 0 && h('div', { class: 'wizard__actions' }, h('span'), h('button', { class: 'btn', type: 'submit' }, 'Guardar')),
  );

  async function submit(event) {
    event.preventDefault();
    const input = Object.fromEntries(Object.entries(inputs).map(([field, el]) => [field, parseMoneyInput(el.value)]));
    const prepared = services.budgets.prepare(trip.id, input);
    if (!prepared.ok) return showErrors(form, prepared.errors);
    if (prepared.reasons.length > 0) {
      const confirmed = await confirmDialog({ title: '¿Confirmas el cambio de presupuesto?', reasons: prepared.reasons });
      if (!confirmed) return;
    }
    const result = services.budgets.save(prepared.budget);
    if (!result.ok) return showErrors(form, result.errors);
    backToSettings(trip);
  }

  return form;
}
