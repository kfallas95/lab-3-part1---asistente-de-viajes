// Adaptador de LocalStorage (D-104). Es el único módulo que conoce las claves
// y la serialización JSON (D-018). Nunca pierde datos en silencio: si algo falla,
// lanza StorageError con un mensaje para el cliente y no sobrescribe nada.

export const SCHEMA_VERSION = 1;

const PREFIX = 'travelAssistant:';

/** Colecciones y su clave en LocalStorage (design §5.4). */
export const Collections = Object.freeze({
  TRIPS: 'trips',
  BUDGETS: 'budgets',
  ACTIVITIES: 'activities',
  EXPENSES: 'expenses',
  FORECAST_ALERTS: 'forecastAlerts',
});

const META_KEY = `${PREFIX}meta`;

/** Error controlado del almacenamiento; `message` está en español para mostrarlo en la UI. */
export class StorageError extends Error {
  /**
   * @param {'UNAVAILABLE'|'CORRUPT'|'QUOTA'|'VERSION'} code
   * @param {string} message
   */
  constructor(code, message) {
    super(message);
    this.name = 'StorageError';
    this.code = code;
  }
}

/**
 * @param {Storage} [backend] por defecto window.localStorage
 */
export function createStorage(backend) {
  let store = backend;

  function getBackend() {
    if (store) return store;
    try {
      store = window.localStorage;
      const probe = `${PREFIX}probe`;
      store.setItem(probe, '1');
      store.removeItem(probe);
      return store;
    } catch {
      store = undefined;
      throw new StorageError(
        'UNAVAILABLE',
        'No se puede guardar información en este navegador. Revisa que el almacenamiento local no esté bloqueado.',
      );
    }
  }

  function readJson(key) {
    const raw = getBackend().getItem(key);
    if (raw === null) return null;
    try {
      return JSON.parse(raw);
    } catch {
      throw new StorageError(
        'CORRUPT',
        `Los datos guardados (${key}) están dañados y no se pueden leer. No se modificó nada.`,
      );
    }
  }

  function writeJson(key, value) {
    try {
      getBackend().setItem(key, JSON.stringify(value));
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new StorageError(
        'QUOTA',
        'No hay espacio suficiente para guardar. El cambio no se guardó.',
      );
    }
  }

  return {
    /**
     * Crea la metadata y las colecciones que falten, sin tocar las que ya existen.
     * Verifica que los datos guardados se puedan leer y que la versión sea compatible.
     */
    init() {
      const meta = readJson(META_KEY);
      if (meta === null) {
        writeJson(META_KEY, { schemaVersion: SCHEMA_VERSION });
      } else if (typeof meta.schemaVersion !== 'number' || meta.schemaVersion > SCHEMA_VERSION) {
        throw new StorageError(
          'VERSION',
          'Los datos guardados son de una versión más nueva de la app. No se modificó nada.',
        );
      }
      for (const name of Object.values(Collections)) {
        const key = PREFIX + name;
        const value = readJson(key);
        if (value === null) writeJson(key, []);
        else if (!Array.isArray(value)) {
          throw new StorageError('CORRUPT', `Los datos guardados (${key}) están dañados. No se modificó nada.`);
        }
      }
    },

    /** Lee una colección completa. Si no existe, devuelve []. */
    readCollection(name) {
      const key = PREFIX + name;
      const value = readJson(key);
      if (value === null) return [];
      if (!Array.isArray(value)) {
        throw new StorageError('CORRUPT', `Los datos guardados (${key}) están dañados. No se modificó nada.`);
      }
      return value;
    },

    /** Reemplaza una colección completa. */
    writeCollection(name, items) {
      if (readJson(META_KEY) === null) writeJson(META_KEY, { schemaVersion: SCHEMA_VERSION });
      writeJson(PREFIX + name, items);
    },

    /** Versión del esquema guardada, o null si todavía no hay datos. */
    schemaVersion() {
      return readJson(META_KEY)?.schemaVersion ?? null;
    },
  };
}
