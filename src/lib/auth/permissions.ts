import type { UserRole } from './types'

const ADMIN_ONLY_PAGES = new Set([
  'Users',
  'Products & Batches',
  'Territories',
  'Audit log',
  'Settings',
  'Admin',
])

export function canAccessPage(page: string, role: UserRole): boolean {
  if (role === 'admin') return true
  if (ADMIN_ONLY_PAGES.has(page)) return false
  return true
}
