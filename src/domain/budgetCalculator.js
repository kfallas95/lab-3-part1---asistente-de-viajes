// Fórmulas del presupuesto (design §6). Todo en centavos USD (D-120, D-121).
// Son funciones puras: reciben los datos y "hoy"; nada se persiste (D-097, D-103).
import { CATEGORY_TOTAL_FIELD, DAILY_CATEGORIES, ExpenseCategory } from './types.js';
import { compareDates, daysBetween, totalDays } from './dates.js';
import { divideCents, sumCents } from './money.js';

/** Monto total asignado a una categoría diaria. */
export function categoryTotal(budget, category) {
  return budget[CATEGORY_TOTAL_FIELD[category]];
}

/** totalAmount = suma de las 6 categorías; opcionales nulos = 0 (INV-16, D-115). */
export function totalAmount(budget) {
  return sumCents([
    budget.foodTotal,
    budget.transportTotal,
    budget.activitiesTotal,
    budget.ticketsAmount,
    budget.lodgingAmount,
    budget.otherReserveAmount,
  ]);
}

/** Gastado en una categoría (todas las fechas). */
export function categorySpent(expenses, category) {
  return sumCents(expenses.filter((e) => e.category === category).map((e) => e.amount));
}

/** Gastado en una categoría antes de una fecha (sin incluirla). */
export function spentBefore(expenses, category, date) {
  return sumCents(
    expenses
      .filter((e) => e.category === category && compareDates(e.date, date) < 0)
      .map((e) => e.amount),
  );
}

/** Gastado en una categoría en una fecha exacta. */
export function spentOn(expenses, category, date) {
  return sumCents(
    expenses.filter((e) => e.category === category && e.date === date).map((e) => e.amount),
  );
}

/**
 * Daily{Cat}Limit (D-007, INV-06, INV-10, INV-12):
 * (Total de la categoría − gastado en días anteriores) ÷ días restantes (incluido hoy).
 * - Antes del viaje (PLANNED) da el límite que tendrá el día 1: total ÷ días totales.
 * - Después del viaje (FINISHED) no hay límite diario: devuelve null.
 * No cambia por los gastos de hoy.
 * @returns {number|null}
 */
export function dailyLimit(budget, expenses, trip, category, today) {
  if (compareDates(today, trip.endDate) > 0) return null;
  const day = compareDates(today, trip.startDate) < 0 ? trip.startDate : today;
  const remainingDays = daysBetween(day, trip.endDate) + 1;
  const available = categoryTotal(budget, category) - spentBefore(expenses, category, day);
  return divideCents(available, remainingDays);
}

/**
 * Daily{Cat}Remaining = Daily{Cat}Limit − gastos de la categoría de hoy (INV-07). Puede ser negativo.
 * @returns {number|null}
 */
export function dailyRemaining(budget, expenses, trip, category, today) {
  const limit = dailyLimit(budget, expenses, trip, category, today);
  if (limit === null) return null;
  const day = compareDates(today, trip.startDate) < 0 ? trip.startDate : today;
  return limit - spentOn(expenses, category, day);
}

/**
 * Límite y disponible de hoy para las 3 categorías diarias, más el total del día.
 * @returns {{FOOD:{limit:number,remaining:number}, TRANSPORT:{...}, ACTIVITIES:{...}, total:{limit:number,remaining:number}}|null}
 */
export function dailySnapshot(budget, expenses, trip, today) {
  if (compareDates(today, trip.endDate) > 0) return null;
  const snapshot = {};
  let totalLimit = 0;
  let totalRemaining = 0;
  for (const category of DAILY_CATEGORIES) {
    const limit = dailyLimit(budget, expenses, trip, category, today);
    const remaining = dailyRemaining(budget, expenses, trip, category, today);
    snapshot[category] = { limit, remaining };
    totalLimit += limit;
    totalRemaining += remaining;
  }
  snapshot.total = { limit: totalLimit, remaining: totalRemaining };
  return snapshot;
}

/** TotalTripSpent = ticketsAmount + lodgingAmount + Σ Expense.amount (INV-20). */
export function totalTripSpent(budget, expenses) {
  return sumCents([budget.ticketsAmount, budget.lodgingAmount, ...expenses.map((e) => e.amount)]);
}

/** Usado del fondo de imprevistos: Σ gastos OTHER. */
export function reserveUsed(expenses) {
  return categorySpent(expenses, ExpenseCategory.OTHER);
}

/** Saldo del fondo de imprevistos (INV-13). null si no existe el fondo. */
export function reserveRemaining(budget, expenses) {
  if (budget.otherReserveAmount === null || budget.otherReserveAmount === undefined) return null;
  return budget.otherReserveAmount - reserveUsed(expenses);
}

/** Σ estimatedCost de actividades no desasociadas (INV-24). */
export function plannedActivitiesTotal(activities) {
  return sumCents(activities.filter((a) => !a.isDetached).map((a) => a.estimatedCost));
}

/** ¿Lo planificado en actividades supera activitiesTotal? (D-050, solo alerta visual). */
export function isPlannedOverBudget(activities, budget) {
  return plannedActivitiesTotal(activities) > budget.activitiesTotal;
}

/** Sobrecosto: un disponible menor a cero activa la alerta visual (INV-09). */
export function isOverBudget(value) {
  return typeof value === 'number' && value < 0;
}

/** Límite diario que tendrá cada categoría en un viaje que aún no empieza (Hoy en PLANNED). */
export function initialDailyLimit(budget, trip, category) {
  return divideCents(categoryTotal(budget, category), totalDays(trip.startDate, trip.endDate));
}
