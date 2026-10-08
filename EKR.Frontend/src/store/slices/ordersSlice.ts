import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type { CheckoutForm, Order, OrderItemSnapshot, OrderStatus } from '../../types';
import { calcBalanceDue, calcDepositAmount, type PaymentType } from '../../constants/payment';
import { isOrderEditable } from '../../constants/orderStatus';
import { cartItemPieces } from '../../utils/cart';
import { diffOrderItems, recalcOrderItem } from '../../utils/orderDiff';
import {
  createOrderRequest,
  fetchAllOrdersRequest,
  fetchMyOrdersRequest,
  payOrderBalanceRequest,
  updateOrderSnapshotRequest,
  updateOrderStatusRequest,
} from '../../api/order';
import {
  broadcastNotification,
  buildAdminNewOrderNotification,
} from '../../components/browserNotify';
import { clear } from './cartSlice';
import type { RootState } from '../index';

interface OrdersState {
  orders: Order[];
  loading: boolean;
  error: string | null;
}

const initialState: OrdersState = { orders: [], loading: false, error: null };

function cloneItems(items: OrderItemSnapshot[]): OrderItemSnapshot[] {
  return items.map((item) => ({
    productId: item.productId,
    productCode: item.productCode,
    productName: item.productName,
    wholesalePrice: item.wholesalePrice,
    piecesPerSeries: item.piecesPerSeries,
    sizes: [...(item.sizes ?? [])],
    colorLines: item.colorLines.map((c) => ({
      colorCode: c.colorCode,
      colorName: c.colorName,
      seriesCount: c.seriesCount,
    })),
    totalPieces: item.totalPieces,
    lineTotal: item.lineTotal,
  }));
}

function buildRevision(
  version: number,
  items: OrderItemSnapshot[],
  amountPaid: number,
  changes: Order['revisions'][number]['changes']
) {
  const plainItems = cloneItems(items);
  const totalPieces = plainItems.reduce((s, i) => s + i.totalPieces, 0);
  const totalPrice = plainItems.reduce((s, i) => s + i.lineTotal, 0);
  return {
    version,
    createdAt: new Date().toISOString(),
    items: plainItems,
    totalPieces,
    totalPrice,
    amountPaid,
    balanceDue: calcBalanceDue(totalPrice, amountPaid),
    changes: changes.map((c) => ({ ...c })),
  };
}

export const fetchMyOrders = createAsyncThunk('orders/fetchMine', async () => {
  return fetchMyOrdersRequest();
});

export const fetchAllOrders = createAsyncThunk('orders/fetchAll', async () => {
  return fetchAllOrdersRequest();
});

export const placeOrder = createAsyncThunk(
  'orders/place',
  async (
    {
      customer,
      paymentMethod,
      paymentType,
    }: { customer: CheckoutForm; paymentMethod: string; paymentType: PaymentType },
    { getState, dispatch }
  ) => {
    const state = getState() as RootState;
    const cartItems = state.cart.items;
    const products = state.products.items;
    const userId = state.auth.session?.user.id;
    if (!userId || !state.auth.session?.token) {
      throw new Error('Login required to place an order');
    }

    const items: OrderItemSnapshot[] = cartItems.map((item) => {
      const totalPieces = cartItemPieces(item);
      const product = products.find((p) => p.id === item.productId);
      return {
        productId: item.productId,
        productCode: item.productCode,
        productName: item.productName,
        wholesalePrice: item.wholesalePrice,
        piecesPerSeries: item.piecesPerSeries,
        sizes: product?.sizes ? [...product.sizes] : [],
        colorLines: item.colorLines,
        totalPieces,
        lineTotal: totalPieces * item.wholesalePrice,
      };
    });

    const totalPieces = items.reduce((s, i) => s + i.totalPieces, 0);
    const totalPrice = items.reduce((s, i) => s + i.lineTotal, 0);
    const amountPaid =
      paymentType === 'full' ? totalPrice : calcDepositAmount(totalPrice);
    const balanceDue = calcBalanceDue(totalPrice, amountPaid);
    const status: OrderStatus = 'accepted';
    const createdAt = new Date().toISOString();
    const revision = buildRevision(1, items, amountPaid, []);

    const draft: Order = {
      id: crypto.randomUUID(),
      createdAt,
      status,
      customer,
      items,
      totalPieces,
      totalPrice,
      paymentMethod,
      paymentType,
      amountPaid,
      balanceDue,
      invoiceGenerated: true,
      userId,
      currentVersion: 1,
      revisions: [revision],
    };

    const saved = await createOrderRequest(draft);
    dispatch(clear());

    const lang = state.locale.lang ?? 'en';
    const customerName =
      `${saved.customer.firstName} ${saved.customer.lastName}`.trim() ||
      saved.customer.email;
    broadcastNotification(
      buildAdminNewOrderNotification({
        orderId: saved.id,
        customerName,
        userEmail: saved.customer.email,
        lang,
      })
    );

    return saved;
  }
);

