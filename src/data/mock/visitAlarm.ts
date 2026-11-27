import { createStore } from './store'
import { customersStore, type Customer } from './customers'
import { visitsStore, type StoredVisit } from './visits'
import {
  visitFrequencyStore,
  getCustomerVisitStats,
  isCustomerOverdue,
  DEFAULT_VISIT_FREQUENCY_POLICY,
  type CustomerClass,
} from './visitFrequency'
import { getSystemCurrentDate } from '@/lib/dateUtils'
import { visitPlansStore, type VisitPlan, type VisitPlanStop } from './visit-plans'
import { filterVisitPlansByScope } from './dataScope'
import { usersStore } from './users'

export interface VisitAlarmParams {
  doctorId?: string
  doctorName?: string
  clientId?: string
  clientName?: string
  visitId?: string
  scheduledDate?: string
  scheduledTime?: string
  callNumber?: number | string
  referenceDate?: string
  lang?: 'en' | 'ar'
}

export interface VisitAlarmDetails {
  doctorName: string
  doctorName_ar?: string
  doctorId?: string
  callNumber: string
  callNumberNumeric?: number
  coverage: string
  coveragePercentage?: number
  isOverdue: boolean
  frequency: string
  customerClass?: string
  scheduledDate?: string
  scheduledTime?: string
  visitId?: string
  repName?: string
  specialty?: string
  address?: string
}

export interface ActiveVisitAlarm {
  id: string
  visitId?: string
  planId?: string
  stopId?: string
  doctorId?: string
  doctorName: string
  scheduledDate: string
  scheduledTime?: string
  repName: string
  repId?: string
  details: VisitAlarmDetails
  createdAt: string
  snoozedUntil?: string
  dismissed: boolean
}

/**
 * Calculates or retrieves the authoritative Call Number for an HCP's scheduled/actual visit.
 * Strict rules:
 * - NOT a phone number.
 * - Retrieved from explicit field if present, or calculated dynamically from existing visit sequence.
 * - If unavailable / cannot be resolved, returns 'Not available' (or Arabic translation).
 */
export function calculateDoctorCallNumber(
  customerIdOrName?: string,
  options?: {
    visitId?: string
    scheduledDate?: string
    explicitCallNumber?: number | string
    lang?: 'en' | 'ar'
  }
): { display: string; numeric?: number } {
  const lang = options?.lang || 'en'
  const notAvailable = lang === 'ar' ? 'غير متوفر' : 'Not available'

  // 1. Explicit call number provided on record/params
  if (options?.explicitCallNumber !== undefined && options?.explicitCallNumber !== null && options?.explicitCallNumber !== '') {
    const num = Number(options.explicitCallNumber)
    if (!isNaN(num) && num > 0) {
      return {
        display: lang === 'ar' ? `زيارة رقم ${num}` : `Call #${num}`,
        numeric: num,
      }
    }
    return {
      display: String(options.explicitCallNumber),
    }
  }

  if (!customerIdOrName || !customerIdOrName.trim()) {
    return { display: notAvailable }
  }

  const query = customerIdOrName.trim().toLowerCase()
  const customers = customersStore.get()
  const customer = customers.find(
    (c) =>
      c.id?.toLowerCase() === query ||
      c.name?.toLowerCase() === query ||
      (c.name_ar && c.name_ar.toLowerCase() === query)
  )

  // 2. Check if customer record itself has explicit callNumber
  if (customer && (customer as any).callNumber !== undefined) {
    const cNum = Number((customer as any).callNumber)
    if (!isNaN(cNum) && cNum > 0) {
      return {
        display: lang === 'ar' ? `زيارة رقم ${cNum}` : `Call #${cNum}`,
        numeric: cNum,
      }
    }
  }

  // 3. Dynamic sequence calculation from visitsStore
  const allVisits = visitsStore.get()
  const customerVisits = allVisits.filter((v) => {
    const matchId = (customer?.id && (v.clientId === customer.id || v.doctorId === customer.id)) ||
      (v.clientId && v.clientId.toLowerCase() === query) ||
      (v.doctorId && v.doctorId.toLowerCase() === query)
    const matchName = (customer?.name && v.clientName?.toLowerCase() === customer.name.toLowerCase()) ||
      v.clientName?.toLowerCase() === query
    return Boolean(matchId || matchName)
  })

  // If specific visitId provided, find index
  if (options?.visitId) {
    const visitIdx = customerVisits.findIndex((v) => v.id === options.visitId)
    if (visitIdx >= 0) {
      const callNum = visitIdx + 1
      return {
        display: lang === 'ar' ? `زيارة رقم ${callNum}` : `Call #${callNum}`,
        numeric: callNum,
      }
    }
  }

  // Otherwise calculate next call number based on completed visits
  const completedVisits = customerVisits.filter((v) => v.status === 'Completed')
  if (customer || customerVisits.length > 0) {
    const nextCallNum = completedVisits.length + 1
    return {
      display: lang === 'ar' ? `زيارة رقم ${nextCallNum}` : `Call #${nextCallNum}`,
      numeric: nextCallNum,
    }
  }

  return { display: notAvailable }
}

