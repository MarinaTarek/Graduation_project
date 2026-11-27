import { createStore } from './store'
import { addAuditLog } from './audit'
import { addNotification } from './notifications'
import { findAuthoritativeUser } from '@/lib/approval/approvalEngine'
import { productsStore, getCanonicalProduct, resolveCanonicalProductCode } from './products'
import {
  batchesStore,
  stockMovementsStore,
  getRepAvailableSampleStock,
  allocateRepSampleFefo,
  addStockMovement,
  type StockMovement,
  type BatchRecord,
} from './stockDerived'
import { getSystemNow, getSystemCurrentDate } from '@/lib/dateUtils'

// ============================================================================
// Types & Logical Entities
// ============================================================================

export type QuotaPeriodType = 'monthly' | 'quarterly' | 'semiannual' | 'custom'

export interface DoctorQuotaPolicy {
  id: string
  doctorId: string
  doctorName?: string
  productId: string
  productName?: string
  allowedQuantity: number
  periodType: QuotaPeriodType
  startDate: string // YYYY-MM-DD
  endDate?: string // YYYY-MM-DD (inclusive)
  status: 'active' | 'inactive' | 'draft'
  version: number
  created_at: string
  updated_at: string
  createdBy: string
}

export interface DoctorQuotaReservation {
  id: string
  requestId: string
  doctorId: string
  productId: string
  repId: string
  quantity: number
  status: 'reserved' | 'consumed' | 'released'
  created_at: string
  expires_at?: string
  released_at?: string
  overrideId?: string
}

export interface SampleQuotaOverride {
  id: string
  requestId: string
  doctorId: string
  doctorName?: string
  productId: string
  productName?: string
  repId: string
  repName?: string
  requestedQuantity: number
  standardRemainingQuota: number
  approvedExcessQuantity: number
  status: 'pending' | 'approved' | 'rejected' | 'consumed' | 'expired' | 'cancelled'
  reason: string
  adminNotes?: string
  reviewedBy?: string
  reviewedAt?: string
  created_at: string
  expires_at?: string
}

export interface SampleDistributionItem {
  productId: string
  productName?: string
  quantity: number
  batchNumber?: string
}

export interface SampleDistributionRequest {
  id: string
  doctorId: string
  doctorName: string
  repId: string
  repName: string
  visitId?: string
  visitPlanId?: string
  items: SampleDistributionItem[]
  status: 'draft' | 'pending_override' | 'approved' | 'distributed' | 'rejected' | 'cancelled'
  requiresOverride: boolean
  overrideIds?: string[]
  notes?: string
  created_at: string
  distributed_at?: string
  cancelled_at?: string
}

// ============================================================================
// Initial Mock Seed Data
// ============================================================================

const SEED_QUOTA_POLICIES: DoctorQuotaPolicy[] = [
  {
    id: 'dqp-c1-prd01',
    doctorId: 'c-1', // Dr. Sarah Kim
    doctorName: 'Dr. Sarah Kim',
    productId: 'PRD-01',
    productName: 'Bevato',
    allowedQuantity: 25,
    periodType: 'monthly',
    startDate: '2026-10-01',
    endDate: '2026-12-31',
    status: 'active',
    version: 1,
    created_at: '2026-10-01T00:00:00Z',
    updated_at: '2026-10-01T00:00:00Z',
    createdBy: 'u-admin-1',
  },
  {
    id: 'dqp-c1-prd02',
    doctorId: 'c-1',
    doctorName: 'Dr. Sarah Kim',
    productId: 'PRD-02',
    productName: 'Naviro D3 50,000 IU',
    allowedQuantity: 40,
    periodType: 'monthly',
    startDate: '2026-10-01',
    endDate: '2026-12-31',
    status: 'active',
    version: 1,
    created_at: '2026-10-01T00:00:00Z',
    updated_at: '2026-10-01T00:00:00Z',
    createdBy: 'u-admin-1',
  },
  {
    id: 'dqp-c5-prd01',
    doctorId: 'c-5', // Dr. Emily Watson
    doctorName: 'Dr. Emily Watson',
    productId: 'PRD-01',
    productName: 'Bevato',
    allowedQuantity: 20,
    periodType: 'monthly',
    startDate: '2026-10-01',
    endDate: '2026-12-31',
    status: 'active',
    version: 1,
    created_at: '2026-10-01T00:00:00Z',
    updated_at: '2026-10-01T00:00:00Z',
    createdBy: 'u-admin-1',
  },
]