export const saveOrderEdits = createAsyncThunk(
  'orders/saveEdits',
  async (
    { id, items }: { id: string; items: OrderItemSnapshot[] },
    { getState }
  ) => {
    const state = getState() as RootState;
    const order = state.orders.orders.find((o) => o.id === id);
    if (!order) throw new Error('Order not found');
    if (!isOrderEditable(order.status)) {
      throw new Error('Order cannot be edited');
    }

    const nextItems = items.map(recalcOrderItem).filter((i) => i.colorLines.length > 0);
    if (nextItems.length === 0) throw new Error('Order must keep at least one item');

    const changes = diffOrderItems(order.items, nextItems);
    if (changes.length === 0) return order;

    const revisions = order.revisions?.length
      ? [...order.revisions]
      : [buildRevision(1, order.items, order.amountPaid, [])];

    const nextVersion = (order.currentVersion ?? revisions.length) + 1;
    const revision = buildRevision(nextVersion, nextItems, order.amountPaid, changes);
    const updated: Order = {
      ...order,
      items: nextItems,
      totalPieces: revision.totalPieces,
      totalPrice: revision.totalPrice,
      balanceDue: revision.balanceDue,
      currentVersion: nextVersion,
      revisions: [...revisions, revision],
      invoiceGenerated: true,
    };

    return updateOrderSnapshotRequest(updated);
  }
);

export const changeOrderStatusRemote = createAsyncThunk(
  'orders/changeStatusRemote',
  async ({ id, status }: { id: string; status: OrderStatus }) => {
    return updateOrderStatusRequest(id, status);
  }
);

export const payOrderBalance = createAsyncThunk('orders/payBalance', async (id: string) => {
  return payOrderBalanceRequest(id);
});

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    setStatus(state, action: PayloadAction<{ id: string; status: OrderStatus }>) {
      state.orders = state.orders.map((o) =>
        o.id === action.payload.id ? { ...o, status: action.payload.status } : o
      );
    },
    markInvoice(state, action: PayloadAction<string>) {
      state.orders = state.orders.map((o) =>
        o.id === action.payload ? { ...o, invoiceGenerated: true } : o
      );
    },
    upsertOrder(state, action: PayloadAction<Order>) {
      const idx = state.orders.findIndex((o) => o.id === action.payload.id);
      if (idx >= 0) state.orders[idx] = action.payload;
      else state.orders = [action.payload, ...state.orders];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload;
      })
      .addCase(fetchMyOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to load orders';
      })
      .addCase(fetchAllOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload;
      })
      .addCase(fetchAllOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to load orders';
      })
      .addCase(placeOrder.fulfilled, (state, action) => {
        state.orders = [action.payload, ...state.orders.filter((o) => o.id !== action.payload.id)];
      })
      .addCase(saveOrderEdits.fulfilled, (state, action) => {
        state.orders = state.orders.map((o) =>
          o.id === action.payload.id ? action.payload : o
        );
      })
      .addCase(changeOrderStatusRemote.fulfilled, (state, action) => {
        state.orders = state.orders.map((o) =>
          o.id === action.payload.id ? action.payload : o
        );
      })
      .addCase(payOrderBalance.fulfilled, (state, action) => {
        state.orders = state.orders.map((o) =>
          o.id === action.payload.id ? action.payload : o
        );
      });
  },
});

export const { setStatus, markInvoice, upsertOrder } = ordersSlice.actions;
export default ordersSlice.reducer;

export const selectOrders = (state: { orders: OrdersState }) => state.orders.orders;
export const selectOrdersLoading = (state: { orders: OrdersState }) => state.orders.loading;
export const selectOrderById = (id: string) => (state: { orders: OrdersState }) =>
  state.orders.orders.find((o) => o.id === id);
