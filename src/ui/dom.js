// Ayudantes para crear DOM sin framework (D-110).
// Se usa textContent en lugar de innerHTML para que los textos del cliente
// (nombres de viaje, conceptos) nunca se interpreten como HTML.

/**
 * Crea un elemento.
 * h('button', { class: 'btn', onClick: fn, disabled: true }, 'Guardar')
 * - Atributos que empiezan con "on" se registran como eventos.
 * - `class` acepta texto o arreglo (los valores vacíos se ignoran).
 * - `dataset` y `style` aceptan objetos.
 * - Los hijos pueden ser texto, números, nodos, arreglos, null o false (se ignoran).
 * @returns {HTMLElement}
 */
export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs ?? {})) {
    if (value === null || value === undefined || value === false) continue;
    if (key.startsWith('on') && typeof value === 'function') {
      el.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (key === 'class') {
      el.className = Array.isArray(value) ? value.filter(Boolean).join(' ') : value;
    } else if (key === 'dataset') {
      Object.assign(el.dataset, value);
    } else if (key === 'style' && typeof value === 'object') {
      Object.assign(el.style, value);
    } else if (key in el && typeof value !== 'string') {
      el[key] = value; // propiedades como value, checked, disabled
    } else if (value === true) {
      el.setAttribute(key, '');
    } else {
      el.setAttribute(key, String(value));
    }
  }
  append(el, children);
  return el;
}

function append(parent, children) {
  for (const child of children) {
    if (child === null || child === undefined || child === false) continue;
    if (Array.isArray(child)) append(parent, child);
    else if (child instanceof Node) parent.appendChild(child);
    else parent.appendChild(document.createTextNode(String(child)));
  }
}

/** Reemplaza el contenido de un elemento. */
export function mount(parent, ...children) {
  parent.replaceChildren();
  append(parent, children);
}
