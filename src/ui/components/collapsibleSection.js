// CollapsibleSection: sección plegable, usada para "Fuera del viaje" (D-089).
import { h } from '../dom.js';

/**
 * @param {{title:string, count?:number, open?:boolean}} props
 * @param {...Node} children
 */
export function CollapsibleSection({ title, count, open = false }, ...children) {
  return h(
    'details',
    { class: 'collapsible', open },
    h('summary', { class: 'collapsible__summary' }, count === undefined ? title : `${title} (${count})`),
    h('div', { class: 'collapsible__body' }, ...children),
  );
}
