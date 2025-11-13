export const safeNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : fallback;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
};

export const safeCurrency = (
  value: unknown,
  currencySymbol = '₹',
  fallback = 0
): string => {
  const amount = safeNumber(value, fallback);
  return `${currencySymbol}${amount.toLocaleString()}`;
};
