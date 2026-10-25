// Estado del viaje según la fecha local (D-032, D-100).
import { TripStatus } from './types.js';
import { compareDates } from './dates.js';

/**
 * PLANNED si hoy < inicio · IN_PROGRESS si inicio ≤ hoy ≤ fin · FINISHED si hoy > fin.
 * @param {{startDate:string, endDate:string}} trip
 * @param {string} today YYYY-MM-DD
 * @returns {'PLANNED'|'IN_PROGRESS'|'FINISHED'}
 */
export function statusFor(trip, today) {
  if (compareDates(today, trip.startDate) < 0) return TripStatus.PLANNED;
  if (compareDates(today, trip.endDate) > 0) return TripStatus.FINISHED;
  return TripStatus.IN_PROGRESS;
}
