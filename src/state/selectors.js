// Selectores: valores derivados del store (design §5.1, D-103).
// Solo combinan datos del store con las fórmulas del dominio; ninguna pantalla calcula.
// Están memoizados: si las entradas no cambiaron (misma referencia), devuelven el mismo resultado.
import {
  categorySpent,
  dailySnapshot,
  initialDailyLimit,
  plannedActivitiesTotal,
  reserveRemaining,
  reserveUsed,
  totalAmount,
  totalTripSpent,
} from '../domain/budgetCalculator.js';
import { compareDates, dayNumber, daysBetween, totalDays } from '../domain/dates.js';
import { DAILY_CATEGORIES, TripStatus } from '../domain/types.js';

/**
 * Memoiza por clave (normalmente el tripId). `deps(state, key)` devuelve las entradas;
 * si todas son las mismas referencias que la vez anterior, se reutiliza el resultado.
 */
function memoByKey(deps, compute) {
  const cache = new Map();
  return (state, key = '') => {
    const inputs = deps(state, key);
    const hit = cache.get(key);
    if (hit && hit.inputs.length === inputs.length && hit.inputs.every((v, i) => v === inputs[i])) {
      return hit.value;
    }
    const value = compute(...inputs);
    cache.set(key, { inputs, value });
    return value;
  };
}

// ---------- Básicos ----------

export const selectToday = (state) => state.today;
export const selectUi = (state) => state.ui;
export const selectTrips = (state) => state.entities.trips;

export const selectTripById = memoByKey(
  (state, tripId) => [state.entities.trips, tripId],
  (trips, tripId) => trips.find((t) => t.id === tripId) ?? null,
);

export const selectCurrentTrip = (state) => selectTripById(state, state.ui.currentTripId);

export const selectBudget = memoByKey(
  (state, tripId) => [state.entities.budgets, tripId],
  (budgets, tripId) => budgets.find((b) => b.tripId === tripId) ?? null,
);

export const selectExpenses = memoByKey(
  (state, tripId) => [state.entities.expenses, tripId],
  (expenses, tripId) => expenses.filter((e) => e.tripId === tripId),
);

export const selectActivities = memoByKey(
  (state, tripId) => [state.entities.activities, tripId],
  (activities, tripId) => activities.filter((a) => a.tripId === tripId),
);

export const selectForecastAlert = (state, tripId) =>
  state.entities.forecastAlerts.find((a) => a.tripId === tripId && a.date === state.today) ?? null;

// ---------- Mis viajes (D-085) ----------

/** En curso · Planificados (más próximo primero) · Finalizados (más reciente primero). */
export const selectTripsGrouped = memoByKey(
  (state) => [state.entities.trips],
  (trips) => ({
    inProgress: trips.filter((t) => t.status === TripStatus.IN_PROGRESS),
    planned: trips
      .filter((t) => t.status === TripStatus.PLANNED)
      .sort((a, b) => compareDates(a.startDate, b.startDate)),
    finished: trips
      .filter((t) => t.status === TripStatus.FINISHED)
      .sort((a, b) => compareDates(b.endDate, a.endDate)),
  }),
);

// ---------- Presupuesto del día (D-007, D-062) ----------

/** Límite y disponible de hoy por categoría diaria + total. null si el viaje ya terminó. */
export const selectDailySnapshot = memoByKey(
  (state, tripId) => [
    selectTripById(state, tripId),
    selectBudget(state, tripId),
    selectExpenses(state, tripId),
    state.today,
  ],
  (trip, budget, expenses, today) => {
    if (!trip || !budget || !today) return null;
    return dailySnapshot(budget, expenses, trip, today);
  },
);

/** Límite diario inicial por categoría (Hoy en PLANNED, paso 2 del wizard). */
export const selectInitialDailyLimits = memoByKey(
  (state, tripId) => [selectTripById(state, tripId), selectBudget(state, tripId)],
  (trip, budget) => {
    if (!trip || !budget) return null;
    return Object.fromEntries(DAILY_CATEGORIES.map((c) => [c, initialDailyLimit(budget, trip, c)]));
  },
);

/** "Día X de N" del viaje en curso. */
export const selectTripDay = memoByKey(
  (state, tripId) => [selectTripById(state, tripId), state.today],
  (trip, today) => {
    if (!trip || !today) return null;
    return { day: dayNumber(today, trip.startDate), total: totalDays(trip.startDate, trip.endDate) };
  },
);

