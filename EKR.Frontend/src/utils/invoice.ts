import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Order, OrderChange, OrderRevision } from '../types';
import { DEPOSIT_RATE } from '../constants/payment';
import { formatAmount } from '../constants/currency';
import type { Lang } from '../data/localeDict';
import { translate } from './i18n';
import { store } from '../store/index';
import { selectCurrency } from '../store/slices/currencySlice';
import { selectLang } from '../store/slices/localeSlice';

type InvoiceDictKey =
  | 'inv_title'
  | 'inv_order_no'
  | 'inv_date'
  | 'inv_customer'
  | 'inv_phone'
  | 'inv_email'
  | 'inv_company'
  | 'inv_delivery'
  | 'inv_payment_method'
  | 'inv_payment_type'
  | 'inv_payment_full'
  | 'inv_payment_deposit'
  | 'inv_amount_paid'
  | 'inv_balance_due'
  | 'inv_total_order'
  | 'inv_currency'
  | 'inv_demo'
  | 'inv_col_code'
  | 'inv_col_model'
  | 'inv_col_color'
  | 'inv_col_series'
  | 'inv_col_pcs_series'
  | 'inv_col_qty'
  | 'inv_col_price'
  | 'inv_col_sum'
  | 'inv_subtotal_code'
  | 'inv_total_pieces'
  | 'inv_total_sum'
  | 'inv_notes'
  | 'inv_pcs'
  | 'inv_none'
  | 'inv_revision'
  | 'inv_revised'
  | 'inv_original'
  | 'inv_changes'
  | 'inv_change_product'
  | 'inv_change_field'
  | 'inv_change_before'
  | 'inv_change_after'
  | 'inv_sizes'
  | 'inv_deposit_nonrefund';

const DATE_LOCALE: Record<Lang, string> = {
  ru: 'ru-RU',
  en: 'en-GB',
  zh: 'zh-CN',
  az: 'az-AZ',
};

const FONT_URL: Record<Lang, string> = {
  ru: 'https://cdn.jsdelivr.net/npm/dejavu-fonts-ttf@2.37.3/ttf/DejaVuSans.ttf',
  en: 'https://cdn.jsdelivr.net/npm/dejavu-fonts-ttf@2.37.3/ttf/DejaVuSans.ttf',
  az: 'https://cdn.jsdelivr.net/npm/dejavu-fonts-ttf@2.37.3/ttf/DejaVuSans.ttf',
  zh: 'https://cdn.jsdelivr.net/gh/notofonts/noto-cjk@main/Sans/TTF/SimplifiedChinese/NotoSansSC-Regular.ttf',
};

const fontCache = new Map<string, string>();

interface JsPdfWithAutoTable extends jsPDF {
  lastAutoTable?: { finalY: number };
}

