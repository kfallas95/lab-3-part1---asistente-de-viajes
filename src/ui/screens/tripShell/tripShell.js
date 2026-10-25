// TripShell: contenedor de un viaje (D-061, design §3.5).
// Celular: encabezado + barra inferior (Hoy · Itinerario · Gastos · Resumen) + botón flotante (+).
// Computadora (≥ 768 px): menú lateral con las mismas opciones, "+ Gasto" y "Ajustes".
import { h } from '../../dom.js';
import { toHash } from '../../router.js';

export const NAV_ITEMS = Object.freeze([
  { tab: 'today', label: 'Hoy', icon: '☀' },
  { tab: 'itinerary', label: 'Itinerario', icon: '🗓' },
  { tab: 'expenses', label: 'Gastos', icon: '🧾' },
  { tab: 'summary', label: 'Resumen', icon: '📊' },
]);

/** Pestaña inicial según el estado del viaje (D-061). */
export function initialTabFor(status) {
  if (status === 'PLANNED') return 'itinerary';
  if (status === 'FINISHED') return 'summary';
  return 'today';
}

/**
 * @param {{trip:object, tab:string, content:Node, onAddExpense:() => void, addExpenseDisabled?:boolean, addExpenseHint?:string}} props
 */
export function TripShell({ trip, tab, content, onAddExpense, addExpenseDisabled = false, addExpenseHint = '' }) {
  const link = (target) => toHash({ name: 'trip', tripId: trip.id, tab: target });

  const navLinks = (variant) =>
    NAV_ITEMS.map(({ tab: target, label, icon }) =>
      h(
        'a',
        {
          class: ['nav-link', `nav-link--${variant}`, target === tab && 'nav-link--active'],
          href: link(target),
          'aria-current': target === tab ? 'page' : null,
        },
        h('span', { class: 'nav-link__icon', 'aria-hidden': 'true' }, icon),
        h('span', { class: 'nav-link__label' }, label),
      ),
    );

  const addButton = (variant) =>
    h(
      'button',
      {
        class: variant === 'fab' ? 'fab' : 'btn sidebar__add',
        type: 'button',
        disabled: addExpenseDisabled,
        title: addExpenseDisabled ? addExpenseHint : 'Registrar gasto',
        'aria-label': 'Registrar gasto',
        onClick: onAddExpense,
      },
      variant === 'fab' ? '+' : '+ Gasto',
    );

  return h(
    'div',
    { class: 'shell' },
    // Menú lateral (computadora)
    h(
      'aside',
      { class: 'sidebar' },
      h('a', { class: 'sidebar__back', href: '#/trips' }, '← Mis viajes'),
      h('p', { class: 'sidebar__trip' }, trip.name),
      h('nav', { class: 'sidebar__nav', 'aria-label': 'Secciones del viaje' }, navLinks('side')),
      addButton('side'),
      h(
        'a',
        { class: ['nav-link', 'nav-link--side', tab === 'settings' && 'nav-link--active'], href: link('settings') },
        h('span', { class: 'nav-link__icon', 'aria-hidden': 'true' }, '⚙'),
        h('span', { class: 'nav-link__label' }, 'Ajustes'),
      ),
    ),
    // Encabezado (celular)
    h(
      'header',
      { class: 'topbar' },
      h('a', { class: 'topbar__back', href: '#/trips', 'aria-label': 'Volver a Mis viajes' }, '←'),
      h('span', { class: 'topbar__title' }, trip.name),
      h('a', { class: 'topbar__settings', href: link('settings'), 'aria-label': 'Ajustes' }, '⚙'),
    ),
    h('main', { class: 'shell__content page' }, content),
    // Barra inferior y botón flotante (celular)
    h('nav', { class: 'bottom-nav', 'aria-label': 'Secciones del viaje' }, navLinks('bottom')),
    addButton('fab'),
  );
}

/** Vista cuando el id del viaje no existe. */
export function TripNotFound() {
  return h(
    'main',
    { class: 'page stack' },
    h('h1', {}, 'No encontramos este viaje'),
    h('div', { class: 'card' }, h('p', {}, 'Puede que se haya eliminado.'), h('a', { class: 'btn', href: '#/trips' }, 'Ir a Mis viajes')),
  );
}
