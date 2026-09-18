import type { OrderChange, OrderItemSnapshot } from '../types';

function colorKey(productCode: string, colorCode: string) {
  return `${productCode}::${colorCode}`;
}

function serializeSizes(sizes: string[]) {
  return [...sizes].sort().join(', ') || '—';
}

/** Diff two order item lists for invoice / UI. */
export function diffOrderItems(
  before: OrderItemSnapshot[],
  after: OrderItemSnapshot[]
): OrderChange[] {
  const changes: OrderChange[] = [];
  const beforeMap = new Map(before.map((i) => [i.productId, i]));
  const afterMap = new Map(after.map((i) => [i.productId, i]));

  for (const [productId, afterItem] of afterMap) {
    const beforeItem = beforeMap.get(productId);
    if (!beforeItem) {
      changes.push({
        productCode: afterItem.productCode,
        field: 'product',
        before: '—',
        after: 'added',
      });
      continue;
    }

    const beforeSizes = serializeSizes(beforeItem.sizes ?? []);
    const afterSizes = serializeSizes(afterItem.sizes ?? []);
    if (beforeSizes !== afterSizes) {
      changes.push({
        productCode: afterItem.productCode,
        field: 'sizes',
        before: beforeSizes,
        after: afterSizes,
      });
    }

    const beforeColors = new Map(
      beforeItem.colorLines.map((c) => [c.colorCode, c])
    );
    const afterColors = new Map(afterItem.colorLines.map((c) => [c.colorCode, c]));
    const allCodes = new Set([...beforeColors.keys(), ...afterColors.keys()]);

    for (const code of allCodes) {
      const b = beforeColors.get(code);
      const a = afterColors.get(code);
      if (!b && a) {
        changes.push({
          productCode: afterItem.productCode,
          field: `color ${a.colorName} (${code})`,
          before: '0 series',
          after: `${a.seriesCount} series`,
        });
      } else if (b && !a) {
        changes.push({
          productCode: afterItem.productCode,
          field: `color ${b.colorName} (${code})`,
          before: `${b.seriesCount} series`,
          after: 'removed',
        });
      } else if (b && a && b.seriesCount !== a.seriesCount) {
        changes.push({
          productCode: afterItem.productCode,
          field: `series ${a.colorName} (${code})`,
          before: String(b.seriesCount),
          after: String(a.seriesCount),
        });
      } else if (b && a && b.colorName !== a.colorName) {
        changes.push({
          productCode: afterItem.productCode,
          field: colorKey(afterItem.productCode, code),
          before: b.colorName,
          after: a.colorName,
        });
      }
    }
  }

  for (const [productId, beforeItem] of beforeMap) {
    if (!afterMap.has(productId)) {
      changes.push({
        productCode: beforeItem.productCode,
        field: 'product',
        before: 'present',
        after: 'removed',
      });
    }
  }

  return changes;
}

export function recalcOrderItem(item: OrderItemSnapshot): OrderItemSnapshot {
  const colorLines = item.colorLines.filter((c) => c.seriesCount > 0);
  const totalPieces = colorLines.reduce(
    (s, c) => s + c.seriesCount * item.piecesPerSeries,
    0
  );
  return {
    ...item,
    colorLines,
    totalPieces,
    lineTotal: totalPieces * item.wholesalePrice,
  };
}
