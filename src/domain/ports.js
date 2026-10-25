// Puertos: interfaces que define el dominio y que implementa la infraestructura
// (design §2.2, D-018, D-101). JavaScript no tiene interfaces, así que se documentan
// con JSDoc. La Fase 2 crea las implementaciones sobre LocalStorage y el navegador.

/**
 * @typedef {Object} TripRepository
 * @property {() => import('./types.js').Trip[]} getAll
 * @property {(id:string) => import('./types.js').Trip|null} getById
 * @property {(trip:import('./types.js').Trip) => void} save      crea o reemplaza por id
 * @property {(id:string) => void} delete
 */

/**
 * @typedef {Object} BudgetRepository
 * @property {(tripId:string) => import('./types.js').GlobalBudget|null} getByTripId
 * @property {(budget:import('./types.js').GlobalBudget) => void} save
 * @property {(tripId:string) => void} deleteByTripId
 */

/**
 * @typedef {Object} ExpenseRepository
 * @property {(tripId:string) => import('./types.js').Expense[]} getByTripId
 * @property {(expense:import('./types.js').Expense) => void} save
 * @property {(id:string) => void} delete
 * @property {(tripId:string) => void} deleteByTripId
 */

/**
 * @typedef {Object} ActivityRepository
 * @property {(tripId:string) => import('./types.js').Activity[]} getByTripId
 * @property {(activity:import('./types.js').Activity) => void} save
 * @property {(activities:import('./types.js').Activity[]) => void} saveMany
 * @property {(id:string) => void} delete
 * @property {(tripId:string) => void} deleteByTripId
 */

/**
 * Sin update: los resúmenes ya generados son inmutables (INV-26).
 * @typedef {Object} ForecastAlertRepository
 * @property {(tripId:string, date:string) => import('./types.js').DailyForecastAlert|null} getByTripAndDate
 * @property {(tripId:string) => import('./types.js').DailyForecastAlert[]} getByTripId
 * @property {(alert:import('./types.js').DailyForecastAlert) => void} create
 * @property {(tripId:string) => void} deleteByTripId
 */

/**
 * Reloj en hora local. Única fuente de "hoy" (design §2.2).
 * @typedef {Object} Clock
 * @property {() => Date} now
 * @property {() => string} today   YYYY-MM-DD
 */

/**
 * @typedef {Object} NotificationPort
 * @property {() => Promise<'granted'|'denied'|'default'|'unsupported'>} requestPermission
 * @property {(title:string, body:string) => void} notify
 */

/**
 * @typedef {Object} IdGenerator
 * @property {() => string} newId   UUID
 */

/** Nombres de los puertos; las implementaciones se registran en main.js (Fase 6). */
export const PORTS = Object.freeze([
  'TripRepository',
  'BudgetRepository',
  'ExpenseRepository',
  'ActivityRepository',
  'ForecastAlertRepository',
  'Clock',
  'NotificationPort',
  'IdGenerator',
]);
