// Resumen matutino (flujo 8.8, REQ-F-02, D-034, D-035, D-082, D-083).
// - Se genera a las 08:00 si la app está abierta, o en la primera apertura posterior a las 08:00.
// - Uno por viaje en curso por día; guarda el disponible del momento (D-082) y es inmutable (INV-26).
// - Notificación del navegador solo si se generó con la app abierta a las 08:00 y el recordatorio
//   está activo (D-035); en la primera apertura posterior solo se muestra la tarjeta en "Hoy" (D-062).
import { dailySnapshot } from '../domain/budgetCalculator.js';
import { buildAssistantMessage } from '../domain/forecastMessage.js';
import { statusFor } from '../domain/tripStatus.js';
import { TripStatus } from '../domain/types.js';
import { upsertEntity } from '../state/store.js';

export const SUMMARY_HOUR = 8;

/**
 * @param {{repos:object, clock:object, ids:object, notifications:object, store:object}} deps
 */
export function createForecastService({ repos, clock, ids, notifications, store }) {
  return {
    /**
     * Crea el DailyForecastAlert de hoy para el viaje en curso, si corresponde.
     * @param {{notify?:boolean}} [options] notify = true solo desde el temporizador de las 08:00
     * @returns {object[]} resúmenes creados (vacío si no correspondía)
     */
    ensureTodayAlert({ notify = false } = {}) {
      if (clock.now().getHours() < SUMMARY_HOUR) return [];
      const today = clock.today();
      const created = [];

      for (const trip of repos.trips.getAll()) {
        if (statusFor(trip, today) !== TripStatus.IN_PROGRESS) continue;
        if (repos.forecastAlerts.getByTripAndDate(trip.id, today)) continue; // ya existe: inmutable

        const budget = repos.budgets.getByTripId(trip.id);
        if (!budget) continue;
        const snapshot = dailySnapshot(budget, repos.expenses.getByTripId(trip.id), trip, today);
        const values = {
          food: snapshot.FOOD.remaining,
          transport: snapshot.TRANSPORT.remaining,
          activities: snapshot.ACTIVITIES.remaining,
          total: snapshot.total.remaining,
        };
        const alert = {
          id: ids.newId(),
          tripId: trip.id,
          date: today,
          generatedAt: clock.now().toISOString(), // momento real de generación (D-100)
          availableTodayFood: values.food,
          availableTodayTransport: values.transport,
          availableTodayActivities: values.activities,
          totalAvailableToday: values.total,
          assistantMessage: buildAssistantMessage({ place: trip.place, ...values }),
        };

        try {
          repos.forecastAlerts.create(alert);
        } catch (error) {
          console.error(error);
          continue;
        }
        store.setState((state) => upsertEntity(state, 'forecastAlerts', alert));
        created.push(alert);

        if (notify && trip.isReminderActive) {
          notifications.notify('Asistente de Viajes', alert.assistantMessage);
        }
      }
      return created;
    },
  };
}
