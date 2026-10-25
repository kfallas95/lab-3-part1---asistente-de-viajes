// Servicio de gastos: registrar (8.1), editar (8.4) y eliminar (8.5).
// El flujo tiene dos pasos para que la UI pueda mostrar UNA confirmación con todos los motivos (INV-15):
//   1. prepare(): valida y calcula los motivos, sin guardar nada.
//   2. save(): guarda (después de que el cliente confirma, si había motivos).
// Los límites, disponibles y TotalTripSpent se recalculan solos en los selectores (D-097, D-103).
import { MESSAGES, validateExpense } from '../domain/validators.js';
import { expenseConfirmationReasons, needsReserveFund } from '../domain/confirmationReasons.js';
import { minDate } from '../domain/dates.js';
import { removeEntity, upsertEntity } from '../state/store.js';

/**
 * @param {{repos:object, clock:object, ids:object, store:object}} deps
 */
export function createExpenseService({ repos, clock, ids, store }) {
  function context(tripId) {
    const trip = repos.trips.getById(tripId);
    const budget = repos.budgets.getByTripId(tripId);
    const expenses = repos.expenses.getByTripId(tripId);
    return { trip, budget, expenses, today: clock.today() };
  }

  return {
    /** Rango permitido para la fecha del gasto: startDate ≤ fecha ≤ min(hoy, endDate) (D-055). */
    dateRange(trip) {
      return { min: trip.startDate, max: minDate(clock.today(), trip.endDate) };
    },

    /** Fecha sugerida para un gasto nuevo: hoy, o el último día si el viaje ya terminó. */
    defaultDate(trip) {
      return minDate(clock.today(), trip.endDate);
    },

    /**
     * Paso 1: valida y calcula los motivos de confirmación. No guarda nada.
     * @param {string} tripId
     * @param {{amount:number|null, category:string, concept:string, date:string}} input monto en centavos
     * @param {string|null} [previousId] id del gasto si es una edición
     * @returns {{ok:false, errors:object} |
     *           {ok:true, needsReserveFund:boolean, reasons:string[], expense:object, previous:object|null}}
     */
    prepare(tripId, input, previousId = null) {
      const { trip, budget, expenses, today } = context(tripId);
      const check = validateExpense(input, { trip, today });
      if (!check.ok) return { ok: false, errors: check.errors };

      const previous = previousId ? expenses.find((e) => e.id === previousId) ?? null : null;
      const expense = {
        id: previous?.id ?? ids.newId(),
        tripId,
        amount: input.amount,
        category: input.category,
        concept: input.concept.trim(),
        date: input.date,
      };

      // Gasto OTHER sin fondo: primero hay que crearlo (D-031, D-098). No se calculan motivos todavía.
      if (needsReserveFund(expense, budget)) {
        return { ok: true, needsReserveFund: true, reasons: [], expense, previous };
      }

      const reasons = expenseConfirmationReasons({ expense, previous, budget, expenses, trip, today }).map((r) => r.message);
      return { ok: true, needsReserveFund: false, reasons, expense, previous };
    },

    /**
     * Crea (o ajusta) el fondo de imprevistos desde el aviso de un gasto OTHER.
     * Permitido también con el viaje FINISHED (D-098). Debe ser > 0 (INV-17).
     * @returns {{ok:true} | {ok:false, error:string}}
     */
    createReserveFund(tripId, amount) {
      if (amount === null || amount === undefined) return { ok: false, error: MESSAGES.required };
      if (!Number.isInteger(amount)) return { ok: false, error: MESSAGES.invalidAmount };
      if (amount <= 0) return { ok: false, error: MESSAGES.positive };
      const budget = repos.budgets.getByTripId(tripId);
      const updated = { ...budget, otherReserveAmount: amount };
      try {
        repos.budgets.save(updated);
      } catch (error) {
        return { ok: false, error: error.message };
      }
      store.setState((state) => upsertEntity(state, 'budgets', updated));
      return { ok: true };
    },

    /**
     * Paso 2: guarda el gasto ya preparado (y confirmado si tenía motivos).
     * No modifica presupuesto, actividades ni DailyForecastAlert (INV-26).
     * @returns {{ok:true} | {ok:false, error:string}}
     */
    save(expense) {
      try {
        repos.expenses.save(expense);
      } catch (error) {
        return { ok: false, error: error.message };
      }
      store.setState((state) => upsertEntity(state, 'expenses', expense));
      return { ok: true };
    },

    /** Elimina un gasto (8.5). Sin motivos de confirmación: eliminar siempre libera dinero. */
    remove(expenseId) {
      try {
        repos.expenses.delete(expenseId);
      } catch (error) {
        return { ok: false, error: error.message };
      }
      store.setState((state) => removeEntity(state, 'expenses', expenseId));
      return { ok: true };
    },
  };
}