// ============================================================================
// Stores
// ============================================================================

export const doctorQuotaPoliciesStore = createStore<DoctorQuotaPolicy[]>(
  'doctor_quota_policies',
  SEED_QUOTA_POLICIES
)

export const doctorQuotaReservationsStore = createStore<DoctorQuotaReservation[]>(
  'doctor_quota_reservations',
  []
)

export const sampleQuotaOverridesStore = createStore<SampleQuotaOverride[]>(
  'sample_quota_overrides',
  []
)

export const sampleDistributionRequestsStore = createStore<SampleDistributionRequest[]>(
  'sample_distribution_requests',
  []
)

// ============================================================================
// Helper Utilities & Calculations
// ============================================================================

const now = () => getSystemNow().toISOString()

export function getEffectivePeriodBounds(
  periodType: QuotaPeriodType,
  refDateStr?: string,
  customStart?: string,
  customEnd?: string
): { startDate: string; endDate: string } {
  const ref = refDateStr ? new Date(refDateStr) : getSystemNow()
  const year = ref.getFullYear()
  const month = ref.getMonth() // 0-11

  if (periodType === 'custom' && customStart && customEnd) {
    return { startDate: customStart, endDate: customEnd }
  }

  if (periodType === 'monthly') {
    const start = new Date(year, month, 1)
    const end = new Date(year, month + 1, 0)
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    }
  }

  if (periodType === 'quarterly') {
    const qStartMonth = Math.floor(month / 3) * 3
    const start = new Date(year, qStartMonth, 1)
    const end = new Date(year, qStartMonth + 3, 0)
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    }
  }

  if (periodType === 'semiannual') {
    const sStartMonth = month < 6 ? 0 : 6
    const start = new Date(year, sStartMonth, 1)
    const end = new Date(year, sStartMonth + 6, 0)
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    }
  }

  // Default fallback monthly
  const start = new Date(year, month, 1)
  const end = new Date(year, month + 1, 0)
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  }
}

/**
 * Resolves the active Doctor Quota Policy for a given doctor and product on an effective date.
 */
export function getActiveDoctorQuotaPolicy(
  doctorId: string,
  productIdOrCode: string,
  effectiveDateStr?: string
): DoctorQuotaPolicy | undefined {
  const canonProductCode = resolveCanonicalProductCode(productIdOrCode)
  const targetDate = effectiveDateStr || getSystemCurrentDate()

  const policies = doctorQuotaPoliciesStore.get().filter(
    (p) =>
      p.status === 'active' &&
      p.doctorId.toLowerCase() === doctorId.trim().toLowerCase() &&
      resolveCanonicalProductCode(p.productId) === canonProductCode
  )

  // Match date within start and end bounds
  return policies.find((p) => {
    if (p.startDate && p.startDate > targetDate) return false
    if (p.endDate && p.endDate < targetDate) return false
    return true
  })
}

/**
 * Calculates complete quota metrics for a doctor and product over the current applicable period.
 */
export interface DoctorQuotaStatus {
  doctorId: string
  productId: string
  productName: string
  hasPolicy: boolean
  allowedQuota: number
  distributedQty: number
  reservedQty: number
  remainingQuota: number
  consumedPct: number
  periodStart: string
  periodEnd: string
  periodType: QuotaPeriodType
  approvedOverrideQty: number
}

