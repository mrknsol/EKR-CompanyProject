/** Shared demo card field helpers for PaymentPage. */

export function onlyDigits(v: string) {
  return v.replace(/\D/g, '');
}

export function formatCardNumber(v: string) {
  const d = onlyDigits(v).slice(0, 16);
  return d.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
}

export function formatExpiry(v: string) {
  const d = onlyDigits(v).slice(0, 4);
  if (d.length <= 2) return d;
  return `${d.slice(0, 2)}/${d.slice(2)}`;
}

export function isValidExpiry(mmYy: string): boolean {
  const m = /^(\d{2})\/(\d{2})$/.exec(mmYy);
  if (!m) return false;
  const month = Number(m[1]);
  const year = 2000 + Number(m[2]);
  if (month < 1 || month > 12) return false;
  const now = new Date();
  const exp = new Date(year, month, 0, 23, 59, 59);
  return exp >= now;
}

export function validateCardFields(params: {
  cardName: string;
  cardNumber: string;
  expiry: string;
  cvc: string;
}): 'name' | 'card' | 'expiry' | 'cvc' | null {
  if (!params.cardName.trim()) return 'name';
  if (onlyDigits(params.cardNumber).length < 16) return 'card';
  if (!isValidExpiry(params.expiry)) return 'expiry';
  if (onlyDigits(params.cvc).length < 3) return 'cvc';
  return null;
}
