// Aviso visible cuando la app usa una fecha simulada (?today=…, D-123).
// Evita confundir una prueba con un error: p. ej. "mañana" parece una fecha pasada
// si la URL todavía tiene ?today= de una prueba anterior.
import { h } from '../dom.js';
import { formatShortDate } from '../../domain/dates.js';

/**
 * @param {{isSimulated:boolean, today:() => string, now:() => Date}} clock
 * @returns {HTMLElement|null}
 */
export function SimulatedDateBanner(clock) {
  if (!clock.isSimulated) return null;
  const time = clock.now().toTimeString().slice(0, 5);
  const realUrl = `${window.location.pathname}${window.location.hash}`;
  return h(
    'div',
    { class: 'sim-banner', role: 'status' },
    `Fecha simulada: ${formatShortDate(clock.today())}, ${time} · `,
    h('a', { href: realUrl }, 'Volver a la fecha real'),
  );
}
