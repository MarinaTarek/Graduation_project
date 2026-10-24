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
    id: 'u-rep-1',
    name: 'Ahmed Samir',
    name_ar: 'أحمد سمير',
    email: 'ahmed@navigenpharma.net',
    role: 'rep',
    region: 'North region',
    status: 'active',
    emailVerified: true,
    permissions: getDefaultPermissions('rep'),
    passwordHash: 'Rep123!',
  },
  {
    id: 'u-rep-2',
    name: 'Sara Ali',
    name_ar: 'سارة علي',
    email: 'sara@navigenpharma.net',
    role: 'rep',
    region: 'West region',
    status: 'active',
    emailVerified: true,
    permissions: getDefaultPermissions('rep'),
    passwordHash: 'Rep123!',
  },
]

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

/** Get all users (built-in + stored) */
export function getAllUsers(): MockUserRecord[] {
  return [...MOCK_USERS, ...getStoredUsers()]
}

/** Find a user by email across built-in + stored */
export function findUserByEmail(email: string): MockUserRecord | undefined {
  const clean = email.trim().toLowerCase()
  return getAllUsers().find((u) => u.email.toLowerCase() === clean)
}

/** Update a stored user record (for email verification etc.) */
export function updateStoredUser(email: string, updates: Partial<MockUserRecord>): void {
  const stored = getStoredUsers()
  const idx = stored.findIndex((u) => u.email.toLowerCase() === email.trim().toLowerCase())
  if (idx !== -1) {
    stored[idx] = { ...stored[idx], ...updates }
    saveStoredUsers(stored)
  }
  // Also update built-in mock users in memory
  const builtIn = MOCK_USERS.find((u) => u.email.toLowerCase() === email.trim().toLowerCase())
  if (builtIn) {
    Object.assign(builtIn, updates)
  }
}
