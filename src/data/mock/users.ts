import { adminUsersMockData, type AdminUserRecord } from '@/ui/pages/admin/users/mock-data'
import { addAuditLog } from './audit'
import { createStore } from './store'
import { storedUsersStore, getAllUsers } from '@/lib/auth/mock-users'
export { storedUsersStore } from '@/lib/auth/mock-users'
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

/**
 * Idempotently seeds missing test accounts into usersStore if localStorage
 * already had an older snapshot, without overwriting existing users.
 */
export function ensureTestUsersSeeded(): void {
  const current = usersStore.get()
  const existingIds = new Set(current.map((u) => u.id))
  const missing = (adminUsersMockData as StoredAdminUser[]).filter((u) => !existingIds.has(u.id))
  if (missing.length > 0) {
    usersStore.update((list) => [...list, ...missing])
  }
}

if (typeof window !== 'undefined') {
  try {
    ensureTestUsersSeeded()
  } catch {}
}

function assertAdminActorIfProvided(actor?: string | { id?: string; name?: string; role?: string }): void {
  if (!actor || actor === 'Admin') return
  const actorStr = typeof actor === 'object' && actor ? (actor.id || actor.name || '') : actor
  const all = [
    ...getAllUsers().map((u) => ({ id: u.id, name: u.name, role: u.role, status: u.status })),
    ...usersStore.get().map((u) => ({ id: u.id, name: u.name, role: u.roleType, status: u.status })),
  ]
  const actorLower = actorStr.toLowerCase()
  const matched = all.find(
    (u) =>
      u.name.toLowerCase() === actorLower ||
      u.id.toLowerCase() === actorLower
  )
  if (matched && matched.role !== 'admin') {
    throw new Error(`Unauthorized: User "${actorStr}" (${matched.role}) cannot perform administrative user management.`)
  }
}

const now = () => new Date().toISOString()

export function addUser(
  data: Omit<StoredAdminUser, 'updated_at'> & { id?: string },
  actor?: string | { id?: string; name?: string; role?: string }
) {
  assertAdminActorIfProvided(actor)
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
      businessUnit: (user as any).businessUnit,
      managerId: (user as any).managerId,
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
    const actorName = typeof actor === 'object' && actor ? actor.name || 'User' : actor
    addAuditLog({
      action: 'User Added',
      actor: actorName,
      time: 'Just now',
      details: `User ${user.name} created`,
    })
  }
  return user
}

export function updateUser(
  id: string,
  patch: Partial<StoredAdminUser>,
  actor?: string | { id?: string; name?: string; role?: string }
) {
  assertAdminActorIfProvided(actor)
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
          businessUnit: (patch as any).businessUnit ?? (u as any).businessUnit,
          managerId: (patch as any).managerId ?? (u as any).managerId,
          status: nextStatus,
          permissions: patch.permissions ?? u.permissions,
        }
      }
      return u
    })
  )

  if (actor) {
    const actorName = typeof actor === 'object' && actor ? actor.name || 'User' : actor
    const user = usersStore.get().find((u) => u.id === id)
    addAuditLog({
      action: patch.permissions ? 'Permissions Updated' : 'User Updated',
      actor: actorName,
      time: 'Just now',
      details: `User ${user?.name ?? id} updated by ${actorName}`,
    })
  }
}

export function deactivateUser(id: string, actor: string = 'Admin') {
  updateUser(id, { status: 'Inactive' }, actor)
}

export function archiveUser(id: string, actor: string = 'Admin') {
  updateUser(id, { status: 'Archived' }, actor)
}

export function deleteUser(
  id: string,
  actor?: string | { id?: string; name?: string; role?: string }
) {
  assertAdminActorIfProvided(actor)
  const user = usersStore.get().find((u) => u.id === id)
  if (!user) return { deleted: false, deactivated: false, reason: 'User not found' }

  const actorName = typeof actor === 'object' && actor ? actor.name || 'Admin' : (actor || 'Admin')
  // Check referential integrity before deletion
  const check = canDeleteUser(id)
  if (!check.allowed) {
    // Prefer deactivation over physical deletion for users with historical activity
    safeDeactivateUser(id, actorName)
    return { deleted: false, deactivated: true, reason: check.reason }
  }

  // Physical deletion allowed only if zero historical references
  usersStore.update((list) => list.filter((u) => u.id !== id))
  storedUsersStore.update((list) => list.filter((u) => u.id !== id))

  if (actor && user) {
    addAuditLog({
      action: 'User Deleted',
      actor: actorName,
      time: 'Just now',
      details: `Deleted user ${user.name} (${id})`,
    })
  }

  return { deleted: true, deactivated: false }
}

