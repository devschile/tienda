export const CHECKOUT_DRAFT_KEY = 'checkout.draft';

export function checkoutDraftKey(cartKey: string): string {
  return `${CHECKOUT_DRAFT_KEY}.${cartKey}`;
}
