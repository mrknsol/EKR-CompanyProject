export const DEPOSIT_RATE = 0.3;
export type PaymentType = 'full' | 'deposit'; // union type

export function calcDepositAmount(total: number) {
    return Math.round(total * DEPOSIT_RATE * 100) / 100;
}

export function calcBalanceDue(total: number, paid: number) {
    return Math.round((total - paid) * 100) / 100;
}