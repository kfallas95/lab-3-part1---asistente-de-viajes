// Ajustes → Datos del viaje (D-093): name, place, country, preferences. Editable en cualquier estado.
import { h } from '../../dom.js';
import { TextField, showErrors } from '../../components/formField.js';
import { backToSettings } from './settingsScreen.js';

export function TripDetailsForm({ trip, services }) {
  const name = TextField({ id: 'name', label: 'Nombre', value: trip.name });
  const place = TextField({ id: 'place', label: 'Lugar', value: trip.place });
  const country = TextField({ id: 'country', label: 'País', value: trip.country });
  const preferences = TextField({ id: 'preferences', label: 'Preferencias (opcional)', value: trip.preferences ?? '', multiline: true });

  const form = h(
    'form',
    {
      class: 'card',
      novalidate: true,
      onSubmit: (event) => {
        event.preventDefault();
        const result = services.trips.updateDetails(trip.id, {
          name: name.input.value,
          place: place.input.value,
          country: country.input.value,
          preferences: preferences.input.value,
        });
        if (!result.ok) return showErrors(form, result.errors);
        backToSettings(trip);
      },
    },
    name,
    place,
    country,
    preferences,
    h('p', { class: 'form-error', role: 'alert' }),
    h('div', { class: 'wizard__actions' }, h('span'), h('button', { class: 'btn', type: 'submit' }, 'Guardar')),
  );
  return form;
}
