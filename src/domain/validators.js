// Validación estricta: el dato inválido se rechaza, nunca se corrige (D-002).
// Cada función devuelve { ok, errors }, donde errors es { campo: mensaje en español }.
import { DAILY_CATEGORIES, ExpenseCategory, TripStatus } from './types.js';
import {
  compareDates,
  compareTimes,
  findOverlappingTrip,
  formatDateRange,
  isValidDate,
  isValidTime,
  isWithin,
  minDate,
} from './dates.js';

export const MESSAGES = Object.freeze({
  required: 'Este campo es obligatorio.',
  positive: 'Solo se admiten valores numéricos positivos.',
  nonNegative: 'El costo no puede ser negativo.',
  invalidAmount: 'Ingresa un monto válido.',
  invalidDate: 'Ingresa una fecha válida.',
  invalidTime: 'Ingresa una hora válida (HH:MM).',
  startAfterEnd: 'La fecha de inicio no puede ser posterior a la fecha de fin.',
  startInPast: 'La fecha de inicio no puede ser anterior a hoy.',
  endInPast: 'La fecha de fin no puede ser anterior a hoy.',
  startLocked: 'No se puede cambiar la fecha de inicio de un viaje en curso.',
  datesLocked: 'Las fechas de un viaje finalizado no se pueden cambiar. Puedes duplicarlo.',
  endBeforeStart: 'La hora de fin debe ser posterior a la hora de inicio.',
  invalidCategory: 'Elige una categoría válida.',
  expenseDateRange: 'La fecha debe estar dentro del viaje y no puede ser futura.',
  activityDateRange: 'La fecha debe estar dentro del viaje.',
  expensesNotAllowed: 'Podrás registrar gastos cuando inicie tu viaje.',
});

function result(errors) {
  return { ok: Object.keys(errors).length === 0, errors };
}

