import { api } from './client';
import { normalizeOrderStatus } from '../constants/orderStatus';
import type { Order, OrderStatus } from '../types';

interface WholesaleOrderDTO {
  id: string;
  customerId: string;
  status: string;
  createdAt: string;
  snapshotJson: string;
  paymentMethod: string;
  paymentType: string;
  amountPaid: number;
  balanceDue: number;
  totalPieces: number;
  totalPrice: number;
  shippingAddress: string;
  customerPhone?: string;
  customerComments?: string;
}

interface ApiEnvelope<T> {
  success?: boolean;
  Success?: boolean;
  data?: T;
  Data?: T;
  message?: string;
  Message?: string;
}

function unwrap<T>(payload: ApiEnvelope<T> | T): T {
  if (payload && typeof payload === 'object' && ('data' in payload || 'Data' in payload)) {
    const env = payload as ApiEnvelope<T>;
    return (env.data ?? env.Data) as T;
  }
  return payload as T;
}

function mapDto(dto: WholesaleOrderDTO): Order {
  let snapshot: Partial<Order> = {};
  try {
    snapshot = JSON.parse(dto.snapshotJson || '{}') as Partial<Order>;
  } catch {
    snapshot = {};
  }

  const customer = snapshot.customer ?? {
    firstName: '',
    lastName: '',
    phone: dto.customerPhone ?? '',
    email: '',
    company: '',
    city: '',
    address: dto.shippingAddress ?? '',
    deliveryRegion: '',
    notes: dto.customerComments ?? '',
  };

  return {
    id: dto.id,
    createdAt: dto.createdAt,
    status: normalizeOrderStatus(dto.status || snapshot.status),
    customer,
    items: snapshot.items ?? [],
    totalPieces: dto.totalPieces ?? snapshot.totalPieces ?? 0,
    totalPrice: Number(dto.totalPrice ?? snapshot.totalPrice ?? 0),
    paymentMethod: dto.paymentMethod || snapshot.paymentMethod || '',
    paymentType: (dto.paymentType as Order['paymentType']) || snapshot.paymentType || 'deposit',
    amountPaid: Number(dto.amountPaid ?? snapshot.amountPaid ?? 0),
    balanceDue: Number(dto.balanceDue ?? snapshot.balanceDue ?? 0),
    invoiceGenerated: snapshot.invoiceGenerated ?? true,
    userId: dto.customerId || snapshot.userId,
    currentVersion: snapshot.currentVersion ?? 1,
    revisions: snapshot.revisions ?? [],
  };
}

export async function createOrderRequest(order: Order): Promise<Order> {
  const items = order.items.map((item) => ({
    productId: item.productId,
    quantity: item.totalPieces,
  }));

  const { data } = await api.post<ApiEnvelope<WholesaleOrderDTO>>('/Order', {
    snapshotJson: JSON.stringify(order),
    paymentMethod: order.paymentMethod,
    paymentType: order.paymentType,
    amountPaid: order.amountPaid,
    balanceDue: order.balanceDue,
    totalPieces: order.totalPieces,
    totalPrice: order.totalPrice,
    shippingAddress: `${order.customer.city}, ${order.customer.address}`.trim(),
    customerPhone: order.customer.phone,
    customerComments: order.customer.notes || null,
    items,
  });

  return mapDto(unwrap(data));
}

export async function fetchMyOrdersRequest(): Promise<Order[]> {
  const { data } = await api.get<ApiEnvelope<WholesaleOrderDTO[]>>('/Order/mine');
  return (unwrap(data) ?? []).map(mapDto);
}

export async function fetchAllOrdersRequest(): Promise<Order[]> {
  const { data } = await api.get<ApiEnvelope<WholesaleOrderDTO[]>>('/Order');
  return (unwrap(data) ?? []).map(mapDto);
}

export async function updateOrderStatusRequest(
  id: string,
  status: OrderStatus
): Promise<Order> {
  const { data } = await api.put<ApiEnvelope<WholesaleOrderDTO>>(`/Order/${id}/status`, {
    status,
  });
  return mapDto(unwrap(data));
}

export async function payOrderBalanceRequest(id: string): Promise<Order> {
  const { data } = await api.post<ApiEnvelope<WholesaleOrderDTO>>(`/Order/${id}/pay-balance`);
  return mapDto(unwrap(data));
}

export async function updateOrderSnapshotRequest(order: Order): Promise<Order> {
  const { data } = await api.put<ApiEnvelope<WholesaleOrderDTO>>(
    `/Order/${order.id}/snapshot`,
    {
      snapshotJson: JSON.stringify(order),
      totalPrice: order.totalPrice,
      totalPieces: order.totalPieces,
      balanceDue: order.balanceDue,
    }
  );
  return mapDto(unwrap(data));
}
