// src/utils/rounding.helper.js

/**
 * Redondea SIEMPRE hacia arriba a 2 decimales.
 *
 * Ejemplos:
 * 0.421  => 0.43
 * 0.4225 => 0.43
 * 10.001 => 10.01
 * 10.0   => 10.00
 */
function roundUpTwoDecimals(value) {
  return Math.ceil(Number(value || 0) * 100) / 100;
}

/**
 * Redondeo configurable hacia arriba.
 *
 * Ejemplo:
 * roundUp(1.2345, 3) => 1.235
 */
function roundUp(value, decimals = 2) {
  const factor = Math.pow(10, decimals);

  return Math.ceil(Number(value || 0) * factor) / factor;
}

/**
 * Formatea visualmente a 2 decimales.
 *
 * IMPORTANTE:
 * Solo para visualización.
 * No usar para cálculos financieros.
 */
function formatTwoDecimals(value) {
  return Number(value || 0).toFixed(2);
}

module.exports = {
  roundUpTwoDecimals,
  roundUp,
  formatTwoDecimals,
};