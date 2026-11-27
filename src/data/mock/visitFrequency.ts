import { createStore } from './store'
import { addAuditLog } from './audit'
import { customersStore, type Customer } from './customers'
import { visitsStore, type StoredVisit } from './visits'
import { visitPlansStore, type VisitPlan, type VisitPlanStop } from './visit-plans'
import { getSystemCurrentDate } from '@/lib/dateUtils'

export type CustomerClass = 'A' | 'B' | 'C'

export interface ClassTargetConfig {
  customerClass: CustomerClass
  targetVisits: number // positive integer > 0
  periodMonths: number // positive integer > 0 (1 = per calendar month, 2 = every 2 calendar months, etc.)
}

export interface VisitFrequencyPolicy {
  A: ClassTargetConfig
  B: ClassTargetConfig
  C: ClassTargetConfig
}

/**
 * Initial default targets as per business rules:
 * - Class A: 2 visits per calendar month
 * - Class B: 1 visit per calendar month
 * - Class C: 1 visit every 2 calendar months
 */
export const DEFAULT_VISIT_FREQUENCY_POLICY: VisitFrequencyPolicy = {
  A: { customerClass: 'A', targetVisits: 2, periodMonths: 1 },
  B: { customerClass: 'B', targetVisits: 1, periodMonths: 1 },
  C: { customerClass: 'C', targetVisits: 1, periodMonths: 2 },
}

export const visitFrequencyStore = createStore<VisitFrequencyPolicy>(
  'visit_frequency_policy',
  DEFAULT_VISIT_FREQUENCY_POLICY
)

/**
 * Validate that frequency configuration targets are positive whole numbers
 * and target periods are valid positive numbers of calendar months.
 */
export function validatePolicyConfiguration(policy: VisitFrequencyPolicy): { valid: boolean; error?: string } {
  const classes: CustomerClass[] = ['A', 'B', 'C']
  for (const cls of classes) {
    const config = policy[cls]
    if (!config) {
      return { valid: false, error: `Missing configuration for Class ${cls}` }
    }
    if (!Number.isInteger(config.targetVisits) || config.targetVisits <= 0) {
      return { valid: false, error: `Visit target for Class ${cls} must be a positive whole number (got ${config.targetVisits})` }
    }
    if (!Number.isInteger(config.periodMonths) || config.periodMonths <= 0) {
      return { valid: false, error: `Target period for Class ${cls} must be a valid positive number of months (got ${config.periodMonths})` }
    }
  }
  return { valid: true }
}

export function updateVisitFrequencyPolicy(
  newPolicy: VisitFrequencyPolicy,
  actor: string = 'Admin'
) {
  const validation = validatePolicyConfiguration(newPolicy)
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid visit frequency policy configuration')
  }

  visitFrequencyStore.set({
    A: { ...newPolicy.A, customerClass: 'A' },
    B: { ...newPolicy.B, customerClass: 'B' },
    C: { ...newPolicy.C, customerClass: 'C' },
  })

  addAuditLog({
    action: 'Visit Frequency Targets Updated',
    actor,
    time: 'Just now',
    module: 'System',
    actionType: 'update',
    affectedRecord: 'Visit Frequency Policy',
    status: 'Success',
    details: `Updated visit frequency targets: Class A (${newPolicy.A.targetVisits}/${newPolicy.A.periodMonths}m), Class B (${newPolicy.B.targetVisits}/${newPolicy.B.periodMonths}m), Class C (${newPolicy.C.targetVisits}/${newPolicy.C.periodMonths}m)`,
  })
}

/**
 * Calculates start and end dates of the calendar cycle covering a given date.
 * For 1 month: calendar month start (1st) to calendar month end.
 * For N months: N-month block within the calendar year (e.g. Jan-Feb, Mar-Apr, etc.).
 */
