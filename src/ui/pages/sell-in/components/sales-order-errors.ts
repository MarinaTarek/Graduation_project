import type { TranslationKey } from '@/lib/i18n'

// The sales-order store throws English messages. Map the known ones to
// translation keys; unknown messages are shown as-is by the caller.
const MATCHERS: [pattern: string, key: TranslationKey][] = [
  ['Customer is unavailable', 'salesOrders.customerUnavailable'],
  ['Select a sales representative', 'salesOrders.selectRepRequired'],
  ['Add at least one product', 'salesOrders.addAtLeastOne'],
  ['quantity must be a positive integer', 'salesOrders.invalidQuantity'],
  ['was not found', 'salesOrders.productNotFound'],
  ['Invalid price', 'salesOrders.invalidPrice'],
  ['Insufficient unexpired stock', 'salesOrders.insufficientStock'],
  ['Stock movements already exist', 'salesOrders.alreadyMoved'],
  ['Only pending orders', 'salesOrders.onlyPending'],
  ['rejection reason is required', 'salesOrders.reasonRequired'],
  ['Invalid discount type', 'salesOrders.discountInvalid'],
  ['Discount must be zero or positive', 'salesOrders.discountNonNegative'],
  ['Percentage discount must be between 0 and 100', 'salesOrders.discountPercentRange'],
  ['Fixed discount cannot exceed the order subtotal', 'salesOrders.discountExceedsSubtotal'],
]

type Translate = (key: TranslationKey, fallback?: string) => string

export function translateSalesOrderError(message: string, t: Translate): string {
  const match = MATCHERS.find(([pattern]) => message.includes(pattern))
  return match ? t(match[1]) : message
}
