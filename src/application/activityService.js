// Servicio de actividades: crear, editar y eliminar (flujo 8.6, D-076 a D-078).
// Permitido en cualquier estado del viaje. Las actividades no afectan saldos ni límites:
// solo se comparan con activitiesTotal (D-050, INV-24).
import { validateActivity } from '../domain/validators.js';
import { removeEntity, upsertEntity } from '../state/store.js';

/**
 * @param {{repos:object, ids:object, store:object}} deps
 */
export function createActivityService({ repos, ids, store }) {
  return {
    /**
     * Crea o edita una actividad. Al guardarla con una fecha dentro del viaje vuelve al itinerario
     * (isDetached = false), también si venía de "Fuera del viaje" (D-089).
     * @param {string} tripId
     * @param {{title:string, type?:string, date:string, startTime:string, endTime:string, location:string, estimatedCost:number|null}} input
     *   estimatedCost en centavos USD
     * @param {string|null} [existingId]
     * @returns {{ok:true, activity:object} | {ok:false, errors:object}}
     */
    save(tripId, input, existingId = null) {
      const trip = repos.trips.getById(tripId);
      const check = validateActivity(input, { trip });
      if (!check.ok) return { ok: false, errors: check.errors };

      const type = typeof input.type === 'string' ? input.type.trim() : '';
      const activity = {
        id: existingId ?? ids.newId(),
        tripId,
        title: input.title.trim(),
        type: type === '' ? null : type, // opcional, texto libre (D-044, D-111)
        date: input.date,
        startTime: input.startTime,
        endTime: input.endTime,
        location: input.location.trim(),
        estimatedCost: input.estimatedCost,
        isDetached: false,
      };
      try {
        repos.activities.save(activity);
      } catch (error) {
        return { ok: false, errors: { form: error.message } };
      }
      store.setState((state) => upsertEntity(state, 'activities', activity));
      return { ok: true, activity };
    },

    /** Elimina una actividad (confirmación simple en la UI). */
    remove(activityId) {
      try {
        repos.activities.delete(activityId);
      } catch (error) {
        return { ok: false, error: error.message };
      }
      store.setState((state) => removeEntity(state, 'activities', activityId));
      return { ok: true };
    },
  };
}