/**
 * Phase 2 - 3.1: Centralized Sign-up Approval Operation.
 * Validates admin caller, verifies pending request exists in storedUsersStore,
 * updates status atomically, adds canonical user profile to usersStore,
 * updates storedUsersStore auth entry, logs audit trail, and dispatches notification.
 */
export function approveSignUpRequest(
  requestIdOrEmail: string,
  approvalData: {
    role?: 'admin' | 'business_unit_manager' | 'first_line_manager' | 'rep' | 'marketing_manager'
    region?: string
    managerId?: string
    businessUnit?: string
    permissions?: any
  },
  actor: string | { id?: string; name?: string; role?: string }
): StoredAdminUser {
  assertAdminActorIfProvided(actor)
  const actorName = typeof actor === 'object' && actor ? actor.name || 'Admin' : (actor || 'Admin')

  const cleanKey = requestIdOrEmail.trim().toLowerCase()
  const authUsers = getAllUsers()
  const target = authUsers.find(
    (u) => u.id.toLowerCase() === cleanKey || u.email.toLowerCase() === cleanKey
  )

  if (!target) {
    throw new Error(`Sign-up request "${requestIdOrEmail}" not found.`)
  }

  if (target.status !== 'pending') {
    throw new Error(`Sign-up request for "${target.name}" is not pending (current status: ${target.status}).`)
  }

  const roleType = approvalData.role || target.role || 'rep'
  const region = approvalData.region || target.region || 'Central region'
  const managerId = approvalData.managerId || target.managerId
  const businessUnit = approvalData.businessUnit || (target as any).businessUnit || 'Cardio-Metabolic'
  const permissions = approvalData.permissions || target.permissions || getDefaultPermissions(roleType)

  const roleLabels: Record<string, string> = {
    admin: 'Executive Administrator',
    business_unit_manager: 'Business Unit Manager',
    first_line_manager: 'First Line Manager',
    rep: 'Medical Representative',
    marketing_manager: 'Marketing Manager',
  }
  const roleLabel = roleLabels[roleType] || 'Medical Representative'

  // Canonical user record
  const adminUser: StoredAdminUser = {
    id: target.id,
    name: target.name,
    name_ar: target.name_ar,
    email: target.email,
    role: roleLabel,
    roleType,
    region,
    businessUnit,
    managerId,
    status: 'Active',
    permissions,
    updated_at: now(),
  }

  // 1. Add canonical profile to usersStore
  usersStore.update((list) => [adminUser, ...list.filter((u) => u.id !== adminUser.id)])

  // 2. Synchronize status & profile in storedUsersStore atomically
  storedUsersStore.update((list) =>
    list.map((u) =>
      u.id === target.id || u.email.toLowerCase() === target.email.toLowerCase()
        ? {
            ...u,
            role: roleType,
            region,
            businessUnit,
            managerId,
            status: 'active',
            emailVerified: true,
            permissions,
          }
        : u
    )
  )

  // 3. Record audit log
  addAuditLog({
    action: 'Account Approved',
    actor: actorName,
    time: 'Just now',
    details: `Account approved for ${target.name} (${target.email}) as ${roleLabel} by ${actorName}`,
  })

  return adminUser
}

/**
 * Phase 2 - 3.1: Centralized Sign-up Rejection Operation.
 */
export function rejectSignUpRequest(
  requestIdOrEmail: string,
  reason: string,
  actor: string | { id?: string; name?: string; role?: string }
): void {
  assertAdminActorIfProvided(actor)
  const actorName = typeof actor === 'object' && actor ? actor.name || 'Admin' : (actor || 'Admin')

  const cleanKey = requestIdOrEmail.trim().toLowerCase()
  const authUsers = getAllUsers()
  const target = authUsers.find(
    (u) => u.id.toLowerCase() === cleanKey || u.email.toLowerCase() === cleanKey
  )

  if (!target) {
    throw new Error(`Sign-up request "${requestIdOrEmail}" not found.`)
  }

  if (target.status !== 'pending') {
    throw new Error(`Sign-up request for "${target.name}" is not pending (current status: ${target.status}).`)
  }

  const cleanReason = reason.trim()

  storedUsersStore.update((list) =>
    list.map((u) =>
      u.id === target.id || u.email.toLowerCase() === target.email.toLowerCase()
        ? { ...u, status: 'rejected' }
        : u
    )
  )

  usersStore.update((list) =>
    list.map((u) =>
      u.id === target.id || u.email.toLowerCase() === target.email.toLowerCase()
        ? { ...u, status: 'Rejected', updated_at: now() }
        : u
    )
  )

  addAuditLog({
    action: 'Account Rejected',
    actor: actorName,
    time: 'Just now',
    details: `Account request rejected for ${target.name}${cleanReason ? `: ${cleanReason}` : ''} by ${actorName}`,
  })
}
