export const formatCurrency = (value, currency = "PEN") => {
  if (value === null || value === undefined || value === "") return "-";

  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency,
    minimumFractionDigits: 4,
    maximumFractionDigits: 6,
  }).format(Number(value));
};

export const calculateVariationPercent = (simulated, current) => {
  const simulatedValue = Number(simulated || 0);
  const currentValue = Number(current || 0);

  if (!currentValue) return null;

  return ((simulatedValue - currentValue) / currentValue) * 100;
};