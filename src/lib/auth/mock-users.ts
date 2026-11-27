import { createStore } from '@/data/mock/store'
import type { User } from './types'
import { getDefaultPermissions } from './permissions'

export interface MockUserRecord extends User {
  passwordHash: string
}

export const MOCK_USERS: MockUserRecord[] = [
  {
    id: 'u-admin-1',
    name: 'Alex Morgan',
    name_ar: 'أليكس مورجان',
    email: 'admin@navigenpharma.net',
    role: 'admin',
    region: 'HQ - Global',
    status: 'active',
    emailVerified: true,
    permissions: getDefaultPermissions('admin'),
    passwordHash: 'Admin123!',
  },
  {
    id: 'u-bum-1',
    name: 'Dr. Khaled Fawzy',
    name_ar: 'د. خالد فوزي',
    email: 'khaled.fawzy@navigenpharma.net',
    role: 'business_unit_manager',
    region: 'North region',
    businessUnit: 'Cardio-Metabolic',
    status: 'active',
    emailVerified: true,
    permissions: getDefaultPermissions('business_unit_manager'),
    passwordHash: 'Bum123!',
    managerId: 'u-admin-1',
  },
  {
    id: 'u-flm-1',
    name: 'Mona Mansour',
    name_ar: 'منى منصور',
    email: 'mona.mansour@navigenpharma.net',
    role: 'first_line_manager',
    region: 'North region',
    businessUnit: 'Cardio-Metabolic',
    status: 'active',
    emailVerified: true,
    permissions: getDefaultPermissions('first_line_manager'),
    passwordHash: 'Flm123!',
    managerId: 'u-bum-1',
  },
  {
    id: 'u-mkt-1',
    name: 'Laila Mostafa',
    name_ar: 'ليلى مصطفى',
    email: 'laila.mostafa@navigenpharma.net',
    role: 'marketing_manager',
    region: 'HQ - Global',
    businessUnit: 'Cardio-Metabolic',
    status: 'active',
    emailVerified: true,
    permissions: getDefaultPermissions('marketing_manager'),
    passwordHash: 'Mkt123!',
    managerId: 'u-admin-1',
  },
  {
    id: 'u-rep-1',
    name: 'Ahmed Samir',
    name_ar: 'أحمد سمير',
    email: 'ahmed@navigenpharma.net',
    role: 'rep',
    region: 'North region',
    businessUnit: 'Cardio-Metabolic',
    status: 'active',
    emailVerified: true,
    permissions: getDefaultPermissions('rep'),
    passwordHash: 'Rep123!',
    managerId: 'u-admin-1',
  },
  {
    id: 'u-rep-2',
    name: 'Sara Ali',
    name_ar: 'سارة علي',
    email: 'sara@navigenpharma.net',
    role: 'rep',
    region: 'West region',
    businessUnit: 'Cardio-Metabolic',
    status: 'active',
    emailVerified: true,
    permissions: getDefaultPermissions('rep'),
    passwordHash: 'Rep123!',
    managerId: 'u-flm-1',
  },
  {
    id: 'u-rep-olivia',
    name: 'Olivia Martin',
    name_ar: 'أوليفيا مارتن',
    email: 'olivia.martin@navigenpharma.net',
    role: 'rep',
    region: 'North region',
    businessUnit: 'Cardio-Metabolic',
    status: 'active',
    emailVerified: true,
    permissions: getDefaultPermissions('rep'),
    passwordHash: 'Rep123!',
    managerId: 'u-flm-1',
  },
  {
    id: 'u-rep-maya',
    name: 'Maya Patel',
    name_ar: 'مايا باتيل',
    email: 'maya.patel@navigenpharma.net',
    role: 'rep',
    region: 'West region',
    businessUnit: 'Respiratory',
    status: 'active',
    emailVerified: true,
    permissions: getDefaultPermissions('rep'),
    passwordHash: 'Rep123!',
    managerId: 'u-admin-1',
  },
]

/**
 * Development-only QA & Manual Testing Organizational Test Accounts
 * Password for all test accounts: Test123!
 */
