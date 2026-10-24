import { adminUsersMockData, type AdminUserRecord } from '@/ui/pages/admin/users/mock-data'
import { addAuditLog } from './audit'
import { createStore } from './store'

export type StoredAdminUser = AdminUserRecord & { updated_at?: string }

export const usersStore = createStore<StoredAdminUser[]>('admin_users', adminUsersMockData as StoredAdminUser[])

const now = () => new Date().toISOString()

export function addUser(data: Omit<StoredAdminUser, 'updated_at'> & { id?: string }, actor?: string) {
  const user: StoredAdminUser = {
    ...data,
    id: data.id ?? `u-${Date.now()}`,
    updated_at: now(),
  }
  usersStore.update((list) => [user, ...list.filter((u) => u.id !== user.id)])
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
  usersStore.update((list) =>
    list.map((u) => (u.id === id ? { ...u, ...patch, updated_at: now() } : u)),
  )
  if (actor && patch.permissions) {
    const user = usersStore.get().find((u) => u.id === id)
    addAuditLog({
      action: 'Permissions Updated',
      actor,
      time: 'Just now',
      details: `Permissions changed for ${user?.name ?? id}`,
    })
  }
}

export function deleteUser(id: string) {
  usersStore.update((list) => list.filter((u) => u.id !== id))
}
