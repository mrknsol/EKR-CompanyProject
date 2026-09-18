import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Lang } from '../../data/localeDict';

interface LocaleState {
  lang: Lang;
}

const initialState: LocaleState = { lang: 'ru' };

const localeSlice = createSlice({
  name: 'locale',
  initialState,
  reducers: {
    setLang(state, action: PayloadAction<Lang>) {
      state.lang = action.payload;
    },
  },
});

export const { setLang } = localeSlice.actions;
export default localeSlice.reducer;

export const selectLang = (state: { locale: LocaleState }) => state.locale.lang;
