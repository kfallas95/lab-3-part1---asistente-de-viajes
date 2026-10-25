// Punto de entrada de la aplicación (D-113): crea las dependencias, carga los datos
// guardados y monta la interfaz.
// Fase 6: hidratación (design §5.2) y eventos de tiempo (design §5.3). Fase 7: gastos. Fase 8: actividades. Fase 10: ajustes. Fase 11: resumen matutino.
import { appStore } from './state/store.js';
import { mountApp } from './ui/app.js';
import { h, mount } from './ui/dom.js';
import { createStorage } from './infrastructure/storage.js';
import { createRepositories } from './infrastructure/repositories.js';
import { createSystemClock } from './infrastructure/clock.js';
import { createBrowserNotificationAdapter } from './infrastructure/notifications.js';
import { createIdGenerator } from './infrastructure/idGenerator.js';
import { everyDayAt, onAppVisible } from './infrastructure/timeEvents.js';
import { createTripService } from './application/tripService.js';
import { createExpenseService } from './application/expenseService.js';
import { createActivityService } from './application/activityService.js';
import { createBudgetService } from './application/budgetService.js';
import { createForecastService } from './application/forecastService.js';
import { hydrateStore, refreshDay } from './application/hydration.js';
import { SimulatedDateBanner } from './ui/components/simulatedDateBanner.js';

const root = document.getElementById('app');
const storage = createStorage();
const repos = createRepositories(storage);
const clock = createSystemClock();
const ids = createIdGenerator();
const notifications = createBrowserNotificationAdapter();

const services = {
  trips: createTripService({ repos, clock, ids, notifications, store: appStore }),
  expenses: createExpenseService({ repos, clock, ids, store: appStore }),
  activities: createActivityService({ repos, ids, store: appStore }),
  budgets: createBudgetService({ repos, store: appStore }),
  forecast: createForecastService({ repos, clock, ids, notifications, store: appStore }),
};

const banner = SimulatedDateBanner(clock);
if (banner) document.body.prepend(banner);

let loaded = false;
try {
  // 1. Hidratar el store desde LocalStorage.  2. Estado de cada viaje según la fecha (D-032, D-106).
  hydrateStore({ storage, repos, store: appStore, clock });
  services.trips.refreshStatuses();
  services.forecast.ensureTodayAlert(); // primera apertura después de las 08:00: solo la tarjeta (D-034)
  loaded = true;
} catch (error) {
  // Nunca se pierden datos en silencio (design §5.4): se muestra el problema y no se escribe nada.
  mount(
    root,
    h(
      'main',
      { class: 'page fatal-error' },
      h('h1', {}, 'No se pudieron cargar tus datos'),
      h('div', { class: 'card card--danger' }, h('p', {}, error.message)),
    ),
  );
  console.error(error);
}

if (loaded) {
  mountApp(root, { store: appStore, services, clock });

  // Eventos de tiempo (D-105):
  // - al volver a la app: cambio de día pendiente y resumen si ya pasaron las 08:00 (sin notificación)
  // - 00:00: cambio de día (D-100)
  // - 08:00 con la app abierta: resumen + notificación si el recordatorio está activo (REQ-F-02, D-035)
  const dayChange = () => refreshDay({ store: appStore, clock, tripService: services.trips });
  onAppVisible(() => {
    dayChange();
    services.forecast.ensureTodayAlert();
  });
  everyDayAt(clock, 0, 0, dayChange);
  everyDayAt(clock, 8, 0, () => services.forecast.ensureTodayAlert({ notify: true }));
}
