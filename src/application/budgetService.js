// Servicio de presupuesto: editar presupuesto (flujo 8.7, D-079 a D-081).
// Bloqueos por estado:
//   PLANNED     → todo editable (D-081)
//   IN_PROGRESS → montos diarios (INV-27), ExpenseCap (D-014) y fondo (D-028); tiquetes y hospedaje bloqueados (D-039)
//   FINISHED    → bloqueado (D-081); el fondo solo desde el aviso de un gasto OTHER (D-098, en expenseService)
// Los límites diarios y totalAmount se recalculan solos desde hoy en los selectores (INV-16, INV-27, D-065).
import { validateBudget } from '../domain/validators.js';
import { budgetConfirmationReasons } from '../domain/confirmationReasons.js';
import { reserveUsed } from '../domain/budgetCalculator.js';
import { upsertEntity } from '../state/store.js';

const ALL_FIELDS = [
  'foodTotal',
  'transportTotal',
  'activitiesTotal',
  'foodExpenseCap',
  'transportExpenseCap',
  'activitiesExpenseCap',
  'ticketsAmount',
  'lodgingAmount',
  'otherReserveAmount',
];

/** Campos que se pueden editar según el estado del viaje. */
export function editableBudgetFields(status) {
  if (status === 'PLANNED') return ALL_FIELDS;
  if (status === 'IN_PROGRESS') return ALL_FIELDS.filter((f) => f !== 'ticketsAmount' && f !== 'lodgingAmount');
  return [];
}

/**
 * @param {{repos:object, store:object}} deps
 */
export function createBudgetService({ repos, store }) {
  return {
    editableFields(trip) {
      return editableBudgetFields(trip.status);
    },

    /**
     * Paso 1: valida y calcula los motivos de la confirmación única (INV-15). No guarda nada.
     * @param {string} tripId
     * @param {object} input montos en centavos (los campos bloqueados se ignoran)
     * @returns {{ok:false, errors:object} | {ok:true, reasons:string[], budget:object}}
     */
    prepare(tripId, input) {
      const trip = repos.trips.getById(tripId);
      const oldBudget = repos.budgets.getByTripId(tripId);
      const editable = editableBudgetFields(trip.status);
      if (editable.length === 0) {
        return { ok: false, errors: { form: 'El presupuesto de un viaje finalizado no se puede editar.' } };
      }

      // Solo se toman los campos editables; los bloqueados conservan su valor (D-039, D-081).
      const newBudget = { ...oldBudget };
      for (const field of editable) newBudget[field] = input[field] ?? null;

      const check = validateBudget(newBudget);
      if (!check.ok) return { ok: false, errors: check.errors };

      const expenses = repos.expenses.getByTripId(tripId);
      // El fondo no se puede quitar si ya hay gastos en Otros / Imprevistos: quedarían sin fondo (INV-13).
      if (newBudget.otherReserveAmount === null && reserveUsed(expenses) > 0) {
        return {
          ok: false,
          errors: { otherReserveAmount: 'Ya tienes gastos en Otros / Imprevistos; el fondo no se puede quitar.' },
        };
      }

      const reasons = budgetConfirmationReasons({ newBudget, oldBudget, expenses }).map((r) => r.message);
      return { ok: true, reasons, budget: newBudget };
    },

    /** Paso 2: guarda (después de confirmar, si había motivos). No modifica gastos ni DailyForecastAlert. */
    save(budget) {
      try {
        repos.budgets.save(budget);
      } catch (error) {
        return { ok: false, errors: { form: error.message } };
      }
      store.setState((state) => upsertEntity(state, 'budgets', budget));
      return { ok: true };
    },
  };
}
