// Motivos de la confirmación única (INV-15, D-015).
// Una operación reúne todos sus motivos y la UI los muestra en UN solo aviso.
// Si la lista está vacía, no hace falta confirmar.
import {
  CATEGORY_CAP_FIELD,
  CATEGORY_TOTAL_FIELD,
  DAILY_CATEGORIES,
  EXPENSE_CATEGORY_LABELS,
  ExpenseCategory,
  TripStatus,
} from './types.js';
import { categorySpent, dailyRemaining, reserveRemaining, reserveUsed } from './budgetCalculator.js';
import { formatMoney } from './money.js';

/**
 * @typedef {{code:string, message:string}} Reason
 * Códigos: EXPENSE_CAP · DAILY_NEGATIVE · RESERVE_NEGATIVE · CATEGORY_BELOW_SPENT
 */

/** Un gasto OTHER necesita que exista el fondo de imprevistos (D-031, INV-19). */
export function needsReserveFund(expense, budget) {
  return (
    expense.category === ExpenseCategory.OTHER &&
    (budget.otherReserveAmount === null || budget.otherReserveAmount === undefined)
  );
}

/**
 * Motivos al registrar o editar un gasto (8.1 paso 4 y 8.4).
 * Al editar se usa el impacto neto: se quita el gasto anterior y se agrega el nuevo,
 * y solo hay motivo si el resultado queda negativo Y empeora respecto de antes.
 * @param {{expense:object, previous?:object|null, budget:object, expenses:Array, trip:object, today:string}} input
 *   expenses = gastos actuales del viaje (incluye `previous` si es una edición)
 * @returns {Reason[]}
 */
export function expenseConfirmationReasons({ expense, previous = null, budget, expenses, trip, today }) {
  const reasons = [];
  const before = expenses;
  const after = expenses.filter((e) => !previous || e.id !== previous.id).concat(expense);
  const label = EXPENSE_CATEGORY_LABELS[expense.category];

  if (expense.category === ExpenseCategory.OTHER) {
    const reserveBefore = reserveRemaining(budget, before);
    const reserveAfter = reserveRemaining(budget, after);
    if (reserveAfter !== null && reserveAfter < 0 && reserveAfter < reserveBefore) {
      reasons.push({
        code: 'RESERVE_NEGATIVE',
        message: `Deja tu fondo de imprevistos en ${formatMoney(reserveAfter)}.`,
      });
    }
    return reasons;
  }

  // Tope por gasto: se revisa siempre, en cualquier fecha y estado (INV-14).
  const cap = budget[CATEGORY_CAP_FIELD[expense.category]];
  if (expense.amount > cap) {
    reasons.push({
      code: 'EXPENSE_CAP',
      message: `Supera tu tope de ${formatMoney(cap)} en ${label}.`,
    });
  }

  // Disponible de hoy: solo con el viaje en curso. En FINISHED solo se revisa el tope (8.1).
  if (trip.status === TripStatus.IN_PROGRESS) {
    const remainingBefore = dailyRemaining(budget, before, trip, expense.category, today);
    const remainingAfter = dailyRemaining(budget, after, trip, expense.category, today);
    if (remainingAfter < 0 && remainingAfter < remainingBefore) {
      const message =
        expense.date === today
          ? `Deja tu disponible de ${label} de hoy en ${formatMoney(remainingAfter)}.`
          : `Esto reduce tu disponible de ${label} de hoy a ${formatMoney(remainingAfter)}.`; // D-065
      reasons.push({ code: 'DAILY_NEGATIVE', message });
    }
  }
  return reasons;
}

/**
 * Motivos al editar el presupuesto (8.7, D-079).
 * Solo se avisa por los montos que cambiaron.
 * @param {{newBudget:object, oldBudget:object, expenses:Array}} input
 * @returns {Reason[]}
 */
export function budgetConfirmationReasons({ newBudget, oldBudget, expenses }) {
  const reasons = [];
  for (const category of DAILY_CATEGORIES) {
    const field = CATEGORY_TOTAL_FIELD[category];
    if (newBudget[field] === oldBudget[field]) continue;
    const spent = categorySpent(expenses, category);
    if (newBudget[field] < spent) {
      reasons.push({
        code: 'CATEGORY_BELOW_SPENT',
        message: `Ya gastaste ${formatMoney(spent)}; tu disponible de ${EXPENSE_CATEGORY_LABELS[category]} quedará en negativo.`,
      });
    }
  }

  const reserve = newBudget.otherReserveAmount;
  if (reserve !== null && reserve !== undefined && reserve !== oldBudget.otherReserveAmount) {
    const used = reserveUsed(expenses);
    if (reserve < used) {
      reasons.push({
        code: 'RESERVE_NEGATIVE',
        message: `Ya usaste ${formatMoney(used)} del fondo de imprevistos; quedará en ${formatMoney(reserve - used)}.`,
      });
    }
  }
  return reasons;
}
