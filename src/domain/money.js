// Dinero: todo en USD (D-120) y guardado en centavos enteros (D-051, D-121).
// Redondeo al centavo: mitad hacia arriba (D-053, INV-25).

/**
 * Convierte dólares (número o texto con punto decimal) a centavos enteros.
 * Trabaja sobre el texto del número para evitar errores de punto flotante
 * (p. ej. 0.1 + 0.2 o 1.005 × 100).
 * @param {number|string} dollars
 * @returns {number} centavos, o NaN si el valor no es un número válido
 */
export function toCents(dollars) {
  let text;
  if (typeof dollars === 'number') {
    if (!Number.isFinite(dollars)) return NaN;
    text = String(dollars);
    if (/e/i.test(text)) text = dollars.toFixed(12);
  } else if (typeof dollars === 'string') {
    text = dollars.trim();
  } else {
    return NaN;
  }

  const match = /^(-?)(\d+)(?:\.(\d*))?$/.exec(text);
  if (!match) return NaN;

  const [, sign, whole, decimals = ''] = match;
  const firstTwo = (decimals + '00').slice(0, 2);
  const third = decimals.length > 2 ? Number(decimals[2]) : 0;

  let cents = Number(whole) * 100 + Number(firstTwo);
  if (third >= 5) cents += 1; // mitad hacia arriba (sobre el valor absoluto)
  return sign === '-' ? -cents : cents;
}

/**
 * Divide centavos y redondea al centavo, mitad hacia arriba (hacia +∞).
 * Usa aritmética entera, sin decimales intermedios.
 * @param {number} cents entero (puede ser negativo)
 * @param {number} divisor entero > 0
 * @returns {number}
 */
export function divideCents(cents, divisor) {
  if (!Number.isInteger(cents) || !Number.isInteger(divisor) || divisor <= 0) {
    throw new RangeError('divideCents requiere enteros y divisor > 0');
  }
  return Math.floor((2 * cents + divisor) / (2 * divisor));
}

/**
 * Formatea centavos como "$1 234.50"; negativos como "−$15.68". Siempre 2 decimales (INV-25).
 * @param {number} cents
 * @returns {string}
 */
export function formatMoney(cents) {
  const negative = cents < 0;
  const abs = Math.abs(Math.trunc(cents));
  const whole = Math.floor(abs / 100);
  const decimals = String(abs % 100).padStart(2, '0');
  const grouped = String(whole).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${negative ? '−' : ''}$${grouped}.${decimals}`;
}

/**
 * Centavos a dólares con 2 decimales, sin símbolo: 4568 → "45.68". Útil para prellenar campos.
 * @param {number} cents
 * @returns {string}
 */
export function centsToInputValue(cents) {
  const negative = cents < 0;
  const abs = Math.abs(cents);
  return `${negative ? '-' : ''}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, '0')}`;
}

/**
 * Suma montos ignorando null (los opcionales nulos cuentan como 0, INV-20).
 * @param {Array<number|null|undefined>} values
 * @returns {number}
 */
export function sumCents(values) {
  return values.reduce((total, value) => total + (value ?? 0), 0);
}
