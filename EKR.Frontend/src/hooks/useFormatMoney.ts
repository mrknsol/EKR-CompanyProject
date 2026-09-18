import { useCallback } from 'react';
import { formatAmount } from '../constants/currency';
import { useAppSelector } from '../store/hooks';
import { selectCurrency } from '../store/slices/currencySlice';

export function useFormatMoney() {
  const currency = useAppSelector(selectCurrency);
  return useCallback(
    (amountCny: number) => formatAmount(amountCny, currency),
    [currency]
  );
}