/**
 * Retrieves the doctor's current visit coverage dynamically from customer and frequency data.
 * If data is unavailable, returns 'Not available'.
 */
export function getDoctorCoverageDisplay(
  customerIdOrName?: string,
  lang: 'en' | 'ar' = 'en',
  referenceDate?: string
): { display: string; percentage?: number; isOverdue: boolean } {
  const notAvailable = lang === 'ar' ? 'غير متوفر' : 'Not available'

  if (!customerIdOrName || !customerIdOrName.trim()) {
    return { display: notAvailable, isOverdue: false }
  }

  const query = customerIdOrName.trim().toLowerCase()
  const customers = customersStore.get()
  const customer = customers.find(
    (c) =>
      c.id?.toLowerCase() === query ||
      c.name?.toLowerCase() === query ||
      (c.name_ar && c.name_ar.toLowerCase() === query)
  )

  if (!customer) {
    return { display: notAvailable, isOverdue: false }
  }

  // Use existing authoritative stats
  const stats = getCustomerVisitStats(customer.id || customer.name, referenceDate)
  if (!stats) {
    return { display: notAvailable, isOverdue: false }
  }

  const target = stats.targetVisits
  const completed = stats.completedVisits
  const pct = target > 0 ? Math.round((completed / target) * 100) : 0
  const overdue = isCustomerOverdue(customer.id || customer.name, referenceDate)

  let display: string
  if (lang === 'ar') {
    const statusText = overdue ? 'متأخرة' : 'في المسار'
    display = `${pct}% (${completed} من ${target} زيارة) · ${statusText}`
  } else {
    const statusText = overdue ? 'Overdue' : 'On Track'
    display = `${pct}% (${completed}/${target} visits) · ${statusText}`
  }

  return {
    display,
    percentage: pct,
    isOverdue: overdue,
  }
}

/**
 * Retrieves the required visit frequency based on the existing configurable Visit Frequency Policy.
 * Dynamically updates when policy is updated.
 * If unavailable, returns 'Not available'.
 */
export function getDoctorFrequencyDisplay(
  customerIdOrName?: string,
  lang: 'en' | 'ar' = 'en'
): { display: string; customerClass?: CustomerClass } {
  const notAvailable = lang === 'ar' ? 'غير متوفر' : 'Not available'

  if (!customerIdOrName || !customerIdOrName.trim()) {
    return { display: notAvailable }
  }

  const query = customerIdOrName.trim().toLowerCase()
  const customers = customersStore.get()
  const customer = customers.find(
    (c) =>
      c.id?.toLowerCase() === query ||
      c.name?.toLowerCase() === query ||
      (c.name_ar && c.name_ar.toLowerCase() === query)
  )

  if (!customer) {
    return { display: notAvailable }
  }

  const rawClass = customer.classification?.replace('Class ', '').trim() || 'A'
  const customerClass: CustomerClass = (rawClass === 'B' || rawClass === 'C') ? rawClass : 'A'

  const policy = visitFrequencyStore.get()
  const config = policy[customerClass] || DEFAULT_VISIT_FREQUENCY_POLICY[customerClass]

  let display: string
  if (lang === 'ar') {
    const visitsUnit = config.targetVisits === 1 ? 'زيارة' : 'زيارات'
    const periodUnit = config.periodMonths === 1 ? 'شهرياً' : config.periodMonths === 2 ? 'كل شهرين' : `كل ${config.periodMonths} أشهر`
    display = `${config.targetVisits} ${visitsUnit} ${periodUnit} (فئة ${customerClass})`
  } else {
    const visitsUnit = config.targetVisits === 1 ? 'visit' : 'visits'
    const periodUnit = config.periodMonths === 1 ? 'month' : `${config.periodMonths} months`
    display = `${config.targetVisits} ${visitsUnit} / ${periodUnit} (Class ${customerClass})`
  }

  return { display, customerClass }
}