export function getTargetPeriodBounds(dateStr: string, periodMonths: number = 1): {
  startDate: string
  endDate: string
  labelEn: string
  labelAr: string
} {
  let date: Date
  try {
    date = new Date(dateStr)
    if (isNaN(date.getTime())) date = new Date()
  } catch {
    date = new Date()
  }

  const year = date.getFullYear()
  const month = date.getMonth() // 0-indexed: 0 = Jan, 11 = Dec

  const cycleIndex = Math.floor(month / periodMonths)
  const startMonth = cycleIndex * periodMonths
  const endMonth = Math.min(11, startMonth + periodMonths - 1)

  const startDate = `${year}-${String(startMonth + 1).padStart(2, '0')}-01`
  const lastDay = new Date(year, endMonth + 1, 0).getDate()
  const endDate = `${year}-${String(endMonth + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

  const monthNamesEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const monthNamesAr = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']

  const labelEn = periodMonths === 1
    ? `${monthNamesEn[startMonth]} ${year}`
    : `${monthNamesEn[startMonth]} - ${monthNamesEn[endMonth]} ${year}`

  const labelAr = periodMonths === 1
    ? `${monthNamesAr[startMonth]} ${year}`
    : `${monthNamesAr[startMonth]} - ${monthNamesAr[endMonth]} ${year}`

  return { startDate, endDate, labelEn, labelAr }
}

function parseVisitIsoDate(dateStr: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr
  try {
    const d = new Date(dateStr)
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10)
  } catch {
    // fallback
  }
  return dateStr
}

export interface CustomerVisitStats {
  customer: Customer
  customerClass: CustomerClass
  targetVisits: number
  periodMonths: number
  periodBounds: { startDate: string; endDate: string; labelEn: string; labelAr: string }
  completedVisits: number
  alreadyScheduledVisits: number
  totalExistingValidVisits: number
  remainingRequired: number
}

/**
 * Computes authoritative visit statistics for a customer within the configured target period.
 * Strict rules enforced:
 * - Double Visit counts as ONE visit.
 * - Only 'Completed' visits count.
 * - Excludes Cancelled, Rejected, or Invalid visits.
 * - Considers already scheduled/approved visits in other active/approved plans to avoid excessive planning.
 * - Excludes pending or draft plans.
 * - Prevents double counting if a visit is represented in both stores.
 */
export function getCustomerVisitStats(
  customerIdOrName: string,
  referenceDateStr?: string,
  excludePlanId?: string
): CustomerVisitStats | null {
  const allCustomers = customersStore.get()
  const customer = allCustomers.find(
    (c) => c.id === customerIdOrName || c.name.toLowerCase() === customerIdOrName.toLowerCase()
  )

  if (!customer) return null

  const rawClass = customer.classification?.replace('Class ', '').trim() || 'A'
  const customerClass: CustomerClass = (rawClass === 'B' || rawClass === 'C') ? rawClass : 'A'

  const policy = visitFrequencyStore.get()
  const config = policy[customerClass] || DEFAULT_VISIT_FREQUENCY_POLICY[customerClass]

  const refDate = referenceDateStr || getSystemCurrentDate()
  const bounds = getTargetPeriodBounds(refDate, config.periodMonths)

  // 1. Count valid Completed visits in visitsStore (Double visit counts as 1)
  const allVisits = visitsStore.get()
  const completedVisitsList = allVisits.filter((v) => {
    const isCustomer = (v.clientId && v.clientId === customer.id) ||
      (v.doctorId && v.doctorId === customer.id) ||
      (v.clientName && customer.name && v.clientName.toLowerCase() === customer.name.toLowerCase())

    if (!isCustomer) return false
    if (v.status !== 'Completed') return false

    const vDate = parseVisitIsoDate(v.date)
    return vDate >= bounds.startDate && vDate <= bounds.endDate
  })

  const completedVisits = completedVisitsList.length

  // Track completed visit dates to avoid double-counting with approved plan stops
  const completedDates = new Set(completedVisitsList.map((v) => parseVisitIsoDate(v.date)))

  // 2. Count already scheduled/approved visits in other plans (Approved or Active only)
  const allPlans = visitPlansStore.get()
  let alreadyScheduledVisits = 0

  allPlans.forEach((p) => {
    if (p.id === excludePlanId) return
    if (p.status !== 'Approved' && p.status !== 'Active') return

    // Count stops for this customer that have not already been executed as completed visits
    if (p.stops && p.stops.length > 0) {
      p.stops.forEach((stop) => {
        const isMatch = (stop.clientId && stop.clientId === customer.id) ||
          (stop.clientName && customer.name && stop.clientName.toLowerCase() === customer.name.toLowerCase())

        if (isMatch && stop.plannedDate) {
          const sDate = parseVisitIsoDate(stop.plannedDate)
          if (sDate >= bounds.startDate && sDate <= bounds.endDate) {
            // Prevent double-counting if completed on that same date
            if (!completedDates.has(sDate)) {
              alreadyScheduledVisits += 1
            }
          }
        }
      })
    }
  })

  const totalExistingValidVisits = completedVisits + alreadyScheduledVisits
  const remainingRequired = Math.max(0, config.targetVisits - totalExistingValidVisits)

  return {
    customer,
    customerClass,
    targetVisits: config.targetVisits,
    periodMonths: config.periodMonths,
    periodBounds: bounds,
    completedVisits,
    alreadyScheduledVisits,
    totalExistingValidVisits,
    remainingRequired,
  }
}

/**
 * Authoritative check determining whether a customer is overdue for visits
 * under the configurable visit frequency policy.
 * A customer is overdue if valid completed visits within their active target period
 * are strictly less than the configured target for their classification.
 */
export function isCustomerOverdue(
  customerIdOrName: string,
  referenceDateStr?: string
): boolean {
  const stats = getCustomerVisitStats(customerIdOrName, referenceDateStr)
  if (stats) {
    return stats.completedVisits < stats.targetVisits
  }
  return true
}

export interface CustomerValidationFeedback {
  customerId: string
  customerName: string
  customerClassification: string
  requiredVisits: number
  targetPeriod: string
  completedVisits: number
  alreadyScheduledVisits: number
  currentPlanVisits: number
  remainingVisits: number
  excessVisits: number
  status: 'valid' | 'under_target' | 'over_target'
  messageEn: string
  messageAr: string
}

export interface PlanValidationResult {
  isValid: boolean
  feedbacks: CustomerValidationFeedback[]
  summaryMessageEn?: string
  summaryMessageAr?: string
}

/**
 * Validates a visit plan before submission or manager approval.
 * Evaluates every target customer against the active configurable visit frequency policy.
 * Blocks plan submission if any customer does not meet or exceeds the required target.
 */
export function validateVisitPlan(
  plan: {
    id?: string
    startDate?: string
    endDate?: string
    targetClients: string[]
    stops?: VisitPlanStop[]
    clientVisitCounts?: Record<string, number>
  }
): PlanValidationResult {
  const feedbacks: CustomerValidationFeedback[] = []
  let isValid = true

  const refDate = plan.startDate || getSystemCurrentDate()

  for (const clientIdentifier of plan.targetClients) {
    const stats = getCustomerVisitStats(clientIdentifier, refDate, plan.id)
    if (!stats) continue

    const { customer, customerClass, targetVisits, periodBounds, completedVisits, alreadyScheduledVisits } = stats

    // Calculate visits included in the current plan for this customer
    let currentPlanVisits = 0
    if (plan.clientVisitCounts && plan.clientVisitCounts[customer.id || customer.name] !== undefined) {
      currentPlanVisits = plan.clientVisitCounts[customer.id || customer.name]
    } else if (plan.stops && plan.stops.length > 0) {
      currentPlanVisits = plan.stops.filter((s) =>
        (s.clientId && s.clientId === customer.id) ||
        (s.clientName && s.clientName.toLowerCase() === customer.name.toLowerCase())
      ).length
    } else {
      // Default fallback when stops not individually enumerated: remaining needed to reach target
      currentPlanVisits = Math.max(1, targetVisits - (completedVisits + alreadyScheduledVisits))
    }

    const totalValidVisits = completedVisits + alreadyScheduledVisits + currentPlanVisits

    if (totalValidVisits < targetVisits) {
      isValid = false
      const remainingVisits = targetVisits - totalValidVisits
      feedbacks.push({
        customerId: customer.id || 'N/A',
        customerName: customer.name,
        customerClassification: `Class ${customerClass}`,
        requiredVisits: targetVisits,
        targetPeriod: periodBounds.labelEn,
        completedVisits,
        alreadyScheduledVisits,
        currentPlanVisits,
        remainingVisits,
        excessVisits: 0,
        status: 'under_target',
        messageEn: `${customer.name} (ID: ${customer.id || 'N/A'}, Class ${customerClass}) requires ${targetVisits} visit(s) in ${periodBounds.labelEn}. Total: ${totalValidVisits} (${completedVisits} completed, ${alreadyScheduledVisits} scheduled, ${currentPlanVisits} in plan). Deficit: ${remainingVisits} visit(s) required.`,
        messageAr: `${customer.name} (كود: ${customer.id || 'N/A'}، تصنيف ${customerClass}) يتطلب ${targetVisits} زيارة في ${periodBounds.labelAr}. الإجمالي: ${totalValidVisits} (${completedVisits} مكتملة، ${alreadyScheduledVisits} مجدولة، ${currentPlanVisits} بالخطة). النقص: ${remainingVisits} زيارة مطلوبة.`,
      })
    } else if (totalValidVisits > targetVisits) {
      isValid = false
      const excessVisits = totalValidVisits - targetVisits
      feedbacks.push({
        customerId: customer.id || 'N/A',
        customerName: customer.name,
        customerClassification: `Class ${customerClass}`,
        requiredVisits: targetVisits,
        targetPeriod: periodBounds.labelEn,
        completedVisits,
        alreadyScheduledVisits,
        currentPlanVisits,
        remainingVisits: 0,
        excessVisits,
        status: 'over_target',
        messageEn: `${customer.name} (ID: ${customer.id || 'N/A'}, Class ${customerClass}) exceeds the allowed target of ${targetVisits} visit(s) in ${periodBounds.labelEn}. Total: ${totalValidVisits} (${completedVisits} completed, ${alreadyScheduledVisits} scheduled, ${currentPlanVisits} in plan). Excess: ${excessVisits} visit(s).`,
        messageAr: `${customer.name} (كود: ${customer.id || 'N/A'}، تصنيف ${customerClass}) يتجاوز المستهدف المحدد بـ ${targetVisits} زيارة في ${periodBounds.labelAr}. الإجمالي: ${totalValidVisits} (${completedVisits} مكتملة، ${alreadyScheduledVisits} مجدولة، ${currentPlanVisits} بالخطة). الزيادة: ${excessVisits} زيارة فائضة.`,
      })
    } else {
      feedbacks.push({
        customerId: customer.id || 'N/A',
        customerName: customer.name,
        customerClassification: `Class ${customerClass}`,
        requiredVisits: targetVisits,
        targetPeriod: periodBounds.labelEn,
        completedVisits,
        alreadyScheduledVisits,
        currentPlanVisits,
        remainingVisits: 0,
        excessVisits: 0,
        status: 'valid',
        messageEn: `${customer.name} meets the target of ${targetVisits} visit(s) for ${periodBounds.labelEn}.`,
        messageAr: `${customer.name} يحقق المستهدف المطلوب (${targetVisits} زيارة) في ${periodBounds.labelAr}.`,
      })
    }
  }

  const invalidFeedbacks = feedbacks.filter((f) => f.status !== 'valid')
  const summaryMessageEn = isValid
    ? 'All target customers meet configurable visit frequency requirements.'
    : `${invalidFeedbacks.length} customer(s) violate visit frequency targets. Please correct targets before submitting.`

  const summaryMessageAr = isValid
    ? 'جميع العملاء المستهدفين يحققون متطلبات تكرار الزيارات المحددة.'
    : `يوجد ${invalidFeedbacks.length} عميل يخالفون مستهدفات الزيارات. يرجى تصحيح التوزيع قبل الإرسال.`

  return {
    isValid,
    feedbacks,
    summaryMessageEn,
    summaryMessageAr,
  }
}
