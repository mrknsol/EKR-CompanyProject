import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { CurrencyCode } from '../../constants/currency';

interface CurrencyState {
  currency: CurrencyCode;
}

const initialState: CurrencyState = { currency: 'CNY' };

const currencySlice = createSlice({
  name: 'currency',
  initialState,
  reducers: {
    setCurrency(state, action: PayloadAction<CurrencyCode>) {
      state.currency = action.payload;
    },
  },
});

export const { setCurrency } = currencySlice.actions;
export default currencySlice.reducer;

export const selectCurrency = (state: { currency: CurrencyState }) =>
  state.currency.currency;
