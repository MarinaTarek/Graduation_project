import { createStore } from './store'
import { addAuditLog } from './audit'
import { visitsStore, type StoredVisit } from './visits'
import { customersStore } from './customers'
import { getSystemNow } from '@/lib/dateUtils'

export interface DoctorClinicLocation {
  id: string
  customerId: string
  customerName: string
  clinicId: string
  clinicName: string
  latitude: number
  longitude: number
  accuracy: number // Accuracy in meters reported by device
  confirmedAt: string
  confirmedBy: string // user id or name who confirmed this reference location
  isPrimary?: boolean
  notes?: string
}

export interface LocationValidationConfig {
  geofenceRadiusMeters: number // default: 100 meters
  maxAccuracyThresholdMeters: number // default: 50 meters
}

export const DEFAULT_LOCATION_CONFIG: LocationValidationConfig = {
  geofenceRadiusMeters: 100,
  maxAccuracyThresholdMeters: 50,
}

export const locationConfigStore = createStore<LocationValidationConfig>(
  'location_validation_config',
  DEFAULT_LOCATION_CONFIG
)

export function updateLocationConfig(patch: Partial<LocationValidationConfig>, actor: string = 'Admin') {
  if (patch.geofenceRadiusMeters !== undefined && (patch.geofenceRadiusMeters <= 0 || !Number.isFinite(patch.geofenceRadiusMeters))) {
    throw new Error('Geofence radius must be a positive number of meters.')
  }
  if (patch.maxAccuracyThresholdMeters !== undefined && (patch.maxAccuracyThresholdMeters <= 0 || !Number.isFinite(patch.maxAccuracyThresholdMeters))) {
    throw new Error('Maximum accuracy threshold must be a positive number of meters.')
  }

  locationConfigStore.update((curr) => ({
    ...curr,
    ...patch,
  }))

  addAuditLog({
    action: 'Location Config Updated',
    actor,
    time: 'Just now',
    details: `Updated geofence radius to ${patch.geofenceRadiusMeters ?? 'default'}m, max accuracy to ${patch.maxAccuracyThresholdMeters ?? 'default'}m`,
  })
}

// ── Seed Locations ──────────────────────────────────────────────────────────
export const SEED_DOCTOR_LOCATIONS: DoctorClinicLocation[] = [
  {
    id: 'loc-1',
    customerId: 'c-1',
    customerName: 'Dr. Sarah Kim',
    clinicId: 'cl-1',
    clinicName: 'North Medical Center Suite 402',
    latitude: 30.0444,
    longitude: 31.2357,
    accuracy: 12,
    confirmedAt: '2026-10-01T09:00:00Z',
    confirmedBy: 'Alex Morgan',
    isPrimary: true,
  },
  {
    id: 'loc-3-primary',
    customerId: 'c-3',
    customerName: 'Dr. Marcus Lee',
    clinicId: 'cl-3-1',
    clinicName: 'City Cardiology Associates',
    latitude: 30.0601,
    longitude: 31.2205,
    accuracy: 15,
    confirmedAt: '2026-10-05T10:30:00Z',
    confirmedBy: 'Ahmed Samir',
    isPrimary: true,
  },
  {
    id: 'loc-3-secondary',
    customerId: 'c-3',
    customerName: 'Dr. Marcus Lee',
    clinicId: 'cl-3-2',
    clinicName: 'Nile Corniche Specialized Clinic',
    latitude: 30.075,
    longitude: 31.23,
    accuracy: 18,
    confirmedAt: '2026-10-12T14:15:00Z',
    confirmedBy: 'Ahmed Samir',
    isPrimary: false,
  },
  {
    id: 'loc-5',
    customerId: 'c-5',
    customerName: 'Dr. Youssef Nabil',
    clinicId: 'cl-5',
    clinicName: 'Heliopolis Heart Clinic',
    latitude: 30.09,
    longitude: 31.32,
    accuracy: 10,
    confirmedAt: '2026-10-15T11:00:00Z',
    confirmedBy: 'Sara Ali',
    isPrimary: true,
  },
]

