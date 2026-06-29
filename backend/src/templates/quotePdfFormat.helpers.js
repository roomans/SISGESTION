/**
 * Helpers para formato de cotización en PDF.
 *
 * Formato actual en BD:
 * COT + Secuencial + DDMMYY
 * Ejemplo: COT01130526
 *
 * Formato deseado en PDF:
 * Secuencial-DDMM-YYYY-TH
 * Ejemplo: 01-1305-2026-TH
 */

function formatQuoteNumberForPdf(quoteNumber, quoteDate) {
  if (!quoteNumber) return "";

  const clean = String(quoteNumber).trim().toUpperCase();

  // Caso esperado: COT01130526
  const match = clean.match(/^COT(\d{2})(\d{2})(\d{2})(\d{2})$/);

  if (match) {
    const [, sequence, day, month, yearYY] = match;
    return `${sequence}-${day}${month}-20${yearYY}-TH`;
  }

  // Fallback usando quote_date si el formato de número cambia en el futuro.
  if (quoteDate) {
    const date = new Date(quoteDate);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    const sequenceMatch = clean.match(/(\d{2})/);
    const sequence = sequenceMatch ? sequenceMatch[1] : clean;

    return `${sequence}-${day}${month}-${year}-TH`;
  }

  return clean;
}

function formatQuoteDateLongEs(quoteDate) {
  if (!quoteDate) return "";

  const date = new Date(quoteDate);

  const months = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  return `${day} de ${month} de ${year}`;
}

module.exports = {
  formatQuoteNumberForPdf,
  formatQuoteDateLongEs,
};