export interface DownloadInvoiceOptions {
  /** Specific revision version; defaults to current */
  version?: number;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function loadPdfFont(doc: jsPDF, lang: Lang): Promise<string> {
  const url = FONT_URL[lang];
  const cacheKey = url;

  let base64 = fontCache.get(cacheKey);
  if (!base64) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load PDF font for ${lang}`);
    }
    base64 = arrayBufferToBase64(await response.arrayBuffer());
    fontCache.set(cacheKey, base64);
  }

  const fileName = lang === 'zh' ? 'NotoSansSC.ttf' : 'DejaVuSans.ttf';
  const fontFamily = lang === 'zh' ? 'NotoSansSC' : 'DejaVuSans';

  doc.addFileToVFS(fileName, base64);
  doc.addFont(fileName, fontFamily, 'normal');
  doc.setFont(fontFamily);

  return fontFamily;
}

function line(doc: jsPDF, text: string, y: number, fontFamily: string): number {
  doc.setFont(fontFamily);
  doc.text(text, 14, y);
  return y + 6;
}

function getRevision(order: Order, version?: number): OrderRevision {
  if (order.revisions?.length) {
    const target = version ?? order.currentVersion ?? order.revisions.at(-1)!.version;
    return (
      order.revisions.find((r) => r.version === target) ??
      order.revisions[order.revisions.length - 1]
    );
  }
  return {
    version: 1,
    createdAt: order.createdAt,
    items: order.items,
    totalPieces: order.totalPieces,
    totalPrice: order.totalPrice,
    amountPaid: order.amountPaid,
    balanceDue: order.balanceDue,
    changes: [],
  };
}

/** Generate wholesale packing invoice (накладная) as PDF */
export async function downloadInvoice(
  order: Order,
  options?: DownloadInvoiceOptions
): Promise<void> {
  const state = store.getState();
  const currency = selectCurrency(state);
  const lang = selectLang(state);
  const format = (amountCny: number) => formatAmount(amountCny, currency);
  const t = (key: InvoiceDictKey, vars?: Record<string, string | number>) =>
    translate(lang, key, vars);

  const revision = getRevision(order, options?.version);
  const paymentType = order.paymentType ?? 'full';
  const amountPaid = revision.amountPaid ?? order.amountPaid ?? order.totalPrice;
  const balanceDue = revision.balanceDue ?? order.balanceDue ?? 0;

  const doc = new jsPDF() as JsPdfWithAutoTable;
  const fontFamily = await loadPdfFont(doc, lang);

  let y = 18;

  doc.setFontSize(15);
  doc.text(t('inv_title'), 14, y);
  y += 10;

  doc.setFontSize(10);
  if (revision.version > 1) {
    y = line(
      doc,
      `${t('inv_revised')} — ${t('inv_revision', { n: revision.version })}`,
      y,
      fontFamily
    );
  } else {
    y = line(doc, t('inv_original'), y, fontFamily);
  }

  y = line(doc, `${t('inv_order_no')}: ${order.id}`, y, fontFamily);
  y = line(
    doc,
    `${t('inv_date')}: ${new Date(revision.createdAt).toLocaleString(DATE_LOCALE[lang])}`,
    y,
    fontFamily
  );
  y = line(
    doc,
    `${t('inv_customer')}: ${order.customer.firstName} ${order.customer.lastName}`,
    y,
    fontFamily
  );
  y = line(doc, `${t('inv_phone')}: ${order.customer.phone}`, y, fontFamily);
  y = line(doc, `${t('inv_email')}: ${order.customer.email}`, y, fontFamily);
  y = line(
    doc,
    `${t('inv_company')}: ${order.customer.company || t('inv_none')}`,
    y,
    fontFamily
  );
  y = line(
    doc,
    `${t('inv_delivery')}: ${order.customer.deliveryRegion} / ${order.customer.city}, ${order.customer.address}`,
    y,
    fontFamily
  );
  y = line(
    doc,
    `${t('inv_payment_method')}: ${order.paymentMethod} ${t('inv_demo')}`,
    y,
    fontFamily
  );

  const paymentLabel =
    paymentType === 'full'
      ? t('inv_payment_full')
      : t('inv_payment_deposit', { percent: DEPOSIT_RATE * 100 });

  y = line(doc, `${t('inv_payment_type')}: ${paymentLabel}`, y, fontFamily);
  y = line(doc, `${t('inv_amount_paid')}: ${format(amountPaid)}`, y, fontFamily);
  y = line(doc, `${t('inv_balance_due')}: ${format(balanceDue)}`, y, fontFamily);
  y = line(doc, `${t('inv_total_order')}: ${format(revision.totalPrice)}`, y, fontFamily);
  y = line(doc, `${t('inv_currency')}: ${currency}`, y, fontFamily);

  if (paymentType === 'deposit') {
    y = line(doc, t('inv_deposit_nonrefund'), y, fontFamily);
  }
  y += 4;

  if (revision.version > 1 && revision.changes.length > 0) {
    doc.setFontSize(11);
    y = line(doc, t('inv_changes'), y, fontFamily);
    doc.setFontSize(9);
    autoTable(doc, {
      startY: y,
      styles: { font: fontFamily, fontSize: 8 },
      headStyles: { font: fontFamily, fontSize: 8, fillColor: [120, 40, 40] },
      bodyStyles: { font: fontFamily },
      head: [
        [
          t('inv_change_product'),
          t('inv_change_field'),
          t('inv_change_before'),
          t('inv_change_after'),
        ],
      ],
      body: revision.changes.map((c: OrderChange) => [
        c.productCode,
        c.field,
        c.before,
        c.after,
      ]),
      margin: { left: 14, right: 14 },
    });
    y = (doc.lastAutoTable?.finalY ?? y) + 8;
  }

  const tableBody: (string | number)[][] = [];

  for (const item of revision.items) {
    const sizesLabel = (item.sizes ?? []).join(', ') || t('inv_none');
    for (const colorLine of item.colorLines) {
      const qty = colorLine.seriesCount * item.piecesPerSeries;
      tableBody.push([
        item.productCode,
        item.productName,
        `${colorLine.colorName} (${colorLine.colorCode})`,
        colorLine.seriesCount,
        item.piecesPerSeries,
        qty,
        format(item.wholesalePrice),
        format(qty * item.wholesalePrice),
      ]);
    }

    tableBody.push([
      '',
      `${t('inv_sizes')}: ${sizesLabel}`,
      '',
      '',
      '',
      '',
      '',
      '',
    ]);

    tableBody.push([
      '',
      t('inv_subtotal_code', { code: item.productCode }),
      '',
      '',
      '',
      item.totalPieces,
      '',
      format(item.lineTotal),
    ]);
  }

  autoTable(doc, {
    startY: y,
    styles: { font: fontFamily, fontSize: 9 },
    headStyles: { font: fontFamily, fontSize: 9, fillColor: [14, 17, 22] },
    bodyStyles: { font: fontFamily },
    head: [
      [
        t('inv_col_code'),
        t('inv_col_model'),
        t('inv_col_color'),
        t('inv_col_series'),
        t('inv_col_pcs_series'),
        t('inv_col_qty'),
        t('inv_col_price'),
        t('inv_col_sum'),
      ],
    ],
    body: tableBody,
    margin: { left: 14, right: 14 },
  });

  y = (doc.lastAutoTable?.finalY ?? y) + 10;

  doc.setFont(fontFamily);
  doc.setFontSize(10);
  y = line(
    doc,
    `${t('inv_total_pieces')}: ${revision.totalPieces} ${t('inv_pcs')}`,
    y,
    fontFamily
  );
  y = line(doc, `${t('inv_total_sum')}: ${format(revision.totalPrice)}`, y, fontFamily);
  y += 2;
  y = line(
    doc,
    `${t('inv_notes')}: ${order.customer.notes || t('inv_none')}`,
    y,
    fontFamily
  );

  const suffix = revision.version > 1 ? `_v${revision.version}` : '_v1';
  doc.save(`ZEIR_invoice_${order.id}${suffix}.pdf`);
}
