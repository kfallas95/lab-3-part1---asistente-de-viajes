// Router por hash (D-122). Funciona con Live Server sin configuración:
// recargar conserva la pantalla y Atrás/Adelante del navegador navegan entre pantallas.
//
// Rutas:
//   #/trips                         Mis viajes
//   #/trips/new                     Crear viaje
//   #/trip/{id}                     abre el viaje en su pestaña inicial (D-061)
//   #/trip/{id}/{tab}               tab = today | itinerary | expenses | summary | settings
//   #/trip/{id}/settings/{section}  section = details | dates | budget (Ajustes, D-092)

export const TABS = Object.freeze(['today', 'itinerary', 'expenses', 'summary', 'settings']);
export const SETTINGS_SECTIONS = Object.freeze(['details', 'dates', 'budget']);

/**
 * Interpreta un hash. Siempre devuelve una ruta; lo desconocido va a Mis viajes.
 * @param {string} hash p. ej. "#/trip/abc/today"
 * @returns {{name:'trips'|'newTrip'|'trip', tripId?:string, tab?:string|null, section?:string|null}}
 */
export function parseHash(hash) {
  const parts = (hash || '').replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  if (parts[0] === 'trips' && parts[1] === 'new' && parts.length === 2) return { name: 'newTrip' };
  if (parts[0] === 'trip' && parts[1] && parts.length <= 3) {
    const tab = parts[2] ?? null;
    if (tab === null || TABS.includes(tab)) return { name: 'trip', tripId: parts[1], tab, section: null };
  }
  if (parts[0] === 'trip' && parts[1] && parts[2] === 'settings' && parts.length === 4 && SETTINGS_SECTIONS.includes(parts[3])) {
    return { name: 'trip', tripId: parts[1], tab: 'settings', section: parts[3] };
  }
  return { name: 'trips' };
}

/** Construye el hash de una ruta. */
export function toHash(route) {
  if (route.name === 'newTrip') return '#/trips/new';
  if (route.name === 'trip') {
    const base = `#/trip/${encodeURIComponent(route.tripId)}`;
    if (!route.tab) return base;
    return route.section ? `${base}/${route.tab}/${route.section}` : `${base}/${route.tab}`;
  }
  return '#/trips';
}

/** Navega a un hash. Con replace no agrega una entrada al historial (útil para redirecciones). */
export function navigate(hash, { replace = false } = {}) {
  if (window.location.hash === hash) return;
  if (replace) {
    const url = `${window.location.pathname}${window.location.search}${hash}`;
    window.history.replaceState(null, '', url);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  } else {
    window.location.hash = hash;
  }
}

/** Ruta actual. */
export function currentRoute() {
  return parseHash(window.location.hash);
}