export const DEVELOPMENT_TEST_USERS: MockUserRecord[] = [
  {
    id: 'u-test-admin',
    name: 'Test Admin',
    name_ar: 'مدير اختباري',
    email: 'admin.test@navigen.local',
    role: 'admin',
    region: 'HQ',
    businessUnit: 'Company-wide',
    status: 'active',
    emailVerified: true,
    permissions: getDefaultPermissions('admin'),
    passwordHash: 'Test123!',
    isTestUser: true,
  },
  {
    id: 'u-test-bum-cardio',
    name: 'Test BUM Cardio',
    name_ar: 'مدير وحدة القلب اختباري',
    email: 'bum.cardio@navigen.local',
    role: 'business_unit_manager',
    region: 'North',
    businessUnit: 'Cardio-Metabolic',
    status: 'active',
    emailVerified: true,
    permissions: getDefaultPermissions('business_unit_manager'),
    passwordHash: 'Test123!',
    managerId: 'u-test-admin',
    isTestUser: true,
  },
  {
    id: 'u-test-flm-cardio',
    name: 'Test FLM Cardio',
    name_ar: 'مدير فريق القلب اختباري',
    email: 'flm.cardio@navigen.local',
    role: 'first_line_manager',
    region: 'North',
    businessUnit: 'Cardio-Metabolic',
    status: 'active',
    emailVerified: true,
    permissions: getDefaultPermissions('first_line_manager'),
    passwordHash: 'Test123!',
    managerId: 'u-test-bum-cardio',
    isTestUser: true,
  },
  {
    id: 'u-test-rep-sara',
    name: 'Test Rep Sara',
    name_ar: 'مندوبة سارة اختباري',
    email: 'rep.sara@navigen.local',
    role: 'rep',
    region: 'North',
    businessUnit: 'Cardio-Metabolic',
    status: 'active',
    emailVerified: true,
    permissions: getDefaultPermissions('rep'),
    passwordHash: 'Test123!',
    managerId: 'u-test-flm-cardio',
    isTestUser: true,
  },
  {
    id: 'u-test-rep-olivia',
    name: 'Test Rep Olivia',
    name_ar: 'مندوبة أوليفيا اختباري',
    email: 'rep.olivia@navigen.local',
    role: 'rep',
    region: 'North',
    businessUnit: 'Cardio-Metabolic',
    status: 'active',
    emailVerified: true,
    permissions: getDefaultPermissions('rep'),
    passwordHash: 'Test123!',
    managerId: 'u-test-flm-cardio',
    isTestUser: true,
  },
  {
    id: 'u-test-bum-resp',
    name: 'Test BUM Respiratory',
    name_ar: 'مدير وحدة التنفس اختباري',
    email: 'bum.respiratory@navigen.local',
    role: 'business_unit_manager',
    region: 'West',
    businessUnit: 'Respiratory',
    status: 'active',
    emailVerified: true,
    permissions: getDefaultPermissions('business_unit_manager'),
    passwordHash: 'Test123!',
    managerId: 'u-test-admin',
    isTestUser: true,
  },
  {
    id: 'u-test-flm-resp',
    name: 'Test FLM Respiratory',
    name_ar: 'مدير فريق التنفس اختباري',
    email: 'flm.respiratory@navigen.local',
    role: 'first_line_manager',
    region: 'West',
    businessUnit: 'Respiratory',
    status: 'active',
    emailVerified: true,
    permissions: getDefaultPermissions('first_line_manager'),
    passwordHash: 'Test123!',
    managerId: 'u-test-bum-resp',
    isTestUser: true,
  },
  {
    id: 'u-test-rep-maya',
    name: 'Test Rep Maya',
    name_ar: 'مندوبة مايا اختباري',
    email: 'rep.maya@navigen.local',
    role: 'rep',
    region: 'West',
    businessUnit: 'Respiratory',
    status: 'active',
    emailVerified: true,
    permissions: getDefaultPermissions('rep'),
    passwordHash: 'Test123!',
    managerId: 'u-test-flm-resp',
    isTestUser: true,
  },
  {
    id: 'u-test-mkt',
    name: 'Test Marketing Manager',
    name_ar: 'مدير التسويق اختباري',
    email: 'marketing.test@navigen.local',
    role: 'marketing_manager',
    region: 'HQ',
    businessUnit: 'Cardio-Metabolic',
    status: 'active',
    emailVerified: true,
    permissions: getDefaultPermissions('marketing_manager'),
    passwordHash: 'Test123!',
    managerId: 'u-test-admin',
    isTestUser: true,
  },
  {
    id: 'u-test-rep-direct',
    name: 'Test Direct Rep',
    name_ar: 'مندوب مباشر للإدارة اختباري',
    email: 'rep.direct@navigen.local',
    role: 'rep',
    region: 'North',
    businessUnit: 'Cardio-Metabolic',
    status: 'active',
    emailVerified: true,
    permissions: getDefaultPermissions('rep'),
    passwordHash: 'Test123!',
    managerId: 'u-test-admin',
    isTestUser: true,
  },
]

