// Servicio de viajes (capa de aplicación, design §2.1).
// Orquesta los flujos: valida con el dominio, guarda con los repositorios y actualiza el store.
// No contiene fórmulas: esas viven en domain/.
import { initialDailyLimit, totalAmount } from '../domain/budgetCalculator.js';
import { addDays, compareDates, dayNumber, isValidDate, totalDays } from '../domain/dates.js';
import { statusFor } from '../domain/tripStatus.js';
import { DAILY_CATEGORIES } from '../domain/types.js';
import { validateBudget, validateDateChange, validateNewTrip, validateTripDetails } from '../domain/validators.js';
import { removeByTripId, removeEntity, upsertEntities, upsertEntity } from '../state/store.js';

/**
 * @param {{repos:ReturnType<import('../infrastructure/repositories.js').createRepositories>,
 *          clock:import('../domain/ports.js').Clock,
 *          ids:import('../domain/ports.js').IdGenerator,
 *          notifications:import('../domain/ports.js').NotificationPort,
 *          store:ReturnType<import('../state/store.js').createStore>}} deps
 */
export function createTripService({ repos, clock, ids, notifications, store }) {
  /** Guarda un viaje modificado en el repositorio y en el store. */
  function persistTrip(trip) {
    try {
      repos.trips.save(trip);
    } catch (error) {
      return { ok: false, errors: { form: error.message } };
    }
    store.setState((state) => upsertEntity(state, 'trips', trip));
    return { ok: true, trip };
  }

  return {
    /**
     * Paso 1 del wizard (8.2): obligatorios, inicio ≥ hoy (INV-28), inicio ≤ fin (REQ-F-05),
     * sin cruce con otros viajes (INV-29). Los viajes se leen del repositorio (fuente de verdad).
     */
    validateTripData(data) {
      return validateNewTrip(normalizeTripData(data), { today: clock.today(), trips: repos.trips.getAll() });
    },

    /** Duración en días para mostrarla en el paso 1 (INV-04); null si las fechas no son válidas. */
    durationOf(startDate, endDate) {
      if (!isValidDate(startDate) || !isValidDate(endDate)) return null;
      const days = totalDays(startDate, endDate);
      return days > 0 ? days : null;
    },

    /**
     * Vista previa del paso 2 (8.2): totalAmount (INV-16) y límite diario por categoría (INV-06).
     * Los montos vacíos o inválidos cuentan como 0 solo para la vista previa.
     */
    previewBudget(tripData, budget) {
      const clean = Object.fromEntries(
        Object.entries(budget).map(([key, value]) => [key, Number.isInteger(value) && value > 0 ? value : null]),
      );
      const days = this.durationOf(tripData.startDate, tripData.endDate);
      const totals = {
        foodTotal: clean.foodTotal ?? 0,
        transportTotal: clean.transportTotal ?? 0,
        activitiesTotal: clean.activitiesTotal ?? 0,
      };
      const dailyLimits = days
        ? Object.fromEntries(DAILY_CATEGORIES.map((c) => [c, initialDailyLimit(totals, tripData, c)]))
        : null;
      return { total: totalAmount(clean), dailyLimits };
    },

    /** Paso 2 del wizard: montos en centavos (INV-01, INV-17, D-013). */
    validateBudget(budget) {
      return validateBudget(budget);
    },

    /**
     * Recalcula el estado de cada viaje según la fecha local y guarda solo los que cambiaron (D-032, D-106).
     * Solo modifica `status`; ningún otro campo del viaje ni del presupuesto.
     * @returns {number} cantidad de viajes que cambiaron de estado
     */
    refreshStatuses() {
      const today = clock.today();
      let changed = 0;
      for (const trip of repos.trips.getAll()) {
        const status = statusFor(trip, today);
        if (status === trip.status) continue;
        const updated = { ...trip, status };
        repos.trips.save(updated);
        store.setState((state) => upsertEntity(state, 'trips', updated));
        changed += 1;
      }
      return changed;
    },

    /**
     * Datos descriptivos (name, place, country, preferences): editables en cualquier estado (D-093).
     * No toca fechas, montos ni gastos; los DailyForecastAlert ya generados conservan su texto (INV-26).
     */
    updateDetails(tripId, data) {
      const trip = repos.trips.getById(tripId);
      const clean = normalizeTripData({ ...trip, ...data });
      const check = validateTripDetails(clean);
      if (!check.ok) return { ok: false, errors: check.errors };
      const updated = { ...trip, name: clean.name, place: clean.place, country: clean.country, preferences: clean.preferences };
      return persistTrip(updated);
    },

    /**
     * Interruptor del recordatorio matutino (D-023). Al activarlo se pide permiso (D-068).
     * En OFF solo se apaga la notificación del navegador; la tarjeta en "Hoy" sigue (D-035).
     */
    setReminder(tripId, isActive) {
      if (isActive) notifications.requestPermission(); // dentro del clic del interruptor
      const trip = repos.trips.getById(tripId);
      return persistTrip({ ...trip, isReminderActive: Boolean(isActive) });
    },

    /**
     * Vista previa del cambio de fechas (8.3): valida según el estado y lista las actividades
     * que quedarían fuera del nuevo rango (REQ-F-13A). No guarda nada.
     * @returns {{ok:false, errors:object} | {ok:true, outOfRange:object[], plan:object}}
     */
    previewDateChange(tripId, data) {
      const trip = repos.trips.getById(tripId);
      const range = { startDate: data.startDate ?? '', endDate: data.endDate ?? '' };
      const check = validateDateChange(trip, range, { today: clock.today(), trips: repos.trips.getAll() });
      if (!check.ok) return { ok: false, errors: check.errors };

      const activities = repos.activities.getByTripId(tripId).filter((a) => !a.isDetached);
      const newDays = totalDays(range.startDate, range.endDate);
      const changed = [];
      const outOfRange = [];
      for (const activity of activities) {
        let date = activity.date;
        let detached = false;
        if (trip.status === 'PLANNED') {
          // Las actividades se mueven con el viaje conservando su día relativo (D-072).
          const relativeDay = dayNumber(activity.date, trip.startDate);
          date = addDays(range.startDate, relativeDay - 1);
          detached = relativeDay > newDays;
        } else {
          // IN_PROGRESS: solo cambia endDate; quedan fuera las de fecha > nuevo fin.
          detached = compareDates(activity.date, range.endDate) > 0;
        }
        if (date !== activity.date || detached) {
          const next = { ...activity, date, isDetached: detached };
          changed.push(next);
          if (detached) outOfRange.push(next);
        }
      }
      return { ok: true, outOfRange, plan: { trip, range, changed } };
    },

    /**
     * Aplica el cambio de fechas ya confirmado (8.3). Los límites diarios se recalculan solos
     * desde hoy en los selectores (REQ-F-13B, D-065). No modifica gastos ni DailyForecastAlert (INV-26).
     */
    applyDateChange({ trip, range, changed }) {
      const updated = { ...trip, startDate: range.startDate, endDate: range.endDate };
      updated.status = statusFor(updated, clock.today());
      try {
        repos.trips.save(updated);
        if (changed.length) repos.activities.saveMany(changed);
      } catch (error) {
        return { ok: false, errors: { form: error.message } };
      }
      store.setState((state) => upsertEntities(upsertEntity(state, 'trips', updated), 'activities', changed));
      return { ok: true, trip: updated };
    },

    /**
     * Duplicar viaje (REQ-F-19, D-057, D-058, D-095).
     * Se copian place, country, preferences, todo el presupuesto (montos, ExpenseCap, tiquetes,
     * hospedaje, fondo) y las actividades por día relativo desde el nuevo startDate.
     * No se copian fechas, gastos ni DailyForecastAlert. El estado se asigna según las fechas.
     * Las actividades "Fuera del viaje" del original se copian y siguen en esa sección (D-126).
     * @param {string} tripId viaje original (no se modifica)
     * @param {{name:string, startDate:string, endDate:string}} data
     * @returns {{ok:true, trip:object, excluded:object[]} | {ok:false, errors:object}}
     */
    duplicate(tripId, data) {
      const original = repos.trips.getById(tripId);
      const tripData = normalizeTripData({
        name: data.name,
        place: original.place,
        country: original.country,
        startDate: data.startDate,
        endDate: data.endDate,
        preferences: original.preferences,
      });
      const check = validateNewTrip(tripData, { today: clock.today(), trips: repos.trips.getAll() });
      if (!check.ok) return { ok: false, errors: check.errors };

      const trip = {
        id: ids.newId(),
        ...tripData,
        status: statusFor(tripData, clock.today()),
        isReminderActive: true, // el recordatorio inicia en ON al crear un viaje (D-068)
      };
      const budget = { ...repos.budgets.getByTripId(tripId), id: ids.newId(), tripId: trip.id };

      const newDays = totalDays(trip.startDate, trip.endDate);
      const activities = [];
      const excluded = [];
      for (const activity of repos.activities.getByTripId(tripId)) {
        const relativeDay = dayNumber(activity.date, original.startDate);
        if (activity.isDetached) {
          // Se copia como "Fuera del viaje", con la fecha desplazada igual que las demás (D-126).
          activities.push({ ...activity, id: ids.newId(), tripId: trip.id, date: addDays(trip.startDate, relativeDay - 1), isDetached: true });
          continue;
        }
        if (relativeDay > newDays) {
          excluded.push(activity); // no cabe en el viaje nuevo (D-058)
          continue;
        }
        activities.push({ ...activity, id: ids.newId(), tripId: trip.id, date: addDays(trip.startDate, relativeDay - 1) });
      }

      try {
        repos.trips.save(trip);
        try {
          repos.budgets.save(budget);
          if (activities.length) repos.activities.saveMany(activities);
        } catch (error) {
          repos.activities.deleteByTripId(trip.id);
          repos.budgets.deleteByTripId(trip.id);
          repos.trips.delete(trip.id); // no queda un viaje a medias
          throw error;
        }
      } catch (error) {
        return { ok: false, errors: { form: error.message } };
      }

      store.setState((state) =>
        upsertEntities(upsertEntity(upsertEntity(state, 'trips', trip), 'budgets', budget), 'activities', activities),
      );
      return { ok: true, trip, excluded };
    },

    /**
     * Eliminar viaje (REQ-F-20, flujo 8.9): el viaje y todos sus registros asociados
     * (presupuesto, gastos, actividades y resúmenes). Sus fechas quedan libres (INV-29).
     * Permitido en cualquier estado. No toca los datos de otros viajes.
     */
    remove(tripId) {
      try {
        repos.forecastAlerts.deleteByTripId(tripId);
        repos.expenses.deleteByTripId(tripId);
        repos.activities.deleteByTripId(tripId);
        repos.budgets.deleteByTripId(tripId);
        repos.trips.delete(tripId);
      } catch (error) {
        return { ok: false, error: error.message };
      }
      store.setState((state) => {
        let next = state;
        for (const collection of ['forecastAlerts', 'expenses', 'activities', 'budgets']) {
          next = removeByTripId(next, collection, tripId);
        }
        return removeEntity(next, 'trips', tripId);
      });
      return { ok: true };
    },

    /**
     * Crea el viaje (flujo 8.2). Vuelve a validar todo antes de guardar.
     * Si el recordatorio está activo, pide permiso de notificaciones (D-068); la respuesta no bloquea el guardado.
     * @returns {{ok:true, trip:object} | {ok:false, step:1|2|3, errors:object}}
     */
    create({ tripData, budgetData, isReminderActive = true }) {
      const data = normalizeTripData(tripData);
      const tripCheck = validateNewTrip(data, { today: clock.today(), trips: repos.trips.getAll() });
      if (!tripCheck.ok) return { ok: false, step: 1, errors: tripCheck.errors };
      const budgetCheck = validateBudget(budgetData);
      if (!budgetCheck.ok) return { ok: false, step: 2, errors: budgetCheck.errors };

      if (isReminderActive) notifications.requestPermission(); // dentro del clic de "Guardar"

      const trip = {
        id: ids.newId(),
        ...data,
        status: statusFor(data, clock.today()), // PLANNED, o IN_PROGRESS si empieza hoy (D-032, INV-28)
        isReminderActive: Boolean(isReminderActive),
      };
      const budget = {
        id: ids.newId(),
        tripId: trip.id,
        foodTotal: budgetData.foodTotal,
        transportTotal: budgetData.transportTotal,
        activitiesTotal: budgetData.activitiesTotal,
        ticketsAmount: budgetData.ticketsAmount ?? null,
        lodgingAmount: budgetData.lodgingAmount ?? null,
        otherReserveAmount: budgetData.otherReserveAmount ?? null,
        foodExpenseCap: budgetData.foodExpenseCap,
        transportExpenseCap: budgetData.transportExpenseCap,
        activitiesExpenseCap: budgetData.activitiesExpenseCap,
      };

      try {
        repos.trips.save(trip);
        try {
          repos.budgets.save(budget);
        } catch (error) {
          repos.trips.delete(trip.id); // sin presupuesto no queda un viaje a medias
          throw error;
        }
      } catch (error) {
        return { ok: false, step: 3, errors: { form: error.message } };
      }

      store.setState((state) => upsertEntity(upsertEntity(state, 'trips', trip), 'budgets', budget));
      return { ok: true, trip };
    },
  };
}

/** Quita espacios sobrantes; las preferencias vacías se guardan como null (D-045). */
function normalizeTripData(data) {
  const preferences = typeof data.preferences === 'string' ? data.preferences.trim() : '';
  return {
    name: (data.name ?? '').trim(),
    place: (data.place ?? '').trim(),
    country: (data.country ?? '').trim(),
    startDate: data.startDate ?? '',
    endDate: data.endDate ?? '',
    preferences: preferences === '' ? null : preferences,
  };
}
