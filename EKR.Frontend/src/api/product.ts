import { api } from './client';
import type { Product } from '../types';
import {
  mapProductFromApi,
  mapProductToCreatePayload,
  mapProductToUpdatePayload,
  type ProductApiDto,
} from '../utils/productMapper';

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

export async function fetchProducts(): Promise<Product[]> {
  const { data } = await api.get<ApiEnvelope<ProductApiDto[]>>('/Product/GetProducts');
  const list = unwrap(data);
  return (list ?? []).map(mapProductFromApi);
}

export async function fetchProductById(id: string): Promise<Product> {
  const { data } = await api.get<ApiEnvelope<ProductApiDto>>(`/Product/${id}`);
  return mapProductFromApi(unwrap(data));
}

export async function createProduct(product: Product): Promise<Product> {
  const { data } = await api.post<ApiEnvelope<ProductApiDto>>(
    '/Product/CreateProduct',
    mapProductToCreatePayload(product)
  );
  return mapProductFromApi(unwrap(data));
}

export async function updateProduct(product: Product): Promise<Product> {
  const { data } = await api.put<ApiEnvelope<ProductApiDto>>(
    '/Product/UpdateProduct',
    mapProductToUpdatePayload(product)
  );
  return mapProductFromApi(unwrap(data));
}

export async function deleteProduct(id: string): Promise<void> {
  await api.delete(`/Product/${id}`);
}

export async function uploadPhoto(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const { data } = await api.post<string | ApiEnvelope<string>>('/Product/UploadImage', formData, {
    headers: { 'Content-Type': undefined },
  });

  if (typeof data === 'string') return data;
  return unwrap(data);
}
