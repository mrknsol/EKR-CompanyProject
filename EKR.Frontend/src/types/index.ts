import type { PaymentType } from "../constants/payment";

export type SizeSystem = 'letter' | 'numeric';
export type UserRole = 'Admin' | 'User' | 'Manager';
export type OrderStatus = 'pending' | 'paid' | 'confirmed' | 'shipped' | 'cancelled';

export interface ProductColor {
  code: string;
  name: string;
  hex: string;
  imageUrls: string[];
}

export interface Product {
  id: string;
  code: string;
  name: string;
  modelType: string;
  season: string;
  wholesalePrice: number;
  minQuantity: number;
  piecesPerSeries: number;
  sizeSystem: SizeSystem;
  sizes: string[];
  colors: ProductColor[];
  material: string;
  lining: string;
  features: string[];
  description: string;
  imageUrls: string[];
  isInStock: boolean;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  country: string;
  countryCode: string;
  company?: string;
  roles: UserRole[];
}

export interface AuthSession {
  token: string;
  refreshToken: string;
  tokenExpiry: string;
  user: User;
}

export interface CartColorLine {
  colorCode: string;
  colorName: string;
  seriesCount: number;
}

export interface CartItem {
  productId: string;
  productCode: string;
  productName: string;
  wholesalePrice: number;
  piecesPerSeries: number;
  minQuantity: number;
  colorLines: CartColorLine[];
}

export interface CheckoutForm {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  company: string;
  city: string;
  address: string;
  deliveryRegion: string;
  notes: string;
}

export interface OrderItemSnapshot {
  productId: string;
  productCode: string;
  productName: string;
  wholesalePrice: number;
  piecesPerSeries: number;
  sizes: string[];
  colorLines: CartColorLine[];
  totalPieces: number;
  lineTotal: number;
}

export interface OrderChange {
  productCode: string;
  field: string;
  before: string;
  after: string;
}

export interface OrderRevision {
  version: number;
  createdAt: string;
  items: OrderItemSnapshot[];
  totalPieces: number;
  totalPrice: number;
  amountPaid: number;
  balanceDue: number;
  changes: OrderChange[];
}

export interface Order {
  id: string;
  createdAt: string;
  status: OrderStatus;
  customer: CheckoutForm;
  items: OrderItemSnapshot[];
  totalPieces: number;
  totalPrice: number;
  paymentMethod: string;
  paymentType: PaymentType;
  amountPaid: number;
  balanceDue: number;
  invoiceGenerated: boolean;
  userId?: string;
  currentVersion: number;
  revisions: OrderRevision[];
}

export interface DeliveryRegion {
  id: string;
  title: string;
  cities: string[];
  eta: string;
  terms: string;
}
