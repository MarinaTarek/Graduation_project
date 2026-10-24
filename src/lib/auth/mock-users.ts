import type { User } from './types'

export interface MockUserRecord extends User {
  passwordHash: string
}

export const MOCK_USERS: MockUserRecord[] = [
  {
    id: 'u-admin-1',
    name: 'Alex Morgan',
    email: 'admin@medora.com',
    role: 'admin',
    passwordHash: 'Admin123!',
  },
  {
    id: 'u-rep-1',
    name: 'Ahmed Samir',
    email: 'ahmed@medora.com',
    role: 'rep',
    passwordHash: 'Rep123!',
  },
  {
    id: 'u-rep-2',
    name: 'Sara Ali',
    email: 'sara@medora.com',
    role: 'rep',
    passwordHash: 'Rep123!',
  },
]