export const doctorLocationsStore = createStore<DoctorClinicLocation[]>(
  'doctor_clinic_locations',
  SEED_DOCTOR_LOCATIONS
)

// ── Haversine Distance Formula ──────────────────────────────────────────────
/**
 * Calculates great-circle distance between two GPS coordinates in meters.
 */
export function calculateHaversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3 // Earth's mean radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180

  const φ1 = toRad(lat1)
  const φ2 = toRad(lat2)
  const Δφ = toRad(lat2 - lat1)
  const Δλ = toRad(lon2 - lon1)

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Math.round(R * c)
}

// ── Query Doctor Locations ──────────────────────────────────────────────────
export function getDoctorClinicLocations(customerIdOrName: string): DoctorClinicLocation[] {
  const list = doctorLocationsStore.get()
  const clean = customerIdOrName.trim().toLowerCase()
  return list.filter(
    (loc) => loc.customerId.toLowerCase() === clean || loc.customerName.toLowerCase() === clean
  )
}

// ── Register Doctor Clinic Location (First Visit / New Clinic) ──────────────
export interface RegisterLocationInput {
  customerId: string
  customerName: string
  clinicId?: string
  clinicName: string
  latitude: number
  longitude: number
  accuracy: number
  confirmedBy: string
  allowUpdate?: boolean
  notes?: string
}

export function registerDoctorClinicLocation(input: RegisterLocationInput): DoctorClinicLocation {
  if (!input.customerId || !input.customerId.trim()) {
    throw new Error('Customer ID is required to register clinic location.')
  }
  if (!input.clinicName || !input.clinicName.trim()) {
    throw new Error('Clinic name is required to register clinic location.')
  }
  if (
    typeof input.latitude !== 'number' ||
    typeof input.longitude !== 'number' ||
    isNaN(input.latitude) ||
    isNaN(input.longitude) ||
    input.latitude < -90 ||
    input.latitude > 90 ||
    input.longitude < -180 ||
    input.longitude > 180
  ) {
    throw new Error('Valid GPS coordinates (latitude -90..90, longitude -180..180) are required.')
  }
  if (typeof input.accuracy !== 'number' || isNaN(input.accuracy) || input.accuracy <= 0) {
    throw new Error('Valid positive GPS accuracy reading is required.')
  }

  const existingLocations = getDoctorClinicLocations(input.customerId)
  const clinicId = input.clinicId || `cl-${Date.now()}`
  const existingClinic = existingLocations.find(
    (l) =>
      (input.clinicId && l.clinicId === input.clinicId) ||
      l.clinicName.toLowerCase() === input.clinicName.trim().toLowerCase()
  )

  // Prevent automatic silent overwrite
  if (existingClinic && !input.allowUpdate) {
    throw new Error(
      `Reference location already exists for clinic "${input.clinicName}". Automatic overwriting is prohibited.`
    )
  }

  const nowIso = getSystemNow().toISOString()
  const record: DoctorClinicLocation = {
    id: existingClinic ? existingClinic.id : `loc-${Date.now()}`,
    customerId: input.customerId,
    customerName: input.customerName,
    clinicId,
    clinicName: input.clinicName.trim(),
    latitude: input.latitude,
    longitude: input.longitude,
    accuracy: input.accuracy,
    confirmedAt: nowIso,
    confirmedBy: input.confirmedBy,
    isPrimary: existingLocations.length === 0 || !existingClinic?.isPrimary ? (existingLocations.length === 0) : true,
    notes: input.notes,
  }

  doctorLocationsStore.update((list) => {
    if (existingClinic) {
      return list.map((l) => (l.id === record.id ? record : l))
    }
    return [...list, record]
  })

  addAuditLog({
    action: existingClinic ? 'Doctor Clinic Location Updated' : 'Doctor Clinic Location Registered',
    actor: input.confirmedBy,
    time: 'Just now',
    details: `${existingClinic ? 'Updated' : 'Registered'} reference location for ${input.customerName} - ${input.clinicName} (${input.latitude}, ${input.longitude})`,
  })

  return record
}