MOCK_USERS.push(...DEVELOPMENT_TEST_USERS)

export const INITIAL_STORED_USERS: MockUserRecord[] = [
  {
    id: 'u-req-1',
    name: 'Tarek Mansour',
    name_ar: 'طارق منصور',
    email: 'tarek.mansour@navigenpharma.net',
    phone: '+20 100 123 4567',
    role: 'rep',
    region: 'North region',
    status: 'pending',
    emailVerified: true,
    requestedDate: '2026-10-24',
    permissions: getDefaultPermissions('rep'),
    passwordHash: 'Rep123!',
  },
  {
    id: 'u-req-2',
    name: 'Nour El-Din',
    name_ar: 'نور الدين',
    email: 'nour.eldin@navigenpharma.net',
    phone: '+20 111 987 6543',
    role: 'rep',
    region: 'Central region',
    status: 'pending',
    emailVerified: false,
    requestedDate: '2026-10-23',
    permissions: getDefaultPermissions('rep'),
    passwordHash: 'Rep123!',
  },
]

export const storedUsersStore = createStore<MockUserRecord[]>('users', INITIAL_STORED_USERS)

/** Load extra users registered via sign-up from localStorage */
export function getStoredUsers(): MockUserRecord[] {
  return storedUsersStore.get()
}

/** Save extra users to localStorage */
export function saveStoredUsers(users: MockUserRecord[]): void {
  storedUsersStore.set(users)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('navigen_users_updated'))
  }
}

/** Get count of pending sign-up requests */
export function getPendingUsersCount(): number {
  return getStoredUsers().filter((u) => u.status === 'pending').length
}

export const userOverridesStore = createStore<Record<string, Partial<MockUserRecord>>>('user_overrides', {})

/** Persist administrative overrides for a user across sessions */
export function saveUserOverride(identifier: string, updates: Partial<MockUserRecord>): void {
  const key = identifier.trim().toLowerCase()
  userOverridesStore.update((curr) => {
    const existing = curr[key] || {}
    return {
      ...curr,
      [key]: {
        ...existing,
        ...updates,
        permissions: updates.permissions ? { ...updates.permissions } : existing.permissions,
      },
    }
  })
}

/** Get all users (built-in + stored) merged with persisted overrides */
export function getAllUsers(): MockUserRecord[] {
  const overrides = userOverridesStore.get()
  const rawList = [...MOCK_USERS, ...getStoredUsers()]
  return rawList.map((user) => {
    const idOverride = user.id ? overrides[user.id.toLowerCase()] : undefined
    const emailOverride = user.email ? overrides[user.email.toLowerCase()] : undefined
    const combinedOverride = { ...(idOverride || {}), ...(emailOverride || {}) }

    if (Object.keys(combinedOverride).length > 0) {
      return {
        ...user,
        ...combinedOverride,
        permissions: combinedOverride.permissions ? { ...combinedOverride.permissions } : user.permissions,
      }
    }
    return user
  })
}

/** Find a user by email across built-in + stored */
export function findUserByEmail(email: string): MockUserRecord | undefined {
  const clean = email.trim().toLowerCase()
  return getAllUsers().find((u) => u.email.toLowerCase() === clean)
}

/** Update a stored user record (for email verification etc.) */
export function updateStoredUser(email: string, updates: Partial<MockUserRecord>): void {
  const clean = email.trim().toLowerCase()
  saveUserOverride(clean, updates)
  const stored = getStoredUsers()
  const idx = stored.findIndex((u) => u.email.toLowerCase() === clean)
  if (idx !== -1) {
    stored[idx] = { ...stored[idx], ...updates }
    saveStoredUsers(stored)
  }
  // Also update built-in mock users in memory
  const builtIn = MOCK_USERS.find((u) => u.email.toLowerCase() === clean)
  if (builtIn) {
    Object.assign(builtIn, updates)
  }
}
