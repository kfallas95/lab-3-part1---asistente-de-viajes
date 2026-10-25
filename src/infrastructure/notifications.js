// Notificaciones del navegador: implementa NotificationPort (design §2.2).
// Solo se usa para el resumen matutino (D-008, REQ-F-02).

/** @returns {import('../domain/ports.js').NotificationPort} */
export function createBrowserNotificationAdapter() {
  const supported = typeof window !== 'undefined' && 'Notification' in window;

  return {
    /** Pide permiso. Si el navegador no tiene notificaciones, devuelve 'unsupported'. */
    async requestPermission() {
      if (!supported) return 'unsupported';
      if (Notification.permission !== 'default') return Notification.permission;
      try {
        return await Notification.requestPermission();
      } catch {
        return 'denied';
      }
    },

    /** Muestra la notificación solo si hay permiso; si no, no hace nada (el resumen igual sale en pantalla, D-068). */
    notify(title, body) {
      if (!supported || Notification.permission !== 'granted') return;
      try {
        new Notification(title, { body });
      } catch {
        // Algunos navegadores móviles no permiten notificaciones sin service worker; se ignora.
      }
    },
  };
}
