// Formulario de gasto (flujo 8.1 registrar · 8.4 editar · 8.5 eliminar, wireframe §6).
// Se abre como diálogo sobre la pantalla actual, desde (+) / "+ Gasto" o al tocar un gasto.
import { h } from '../../dom.js';
import { MoneyInput, parseMoneyInput } from '../../components/moneyInput.js';
import { TextField, showErrors } from '../../components/formField.js';
import { confirmDialog } from '../../components/confirmDialog.js';
import { formatMoney, centsToInputValue } from '../../../domain/money.js';
import { EXPENSE_CATEGORY_LABELS, ExpenseCategory } from '../../../domain/types.js';

const CATEGORY_OPTIONS = [
  { value: ExpenseCategory.FOOD, label: 'Comida' },
  { value: ExpenseCategory.TRANSPORT, label: 'Transporte' },
  { value: ExpenseCategory.ACTIVITIES, label: 'Actividades' },
  { value: ExpenseCategory.OTHER, label: 'Otros' },
];

/**
 * @param {{trip:object, services:object, expense?:object|null}} options expense = gasto a editar
 */
export function openExpenseForm({ trip, services, expense = null }) {
  const expenseService = services.expenses;
  const isEdit = Boolean(expense);
  const range = expenseService.dateRange(trip);

  const amountInput = MoneyInput({ id: 'expense-amount', ariaLabel: 'Monto en USD' });
  if (isEdit) amountInput.value = centsToInputValue(expense.amount);

  const category = expense?.category ?? ExpenseCategory.FOOD;
  const categoryField = h(
    'fieldset',
    { class: 'field radio-group', dataset: { field: 'category' } },
    h('legend', {}, 'Categoría'),
    h(
      'div',
      { class: 'radio-group__options' },
      CATEGORY_OPTIONS.map(({ value, label }) =>
        h(
          'label',
          { class: 'radio' },
          h('input', { type: 'radio', name: 'expense-category', value, checked: value === category }),
          ` ${label}`,
        ),
      ),
    ),
    h('small', { class: 'field-error', role: 'alert' }),
  );

  const concept = TextField({ id: 'concept', label: 'Concepto', value: expense?.concept ?? '', placeholder: 'Cena en Trastevere' });
  const date = TextField({
    id: 'date',
    label: 'Fecha',
    type: 'date',
    value: expense?.date ?? expenseService.defaultDate(trip),
    min: range.min,
    max: range.max,
  });

  const form = h(
    'form',
    { class: 'expense-form', novalidate: true, onSubmit: submit },
    h(
      'div',
      { class: 'field', dataset: { field: 'amount' } },
      h('label', { for: 'expense-amount' }, 'Monto (USD)'),
      h('div', { class: 'money-field' }, h('span', { class: 'money-field__prefix', 'aria-hidden': 'true' }, '$'), amountInput),
      h('small', { class: 'field-error', role: 'alert' }),
    ),
    categoryField,
    concept,
    date,
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
    { class: 'dialog dialog--sheet', 'aria-labelledby': 'expense-title' },
    h(
      'div',
      { class: 'row row--between' },
      h('h2', { id: 'expense-title', class: 'dialog__title' }, isEdit ? 'Editar gasto' : 'Nuevo gasto'),
      h('button', { class: 'icon-button', type: 'button', 'aria-label': 'Cerrar', onClick: close }, '✕'),
    ),
    form,
  );
  dialog.addEventListener('close', () => dialog.remove());
  document.body.appendChild(dialog);
  dialog.showModal();
  amountInput.focus();

  function close() {
    dialog.close();
  }

  function readInput() {
    return {
      amount: parseMoneyInput(amountInput.value),
      category: form.querySelector('input[name="expense-category"]:checked')?.value ?? '',
      concept: concept.input.value,
      date: date.input.value,
    };
  }

  async function submit(event) {
    event.preventDefault();
    let prepared = expenseService.prepare(trip.id, readInput(), expense?.id ?? null);
    if (!prepared.ok) {
      showErrors(form, prepared.errors);
      return;
    }

    // Gasto OTHER sin fondo de imprevistos → pedir crearlo; si no lo crea, no se guarda (D-031, D-066).
    if (prepared.needsReserveFund) {
      const created = await askReserveFund(trip.id, expenseService);
      if (!created) return; // vuelve al formulario
      prepared = expenseService.prepare(trip.id, readInput(), expense?.id ?? null);
      if (!prepared.ok) return showErrors(form, prepared.errors);
    }

    // UNA sola confirmación con todos los motivos (INV-15). Cancelar → no se guarda.
    if (prepared.reasons.length > 0) {
      const confirmed = await confirmDialog({ title: '¿Confirmas este gasto?', reasons: prepared.reasons });
      if (!confirmed) return;
    }

    const result = expenseService.save(prepared.expense);
    if (!result.ok) return showErrors(form, { form: result.error });
    close();
  }

  async function remove() {
    const confirmed = await confirmDialog({
      title: '¿Eliminar gasto?',
      message: `¿Eliminar '${expense.concept}' (${formatMoney(expense.amount)})?`,
      confirmLabel: 'Eliminar',
      danger: true,
    });
    if (!confirmed) return;
    const result = expenseService.remove(expense.id);
    if (!result.ok) return showErrors(form, { form: result.error });
    close();
  }
}

/**
 * Aviso para crear el fondo de imprevistos (D-031). Devuelve true si se creó.
 */
function askReserveFund(tripId, expenseService) {
  return new Promise((resolve) => {
    const input = MoneyInput({ id: 'reserve-amount', ariaLabel: 'Monto del fondo en USD' });
    const field = h(
      'div',
      { class: 'field', dataset: { field: 'reserve' } },
      h('label', { for: 'reserve-amount' }, 'Monto del fondo (USD)'),
      h('div', { class: 'money-field' }, h('span', { class: 'money-field__prefix', 'aria-hidden': 'true' }, '$'), input),
      h('small', { class: 'field-error', role: 'alert' }),
    );
    let done = false;
    const finish = (value) => {
      if (done) return;
      done = true;
      dialog.close();
      dialog.remove();
      resolve(value);
    };
    const form = h(
      'form',
      {
        novalidate: true,
        onSubmit: (event) => {
          event.preventDefault();
          const result = expenseService.createReserveFund(tripId, parseMoneyInput(input.value));
          if (!result.ok) return showErrors(form, { reserve: result.error });
          finish(true);
        },
      },
      h('p', {}, `Este viaje no tiene fondo de ${EXPENSE_CATEGORY_LABELS.OTHER}. Créalo para registrar el gasto.`),
      field,
      h(
        'div',
        { class: 'dialog__actions' },
        h('button', { class: 'btn btn--secondary', type: 'button', onClick: () => finish(false) }, 'Cancelar'),
        h('button', { class: 'btn', type: 'submit' }, 'Crear fondo'),
      ),
    );
    const dialog = h('dialog', { class: 'dialog' }, h('h2', { class: 'dialog__title' }, 'Crear fondo de imprevistos'), form);
    dialog.addEventListener('cancel', (event) => {
      event.preventDefault();
      finish(false);
    });
    document.body.appendChild(dialog);
    dialog.showModal();
    input.focus();
  });
}
