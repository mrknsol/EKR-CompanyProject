import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { CartColorLine, CartItem, Product } from '../../types';
import { cartItemPieces } from '../../utils/cart';

interface CartState {
  items: CartItem[];
}

const initialState: CartState = { items: [] };

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addOrUpdate(
      state,
      action: PayloadAction<{ product: Product; colorLines: CartColorLine[] }>
    ) {
      const { product, colorLines } = action.payload;
      const filtered = colorLines.filter((c) => c.seriesCount > 0);
      if (filtered.length === 0) {
        state.items = state.items.filter((i) => i.productId !== product.id);
        return;
      }
      const next: CartItem = {
        productId: product.id,
        productCode: product.code,
        productName: product.name,
        wholesalePrice: product.wholesalePrice,
        piecesPerSeries: product.piecesPerSeries,
        minQuantity: product.minQuantity,
        colorLines: filtered,
      };
      state.items = [...state.items.filter((i) => i.productId !== product.id), next];
    },
    remove(state, action: PayloadAction<string>) {
      state.items = state.items.filter((i) => i.productId !== action.payload);
    },
    clear(state) {
      state.items = [];
    },
  },
});

export const { addOrUpdate, remove, clear } = cartSlice.actions;
export default cartSlice.reducer;

export const selectCartItems = (state: { cart: CartState }) => state.cart.items;
export const selectCartTotalPieces = (state: { cart: CartState }) =>
  state.cart.items.reduce((s, i) => s + cartItemPieces(i), 0);
export const selectCartTotalPrice = (state: { cart: CartState }) =>
  state.cart.items.reduce((s, i) => s + cartItemPieces(i) * i.wholesalePrice, 0);