/**
 * Compiles complete authoritative Visit Alarm details for display.
 * Resolves Doctor Name, Call Number, Coverage, and Frequency dynamically.
 */
export function getVisitAlarmDetails(params: VisitAlarmParams): VisitAlarmDetails {
  const lang = params.lang || 'en'
  const notAvailable = lang === 'ar' ? 'غير متوفر' : 'Not available'

  const lookupKey = params.doctorId || params.doctorName || params.clientId || params.clientName || ''
  const customers = customersStore.get()
  const customer = lookupKey
    ? customers.find(
        (c) =>
          c.id?.toLowerCase() === lookupKey.toLowerCase() ||
          c.name?.toLowerCase() === lookupKey.toLowerCase() ||
          (c.name_ar && c.name_ar.toLowerCase() === lookupKey.toLowerCase())
      )
    : undefined

  // 1. Doctor Name (Prominent)
  let doctorName = notAvailable
  let doctorName_ar: string | undefined

  if (customer) {
    doctorName = customer.name || notAvailable
    doctorName_ar = customer.name_ar
  } else if (params.doctorName && params.doctorName.trim()) {
    doctorName = params.doctorName.trim()
  } else if (params.clientName && params.clientName.trim()) {
    doctorName = params.clientName.trim()
  }

  // 2. Call Number (Not phone number, from existing field or sequence calculation)
  const callNumRes = calculateDoctorCallNumber(customer?.id || lookupKey, {
    visitId: params.visitId,
    scheduledDate: params.scheduledDate,
    explicitCallNumber: params.callNumber,
    lang,
  })

  // 3. Coverage (Current status and percentage from actual data)
  const coverageRes = getDoctorCoverageDisplay(customer?.id || lookupKey, lang, params.referenceDate)

  // 4. Frequency (From configured Visit Frequency Policy)
  const freqRes = getDoctorFrequencyDisplay(customer?.id || lookupKey, lang)

  return {
    doctorName,
    doctorName_ar,
    doctorId: customer?.id || params.doctorId || params.clientId,
    callNumber: callNumRes.display,
    callNumberNumeric: callNumRes.numeric,
    coverage: coverageRes.display,
    coveragePercentage: coverageRes.percentage,
    isOverdue: coverageRes.isOverdue,
    frequency: freqRes.display,
    customerClass: freqRes.customerClass,
    scheduledDate: params.scheduledDate,
    scheduledTime: params.scheduledTime,
    visitId: params.visitId,
    repName: customer?.repName,
    specialty: customer?.specialty,
    address: customer?.address,
  }
}

// ── Reactive Visit Alarms Store ─────────────────────────────────────────────

const SEED_ALARMS: ActiveVisitAlarm[] = [
  {
    id: 'alarm-VP-2401-stop-1',
    visitId: 'stop-1',
    planId: 'VP-2401',
    stopId: 'stop-1',
    doctorId: 'c-1',
    doctorName: 'Dr. Sarah Kim',
    scheduledDate: '2026-11-23',
    scheduledTime: '09:00 AM',
    repName: 'Alex Morgan',
    repId: 'u-admin-1',
    details: getVisitAlarmDetails({
      doctorId: 'c-1',
      doctorName: 'Dr. Sarah Kim',
      scheduledDate: '2026-11-23',
      scheduledTime: '09:00 AM',
    }),
    createdAt: new Date().toISOString(),
    dismissed: false,
  },
]

export const visitAlarmsStore = createStore<ActiveVisitAlarm[]>('visit_alarms_v1', SEED_ALARMS)

