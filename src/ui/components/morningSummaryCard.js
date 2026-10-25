// MorningSummaryCard: tarjeta cerrable con el assistantMessage del día (REQ-F-02, D-062).
// Al cerrarla no vuelve a aparecer ese día mientras la app siga abierta (estado de UI, design §5.1).
import { h } from '../dom.js';

/**
 * @param {{message:string, onClose:() => void}} props
 */
export function MorningSummaryCard({ message, onClose }) {
  return h(
    'aside',
    { class: 'card morning-card', 'aria-label': 'Resumen matutino' },
    h(
      'div',
      { class: 'row row--between' },
      h('p', { class: 'morning-card__title' }, h('span', { 'aria-hidden': 'true' }, '☀ '), 'Buenos días'),
      h('button', { class: 'icon-button', type: 'button', 'aria-label': 'Cerrar resumen', onClick: onClose }, '✕'),
    ),
    h('p', { class: 'morning-card__text' }, message),
  );
}
