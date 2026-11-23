import { adminUsersMockData, type AdminUserRecord } from '@/ui/pages/admin/users/mock-data'
import { addAuditLog } from './audit'
import { createStore } from './store'
import { storedUsersStore } from '@/lib/auth/mock-users'
import { getDefaultPermissions } from '@/lib/auth/permissions'
import { canDeleteUser, safeDeactivateUser } from './referentialIntegrity'

export type StoredAdminUser = AdminUserRecord & { updated_at?: string }

export function mapToAuthStatus(status: string | undefined): 'pending' | 'active' | 'rejected' | 'disabled' {
  if (!status) return 'active'
  const normalized = status.trim().toLowerCase()
  switch (normalized) {
    case 'active':
      return 'active'
    case 'pending':
      return 'pending'
    case 'rejected':
      return 'rejected'
    case 'disabled':
    case 'inactive':
    case 'archived':
      return 'disabled'
    default:
      return 'disabled'
  }
}

export function mapToBusinessStatus(authStatus: string | undefined): string {
  if (!authStatus) return 'Active'
  const normalized = authStatus.trim().toLowerCase()
  switch (normalized) {
    case 'active':
      return 'Active'
    case 'pending':
      return 'Pending'
    case 'rejected':
      return 'Rejected'
    case 'disabled':
    case 'inactive':
    case 'archived':
      return 'Inactive'
    default:
      return 'Inactive'
  }
}

export const usersStore = createStore<StoredAdminUser[]>('admin_users', adminUsersMockData as StoredAdminUser[])

const now = () => new Date().toISOString()

export function addUser(data: Omit<StoredAdminUser, 'updated_at'> & { id?: string }, actor?: string) {
  const user: StoredAdminUser = {
    ...data,
    id: data.id ?? `u-${Date.now()}`,
    status: data.status || 'Active',
    updated_at: now(),
  }
  usersStore.update((list) => [user, ...list.filter((u) => u.id !== user.id)])

  // Synchronize to storedUsersStore for auth/login consistency
  storedUsersStore.update((authList) => {
    const existingIndex = authList.findIndex((u) => u.id === user.id)
    const authStatus = mapToAuthStatus(user.status)
    const authEntry = {
      id: user.id,
      name: user.name,
      name_ar: user.name_ar,
      email: user.email,
      role: user.roleType,
      region: user.region,
      status: authStatus,
      emailVerified: true,
      permissions: user.permissions || getDefaultPermissions(user.roleType),
      passwordHash: 'User123!',
    }
    if (existingIndex >= 0) {
      const next = [...authList]
      next[existingIndex] = { ...next[existingIndex], ...authEntry }
      return next
    }
    return [authEntry, ...authList]
  })

  if (actor) {
    addAuditLog({
      action: 'User Added',
      actor,
      time: 'Just now',
      details: `User ${user.name} created`,
    })
  }
  return user
}

export function updateUser(id: string, patch: Partial<StoredAdminUser>, actor?: string) {
  const updatedAt = now()
  usersStore.update((list) =>
    list.map((u) => (u.id === id ? { ...u, ...patch, updated_at: updatedAt } : u)),
  )

  // Synchronize to storedUsersStore
  storedUsersStore.update((authList) =>
    authList.map((u) => {
      if (u.id === id) {
        const nextStatus = patch.status !== undefined
          ? mapToAuthStatus(patch.status)
          : u.status
        return {
          ...u,
          name: patch.name ?? u.name,
          name_ar: patch.name_ar ?? u.name_ar,
          email: patch.email ?? u.email,
          role: patch.roleType ?? u.role,
          region: patch.region ?? u.region,
          status: nextStatus,
          permissions: patch.permissions ?? u.permissions,
        }
      }
      return u
    })
  )

  if (actor) {
    const user = usersStore.get().find((u) => u.id === id)
    addAuditLog({
      action: patch.permissions ? 'Permissions Updated' : 'User Updated',
      actor,
      time: 'Just now',
      details: `User ${user?.name ?? id} updated by ${actor}`,
    })
  }
}

export function deactivateUser(id: string, actor: string = 'Admin') {
  updateUser(id, { status: 'Inactive' }, actor)
}

export function archiveUser(id: string, actor: string = 'Admin') {
  updateUser(id, { status: 'Archived' }, actor)
}

export function deleteUser(id: string, actor?: string) {
  const user = usersStore.get().find((u) => u.id === id)
  if (!user) return { deleted: false, deactivated: false, reason: 'User not found' }

  // Check referential integrity before deletion
  const check = canDeleteUser(id)
  if (!check.allowed) {
    // Prefer deactivation over physical deletion for users with historical activity
    safeDeactivateUser(id, actor || 'Admin')
    return { deleted: false, deactivated: true, reason: check.reason }
  }

  // Physical deletion allowed only if zero historical references
  usersStore.update((list) => list.filter((u) => u.id !== id))
  storedUsersStore.update((list) => list.filter((u) => u.id !== id))

  if (actor && user) {
    addAuditLog({
      action: 'User Deleted',
      actor,
      time: 'Just now',
      details: `Deleted user ${user.name} (${id})`,
    })
  }

  return { deleted: true, deactivated: false }
}