export function getDoctorQuotaStatus(
  doctorId: string,
  productIdOrCode: string,
  refDateStr?: string
): DoctorQuotaStatus {
  const canonCode = resolveCanonicalProductCode(productIdOrCode)
  const product = getCanonicalProduct(canonCode)
  const productName = product?.name || productIdOrCode
  const refDate = refDateStr || getSystemCurrentDate()

  const policy = getActiveDoctorQuotaPolicy(doctorId, canonCode, refDate)
  if (!policy) {
    // If no explicit quota policy exists, default to 0 with empty period
    const bounds = getEffectivePeriodBounds('monthly', refDate)
    return {
      doctorId,
      productId: canonCode,
      productName,
      hasPolicy: false,
      allowedQuota: 0,
      distributedQty: 0,
      reservedQty: 0,
      remainingQuota: 0,
      consumedPct: 0,
      periodStart: bounds.startDate,
      periodEnd: bounds.endDate,
      periodType: 'monthly',
      approvedOverrideQty: 0,
    }
  }

  const { startDate, endDate } = getEffectivePeriodBounds(
    policy.periodType,
    refDate,
    policy.startDate,
    policy.endDate
  )

  // 1. Calculate actual distributed quantities from stockMovementsStore
  // Movements of type 'sample' attributed to this customer/doctor and this product in this period
  const movements = stockMovementsStore.get()
  const distributedQty = movements
    .filter((m) => {
      if (m.type !== 'sample') return false
      const matchDoc = m.customer_id === doctorId
      if (!matchDoc) return false
      const matchProd = resolveCanonicalProductCode(m.product_id || m.productName) === canonCode
      if (!matchProd) return false
      const mDate = m.date || (m.updated_at ? m.updated_at.split('T')[0] : '')
      return mDate >= startDate && mDate <= endDate
    })
    .reduce((sum, m) => sum + (m.quantity || 0), 0)

  // 2. Calculate pending active reservations
  const reservations = doctorQuotaReservationsStore.get()
  const reservedQty = reservations
    .filter((r) => {
      if (r.status !== 'reserved') return false
      if (r.doctorId.toLowerCase() !== doctorId.toLowerCase()) return false
      if (resolveCanonicalProductCode(r.productId) !== canonCode) return false
      const rDate = r.created_at.split('T')[0]
      return rDate >= startDate && rDate <= endDate
    })
    .reduce((sum, r) => sum + (r.quantity || 0), 0)

  // 3. Calculate any active approved overrides that add to this doctor's specific allowance
  const overrides = sampleQuotaOverridesStore.get()
  const approvedOverrideQty = overrides
    .filter((o) => {
      if (o.status !== 'approved') return false
      if (o.doctorId.toLowerCase() !== doctorId.toLowerCase()) return false
      if (resolveCanonicalProductCode(o.productId) !== canonCode) return false
      const oDate = o.created_at.split('T')[0]
      return oDate >= startDate && oDate <= endDate
    })
    .reduce((sum, o) => sum + (o.approvedExcessQuantity || 0), 0)

  const effectiveAllowed = policy.allowedQuantity + approvedOverrideQty
  const totalOccupied = distributedQty + reservedQty
  const remainingQuota = Math.max(0, effectiveAllowed - totalOccupied)
  const consumedPct = effectiveAllowed > 0 ? Math.min(100, Math.round((totalOccupied / effectiveAllowed) * 100)) : 0

  return {
    doctorId,
    productId: canonCode,
    productName,
    hasPolicy: true,
    allowedQuota: policy.allowedQuantity,
    distributedQty,
    reservedQty,
    remainingQuota,
    consumedPct,
    periodStart: startDate,
    periodEnd: endDate,
    periodType: policy.periodType,
    approvedOverrideQty,
  }
}

// ============================================================================
// Admin Quota Policy Management
// ============================================================================

