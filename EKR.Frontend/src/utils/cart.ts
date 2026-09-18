import type { CartItem } from '../types';

export function cartItemPieces(item: CartItem) {
  return item.colorLines.reduce(
    (sum, line) => sum + line.seriesCount * item.piecesPerSeries,
    0
  );
}
