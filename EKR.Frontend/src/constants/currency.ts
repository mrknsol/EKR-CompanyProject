export type CurrencyCode = 'CNY' | 'USD' | 'EUR' | 'RUB' | 'AZN' | 'KZT';

export const CURRENCIES: {
  code: CurrencyCode;
  symbol: string;
  label: string;
  fromCny: number;
}[] = [
  { code: 'CNY', symbol: '¥', label: '¥ CNY', fromCny: 1 },
  { code: 'USD', symbol: '$', label: '$ USD', fromCny: 1 / 7.2 },
  { code: 'EUR', symbol: '€', label: '€ EUR', fromCny: 1 / 7.8 },
  { code: 'RUB', symbol: '₽', label: '₽ RUB', fromCny: 12 },
  { code: 'AZN', symbol: '₼', label: '₼ AZN', fromCny: 0.24 },
  { code: 'KZT', symbol: '₸', label: '₸ KZT', fromCny: 70 },
];

export function formatAmount(amountCny: number, currency: CurrencyCode) {
  const value = amountCny * (CURRENCIES.find((c) => c.code === currency)?.fromCny ?? 1);
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits:
      currency === 'KZT' || currency === 'RUB' || currency === 'CNY' ? 0 : 2,
  }).format(value);
}
