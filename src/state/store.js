// Store global en memoria (design §5, D-103).
// - Entidades: copia en memoria de lo que hay en LocalStorage (la fuente de verdad).
// - Estado global de UI: viaje abierto, pestaña, filtro, resumen cerrado hoy.
// - Nunca guarda valores derivados: esos los calculan los selectores.
// El estado es inmutable: cada cambio crea un objeto nuevo y se congela,
// así nadie puede modificar una entidad por accidente al leerla.

/** Estado inicial. `today` lo pone main.js con el Clock (Fase 6). */
export function createInitialState(today = null) {
  return {
    today,
    entities: {
      trips: [],
      budgets: [],
      activities: [],
      expenses: [],
      forecastAlerts: [],
    },
    ui: {
      currentTripId: null,
      activeTab: null,
      categoryFilter: 'ALL',
      /** { [tripId]: 'YYYY-MM-DD' } día en que se cerró la tarjeta del resumen matutino */
      dismissedSummary: {},
    },
  };
}

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const key of Object.keys(value)) deepFreeze(value[key]);
  }
  return value;
}

/**
 * @param {object} [initialState]
 */
export function createStore(initialState = createInitialState()) {
  let state = deepFreeze(structuredClone(initialState));
  const listeners = new Set();

  return {
    getState: () => state,

    /**
     * Reemplaza el estado. Recibe una función (estadoActual) => estadoNuevo,
     * o un objeto parcial que se mezcla en el primer nivel.
     */
    setState(update) {
      const next = typeof update === 'function' ? update(state) : { ...state, ...update };
      if (next === state) return;
      const previous = state;
      state = deepFreeze(next);
      for (const listener of [...listeners]) listener(state, previous);
    },

    /** Escucha cambios. Devuelve la función para dejar de escuchar. */
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

// ---------- Ayudantes para que los servicios actualicen entidades sin mutar ----------

/** Reemplaza (o agrega) una entidad por id en una colección. */
export function upsertEntity(state, collection, entity) {
  const list = state.entities[collection];
  const index = list.findIndex((item) => item.id === entity.id);
  const nextList = index === -1 ? [...list, entity] : list.map((item, i) => (i === index ? entity : item));
  return { ...state, entities: { ...state.entities, [collection]: nextList } };
}

/** Reemplaza (o agrega) varias entidades a la vez. */
export function upsertEntities(state, collection, entities) {
  return entities.reduce((acc, entity) => upsertEntity(acc, collection, entity), state);
}

/** Quita una entidad por id. */
export function removeEntity(state, collection, id) {
  const list = state.entities[collection];
  return { ...state, entities: { ...state.entities, [collection]: list.filter((item) => item.id !== id) } };
}

/** Quita todas las entidades de un viaje (eliminar viaje, 8.9). */
export function removeByTripId(state, collection, tripId) {
  const list = state.entities[collection];
  return { ...state, entities: { ...state.entities, [collection]: list.filter((item) => item.tripId !== tripId) } };
}

/** Cambia campos del estado de UI. */
export function setUi(state, changes) {
  return { ...state, ui: { ...state.ui, ...changes } };
}

/**
 * Store único de la aplicación. Al ser un módulo ES, cualquier import de este archivo
 * recibe la misma instancia (también desde la consola del navegador, útil para la verificación manual, D-112).
 */
export const appStore = createStore();
