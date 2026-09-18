import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { Product } from '../../types';
import {
  createProduct as createProductApi,
  deleteProduct as deleteProductApi,
  fetchProducts as fetchProductsApi,
  updateProduct as updateProductApi,
} from '../../api/product';

interface ProductsState {
  items: Product[];
  loading: boolean;
  error: string | null;
}

const initialState: ProductsState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchProducts = createAsyncThunk('products/fetchAll', async () => {
  return fetchProductsApi();
});

export const createProduct = createAsyncThunk(
  'products/create',
  async (product: Product) => createProductApi(product)
);

export const updateProduct = createAsyncThunk(
  'products/update',
  async (product: Product) => updateProductApi(product)
);

export const deleteProduct = createAsyncThunk(
  'products/delete',
  async (id: string) => {
    await deleteProductApi(id);
    return id;
  }
);

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to load products';
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.items = [action.payload, ...state.items];
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        state.items = state.items.map((p) =>
          p.id === action.payload.id ? action.payload : p
        );
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.items = state.items.filter((p) => p.id !== action.payload);
      });
  },
});

export default productsSlice.reducer;

export const selectAllProducts = (state: { products: ProductsState }) =>
  state.products.items;
export const selectProductsLoading = (state: { products: ProductsState }) =>
  state.products.loading;
export const selectProductsError = (state: { products: ProductsState }) =>
  state.products.error;
export const selectProductById = (id: string) => (state: { products: ProductsState }) =>
  state.products.items.find((p) => p.id === id);