export function triggerVisitAlarm(data: Omit<ActiveVisitAlarm, 'id' | 'createdAt' | 'dismissed' | 'details'> & { id?: string; details?: VisitAlarmDetails }): ActiveVisitAlarm {
  const details = data.details || getVisitAlarmDetails({
    doctorId: data.doctorId,
    doctorName: data.doctorName,
    scheduledDate: data.scheduledDate,
    scheduledTime: data.scheduledTime,
    visitId: data.visitId,
  })

  const alarm: ActiveVisitAlarm = {
    ...data,
    id: data.id || `alarm-${Date.now()}`,
    details,
    createdAt: new Date().toISOString(),
    dismissed: false,
  }

  visitAlarmsStore.update((list) => {
    // Avoid duplicate alarms for same visit/stop
    const existing = list.filter((a) => a.id !== alarm.id && (a.stopId !== alarm.stopId || !alarm.stopId))
    return [alarm, ...existing]
  })

  return alarm
}

export function dismissVisitAlarm(alarmId: string) {
  visitAlarmsStore.update((list) =>
    list.map((a) => (a.id === alarmId ? { ...a, dismissed: true } : a))
  )
}

export function snoozeVisitAlarm(alarmId: string, minutes: number = 15) {
  const snoozeTime = new Date(Date.now() + minutes * 60 * 1000).toISOString()
  visitAlarmsStore.update((list) =>
    list.map((a) => (a.id === alarmId ? { ...a, snoozedUntil: snoozeTime } : a))
  )
}

export function clearDismissedAlarms() {
  visitAlarmsStore.update((list) => list.filter((a) => !a.dismissed))
}

/**
 * Evaluates approved and active visit plans for the current user and triggers
 * an alarm for high-importance scheduled visits (e.g. today's visits, overdue visits, Class A / high priority).
 */
export function checkAndTriggerImportantVisitAlarms(
  user?: { id?: string; name?: string; role?: any; businessUnit?: string },
  referenceDate?: string
): ActiveVisitAlarm | null {
  const today = referenceDate || getSystemCurrentDate()
  const allPlans = visitPlansStore.get()
  const users = usersStore.get()
  const scopedPlans = user ? filterVisitPlansByScope(allPlans, user, users) : allPlans

  // Only Approved or Active plans generate alarms per visibility rules
  const activePlans = scopedPlans.filter((p) => p.status === 'Approved' || p.status === 'Active')

  type ScoredStop = {
    plan: VisitPlan
    stop: VisitPlanStop
    score: number
  }

  const candidates: ScoredStop[] = []

  for (const plan of activePlans) {
    if (!plan.stops || plan.stops.length === 0) continue

    for (const stop of plan.stops) {
      if ((stop as any).status === 'Completed' || (stop as any).completed === true) continue

      const stopDate = stop.plannedDate || plan.startDate
      const isToday = stopDate === today
      const isPastDue = stopDate < today
      const isClassA = stop.priority === 'Class A' || stop.priority === 'High' || stop.priority === 'Critical'
      const customerOverdue = stop.clientId ? isCustomerOverdue(stop.clientId, today) : false

      // It's considered important if:
      // (1) Scheduled for today, OR
      // (2) Past due (overdue date), OR
      // (3) High Priority / Class A, OR
      // (4) Customer coverage is overdue
      if (isToday || isPastDue || isClassA || customerOverdue) {
        let score = 0
        if (isToday) score += 50
        if (isPastDue) score += 40
        if (isClassA) score += 30
        if (customerOverdue) score += 20

        candidates.push({ plan, stop, score })
      }
    }
  }

  // Sort by highest urgency score
  candidates.sort((a, b) => b.score - a.score)

  if (candidates.length === 0) return null

  const currentAlarms = visitAlarmsStore.get()

  // If there's already an active (non-dismissed) alarm, return it
  const activeAlarm = currentAlarms.find((a) => !a.dismissed)
  if (activeAlarm) {
    return activeAlarm
  }

  // Find the top candidate that has not been dismissed yet
  for (const { plan, stop } of candidates) {
    const alarmId = `alarm-${plan.id}-${stop.id}`
    const existing = currentAlarms.find((a) => a.id === alarmId || a.stopId === stop.id)
    if (existing) {
      if (existing.dismissed) continue
      return existing
    }

    // Trigger and return this important alarm
    return triggerVisitAlarm({
      id: alarmId,
      visitId: stop.id,
      planId: plan.id,
      stopId: stop.id,
      doctorId: stop.clientId,
      doctorName: stop.clientName,
      scheduledDate: stop.plannedDate || today,
      scheduledTime: stop.plannedTime,
      repName: plan.repName,
      repId: plan.repId,
    })
  }

  return null
}