export function upsertDoctorQuotaPolicy(
  policyData: Omit<DoctorQuotaPolicy, 'id' | 'version' | 'created_at' | 'updated_at'> & { id?: string },
  actor: string | { id?: string; name?: string; role?: string }
): DoctorQuotaPolicy {
  const authUser = findAuthoritativeUser(actor)
  const actorRole = authUser?.role || (typeof actor === 'object' && actor?.role ? actor.role : 'rep')
  const actorName = authUser?.name || (typeof actor === 'object' && actor?.name ? actor.name : typeof actor === 'string' ? actor : 'Admin')

  if (actorRole !== 'admin') {
    throw new Error(`Unauthorized: User "${actorName}" (${actorRole}) cannot configure Doctor Quota Policies. Only Executive Administrators are authorized.`)
  }

  if (policyData.allowedQuantity < 0 || !Number.isInteger(policyData.allowedQuantity)) {
    throw new Error('Allowed quota quantity must be a non-negative integer.')
  }

  const canonCode = resolveCanonicalProductCode(policyData.productId)
  const product = getCanonicalProduct(canonCode)
  const productName = product?.name || policyData.productName || canonCode
  const at = now()

  // Prevent overlapping active policies for the exact same Doctor + Product + period
  const existing = doctorQuotaPoliciesStore.get()
  const duplicate = existing.find((p) => {
    if (policyData.id && p.id === policyData.id) return false
    if (p.status !== 'active' || policyData.status !== 'active') return false
    if (p.doctorId.toLowerCase() !== policyData.doctorId.toLowerCase()) return false
    if (resolveCanonicalProductCode(p.productId) !== canonCode) return false
    // Date overlap check
    const pStart = p.startDate
    const pEnd = p.endDate || '2099-12-31'
    const newStart = policyData.startDate
    const newEnd = policyData.endDate || '2099-12-31'
    return newStart <= pEnd && newEnd >= pStart
  })

  if (duplicate) {
    throw new Error(
      `An active quota policy already exists for Doctor (${policyData.doctorId}) and Product (${productName}) within the specified date period.`
    )
  }

  let finalPolicy: DoctorQuotaPolicy

  if (policyData.id) {
    const current = existing.find((p) => p.id === policyData.id)
    if (!current) throw new Error(`Quota policy ${policyData.id} not found.`)
    finalPolicy = {
      ...current,
      ...policyData,
      productId: canonCode,
      productName,
      version: current.version + 1,
      updated_at: at,
    }
    doctorQuotaPoliciesStore.update((list) => list.map((p) => (p.id === finalPolicy.id ? finalPolicy : p)))
  } else {
    finalPolicy = {
      ...policyData,
      id: `dqp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      productId: canonCode,
      productName,
      version: 1,
      created_at: at,
      updated_at: at,
    }
    doctorQuotaPoliciesStore.update((list) => [finalPolicy, ...list])
  }

  addAuditLog({
    action: policyData.id ? 'Doctor Quota Policy Updated' : 'Doctor Quota Policy Created',
    actor: actorName,
    time: 'Just now',
    details: `Doctor Quota Policy for ${finalPolicy.doctorName || finalPolicy.doctorId} - ${productName}: ${finalPolicy.allowedQuantity} units (${finalPolicy.periodType}) by ${actorName}`,
  })

  return finalPolicy
}

// ============================================================================
// Representative Sample Custody
// ============================================================================

export function getRepCustodyBalance(repIdentifier: string, productIdOrCode: string): number {
  const canonCode = resolveCanonicalProductCode(productIdOrCode)
  const product = getCanonicalProduct(canonCode)
  const productName = product?.name || canonCode
  const authUser = findAuthoritativeUser(repIdentifier)
  const repName = authUser?.name || repIdentifier

  const batches = batchesStore.get()
  const movements = stockMovementsStore.get()
  return getRepAvailableSampleStock(repName, productName, batches, movements)
}

// ============================================================================
// Sample Distribution Request & Override Workflow
// ============================================================================

/**
 * Creates or updates a sample distribution request.
 * Automatically evaluates Doctor Quota and Rep Custody.
 * If Doctor Quota is exceeded, creates a pending SampleQuotaOverride and reserves remaining normal quota.
 * If Rep Custody is insufficient, the operation is blocked entirely.
 */
export function submitSampleDistributionRequest(
  data: {
    doctorId: string
    doctorName?: string
    repId: string
    repName?: string
    visitId?: string
    visitPlanId?: string
    items: SampleDistributionItem[]
    notes?: string
  },
  actor: string | { id?: string; name?: string; role?: string }
): SampleDistributionRequest {
  const authUser = findAuthoritativeUser(actor)
  const actorName = authUser?.name || (typeof actor === 'object' && actor?.name ? actor.name : typeof actor === 'string' ? actor : 'Rep')

  if (!data.items || data.items.length === 0) {
    throw new Error('Sample distribution request must include at least one product item.')
  }

  const at = now()
  const requestId = `sdr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
  const createdOverrides: string[] = []
  let requiresOverride = false

  // Validate Rep custody and Doctor quota for each item
  for (const item of data.items) {
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      throw new Error(`Quantity for product ${item.productName || item.productId} must be a positive integer.`)
    }

    const canonCode = resolveCanonicalProductCode(item.productId)
    const product = getCanonicalProduct(canonCode)
    const prodName = product?.name || item.productName || canonCode
    item.productId = canonCode
    item.productName = prodName

    // 1. Rep Custody check (Strict: Cannot be overridden)
    const repAvailableCustody = getRepCustodyBalance(data.repId, canonCode)
    if (repAvailableCustody < item.quantity) {
      throw new Error(
        `Insufficient representative custody for ${prodName}. Available in custody: ${repAvailableCustody}, Requested: ${item.quantity}. Doctor quota overrides cannot bypass representative custody.`
      )
    }

    // 2. Doctor Quota check
    const quotaStatus = getDoctorQuotaStatus(data.doctorId, canonCode)
    if (quotaStatus.hasPolicy && quotaStatus.remainingQuota < item.quantity) {
      // Exceeds normal quota
      requiresOverride = true
      const excessNeeded = item.quantity - quotaStatus.remainingQuota

      const overrideRecord: SampleQuotaOverride = {
        id: `sqo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        requestId,
        doctorId: data.doctorId,
        doctorName: data.doctorName,
        productId: canonCode,
        productName: prodName,
        repId: data.repId,
        repName: data.repName,
        requestedQuantity: item.quantity,
        standardRemainingQuota: quotaStatus.remainingQuota,
        approvedExcessQuantity: excessNeeded,
        status: 'pending',
        reason: data.notes || 'Distribution exceeds doctor sample quota limit.',
        created_at: at,
      }
      sampleQuotaOverridesStore.update((list) => [overrideRecord, ...list])
      createdOverrides.push(overrideRecord.id)

      // Reserve whatever standard quota is currently remaining
      if (quotaStatus.remainingQuota > 0) {
        doctorQuotaReservationsStore.update((list) => [
          {
            id: `res-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            requestId,
            doctorId: data.doctorId,
            productId: canonCode,
            repId: data.repId,
            quantity: quotaStatus.remainingQuota,
            status: 'reserved',
            created_at: at,
          },
          ...list,
        ])
      }
    } else {
      // Fully covered by standard quota -> reserve entire item quantity
      doctorQuotaReservationsStore.update((list) => [
        {
          id: `res-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          requestId,
          doctorId: data.doctorId,
          productId: canonCode,
          repId: data.repId,
          quantity: item.quantity,
          status: 'reserved',
          created_at: at,
        },
        ...list,
      ])
    }
  }

  const request: SampleDistributionRequest = {
    id: requestId,
    doctorId: data.doctorId,
    doctorName: data.doctorName || data.doctorId,
    repId: data.repId,
    repName: data.repName || data.repId,
    visitId: data.visitId,
    visitPlanId: data.visitPlanId,
    items: data.items,
    status: requiresOverride ? 'pending_override' : 'approved',
    requiresOverride,
    overrideIds: createdOverrides.length > 0 ? createdOverrides : undefined,
    notes: data.notes,
    created_at: at,
  }

  sampleDistributionRequestsStore.update((list) => [request, ...list])

  addAuditLog({
    action: requiresOverride ? 'Sample Request Awaiting Override' : 'Sample Request Created',
    actor: actorName,
    time: 'Just now',
    details: `Sample distribution request ${requestId} for ${request.doctorName} submitted by ${request.repName} (${requiresOverride ? 'Requires Admin Override' : 'Auto-Approved'})`,
  })

  if (requiresOverride) {
    addNotification({
      title: 'Doctor Quota Override Required',
      message: `${request.repName} requested ${request.items.map((i) => `${i.quantity}x ${i.productName}`).join(', ')} exceeding Doctor Quota for ${request.doctorName}.`,
      category: 'system',
      priority: 'warning',
      time: 'Just now',
      targetPage: 'Settings',
    })
  }

  return request
}

/**
 * Admin action to review (approve or reject) a doctor quota override.
 */
export function reviewQuotaOverride(
  overrideId: string,
  action: 'approve' | 'reject',
  adminActor: string | { id?: string; name?: string; role?: string },
  adminNotes?: string
): SampleQuotaOverride {
  const authUser = findAuthoritativeUser(adminActor)
  const actorRole = authUser?.role || (typeof adminActor === 'object' && adminActor?.role ? adminActor.role : 'rep')
  const actorName = authUser?.name || (typeof adminActor === 'object' && adminActor?.name ? adminActor.name : typeof adminActor === 'string' ? adminActor : 'Admin')

  if (actorRole !== 'admin') {
    throw new Error(`Unauthorized: User "${actorName}" (${actorRole}) cannot review quota overrides. Only Executive Administrators are authorized.`)
  }

  const overrides = sampleQuotaOverridesStore.get()
  const override = overrides.find((o) => o.id === overrideId)
  if (!override) throw new Error(`Quota override ${overrideId} not found.`)
  if (override.status !== 'pending') {
    throw new Error(`Quota override ${overrideId} is already ${override.status}.`)
  }

  const at = now()
  const updatedStatus = action === 'approve' ? 'approved' : 'rejected'

  const updatedOverride: SampleQuotaOverride = {
    ...override,
    status: updatedStatus,
    adminNotes,
    reviewedBy: actorName,
    reviewedAt: at,
  }

  sampleQuotaOverridesStore.update((list) =>
    list.map((o) => (o.id === overrideId ? updatedOverride : o))
  )

  // Update associated request
  const request = sampleDistributionRequestsStore.get().find((r) => r.id === override.requestId)
  if (request) {
    if (action === 'approve') {
      // If all overrides for this request are approved, approve request
      const otherOverrides = sampleQuotaOverridesStore
        .get()
        .filter((o) => o.requestId === request.id && o.id !== overrideId)
      const allApproved = otherOverrides.every((o) => o.status === 'approved')
      if (allApproved) {
        sampleDistributionRequestsStore.update((list) =>
          list.map((r) => (r.id === request.id ? { ...r, status: 'approved' } : r))
        )
      }
    } else {
      // Rejection: reject the distribution request and release any existing reservations
      sampleDistributionRequestsStore.update((list) =>
        list.map((r) => (r.id === request.id ? { ...r, status: 'rejected' } : r))
      )
      doctorQuotaReservationsStore.update((list) =>
        list.map((res) => (res.requestId === request.id ? { ...res, status: 'released', released_at: at } : res))
      )
    }
  }

  addAuditLog({
    action: action === 'approve' ? 'Quota Override Approved' : 'Quota Override Rejected',
    actor: actorName,
    time: 'Just now',
    details: `Doctor Quota Override for ${override.doctorName || override.doctorId} (${override.productName}): ${action.toUpperCase()} by ${actorName}`,
  })

  return updatedOverride
}

/**
 * Confirms actual physical execution of an approved sample distribution.
 * Converts reservations to consumed, validates rep custody again, creates sample StockMovement,
 * and updates distribution request status to 'distributed'.
 */
export function confirmSampleDistribution(
  requestId: string,
  actor: string | { id?: string; name?: string; role?: string }
): SampleDistributionRequest {
  const authUser = findAuthoritativeUser(actor)
  const actorName = authUser?.name || (typeof actor === 'object' && actor?.name ? actor.name : typeof actor === 'string' ? actor : 'User')

  const request = sampleDistributionRequestsStore.get().find((r) => r.id === requestId)
  if (!request) throw new Error(`Sample distribution request ${requestId} not found.`)
  if (request.status !== 'approved') {
    throw new Error(`Cannot confirm distribution: Request ${requestId} is currently "${request.status}" (must be "approved").`)
  }

  const at = now()
  const todayStr = at.split('T')[0]
  const batches = batchesStore.get()
  const movements = stockMovementsStore.get()

  // Execute FEFO allocation from Rep's physical sample custody and write stockMovements
  for (const item of request.items) {
    const canonCode = resolveCanonicalProductCode(item.productId)
    const product = getCanonicalProduct(canonCode)
    const prodName = product?.name || item.productName || canonCode

    // Validate rep sample custody availability one final time
    const repAvailable = getRepAvailableSampleStock(request.repName, prodName, batches, movements)
    if (repAvailable < item.quantity) {
      throw new Error(
        `Final distribution failed: Representative ${request.repName} has insufficient physical custody for ${prodName} (Available: ${repAvailable}, Required: ${item.quantity}).`
      )
    }

    // Allocate FEFO from rep custody
    const repBatches = allocateRepSampleFefo(request.repName, prodName, item.quantity, batches, movements)

    for (const alloc of repBatches) {
      addStockMovement({
        product_id: canonCode,
        productName: prodName,
        batchNumber: alloc.batchNumber,
        batch_id: alloc.batchId,
        quantity: alloc.quantity,
        type: 'sample',
        date: todayStr,
        customer_id: request.doctorId,
        customerName: request.doctorName,
        rep_id: request.repId,
        repName: request.repName,
        referenceType: 'visit',
        referenceId: request.visitId || request.id,
      })
    }
  }

  // Mark all reservations for this request as consumed
  doctorQuotaReservationsStore.update((list) =>
    list.map((r) => (r.requestId === requestId ? { ...r, status: 'consumed' } : r))
  )

  // Mark overrides as consumed
  if (request.overrideIds) {
    sampleQuotaOverridesStore.update((list) =>
      list.map((o) => (request.overrideIds?.includes(o.id) ? { ...o, status: 'consumed' } : o))
    )
  }

  // Update request status
  const updatedRequest: SampleDistributionRequest = {
    ...request,
    status: 'distributed',
    distributed_at: at,
  }
  sampleDistributionRequestsStore.update((list) =>
    list.map((r) => (r.id === requestId ? updatedRequest : r))
  )

  addAuditLog({
    action: 'Samples Distributed',
    actor: actorName,
    time: 'Just now',
    details: `Executed distribution ${requestId} to ${request.doctorName}: ${request.items.map((i) => `${i.quantity}x ${i.productName}`).join(', ')} by ${request.repName}`,
  })

  return updatedRequest
}

/**
 * Cancels a sample distribution request and releases any held quota reservations and overrides.
 */
export function cancelSampleDistributionRequest(
  requestId: string,
  actor: string | { id?: string; name?: string; role?: string },
  reason?: string
): SampleDistributionRequest {
  const authUser = findAuthoritativeUser(actor)
  const actorName = authUser?.name || (typeof actor === 'object' && actor?.name ? actor.name : typeof actor === 'string' ? actor : 'User')

  const request = sampleDistributionRequestsStore.get().find((r) => r.id === requestId)
  if (!request) throw new Error(`Sample distribution request ${requestId} not found.`)
  if (request.status === 'distributed') {
    throw new Error('Cannot cancel a distribution request that has already been executed.')
  }
  if (request.status === 'cancelled') {
    throw new Error('Request is already cancelled.')
  }

  const at = now()

  // Release all active reservations
  doctorQuotaReservationsStore.update((list) =>
    list.map((r) => (r.requestId === requestId && r.status === 'reserved' ? { ...r, status: 'released', released_at: at } : r))
  )

  // Cancel associated overrides
  if (request.overrideIds) {
    sampleQuotaOverridesStore.update((list) =>
      list.map((o) => (request.overrideIds?.includes(o.id) && o.status === 'pending' ? { ...o, status: 'cancelled' } : o))
    )
  }

  const updatedRequest: SampleDistributionRequest = {
    ...request,
    status: 'cancelled',
    cancelled_at: at,
    notes: reason ? `${request.notes || ''} [Cancelled: ${reason}]`.trim() : request.notes,
  }

  sampleDistributionRequestsStore.update((list) =>
    list.map((r) => (r.id === requestId ? updatedRequest : r))
  )

  addAuditLog({
    action: 'Sample Request Cancelled',
    actor: actorName,
    time: 'Just now',
    details: `Sample distribution request ${requestId} for ${request.doctorName} was cancelled by ${actorName}`,
  })

  return updatedRequest
}
