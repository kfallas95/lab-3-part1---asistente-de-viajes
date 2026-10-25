// Plantilla fija del resumen matutino (D-033, D-083, 8.8). Sin inteligencia artificial.
import { formatMoney } from './money.js';

/**
 * "¡Buenos días! Para hoy en {place} tienes disponible: ${food} en Comida, ${transport} en
 *  Transporte y ${activities} en Actividades. Total disponible hoy: ${total} USD."
 * @param {{place:string, food:number, transport:number, activities:number, total:number}} data centavos
 * @returns {string}
 */
export function buildAssistantMessage({ place, food, transport, activities, total }) {
  return (
    `¡Buenos días! Para hoy en ${place} tienes disponible: ` +
    `${formatMoney(food)} en Comida, ${formatMoney(transport)} en Transporte y ` +
    `${formatMoney(activities)} en Actividades. Total disponible hoy: ${formatMoney(total)} USD.`
  );
}
