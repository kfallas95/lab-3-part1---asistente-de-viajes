// Tipos y enumeraciones del dominio (CLAUDE.md §3, data-contract.json).
// Código en inglés; etiquetas de interfaz en español (D-019).

/** Estados del viaje (D-029). */
export const TripStatus = Object.freeze({
  PLANNED: 'PLANNED',
  IN_PROGRESS: 'IN_PROGRESS',
  FINISHED: 'FINISHED',
});

export const TRIP_STATUS_LABELS = Object.freeze({
  PLANNED: 'Planificado',
  IN_PROGRESS: 'En curso',
  FINISHED: 'Finalizado',
});

/** Categorías permitidas en Expense (D-038). */
export const ExpenseCategory = Object.freeze({
  FOOD: 'FOOD',
  TRANSPORT: 'TRANSPORT',
  ACTIVITIES: 'ACTIVITIES',
  OTHER: 'OTHER',
});

export const EXPENSE_CATEGORY_LABELS = Object.freeze({
  FOOD: 'Comida',
  TRANSPORT: 'Transporte',
  ACTIVITIES: 'Actividades',
  OTHER: 'Otros / Imprevistos',
});

/** Categorías diarias: tienen límite, disponible y ExpenseCap (D-010, D-013). */
export const DAILY_CATEGORIES = Object.freeze([
  ExpenseCategory.FOOD,
  ExpenseCategory.TRANSPORT,
  ExpenseCategory.ACTIVITIES,
]);

/** Campo de GlobalBudget con el total de cada categoría diaria. */
export const CATEGORY_TOTAL_FIELD = Object.freeze({
  FOOD: 'foodTotal',
  TRANSPORT: 'transportTotal',
  ACTIVITIES: 'activitiesTotal',
});

/** Campo de GlobalBudget con el ExpenseCap de cada categoría diaria (INV-14). */
export const CATEGORY_CAP_FIELD = Object.freeze({
  FOOD: 'foodExpenseCap',
  TRANSPORT: 'transportExpenseCap',
  ACTIVITIES: 'activitiesExpenseCap',
});

/**
 * Entidades del contrato de datos. Todos los montos son centavos USD enteros (D-120, D-121).
 *
 * @typedef {'PLANNED'|'IN_PROGRESS'|'FINISHED'} TripStatusValue
 * @typedef {'FOOD'|'TRANSPORT'|'ACTIVITIES'|'OTHER'} ExpenseCategoryValue
 *
 * @typedef {Object} Trip
 * @property {string} id
 * @property {string} name
 * @property {string} place
 * @property {string} country
 * @property {string} startDate   YYYY-MM-DD
 * @property {string} endDate     YYYY-MM-DD
 * @property {string|null} preferences
 * @property {TripStatusValue} status
 * @property {boolean} isReminderActive
 *
 * @typedef {Object} GlobalBudget
 * @property {string} id
 * @property {string} tripId
 * @property {number} foodTotal
 * @property {number} transportTotal
 * @property {number} activitiesTotal
 * @property {number|null} ticketsAmount
 * @property {number|null} lodgingAmount
 * @property {number|null} otherReserveAmount
 * @property {number} foodExpenseCap
 * @property {number} transportExpenseCap
 * @property {number} activitiesExpenseCap
 *
 * @typedef {Object} Activity
 * @property {string} id
 * @property {string} tripId
 * @property {string} title
 * @property {string|null} type
 * @property {string} date        YYYY-MM-DD
 * @property {string} startTime   HH:MM
 * @property {string} endTime     HH:MM
 * @property {string} location
 * @property {number} estimatedCost
 * @property {boolean} isDetached
 *
 * @typedef {Object} Expense
 * @property {string} id
 * @property {string} tripId
 * @property {number} amount
 * @property {ExpenseCategoryValue} category
 * @property {string} concept
 * @property {string} date        YYYY-MM-DD
 *
 * @typedef {Object} DailyForecastAlert
 * @property {string} id
 * @property {string} tripId
 * @property {string} date
 * @property {string} generatedAt ISO date-time
 * @property {number} availableTodayFood
 * @property {number} availableTodayTransport
 * @property {number} availableTodayActivities
 * @property {number} totalAvailableToday
 * @property {string} assistantMessage
 */
