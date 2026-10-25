// Arranque (design §5.2 paso 1): lee las entidades desde los repositorios y las carga en el store.
// LocalStorage es la fuente de verdad; el store es su copia en memoria (D-103).

/**
 * @param {{storage:object, repos:object, store:object, clock:object}} deps
 * @throws {import('../infrastructure/storage.js').StorageError} si los datos no se pueden leer
 */
export function hydrateStore({ storage, repos, store, clock }) {
  storage.init(); // crea lo que falte sin tocar lo existente; falla si hay datos dañados

  const trips = repos.trips.getAll();
  const byTrip = (repo) => trips.flatMap((t) => repo.getByTripId(t.id));
  const budgets = trips.map((t) => repos.budgets.getByTripId(t.id)).filter(Boolean);

  store.setState((state) => ({
    ...state,
    today: clock.today(),
    entities: {
      trips,
      budgets,
      activities: byTrip(repos.activities),
      expenses: byTrip(repos.expenses),
      forecastAlerts: byTrip(repos.forecastAlerts),
    },
  }));
}

/**
 * Cambio de día o vuelta a primer plano (design §5.3): actualiza "hoy" y el estado de los viajes.
 * Los límites del nuevo día se recalculan solos en los selectores (D-007, INV-10).
 */
export function refreshDay({ store, clock, tripService }) {
  const today = clock.today();
  if (store.getState().today !== today) store.setState({ today });
  tripService.refreshStatuses();
}
