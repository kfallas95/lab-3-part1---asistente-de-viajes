// Reloj del sistema en hora local: implementa el puerto Clock (design §2.2).
// Fecha simulada para pruebas manuales (D-123):
//   ?today=YYYY-MM-DD            → la app arranca en esa fecha, a la hora real actual
//   ?today=YYYY-MM-DD&time=HH:MM → arranca en esa fecha y hora
// El tiempo sigue avanzando desde ahí, así que se pueden probar las 00:00 y las 08:00
// (p. ej. time=07:59 y esperar un minuto). Sin parámetros se usa la fecha real.
import { isValidDate, isValidTime, toDateString } from '../domain/dates.js';

/**
 * Lee los parámetros de fecha simulada. Devuelve el Date de inicio o null.
 * @param {string} search p. ej. "?today=2026-11-06&time=07:59"
 * @param {Date} realNow
 */
export function parseSimulatedStart(search, realNow) {
  const params = new URLSearchParams(search);
  const today = params.get('today');
  if (!today) return null;
  if (!isValidDate(today)) {
    console.warn(`[Clock] ?today=${today} no es una fecha válida (YYYY-MM-DD). Se usa la fecha real.`);
    return null;
  }
  const time = params.get('time');
  if (time !== null && !isValidTime(time)) {
    console.warn(`[Clock] &time=${time} no es una hora válida (HH:MM). Se usa la hora real.`);
  }
  const [year, month, day] = today.split('-').map(Number);
  const [hours, minutes] =
    time !== null && isValidTime(time)
      ? time.split(':').map(Number)
      : [realNow.getHours(), realNow.getMinutes()];
  return new Date(year, month - 1, day, hours, minutes, realNow.getSeconds(), realNow.getMilliseconds());
}

/**
 * @param {{search?:string, nowFn?:() => number}} [options]
 * @returns {import('../domain/ports.js').Clock & {isSimulated:boolean}}
 */
export function createSystemClock({ search = window.location.search, nowFn = () => Date.now() } = {}) {
  const realNow = new Date(nowFn());
  const simulatedStart = parseSimulatedStart(search, realNow);
  const offset = simulatedStart ? simulatedStart.getTime() - realNow.getTime() : 0;

  if (simulatedStart) {
    console.info(`[Clock] Fecha simulada activa: ${simulatedStart.toLocaleString('es-CR')}`);
  }

  const now = () => new Date(nowFn() + offset);
  return {
    isSimulated: simulatedStart !== null,
    now,
    today: () => toDateString(now()),
  };
}