// ---------- Resumen (D-091) ----------

export const selectTotals = memoByKey(
  (state, tripId) => [selectBudget(state, tripId), selectExpenses(state, tripId)],
  (budget, expenses) => {
    if (!budget) return null;
    const planned = totalAmount(budget);
    const spent = totalTripSpent(budget, expenses);
    return { planned, spent, left: planned - spent };
  },
);

export const selectCategoryBreakdown = memoByKey(
  (state, tripId) => [selectBudget(state, tripId), selectExpenses(state, tripId)],
  (budget, expenses) => {
    if (!budget) return null;
    return {
      FOOD: { spent: categorySpent(expenses, 'FOOD'), planned: budget.foodTotal },
      TRANSPORT: { spent: categorySpent(expenses, 'TRANSPORT'), planned: budget.transportTotal },
      ACTIVITIES: { spent: categorySpent(expenses, 'ACTIVITIES'), planned: budget.activitiesTotal },
      TICKETS: budget.ticketsAmount,
      LODGING: budget.lodgingAmount,
    };
  },
);

/** Fondo de imprevistos: null si no existe (D-025). */
export const selectReserve = memoByKey(
  (state, tripId) => [selectBudget(state, tripId), selectExpenses(state, tripId)],
  (budget, expenses) => {
    if (!budget || budget.otherReserveAmount === null) return null;
    return {
      amount: budget.otherReserveAmount,
      used: reserveUsed(expenses),
      remaining: reserveRemaining(budget, expenses),
    };
  },
);

// ---------- Itinerario (D-050, INV-24) ----------

export const selectPlannedVsBudget = memoByKey(
  (state, tripId) => [selectBudget(state, tripId), selectActivities(state, tripId)],
  (budget, activities) => {
    if (!budget) return null;
    const planned = plannedActivitiesTotal(activities);
    return { planned, budget: budget.activitiesTotal, isOver: planned > budget.activitiesTotal };
  },
);

/** Actividades de una fecha (no desasociadas), ordenadas por hora de inicio. Hoy: D-062. */
export const selectActivitiesOn = memoByKey(
  (state, key) => [selectActivities(state, key.split('|')[0]), key.split('|')[1]],
  (activities, date) =>
    activities
      .filter((a) => !a.isDetached && a.date === date)
      .sort((a, b) => (a.startTime < b.startTime ? -1 : a.startTime > b.startTime ? 1 : 0)),
);

/** Días que faltan para que empiece un viaje planificado. */
export const selectDaysUntilStart = (state, tripId) => {
  const trip = selectTripById(state, tripId);
  if (!trip || !state.today) return null;
  return daysBetween(state.today, trip.startDate);
};

/**
 * Gastos agrupados por día, el más reciente primero, con el total de cada día (D-090).
 * @param {string} key "tripId|filtro" donde filtro = ALL | FOOD | TRANSPORT | ACTIVITIES | OTHER
 * @returns {Array<{date:string, total:number, items:object[]}>}
 */
export const selectExpensesByDay = memoByKey(
  (state, key) => [selectExpenses(state, key.split('|')[0]), key.split('|')[1]],
  (expenses, filter) => {
    const shown = filter === 'ALL' ? expenses : expenses.filter((e) => e.category === filter);
    const groups = new Map();
    // El más reciente primero; dentro del día, el último registrado arriba.
    for (const expense of [...shown].reverse()) {
      if (!groups.has(expense.date)) groups.set(expense.date, []);
      groups.get(expense.date).push(expense);
    }
    return [...groups.entries()]
      .sort(([a], [b]) => compareDates(b, a))
      .map(([date, items]) => ({ date, items, total: items.reduce((sum, e) => sum + e.amount, 0) }));
  },
);

/** Actividades desasociadas al acortar el viaje: sección "Fuera del viaje" (REQ-F-13A, D-089). */
export const selectDetachedActivities = memoByKey(
  (state, tripId) => [selectActivities(state, tripId)],
  (activities) =>
    activities
      .filter((a) => a.isDetached)
      .sort((a, b) => compareDates(a.date, b.date) || (a.startTime < b.startTime ? -1 : a.startTime > b.startTime ? 1 : 0)),
);
