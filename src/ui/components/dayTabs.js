// DayTabs: pestañas Día 1…N (D-088). La pantalla decide el día inicial:
// hoy si el viaje está IN_PROGRESS; si no, Día 1.
import { h } from '../dom.js';

/**
 * @param {{totalDays:number, selected:number, onSelect:(day:number) => void, labelFor?:(day:number) => string}} props
 */
export function DayTabs({ totalDays, selected, onSelect, labelFor = (day) => `Día ${day}` }) {
  const tabs = h(
    'div',
    { class: 'tabs', role: 'tablist', 'aria-label': 'Días del viaje' },
    Array.from({ length: totalDays }, (_, i) => {
      const day = i + 1;
      return h(
        'button',
        {
          class: ['tab', day === selected && 'tab--active'],
          type: 'button',
          role: 'tab',
          'aria-selected': day === selected ? 'true' : 'false',
          onClick: () => onSelect(day),
        },
        labelFor(day),
      );
    }),
  );
  // Lleva la pestaña activa a la vista cuando hay muchos días.
  queueMicrotask(() => tabs.querySelector('.tab--active')?.scrollIntoView({ block: 'nearest', inline: 'center' }));
  return tabs;
}
