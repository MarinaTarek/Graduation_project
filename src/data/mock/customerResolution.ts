/**
 * customerResolution.ts
 *
 * Single authoritative source for resolving a customer ID from an invoice's
 * legacy customerName field. Used by both normalizeLegacyInvoice() in
 * invoices.ts and toCollectionInvoice() in cash-in.ts so the two paths
 * can never diverge.
 *
 * Design rules (D-02):
 *  1. If a valid customerId already exists on the record, return it as-is.
 *  2. If the name matches exactly one known customer in the seed map, return
 *     that ID.  Matching is substring-based because legacy records use
 *     abbreviated names.
 *  3. If the name matches MORE THAN ONE entry (ambiguous), return
 *     { resolved: false, reason: 'ambiguous' } — never pick one arbitrarily.
 *  4. If the name matches ZERO entries, return a deterministic slug as a
 *     temporary key so the invoice can be stored, but set resolved: false
 *     with reason 'unknown' so callers can flag needsReconciliation.
 *  5. The slug (`c-<slugified-name>`) is NOT a foreign key to any real customer.
 *     It is a stable placeholder that lets the same unknown customer be
 *     identified consistently across multiple legacy invoices until a human
 *     performs the reconciliation.
 */

export type CustomerResolutionResult =
  | { resolved: true; customerId: string }
  | { resolved: false; customerId: string; reason: 'ambiguous' | 'unknown' }

/**
 * Known customer name → ID seed map.
 * Each entry is a tuple of [substring-to-match (lowercase), customerId].
 * Order matters: more specific entries must come before shorter ones that
 * are substrings of them (e.g. 'cairo central' before 'cairo').
 */
const CUSTOMER_NAME_SEED: Array<[string, string]> = [
  ['green cross', 'c-2'],
  ['metro health', 'c-6'],
  ['city clinic', 'c-6'],
  ['riverside', 'c-9'],
  ['wellness', 'c-4'],
  ['apex', 'c-apex'],
  ['medplus', 'c-medplus'],
  ['northstar', 'c-northstar'],
  ['wellcare', 'c-wellcare'],
  ['cairo central', 'wh-cai-01'],
  ['logistics hub', 'wh-cai-01'],
  ['giza', 'wh-gz-01'],
]

/**
 * Resolve a customer ID from a customer name when no explicit customerId is
 * stored on the record.
 *
 * @param existingId - The customerId already on the record (may be undefined).
 * @param customerName - The human-readable customer name from the legacy record.
 */
export function resolveCustomerId(
  existingId: string | undefined | null,
  customerName: string,
): CustomerResolutionResult {
  // Rule 1: already have a valid ID — pass through without change.
  if (existingId && existingId.trim()) {
    return { resolved: true, customerId: existingId.trim() }
  }

  const norm = customerName.toLowerCase()
  const matches = CUSTOMER_NAME_SEED.filter(([substring]) => norm.includes(substring))

  if (matches.length === 1) {
    // Rule 2: unambiguous single match.
    return { resolved: true, customerId: matches[0][1] }
  }

  // Build a stable slug for storage regardless of ambiguity/unknown.
  const slug = `c-${customerName.toLowerCase().replace(/[^a-z0-9]/g, '')}`

  if (matches.length > 1) {
    // Rule 3: ambiguous — multiple seed entries match this name.
    return { resolved: false, customerId: slug, reason: 'ambiguous' }
  }

  // Rule 4: no match — unknown customer, slug placeholder.
  return { resolved: false, customerId: slug, reason: 'unknown' }
}
