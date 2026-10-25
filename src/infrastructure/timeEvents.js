// Eventos de tiempo del navegador (design §5.3, D-105):
// - al volver a primer plano (visibilitychange)
// - a una hora del día (00:00 para el cambio de día; 08:00 se usa en la Fase 11)
// Usa el Clock, así que también funciona con la fecha simulada (D-123).

/** Ejecuta `callback` cada vez que la pestaña vuelve a estar visible. */
export function onAppVisible(callback) {
  const handler = () => {
    if (document.visibilityState === 'visible') callback();
  };
  document.addEventListener('visibilitychange', handler);
  return () => document.removeEventListener('visibilitychange', handler);
}

/**
 * Ejecuta `callback` todos los días a la hora indicada (hora local del Clock).
 * @param {{now:() => Date}} clock
 * @param {number} hours 0–23
 * @param {number} minutes 0–59
 * @param {() => void} callback
 */
export function everyDayAt(clock, hours, minutes, callback) {
  let timer = null;
  const schedule = () => {
    const now = clock.now();
    const next = new Date(now);
    next.setHours(hours, minutes, 0, 0);
    if (next <= now) next.setDate(next.getDate() + 1);
    timer = setTimeout(() => {
      callback();
      schedule();
    }, next - now + 500); // medio segundo de margen para quedar ya en el nuevo minuto
  };
  schedule();
  return () => clearTimeout(timer);
}
