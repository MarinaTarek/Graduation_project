import type { UserPermissions, UserRole } from '@/lib/auth'
import { getDefaultPermissions } from '@/lib/auth/permissions'

export interface AdminUserRecord {
  id: string
  name: string
  email: string
  role: string
  roleType: UserRole
  region: string
  status: string
  permissions?: UserPermissions
}

export const adminUsersMockData: AdminUserRecord[] = [
  {
    id: 'u-admin-1',
    name: 'Alex Morgan',
    email: 'admin@medora.com',
    role: 'Admin',
    roleType: 'admin',
    region: 'HQ - Global',
    status: 'Active',
    permissions: getDefaultPermissions('admin'),
  },
  {
    id: 'u-rep-olivia',
    name: 'Olivia Martin',
    email: 'olivia.martin@medora.com',
    role: 'Medical Representative',
    roleType: 'rep',
    region: 'North region',
    status: 'Active',
    permissions: getDefaultPermissions('rep'),
  },
  {
    id: 'u-rep-maya',
    name: 'Maya Patel',
    email: 'maya.patel@medora.com',
    role: 'Medical Representative',
    roleType: 'rep',
    region: 'West region',
    status: 'Active',
    permissions: getDefaultPermissions('rep'),
  },
  {
    id: 'u-rep-james',
    name: 'James Wilson',
    email: 'james.wilson@medora.com',
    role: 'Medical Representative',
    roleType: 'rep',
    region: 'Central region',
    status: 'Active',
    permissions: getDefaultPermissions('rep'),
  },
  {
    id: 'u-rep-sofia',
    name: 'Sofia Chen',
    email: 'sofia.chen@medora.com',
    role: 'Medical Representative',
    roleType: 'rep',
    region: 'East region',
    status: 'Active',
    permissions: getDefaultPermissions('rep'),
  },
]
