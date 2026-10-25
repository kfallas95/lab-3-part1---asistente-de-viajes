// Generador de IDs UUID: implementa IdGenerator (design §2.2).
// crypto.randomUUID funciona en localhost / 127.0.0.1 (Live Server). Si no existe,
// se arma un UUID v4 con crypto.getRandomValues.

/** @returns {import('../domain/ports.js').IdGenerator} */
export function createIdGenerator() {
  return {
    newId() {
      if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
      const bytes = crypto.getRandomValues(new Uint8Array(16));
      bytes[6] = (bytes[6] & 0x0f) | 0x40; // versión 4
      bytes[8] = (bytes[8] & 0x3f) | 0x80; // variante RFC 4122
      const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
      return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
    },
  };
}
