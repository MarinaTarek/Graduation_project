import type { User } from './types'
import { getDefaultPermissions } from './permissions'

export interface MockUserRecord extends User {
  passwordHash: string
}

export const MOCK_USERS: MockUserRecord[] = [
  {
    id: 'u-admin-1',
    name: 'Alex Morgan',
    email: 'admin@medora.com',
    role: 'admin',
    region: 'HQ - Global',
    status: 'Active',
    permissions: getDefaultPermissions('admin'),
    passwordHash: 'Admin123!',
  },
  {
    id: 'u-rep-1',
    name: 'Ahmed Samir',
    email: 'ahmed@medora.com',
    role: 'rep',
    region: 'North region',
    status: 'Active',
    permissions: getDefaultPermissions('rep'),
    passwordHash: 'Rep123!',
  },
  {
    id: 'u-rep-2',
    name: 'Sara Ali',
    email: 'sara@medora.com',
    role: 'rep',
    region: 'West region',
    status: 'Active',
    permissions: getDefaultPermissions('rep'),
    passwordHash: 'Rep123!',
  },
]