/** Texto no vacío (INV-02). */
export function isNonEmpty(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

/** Monto en centavos > 0 (INV-01, REQ-F-06). */
export function isPositiveAmount(value) {
  return Number.isInteger(value) && value > 0;
}

/** Valida un monto obligatorio > 0. Devuelve el mensaje de error o null. */
function amountError(value) {
  if (value === null || value === undefined || value === '') return MESSAGES.required;
  if (!Number.isInteger(value)) return MESSAGES.invalidAmount;
  if (value <= 0) return MESSAGES.positive;
  return null;
}

/** Valida un monto opcional: null o > 0 (INV-17). */
function optionalAmountError(value) {
  if (value === null || value === undefined) return null;
  return amountError(value);
}

/** Mensaje de cruce de fechas (INV-29). */
export function overlapMessage(trip) {
  return `Estas fechas se cruzan con tu viaje a ${trip.place} (${formatDateRange(trip.startDate, trip.endDate, true)}).`;
}

/**
 * Datos del viaje al crear o duplicar (8.2, REQ-F-05, REQ-F-19, INV-28, INV-29).
 * @param {{name:string, place:string, country:string, startDate:string, endDate:string, preferences?:string|null}} data
 * @param {{today:string, trips:Array}} context trips = viajes existentes
 */
export function validateNewTrip(data, { today, trips }) {
  const errors = {};
  for (const field of ['name', 'place', 'country']) {
    if (!isNonEmpty(data[field])) errors[field] = MESSAGES.required;
  }
  validateRange(data, errors);
  if (!errors.startDate && compareDates(data.startDate, today) < 0) {
    errors.startDate = MESSAGES.startInPast;
  }
  if (!errors.startDate && !errors.endDate) {
    const other = findOverlappingTrip(data, trips);
    if (other) errors.startDate = overlapMessage(other);
  }
  return result(errors);
}

/** Datos descriptivos editables en cualquier estado (D-093). */
export function validateTripDetails(data) {
  const errors = {};
  for (const field of ['name', 'place', 'country']) {
    if (!isNonEmpty(data[field])) errors[field] = MESSAGES.required;
  }
  return result(errors);
}

/**
 * Cambio de fechas según el estado (8.3, D-071 a D-073, INV-29).
 * @param {object} trip viaje actual
 * @param {{startDate:string, endDate:string}} data fechas nuevas
 * @param {{today:string, trips:Array}} context
 */
export function validateDateChange(trip, data, { today, trips }) {
  const errors = {};
  if (trip.status === TripStatus.FINISHED) {
    errors.startDate = MESSAGES.datesLocked;
    return result(errors);
  }
  validateRange(data, errors);
  if (Object.keys(errors).length) return result(errors);

  if (trip.status === TripStatus.PLANNED && compareDates(data.startDate, today) < 0) {
    errors.startDate = MESSAGES.startInPast;
  }
  if (trip.status === TripStatus.IN_PROGRESS) {
    if (data.startDate !== trip.startDate) errors.startDate = MESSAGES.startLocked;
    if (compareDates(data.endDate, today) < 0) errors.endDate = MESSAGES.endInPast;
  }
  if (!Object.keys(errors).length) {
    const other = findOverlappingTrip(data, trips, trip.id);
    if (other) errors.startDate = overlapMessage(other);
  }
  return result(errors);
}

function validateRange(data, errors) {
  if (!isNonEmpty(data.startDate)) errors.startDate = MESSAGES.required;
  else if (!isValidDate(data.startDate)) errors.startDate = MESSAGES.invalidDate;
  if (!isNonEmpty(data.endDate)) errors.endDate = MESSAGES.required;
  else if (!isValidDate(data.endDate)) errors.endDate = MESSAGES.invalidDate;
  if (!errors.startDate && !errors.endDate && compareDates(data.startDate, data.endDate) > 0) {
    errors.endDate = MESSAGES.startAfterEnd;
  }
}

/**
 * Presupuesto en centavos (8.2 paso 2, 8.7): totales y topes diarios obligatorios > 0;
 * tiquetes, hospedaje e imprevistos opcionales > 0 (INV-01, INV-17, D-013).
 */
export function validateBudget(budget) {
  const errors = {};
  for (const field of [
    'foodTotal',
    'transportTotal',
    'activitiesTotal',
    'foodExpenseCap',
    'transportExpenseCap',
    'activitiesExpenseCap',
  ]) {
    const error = amountError(budget[field]);
    if (error) errors[field] = error;
  }
  for (const field of ['ticketsAmount', 'lodgingAmount', 'otherReserveAmount']) {
    const error = optionalAmountError(budget[field]);
    if (error) errors[field] = error;
  }
  return result(errors);
}

/**
 * Gasto (8.1, D-038, D-043, D-055, INV-01).
 * @param {{amount:number, category:string, concept:string, date:string}} expense
 * @param {{trip:object, today:string}} context
 */
export function validateExpense(expense, { trip, today }) {
  const errors = {};
  if (trip.status === TripStatus.PLANNED) {
    errors.form = MESSAGES.expensesNotAllowed;
    return result(errors);
  }
  const amount = amountError(expense.amount);
  if (amount) errors.amount = amount;
  if (!Object.values(ExpenseCategory).includes(expense.category)) {
    errors.category = MESSAGES.invalidCategory;
  }
  if (!isNonEmpty(expense.concept)) errors.concept = MESSAGES.required;
  if (!isNonEmpty(expense.date)) errors.date = MESSAGES.required;
  else if (!isValidDate(expense.date)) errors.date = MESSAGES.invalidDate;
  else if (!isWithin(expense.date, trip.startDate, minDate(today, trip.endDate))) {
    errors.date = MESSAGES.expenseDateRange;
  }
  return result(errors);
}

/**
 * Actividad (8.6, D-044, D-076, INV-21, INV-22).
 * @param {{title:string, type?:string|null, date:string, startTime:string, endTime:string, location:string, estimatedCost:number}} activity
 * @param {{trip:object}} context
 */
export function validateActivity(activity, { trip }) {
  const errors = {};
  if (!isNonEmpty(activity.title)) errors.title = MESSAGES.required;
  if (!isNonEmpty(activity.location)) errors.location = MESSAGES.required;

  if (!isNonEmpty(activity.date)) errors.date = MESSAGES.required;
  else if (!isValidDate(activity.date)) errors.date = MESSAGES.invalidDate;
  else if (!isWithin(activity.date, trip.startDate, trip.endDate)) errors.date = MESSAGES.activityDateRange;

  if (!isNonEmpty(activity.startTime)) errors.startTime = MESSAGES.required;
  else if (!isValidTime(activity.startTime)) errors.startTime = MESSAGES.invalidTime;
  if (!isNonEmpty(activity.endTime)) errors.endTime = MESSAGES.required;
  else if (!isValidTime(activity.endTime)) errors.endTime = MESSAGES.invalidTime;
  if (!errors.startTime && !errors.endTime && compareTimes(activity.endTime, activity.startTime) <= 0) {
    errors.endTime = MESSAGES.endBeforeStart;
  }

  const cost = activity.estimatedCost;
  if (cost === null || cost === undefined || cost === '') errors.estimatedCost = MESSAGES.required;
  else if (!Number.isInteger(cost)) errors.estimatedCost = MESSAGES.invalidAmount;
  else if (cost < 0) errors.estimatedCost = MESSAGES.nonNegative;
  return result(errors);
}

/** ¿La categoría es diaria (tiene límite y tope)? */
export function isDailyCategory(category) {
  return DAILY_CATEGORIES.includes(category);
}
