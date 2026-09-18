import type { Product, ProductColor } from '../types';

export interface ProductApiDto {
  id: string;
  code: string;
  modelType: string;
  season: string;
  price: number;
  quantity: number;
  isInStock: boolean;
  colors: string[];
  sizes: string[];
  imageUrls: string[];
}

const DEFAULT_PIECES_PER_SERIES = 4;

function parseColor(raw: string, imageUrls: string[]): ProductColor {
  const parts = raw.split(':').map((s) => s.trim());
  const code = parts[0] || 'X';
  const name = parts[1] || code;
  const hex = parts[2] || '#888888';
  return { code, name, hex, imageUrls };
}

export function mapProductFromApi(dto: ProductApiDto): Product {
  const imageUrls = dto.imageUrls ?? [];
  const colors = (dto.colors ?? []).map((c) => parseColor(c, imageUrls));
  const sizes = dto.sizes ?? [];

  return {
    id: dto.id,
    code: dto.code,
    name: `${dto.modelType} ${dto.code}`.trim(),
    modelType: dto.modelType,
    season: dto.season,
    wholesalePrice: dto.price,
    minQuantity: dto.quantity,
    piecesPerSeries: DEFAULT_PIECES_PER_SERIES,
    sizeSystem: sizes.some((s) => /^[A-Z]/i.test(s)) ? 'letter' : 'numeric',
    sizes,
    colors: colors.length
      ? colors
      : [{ code: 'D1', name: 'Default', hex: '#888888', imageUrls }],
    material: '',
    lining: '',
    features: [],
    description: '',
    imageUrls,
    isInStock: dto.isInStock,
    createdAt: new Date().toISOString(),
  };
}

export function encodeColor(color: ProductColor): string {
  return `${color.code}:${color.name}:${color.hex}`;
}

export function mapProductToCreatePayload(product: Product) {
  return {
    code: product.code,
    price: Math.round(product.wholesalePrice),
    quantity: product.minQuantity,
    isInStock: product.isInStock,
    modelType: product.modelType,
    season: product.season,
    productSizes: product.sizes,
    productColors: product.colors.map(encodeColor),
    images: product.imageUrls,
  };
}

export function mapProductToUpdatePayload(product: Product) {
  return {
    code: product.code,
    price: Math.round(product.wholesalePrice),
    quantity: product.minQuantity,
    isInStock: product.isInStock,
    modelType: product.modelType,
    season: product.season,
    productSizes: product.sizes,
    productColors: product.colors.map(encodeColor),
    newImages: product.imageUrls,
  };
}