// ── Geofence Validation for Subsequent Visits ───────────────────────────────
export interface GeofenceValidationResult {
  status:
    | 'verified'
    | 'out_of_range'
    | 'inaccurate_gps'
    | 'first_visit_needed'
    | 'permission_denied'
    | 'unavailable'
  isWithinGeofence: boolean
  distanceMeters?: number
  permittedRadiusMeters: number
  reportedAccuracyMeters?: number
  maxAccuracyThresholdMeters: number
  clinicLocation?: DoctorClinicLocation
  messageEn: string
  messageAr: string
}

export function validateVisitGeofence(params: {
  customerId: string
  clinicId?: string
  latitude?: number
  longitude?: number
  accuracy?: number
  permissionDenied?: boolean
}): GeofenceValidationResult {
  const config = locationConfigStore.get()
  const permittedRadiusMeters = config.geofenceRadiusMeters
  const maxAccuracyThresholdMeters = config.maxAccuracyThresholdMeters

  if (params.permissionDenied) {
    return {
      status: 'permission_denied',
      isWithinGeofence: false,
      permittedRadiusMeters,
      maxAccuracyThresholdMeters,
      messageEn: 'Location permission was denied. Please allow location access to verify this visit.',
      messageAr: 'تم رفض إذن الوصول إلى الموقع الجغرافي. يرجى تفعيل الموقع للتحقق من الزيارة.',
    }
  }

  const existingLocations = getDoctorClinicLocations(params.customerId)
  if (existingLocations.length === 0) {
    return {
      status: 'first_visit_needed',
      isWithinGeofence: false,
      permittedRadiusMeters,
      maxAccuracyThresholdMeters,
      messageEn: 'First visit registration required: please confirm clinic location to establish a reference point.',
      messageAr: 'تسجيل الموقع للمرة الأولى مطلوب: يرجى تأكيد موقع العيادة لإنشاء نقطة مرجعية.',
    }
  }

  const targetClinic =
    (params.clinicId ? existingLocations.find((l) => l.clinicId === params.clinicId) : null) ||
    existingLocations[0]

  if (
    params.latitude === undefined ||
    params.longitude === undefined ||
    isNaN(params.latitude) ||
    isNaN(params.longitude)
  ) {
    return {
      status: 'unavailable',
      isWithinGeofence: false,
      permittedRadiusMeters,
      maxAccuracyThresholdMeters,
      clinicLocation: targetClinic,
      messageEn: 'Unable to detect GPS coordinates. Please retry location detection.',
      messageAr: 'تعذر التقاط إحداثيات الموقع الجغرافي. يرجى إعادة المحاولة.',
    }
  }

  // GPS Accuracy check
  if (params.accuracy !== undefined && params.accuracy > maxAccuracyThresholdMeters) {
    return {
      status: 'inaccurate_gps',
      isWithinGeofence: false,
      permittedRadiusMeters,
      reportedAccuracyMeters: params.accuracy,
      maxAccuracyThresholdMeters,
      clinicLocation: targetClinic,
      messageEn: `GPS accuracy is insufficient (±${Math.round(params.accuracy)}m vs required ≤${maxAccuracyThresholdMeters}m). Please request another reading.`,
      messageAr: `دقة الموقع الجغرافي غير كافية (±${Math.round(params.accuracy)} م مقابل الحد الأقصى ${maxAccuracyThresholdMeters} م). يرجى طلب قراءة جديدة.`,
    }
  }

  const distance = calculateHaversineDistanceMeters(
    params.latitude,
    params.longitude,
    targetClinic.latitude,
    targetClinic.longitude
  )

  if (distance <= permittedRadiusMeters) {
    return {
      status: 'verified',
      isWithinGeofence: true,
      distanceMeters: distance,
      permittedRadiusMeters,
      reportedAccuracyMeters: params.accuracy,
      maxAccuracyThresholdMeters,
      clinicLocation: targetClinic,
      messageEn: `Location verified. You are within the permitted visit area (${distance}m from clinic).`,
      messageAr: `تم التحقق من الموقع الجغرافي بنجاح. أنت داخل نطاق الزيارة المسموح به (${distance} م من العيادة).`,
    }
  }

  return {
    status: 'out_of_range',
    isWithinGeofence: false,
    distanceMeters: distance,
    permittedRadiusMeters,
    reportedAccuracyMeters: params.accuracy,
    maxAccuracyThresholdMeters,
    clinicLocation: targetClinic,
    messageEn: `You are ${distance} meters away from the registered clinic location (permitted radius: ${permittedRadiusMeters}m). Move closer to confirm this visit.`,
    messageAr: `أنت على بعد ${distance} متراً من موقع العيادة المسجل (النطاق المسموح به: ${permittedRadiusMeters} م). يرجى الاقتراب لتأكيد الزيارة.`,
  }
}

