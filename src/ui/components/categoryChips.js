// CategoryChips: filtro Todos / Comida / Transporte / Actividades / Otros (D-090).
import { h } from '../dom.js';

export const CHIP_OPTIONS = Object.freeze([
  { value: 'ALL', label: 'Todos' },
  { value: 'FOOD', label: 'Comida' },
  { value: 'TRANSPORT', label: 'Transporte' },
  { value: 'ACTIVITIES', label: 'Actividades' },
  { value: 'OTHER', label: 'Otros' },
]);

/**
 * @param {{selected:string, onSelect:(value:string) => void}} props
 */
export function CategoryChips({ selected, onSelect }) {
  return h(
    'div',
    { class: 'chips', role: 'group', 'aria-label': 'Filtrar por categoría' },
    CHIP_OPTIONS.map(({ value, label }) =>
      h(
        'button',
        {
          class: ['chip', value === selected && 'chip--active'],
          type: 'button',
          'aria-pressed': value === selected ? 'true' : 'false',
          onClick: () => onSelect(value),
        },
        label,
      ),
    ),
  );
}
