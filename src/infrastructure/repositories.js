// Repositorios sobre LocalStorage: implementan los puertos de domain/ports.js (D-018, D-101).
// Cada operación lee la colección, la modifica y la vuelve a escribir completa.
// Los objetos se copian al leer y al guardar para que nadie modifique el almacenamiento por referencia.
import { Collections } from './storage.js';

const copy = (value) => structuredClone(value);

function upsert(items, entity) {
  const index = items.findIndex((item) => item.id === entity.id);
  if (index === -1) items.push(copy(entity));
  else items[index] = copy(entity);
  return items;
}

/** @returns {import('../domain/ports.js').TripRepository} */
export function createTripRepository(storage) {
  const read = () => storage.readCollection(Collections.TRIPS);
  return {
    getAll: () => copy(read()),
    getById: (id) => copy(read().find((t) => t.id === id) ?? null),
    save: (trip) => storage.writeCollection(Collections.TRIPS, upsert(read(), trip)),
    delete: (id) => storage.writeCollection(Collections.TRIPS, read().filter((t) => t.id !== id)),
  };
}

/** @returns {import('../domain/ports.js').BudgetRepository} */
export function createBudgetRepository(storage) {
  const read = () => storage.readCollection(Collections.BUDGETS);
  return {
    getByTripId: (tripId) => copy(read().find((b) => b.tripId === tripId) ?? null),
    save: (budget) => storage.writeCollection(Collections.BUDGETS, upsert(read(), budget)),
    deleteByTripId: (tripId) =>
      storage.writeCollection(Collections.BUDGETS, read().filter((b) => b.tripId !== tripId)),
  };
}

/** @returns {import('../domain/ports.js').ExpenseRepository} */
export function createExpenseRepository(storage) {
  const read = () => storage.readCollection(Collections.EXPENSES);
  return {
    getByTripId: (tripId) => copy(read().filter((e) => e.tripId === tripId)),
    save: (expense) => storage.writeCollection(Collections.EXPENSES, upsert(read(), expense)),
    delete: (id) => storage.writeCollection(Collections.EXPENSES, read().filter((e) => e.id !== id)),
    deleteByTripId: (tripId) =>
      storage.writeCollection(Collections.EXPENSES, read().filter((e) => e.tripId !== tripId)),
  };
}

/** @returns {import('../domain/ports.js').ActivityRepository} */
export function createActivityRepository(storage) {
  const read = () => storage.readCollection(Collections.ACTIVITIES);
  return {
    getByTripId: (tripId) => copy(read().filter((a) => a.tripId === tripId)),
    save: (activity) => storage.writeCollection(Collections.ACTIVITIES, upsert(read(), activity)),
    saveMany: (activities) =>
      storage.writeCollection(
        Collections.ACTIVITIES,
        activities.reduce((items, activity) => upsert(items, activity), read()),
      ),
    delete: (id) => storage.writeCollection(Collections.ACTIVITIES, read().filter((a) => a.id !== id)),
    deleteByTripId: (tripId) =>
      storage.writeCollection(Collections.ACTIVITIES, read().filter((a) => a.tripId !== tripId)),
  };
}

/**
 * Sin update: un resumen ya generado es inmutable (INV-26) y hay uno por viaje por día.
 * @returns {import('../domain/ports.js').ForecastAlertRepository}
 */
export function createForecastAlertRepository(storage) {
  const read = () => storage.readCollection(Collections.FORECAST_ALERTS);
  return {
    getByTripAndDate: (tripId, date) =>
      copy(read().find((a) => a.tripId === tripId && a.date === date) ?? null),
    getByTripId: (tripId) => copy(read().filter((a) => a.tripId === tripId)),
    create: (alert) => {
      const items = read();
      if (items.some((a) => a.id === alert.id || (a.tripId === alert.tripId && a.date === alert.date))) {
        throw new Error('Ya existe un resumen matutino para este viaje y fecha; no se puede modificar (INV-26).');
      }
      items.push(copy(alert));
      storage.writeCollection(Collections.FORECAST_ALERTS, items);
    },
    deleteByTripId: (tripId) =>
      storage.writeCollection(Collections.FORECAST_ALERTS, read().filter((a) => a.tripId !== tripId)),
  };
}

/** Crea los 5 repositorios sobre un mismo almacenamiento. */
export function createRepositories(storage) {
  return {
    trips: createTripRepository(storage),
    budgets: createBudgetRepository(storage),
    expenses: createExpenseRepository(storage),
    activities: createActivityRepository(storage),
    forecastAlerts: createForecastAlertRepository(storage),
  };
}