// ── Offline Visits Queue & Local Storage Synchronization ───────────────────
export interface StoredVisitWithLocation extends StoredVisit {
  syncStatus?: 'Synced' | 'Pending Sync'
  locationStatus?: 'Location Verified' | 'Location Pending' | 'First Visit Registered'
  clinicId?: string
  clinicName?: string
  capturedLatitude?: number
  capturedLongitude?: number
  capturedAccuracy?: number
  geofenceDistanceMeters?: number
  gpsCapturedAt?: string
  presentationImage?: string
  presentationImageId?: string
  presentationImageName?: string
}

export const offlineVisitsQueueStore = createStore<StoredVisitWithLocation[]>(
  'offline_visits_queue',
  []
)

/**
 * Records a visit locally, supporting offline operation when device has GPS but no active internet.
 */
export function recordVisitLocally(
  visitData: Omit<StoredVisitWithLocation, 'id' | 'updated_at'> & { id?: string },
  isOffline: boolean = false
): StoredVisitWithLocation {
  const visitId = visitData.id ?? `V-LOC-${Date.now()}`
  const nowIso = getSystemNow().toISOString()

  const syncStatus: 'Synced' | 'Pending Sync' = isOffline ? 'Pending Sync' : 'Synced'
  const locationStatus: 'Location Verified' | 'Location Pending' | 'First Visit Registered' =
    visitData.gpsVerified
      ? 'Location Verified'
      : visitData.locationStatus || 'Location Pending'

  const visitRecord: StoredVisitWithLocation = {
    ...visitData,
    id: visitId,
    syncStatus,
    locationStatus,
    updated_at: nowIso,
  }

  // 1. Add to main visits store
  visitsStore.update((list) => [visitRecord, ...list.filter((v) => v.id !== visitId)])

  // 2. If offline, enqueue for background/connection sync
  if (isOffline) {
    offlineVisitsQueueStore.update((queue) => [
      visitRecord,
      ...queue.filter((q) => q.id !== visitId),
    ])
  }

  addAuditLog({
    action: isOffline ? 'Offline Visit Recorded' : 'Visit Recorded',
    actor: visitData.repName || 'User',
    time: 'Just now',
    details: `Recorded visit ${visitId} for ${visitData.clientName} (${syncStatus}, ${locationStatus})`,
  })

  return visitRecord
}

/**
 * Synchronizes queued offline visits to the active database / visits store.
 * Strictly prevents duplicate visit creation.
 */
export function syncOfflineVisits(): { syncedCount: number; syncedIds: string[] } {
  const queue = offlineVisitsQueueStore.get()
  if (queue.length === 0) {
    return { syncedCount: 0, syncedIds: [] }
  }

  const syncedIds: string[] = []

  visitsStore.update((list) => {
    const queueMap = new Map(queue.map((v) => [v.id, v]))
    return list.map((v) => {
      if (queueMap.has(v.id)) {
        syncedIds.push(v.id)
        return {
          ...v,
          syncStatus: 'Synced' as const,
          updated_at: getSystemNow().toISOString(),
        }
      }
      return v
    })
  })

  // Clear offline queue
  offlineVisitsQueueStore.set([])

  addAuditLog({
    action: 'Offline Visits Synced',
    actor: 'System',
    time: 'Just now',
    details: `Synchronized ${syncedIds.length} offline visit(s): ${syncedIds.join(', ')}`,
  })

  return {
    syncedCount: syncedIds.length,
    syncedIds,
  }
}
