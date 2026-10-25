// Fechas del dominio. Las fechas se manejan como texto "YYYY-MM-DD" en hora local
// del cliente (D-100). Nunca se usa new Date("YYYY-MM-DD"), que se interpreta como UTC
// y en Costa Rica (UTC-6) daría el día anterior. Este módulo no lee la fecha del sistema:
// "hoy" siempre llega como parámetro (lo da Clock, D-101).

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const MS_PER_DAY = 86_400_000;

const MONTHS_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/**
 * @param {string} value
 * @returns {{year:number, month:number, day:number}|null}
 */
function parts(value) {
  const match = typeof value === 'string' ? DATE_PATTERN.exec(value) : null;
  if (!match) return null;
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
}

/** Número de día absoluto (sin horas ni zona horaria), para restar fechas. */
function dayIndex(value) {
  const p = parts(value);
  if (!p) throw new RangeError(`Fecha inválida: ${value}`);
  return Date.UTC(p.year, p.month - 1, p.day) / MS_PER_DAY;
}

/** ¿Es una fecha real con formato YYYY-MM-DD? (rechaza 2026-02-30). */
export function isValidDate(value) {
  const p = parts(value);
  if (!p) return false;
  const d = new Date(Date.UTC(p.year, p.month - 1, p.day));
  return d.getUTCFullYear() === p.year && d.getUTCMonth() === p.month - 1 && d.getUTCDate() === p.day;
}

/** ¿Es una hora válida HH:MM de 24 horas? */
export function isValidTime(value) {
  return typeof value === 'string' && TIME_PATTERN.test(value);
}

/**
 * Convierte un Date a "YYYY-MM-DD" usando sus componentes locales.
 * Lo usa la infraestructura (Clock) para entregar "hoy" al dominio.
 * @param {Date} date
 */
export function toDateString(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Días de a hasta b (b − a). Ej.: daysBetween('2026-11-05', '2026-11-09') = 4. */
export function daysBetween(a, b) {
  return dayIndex(b) - dayIndex(a);
}

/** Días Totales = Fecha Fin − Fecha Inicio + 1 (INV-04). */
export function totalDays(startDate, endDate) {
  return daysBetween(startDate, endDate) + 1;
}

/** Día relativo de una fecha dentro del viaje: date − startDate + 1 (derivado, D-117). */
export function dayNumber(date, startDate) {
  return daysBetween(startDate, date) + 1;
}

/** Suma n días a una fecha. */
export function addDays(date, n) {
  const d = new Date((dayIndex(date) + n) * MS_PER_DAY);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Compara fechas: negativo si a < b, 0 si son iguales, positivo si a > b. */
export function compareDates(a, b) {
  return dayIndex(a) - dayIndex(b);
}

/** ¿start ≤ date ≤ end? */
export function isWithin(date, start, end) {
  return compareDates(date, start) >= 0 && compareDates(date, end) <= 0;
}

/** La menor de dos fechas. */
export function minDate(a, b) {
  return compareDates(a, b) <= 0 ? a : b;
}

/** La mayor de dos fechas. */
export function maxDate(a, b) {
  return compareDates(a, b) >= 0 ? a : b;
}

/** ¿Se cruzan los rangos [aStart, aEnd] y [bStart, bEnd]? (INV-29). */
export function overlaps(aStart, aEnd, bStart, bEnd) {
  return compareDates(aStart, bEnd) <= 0 && compareDates(bStart, aEnd) <= 0;
}

/**
 * Primer viaje cuyas fechas se cruzan con el rango dado, ignorando el viaje con excludeId (INV-29).
 * @param {{startDate:string, endDate:string}} range
 * @param {Array<{id:string, startDate:string, endDate:string}>} trips
 * @param {string} [excludeId]
 */
export function findOverlappingTrip(range, trips, excludeId) {
  return trips.find(
    (t) => t.id !== excludeId && overlaps(range.startDate, range.endDate, t.startDate, t.endDate),
  ) ?? null;
}

/** Compara horas HH:MM (texto con ceros a la izquierda, se comparan como texto). */
export function compareTimes(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** "2026-11-05" → "5 nov 2026". */
export function formatShortDate(date) {
  const p = parts(date);
  if (!p) return date;
  return `${p.day} ${MONTHS_SHORT[p.month - 1]} ${p.year}`;
}

/** Rango corto para la interfaz: "5–9 nov", "28 nov – 2 dic", con año si se pide. */
export function formatDateRange(startDate, endDate, withYear = false) {
  const a = parts(startDate);
  const b = parts(endDate);
  if (!a || !b) return `${startDate} – ${endDate}`;
  const year = withYear ? ` ${b.year}` : '';
  if (a.year === b.year && a.month === b.month) {
    return `${a.day}–${b.day} ${MONTHS_SHORT[b.month - 1]}${year}`;
  }
  const startYear = withYear && a.year !== b.year ? ` ${a.year}` : '';
  return `${a.day} ${MONTHS_SHORT[a.month - 1]}${startYear} – ${b.day} ${MONTHS_SHORT[b.month - 1]}${year}`;
}
