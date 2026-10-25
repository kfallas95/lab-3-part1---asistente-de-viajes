// App: decide qué pantalla mostrar según la ruta (D-122) y el store, y vuelve a dibujar
// cuando cambia cualquiera de los dos. La UI solo lee selectores y llama servicios (design §2.1).
import { mount } from './dom.js';
import { currentRoute, navigate, toHash } from './router.js';
import { selectTripById } from '../state/selectors.js';
import { TripNotFound, TripShell, initialTabFor } from './screens/tripShell/tripShell.js';
import { TripListScreen } from './screens/tripList/tripListScreen.js';
import { TripCreateWizard } from './screens/tripCreate/tripCreateWizard.js';
import { TodayScreen } from './screens/today/todayScreen.js';
import { ExpensesScreen } from './screens/expenses/expensesScreen.js';
import { openExpenseForm } from './screens/expenses/expenseForm.js';
import { ItineraryScreen } from './screens/itinerary/itineraryScreen.js';
import { SummaryScreen } from './screens/summary/summaryScreen.js';
import { SettingsScreen } from './screens/settings/settingsScreen.js';

/**
 * Pantallas por ruta.
 * Una pantalla es una función (ctx) => Node.
 */
export const screens = {
  trips: TripListScreen,
  newTrip: TripCreateWizard,
  today: TodayScreen,
  itinerary: ItineraryScreen,
  expenses: ExpensesScreen,
  summary: SummaryScreen,
  settings: SettingsScreen,
};

/**
 * @param {HTMLElement} root
 * @param {{store:object, services:object, clock:object}} context
 */
export function mountApp(root, context) {
  const { store } = context;

  function render() {
    const route = currentRoute();
    const state = store.getState();
    const ctx = { ...context, state, route };

    if (route.name === 'trips') return mount(root, wrapPage(screens.trips(ctx)));
    if (route.name === 'newTrip') return mount(root, wrapPage(screens.newTrip(ctx)));

    const trip = selectTripById(state, route.tripId);
    if (!trip) return mount(root, TripNotFound());

    if (!route.tab) {
      // #/trip/{id} → pestaña inicial según el estado (D-061), sin dejar entrada extra en el historial.
      return navigate(toHash({ name: 'trip', tripId: trip.id, tab: initialTabFor(trip.status) }), { replace: true });
    }

    const content = screens[route.tab]({ ...ctx, trip });
    mount(
      root,
      TripShell({
        trip,
        tab: route.tab,
        content,
        // (+) desactivado mientras el viaje está PLANNED (D-066)
        addExpenseDisabled: trip.status === 'PLANNED',
        addExpenseHint: 'Podrás registrar gastos cuando inicie tu viaje',
        onAddExpense: () => openExpenseForm({ trip, services: context.services }),
      }),
    );
  }

  window.addEventListener('hashchange', render);
  const unsubscribe = store.subscribe(render);
  render();

  return () => {
    window.removeEventListener('hashchange', render);
    unsubscribe();
  };
}

function wrapPage(content) {
  const main = document.createElement('main');
  main.className = 'page';
  main.appendChild(content);
  return main;
}
