'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Trash2, Pencil, Check, X, Shield, Users as UsersIcon, AlertTriangle, UserCheck, UserX } from 'lucide-react'
import { StatusPill } from '@/ui/design-system/components/StatusPill'
import { Button } from '@/ui/design-system/components/Button'
import { Drawer } from '@/ui/design-system/components/Drawer'
import { FieldError } from '@/ui/design-system/components/FieldError'
import { useAuth, type UserRole, type UserPermissions } from '@/lib/auth'
import {
  ALL_STANDARD_PAGES,
  ALL_ADMIN_PAGES,
  getDefaultPermissions,
} from '@/lib/auth/permissions'
import { updateMockUser } from '@/lib/auth/auth-service'
import { getStoredUsers, saveStoredUsers, storedUsersStore, type MockUserRecord } from '@/lib/auth/mock-users'
import { addAuditLog } from '@/data/mock/audit'
import { addUser, deleteUser, updateUser, usersStore } from '@/data/mock/users'
import { useStore } from '@/data/mock/store'
import { addMockNotification } from '@/ui/layout/notifications-mock'
import { type AdminUserRecord } from '../mock-data'
import { useUndo } from '@/lib/useUndo'
import { useT } from '@/lib/i18n'

export interface UserListTableProps {
  initialTab?: 'all' | 'pending'
}

export function UserListTable({ initialTab = 'all' }: UserListTableProps) {
  const { t } = useT()
  const { user: currentUser } = useAuth()
  const [activeTab, setActiveTab] = useState<'all' | 'pending'>(initialTab)

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab)
  }, [initialTab])

  const storedUsers = useStore(storedUsersStore)
  const pendingRequests = storedUsers.filter((u) => u.status === 'pending')

  // Approve drawer state
  const [approvingUser, setApprovingUser] = useState<MockUserRecord | null>(null)
  const [approveRole, setApproveRole] = useState<UserRole>('rep')
  const [approveRegion, setApproveRegion] = useState('Central region')
  const [approvePermissions, setApprovePermissions] = useState<UserPermissions>(getDefaultPermissions('rep'))
  const [confirmAdminGrant, setConfirmAdminGrant] = useState(false)
  const [isSavingApprove, setIsSavingApprove] = useState(false)
  const [approveError, setApproveError] = useState<string | null>(null)

  // Reject modal state
  const [rejectingUser, setRejectingUser] = useState<MockUserRecord | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [isSavingReject, setIsSavingReject] = useState(false)
  const users = useStore(usersStore)
  const [deletedUser, setDeletedUser] = useState<AdminUserRecord | null>(null)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [toastUndo, setToastUndo] = useState<(() => void) | null>(null)

  // Add user form state
  const [addName, setAddName] = useState('')
  const [addEmail, setAddEmail] = useState('')
  const [addRole, setAddRole] = useState<UserRole>('rep')
  const [addRegion, setAddRegion] = useState('Central region')
  const [addEmailError, setAddEmailError] = useState<string | null>(null)
  const [isSavingAdd, setIsSavingAdd] = useState(false)

  // Edit user drawer state
  const [editingUser, setEditingUser] = useState<AdminUserRecord | null>(null)
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editRoleType, setEditRoleType] = useState<UserRole>('rep')
  const [editRegion, setEditRegion] = useState('North region')
  const [editStatus, setEditStatus] = useState('Active')
  const [editPermissions, setEditPermissions] = useState<UserPermissions>(getDefaultPermissions('rep'))
  const [editError, setEditError] = useState<string | null>(null)
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  const { trigger, undo } = useUndo(8000)

  const showToast = (msg: string, undoCb?: () => void) => {
    setToastMessage(msg)
    setToastUndo(undoCb ? () => undoCb : null)
    setTimeout(() => {
      setToastMessage(null)
      setToastUndo(null)
    }, 6000)
  }

  // Count active admins in current state excluding a given user
  const countOtherActiveAdmins = (excludeIdOrEmail: string): number => {
    return users.filter(
      (u) =>
        u.id !== excludeIdOrEmail &&
        u.email.toLowerCase() !== excludeIdOrEmail.toLowerCase() &&
        u.roleType === 'admin' &&
        u.status === 'Active'
    ).length
  }

  // Open Edit Drawer
  const handleOpenEdit = (user: AdminUserRecord) => {
    setEditingUser(user)
    setEditName(user.name)
    setEditEmail(user.email)
    setEditRoleType(user.roleType)
    setEditRegion(user.region || 'North region')
    setEditStatus(user.status || 'Active')
    setEditPermissions(user.permissions || getDefaultPermissions(user.roleType))
    setEditError(null)
  }

  // Role selector change inside Edit Drawer
  const handleEditRoleChange = (newRole: UserRole) => {
    setEditRoleType(newRole)
    // Changing the role pre-fills the defaults; individual checkboxes override them
    setEditPermissions(getDefaultPermissions(newRole))
  }

  // Toggle page permission checkbox
  const handleTogglePage = (pageName: string) => {
    setEditPermissions((prev) => {
      const currentPages = prev.pages || []
      const exists = currentPages.includes(pageName)
      const nextPages = exists
        ? currentPages.filter((p) => p !== pageName && (pageName !== 'Dashboard' || p !== 'Home'))
        : [...currentPages, pageName, ...(pageName === 'Dashboard' ? ['Home'] : [])]
      return {
        ...prev,
        pages: nextPages,
      }
    })
  }

  // Toggle action permission checkbox
  const handleToggleAction = (actionKey: keyof Omit<UserPermissions, 'pages'>) => {
    setEditPermissions((prev) => ({
      ...prev,
      [actionKey]: !prev[actionKey],
    }))
  }

  // Save Edit Handler
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault()
    setEditError(null)

    if (!editingUser) return

    // 1. Validation
    if (!editName.trim()) {
      setEditError('Full name is required')
      return
    }

    if (!editEmail.includes('@') || !editEmail.includes('.')) {
      setEditError('Please enter a valid work email address')
      return
    }

    // 2. Safety Check: at least one active Admin must always exist
    const isCurrentlyActiveAdmin = editingUser.roleType === 'admin' && editingUser.status === 'Active'
    const willBeActiveAdmin = editRoleType === 'admin' && editStatus === 'Active'

    if (isCurrentlyActiveAdmin && !willBeActiveAdmin) {
      const otherAdmins = countOtherActiveAdmins(editingUser.id || editingUser.email)
      if (otherAdmins === 0) {
        setEditError('Cannot remove or deactivate the only active Admin. At least one active Admin must always exist.')
        return
      }
    }

    // 3. Confirm Dialog: if the Admin removes their own admin role or access
    const isSelf =
      currentUser &&
      (currentUser.id === editingUser.id ||
        currentUser.email.toLowerCase() === editingUser.email.toLowerCase() ||
        currentUser.name.toLowerCase() === editingUser.name.toLowerCase())

    if (isSelf) {
      const losesAdminRole = editRoleType !== 'admin'
      const losesAdminPages = !editPermissions.pages.includes('Admin') || !editPermissions.pages.includes('Users')

      if (losesAdminRole || losesAdminPages) {
        const confirmed = window.confirm(
          'Warning: You are about to remove your own Admin role or administrative access. You may lose access to manage users. Are you sure you want to proceed?'
        )
        if (!confirmed) {
          return
        }
      }
    }

    setIsSavingEdit(true)

    const updatedUser: AdminUserRecord = {
      ...editingUser,
      name: editName.trim(),
      email: editEmail.trim(),
      role: editRoleType === 'admin' ? 'Admin' : 'Medical Representative',
      roleType: editRoleType,
      region: editRegion,
      status: editStatus,
      permissions: editPermissions,
    }

    updateUser(editingUser.id, updatedUser, currentUser?.name || 'Admin')

    // Sync live mock user & session
    updateMockUser({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.roleType,
      region: updatedUser.region,
      status: updatedUser.status as 'pending' | 'active' | 'rejected' | 'disabled' | undefined,
      permissions: updatedUser.permissions,
    })

    setIsSavingEdit(false)
    setEditingUser(null)
    showToast(`Permissions changed for ${updatedUser.name}`)
  }

  // Delete Handler with Safety Check
  const handleDelete = (user: AdminUserRecord) => {
    // Safety check: Cannot delete the only active admin
    if (user.roleType === 'admin' && user.status === 'Active') {
      const otherAdmins = countOtherActiveAdmins(user.id || user.email)
      if (otherAdmins === 0) {
        showToast('Cannot delete the only active Admin. At least one active Admin must always exist.')
        return
      }
    }

    if (!window.confirm(`Are you sure you want to delete user ${user.name}?`)) {
      return
    }

    setDeletedUser(user)
    deleteUser(user.id)

    trigger(
      `User ${user.name} deleted`,
      () => {
        setDeletedUser(null)
      },
      () => {
        addUser(user)
        setDeletedUser(null)
      }
    )

    showToast(`User ${user.name} deleted`, () => {
      undo()
      addUser(user)
      setToastMessage(`Restored ${user.name}`)
      setTimeout(() => setToastMessage(null), 3000)
    })
  }

  // Add User Submit Handler
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setAddEmailError(null)

    if (!addEmail.includes('@') || !addEmail.includes('.')) {
      setAddEmailError('Please enter a valid work email address')
      return
    }

    setIsSavingAdd(true)
    setTimeout(() => {
      const newUser: AdminUserRecord = {
        id: `u-${Date.now()}`,
        name: addName.trim(),
        email: addEmail.trim(),
        role: addRole === 'admin' ? 'Admin' : 'Medical Representative',
        roleType: addRole,
        region: addRegion,
        status: 'Active',
        permissions: getDefaultPermissions(addRole),
      }

      addUser(newUser, currentUser?.name || 'Admin')

      updateMockUser({
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.roleType,
        region: newUser.region,
        status: newUser.status as 'pending' | 'active' | 'rejected' | 'disabled' | undefined,
        permissions: newUser.permissions,
      })

      setIsSavingAdd(false)
      setIsAddOpen(false)
      setAddName('')
      setAddEmail('')
      showToast(`User ${newUser.name} created successfully`)
    }, 400)
  }

  // ─── Approve Sign-up Request ─────────────────────────────────
  const handleOpenApprove = (user: MockUserRecord) => {
    if (currentUser?.role !== 'admin') {
      showToast('Only administrators can approve account requests.')
      return
    }
    setApprovingUser(user)
    setApproveRole('rep')
    setApproveRegion(user.region || 'Central region')
    setApprovePermissions(getDefaultPermissions('rep'))
    setConfirmAdminGrant(false)
    setApproveError(null)
  }

  const handleApproveRoleChange = (newRole: UserRole) => {
    setApproveRole(newRole)
    setApprovePermissions(getDefaultPermissions(newRole))
    if (newRole !== 'admin') {
      setConfirmAdminGrant(false)
    }
  }

  const handleToggleApprovePage = (pageName: string) => {
    setApprovePermissions((prev) => {
      const currentPages = prev.pages || []
      const exists = currentPages.includes(pageName)
      const nextPages = exists
        ? currentPages.filter((p) => p !== pageName && (pageName !== 'Dashboard' || p !== 'Home'))
        : [...currentPages, pageName, ...(pageName === 'Dashboard' ? ['Home'] : [])]
      return { ...prev, pages: nextPages }
    })
  }

  const handleToggleApproveAction = (actionKey: keyof Omit<UserPermissions, 'pages'>) => {
    setApprovePermissions((prev) => ({
      ...prev,
      [actionKey]: !prev[actionKey],
    }))
  }

  const handleConfirmApprove = (e: React.FormEvent) => {
    e.preventDefault()
    if (!approvingUser) return

    if (currentUser?.role !== 'admin') {
      setApproveError('Only administrators can approve account requests.')
      return
    }

    if (approveRole === 'admin' && !confirmAdminGrant) {
      setApproveError('Please confirm granting administrative privileges before proceeding.')
      return
    }

    setIsSavingApprove(true)

    setTimeout(() => {
      const allStored = getStoredUsers()
      const targetIdx = allStored.findIndex(
        (u) => u.id === approvingUser.id || u.email.toLowerCase() === approvingUser.email.toLowerCase()
      )

      const updatedRecord: MockUserRecord = {
        ...approvingUser,
        role: approveRole,
        region: approveRegion,
        status: 'active',
        permissions: approvePermissions,
      }

      if (targetIdx !== -1) {
        allStored[targetIdx] = updatedRecord
      } else {
        allStored.unshift(updatedRecord)
      }
      saveStoredUsers(allStored)

      const roleLabel = approveRole === 'admin' ? 'Admin' : 'Medical Representative'
      const newAdminUser: AdminUserRecord = {
        id: approvingUser.id,
        name: approvingUser.name,
        name_ar: approvingUser.name_ar,
        email: approvingUser.email,
        role: roleLabel,
        roleType: approveRole,
        region: approveRegion,
        status: 'Active',
        permissions: approvePermissions,
      }

      addUser(newAdminUser)

      addAuditLog({
        action: 'Account Approved',
        actor: currentUser?.name || 'Admin',
        time: 'Just now',
        details: `Account approved for ${approvingUser.name} as ${roleLabel}`,
      })

      addMockNotification(`Account approved for ${approvingUser.name} as ${roleLabel}`)
      showToast(`Account approved for ${approvingUser.name} as ${roleLabel}`)

      setIsSavingApprove(false)
      setApprovingUser(null)
    }, 300)
  }

  // ─── Reject Sign-up Request ─────────────────────────────────
  const handleOpenReject = (user: MockUserRecord) => {
    if (currentUser?.role !== 'admin') {
      showToast('Only administrators can reject account requests.')
      return
    }
    setRejectingUser(user)
    setRejectReason('')
  }

  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault()
    if (!rejectingUser) return

    setIsSavingReject(true)
    const userToReject = rejectingUser
    const reasonText = rejectReason.trim()

    const allStored = getStoredUsers()
    const targetIdx = allStored.findIndex(
      (u) => u.id === userToReject.id || u.email.toLowerCase() === userToReject.email.toLowerCase()
    )
    if (targetIdx !== -1) {
      allStored[targetIdx] = { ...allStored[targetIdx], status: 'rejected' }
      saveStoredUsers(allStored)
    }

    addAuditLog({
      action: 'Account Rejected',
      actor: currentUser?.name || 'Admin',
      time: 'Just now',
      details: `Account request rejected for ${userToReject.name}${reasonText ? `: ${reasonText}` : ''}`,
    })

    trigger(
      `Account request rejected for ${userToReject.name}`,
      () => {},
      () => {
        const currentStored = getStoredUsers()
        const idx = currentStored.findIndex((u) => u.id === userToReject.id)
        if (idx !== -1) {
          currentStored[idx] = { ...currentStored[idx], status: 'pending' }
          saveStoredUsers(currentStored)
        }
      }
    )

    showToast(`Account request rejected for ${userToReject.name}`, () => {
      undo()
      const currentStored = getStoredUsers()
      const idx = currentStored.findIndex((u) => u.id === userToReject.id)
      if (idx !== -1) {
        currentStored[idx] = { ...currentStored[idx], status: 'pending' }
        saveStoredUsers(currentStored)
      }
      setToastMessage(`Restored ${userToReject.name} request`)
      setTimeout(() => setToastMessage(null), 3000)
    })

    setIsSavingReject(false)
    setRejectingUser(null)
  }

  return (
    <div>
      {/* Segmented Control: All users | Pending requests (N) */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'inline-flex', background: 'var(--input-bg)', borderRadius: '12px', padding: '4px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            style={{
              padding: '8px 18px',
              borderRadius: '10px',
              border: 'none',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              background: activeTab === 'all' ? 'var(--card-bg, #fff)' : 'transparent',
              color: activeTab === 'all' ? 'var(--heading-text)' : 'var(--muted-text)',
              boxShadow: activeTab === 'all' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            {t('admin.users.allUsers')}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pending')}
            style={{
              padding: '8px 18px',
              borderRadius: '10px',
              border: 'none',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              background: activeTab === 'pending' ? 'var(--card-bg, #fff)' : 'transparent',
              color: activeTab === 'pending' ? 'var(--heading-text)' : 'var(--muted-text)',
              boxShadow: activeTab === 'pending' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
          >
            {t('admin.users.pendingRequests')}
            {pendingRequests.length > 0 && (
              <span
                style={{
                  background: 'var(--amber, #f59e0b)',
                  color: '#fff',
                  borderRadius: '999px',
                  padding: '1px 7px',
                  fontSize: '11px',
                  fontWeight: 700,
                  lineHeight: 1.2,
                }}
              >
                {pendingRequests.length}
              </span>
            )}
          </button>
        </div>

        {activeTab === 'all' && (
          <Button variant="primary" onClick={() => setIsAddOpen(true)}>
            <Plus data-icon="inline-start" /> {t('admin.users.addUser')}
          </Button>
        )}
      </div>

      {activeTab === 'pending' && (
        <div>
          {pendingRequests.length === 0 ? (
            <div
              className="panel"
              style={{
                padding: '40px 20px',
                textAlign: 'center',
                color: 'var(--muted-text)',
                borderRadius: '14px',
              }}
            >
              <UsersIcon style={{ width: '32px', height: '32px', margin: '0 auto 12px', opacity: 0.5 }} />
              <div style={{ fontWeight: 600, color: 'var(--heading-text)', marginBottom: '4px' }}>
                {t('admin.users.noPending')}
              </div>
              <p style={{ margin: 0, fontSize: '13px' }}>
                {t('admin.users.noPendingDesc')}
              </p>
            </div>
          ) : (
            <div className="collection-list">
              {pendingRequests.map((req) => (
                <div key={req.id || req.email} className="collection-item" style={{ alignItems: 'center' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <strong style={{ fontSize: '14px', color: 'var(--heading-text)' }}>{req.name}</strong>
                      {req.emailVerified ? (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: 'var(--story-em, #3e9a78)',
                            background: 'rgba(62, 154, 120, 0.1)',
                            padding: '2px 8px',
                            borderRadius: '99px',
                            fontSize: '11px',
                            fontWeight: 600,
                          }}
                        >
                          <Check size={12} /> {t('admin.users.emailVerified')}
                        </span>
                      ) : (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: 'var(--amber-text, #d97706)',
                            background: 'rgba(217, 119, 6, 0.1)',
                            padding: '2px 8px',
                            borderRadius: '99px',
                            fontSize: '11px',
                            fontWeight: 600,
                          }}
                        >
                          <AlertTriangle size={12} /> {t('admin.users.unverifiedEmail')}
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--muted-text)', display: 'block', marginTop: '4px' }}>
                      {req.email} · {req.phone || t('admin.users.noPhone')} · {t('admin.users.requestedDate', { date: req.requestedDate || t('admin.users.recent') })}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <Button
                      variant="primary"
                      onClick={() => handleOpenApprove(req)}
                      style={{ padding: '6px 14px', fontSize: '13px' }}
                    >
                      <UserCheck data-icon="inline-start" size={14} /> {t('common.approve')}
                    </Button>
                    <Button
                      variant="text"
                      onClick={() => handleOpenReject(req)}
                      style={{
                        padding: '6px 14px',
                        fontSize: '13px',
                        color: 'var(--rose, #d9798b)',
                      }}
                    >
                      <UserX data-icon="inline-start" size={14} /> {t('common.reject')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'all' && (
      <div className="collection-list">
        {users.map((user) => (
          <div key={user.id || user.name} className="collection-item">
            <div>
              <strong>{user.name}</strong>
              <span>
                {user.role} · {user.email} · {user.region}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <StatusPill status={user.status} />

              <button
                onClick={() => handleOpenEdit(user)}
                title={t('admin.users.editTitle', { name: user.name })}
                aria-label={t('admin.users.editTitle', { name: user.name })}
                style={{
                  background: 'var(--surface-raised)',
                  border: '1px solid var(--border-soft)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  color: 'var(--heading-text)',
                  padding: '6px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
              >
                <Pencil style={{ width: '13px', height: '13px', color: 'var(--ocean)' }} />
                <span>{t('admin.users.edit')}</span>
              </button>

              <button
                onClick={() => handleDelete(user)}
                title={t('admin.users.deleteTitle', { name: user.name })}
                aria-label={t('admin.users.deleteTitle', { name: user.name })}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--muted-text)',
                  padding: '6px',
                  borderRadius: '6px',
                }}
              >
                <Trash2 style={{ width: '15px', height: '15px' }} />
              </button>
            </div>
          </div>
        ))}
      </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: 'var(--navy)',
            color: 'var(--text-on-dark)',
            padding: '12px 18px',
            borderRadius: '12px',
            boxShadow: 'var(--shadow)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '13px',
            zIndex: 9999,
          }}
        >
          <span>{toastMessage}</span>
          {toastUndo && (
            <button
              onClick={toastUndo}
              style={{
                background: 'var(--mist)',
                color: 'var(--navy)',
                border: 'none',
                borderRadius: '99px',
                padding: '3px 10px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {t('admin.users.undo')}
            </button>
          )}
        </div>
      )}

      {/* Edit User & Permissions Drawer */}
      {editingUser && (
        <Drawer
          title={t('admin.users.editDrawerTitle', { name: editingUser.name })}
          kicker={t('admin.users.drawerKicker')}
          isOpen={Boolean(editingUser)}
          onClose={() => setEditingUser(null)}
        >
          <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
            {editError && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'rgba(239, 68, 68, 0.12)',
                  color: 'var(--rose-text)',
                  fontSize: '13px',
                  fontWeight: 500,
                  marginBottom: '16px',
                }}
              >
                {editError}
              </div>
            )}

            <div className="form-grid" style={{ gridTemplateColumns: '1fr', gap: '16px', flex: 1 }}>
              <label>
                {t('admin.users.fullNameLabel')}
                <input
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                />
              </label>

              <label>
                {t('admin.users.workEmailLabel')}
                <input
                  required
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="alex.morgan@navigenpharma.net"
                />
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <label>
                  {t('admin.users.roleLabel')}
                  <select
                    value={editRoleType}
                    onChange={(e) => handleEditRoleChange(e.target.value as UserRole)}
                  >
                    <option value="admin">Admin</option>
                    <option value="rep">Medical Representative</option>
                  </select>
                </label>

                <label>
                  {t('admin.users.regionLabel')}
                  <select value={editRegion} onChange={(e) => setEditRegion(e.target.value)}>
                    <option value="HQ - Global">HQ - Global</option>
                    <option value="North region">North region</option>
                    <option value="West region">West region</option>
                    <option value="Central region">Central region</option>
                    <option value="East region">East region</option>
                  </select>
                </label>
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginTop: '4px' }}>
                  <input
                    type="checkbox"
                    checked={editStatus === 'Active'}
                    onChange={(e) => setEditStatus(e.target.checked ? 'Active' : 'Inactive')}
                    style={{ accentColor: 'var(--ocean)', width: '16px', height: '16px' }}
                  />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--heading-text)' }}>
                    {t('admin.users.activeAccount')}
                  </span>
                </label>
                <span style={{ display: 'block', fontSize: '11px', color: 'var(--muted-text)', marginInlineStart: '26px' }}>
                  {t('admin.users.deactivatedDesc')}
                </span>
              </div>

              {/* Grouped Checklist: Permissions */}
              <div
                style={{
                  borderTop: '1px solid var(--border-soft)',
                  paddingTop: '16px',
                  marginTop: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span className="eyebrow" style={{ margin: 0 }}>PERMISSIONS CONFIGURATION</span>
                  <span style={{ fontSize: '11px', color: 'var(--muted-text)' }}>
                    Role defaults pre-filled; customize below
                  </span>
                </div>

                {/* Group 1: Pages Checklist */}
                <div style={{ marginBottom: '18px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--heading-text)', marginBottom: '8px' }}>
                    Allowed Pages
                  </div>

                  {/* Standard Pages */}
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted-text)', marginBottom: '6px', textTransform: 'uppercase' }}>
                    Standard Workspace Pages
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                    {ALL_STANDARD_PAGES.map((pg) => {
                      const isChecked = editPermissions.pages?.includes(pg) || (pg === 'Dashboard' && editPermissions.pages?.includes('Home'))
                      return (
                        <label
                          key={pg}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '6px 8px',
                            borderRadius: '6px',
                            background: 'var(--surface-raised)',
                            border: '1px solid var(--border-soft)',
                            cursor: 'pointer',
                            fontSize: '12px',
                            color: 'var(--heading-text)',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={Boolean(isChecked)}
                            onChange={() => handleTogglePage(pg)}
                            style={{ accentColor: 'var(--ocean)' }}
                          />
                          <span>{pg}</span>
                        </label>
                      )
                    })}
                  </div>

                  {/* Admin Pages */}
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted-text)', marginBottom: '6px', textTransform: 'uppercase' }}>
                    Administrative Hub Pages
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {ALL_ADMIN_PAGES.map((pg) => {
                      const isChecked = editPermissions.pages?.includes(pg)
                      return (
                        <label
                          key={pg}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '6px 8px',
                            borderRadius: '6px',
                            background: 'var(--surface-raised)',
                            border: '1px solid var(--border-soft)',
                            cursor: 'pointer',
                            fontSize: '12px',
                            color: 'var(--heading-text)',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={Boolean(isChecked)}
                            onChange={() => handleTogglePage(pg)}
                            style={{ accentColor: 'var(--ocean)' }}
                          />
                          <span>{pg}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>

                {/* Group 2: Actions Checklist */}
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--heading-text)', marginBottom: '8px' }}>
                    Granted Operational Actions
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px',
                        borderRadius: '6px',
                        background: 'var(--surface-raised)',
                        border: '1px solid var(--border-soft)',
                        cursor: 'pointer',
                        fontSize: '12px',
                        color: 'var(--heading-text)',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(editPermissions.canApproveInvoices)}
                        onChange={() => handleToggleAction('canApproveInvoices')}
                        style={{ accentColor: 'var(--ocean)' }}
                      />
                      <span>Approve invoices</span>
                    </label>

                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px',
                        borderRadius: '6px',
                        background: 'var(--surface-raised)',
                        border: '1px solid var(--border-soft)',
                        cursor: 'pointer',
                        fontSize: '12px',
                        color: 'var(--heading-text)',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(editPermissions.canEditPrices)}
                        onChange={() => handleToggleAction('canEditPrices')}
                        style={{ accentColor: 'var(--ocean)' }}
                      />
                      <span>Edit prices</span>
                    </label>

                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px',
                        borderRadius: '6px',
                        background: 'var(--surface-raised)',
                        border: '1px solid var(--border-soft)',
                        cursor: 'pointer',
                        fontSize: '12px',
                        color: 'var(--heading-text)',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(editPermissions.canExport)}
                        onChange={() => handleToggleAction('canExport')}
                        style={{ accentColor: 'var(--ocean)' }}
                      />
                      <span>Export data</span>
                    </label>

                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px',
                        borderRadius: '6px',
                        background: 'var(--surface-raised)',
                        border: '1px solid var(--border-soft)',
                        cursor: 'pointer',
                        fontSize: '12px',
                        color: 'var(--heading-text)',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(editPermissions.canDeleteData)}
                        onChange={() => handleToggleAction('canDeleteData')}
                        style={{ accentColor: 'var(--ocean)' }}
                      />
                      <span>Delete data</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Sticky Save / Cancel bar */}
            <div
              style={{
                position: 'sticky',
                bottom: 0,
                background: 'var(--surface)',
                borderTop: '1px solid var(--border-soft)',
                padding: '16px 24px',
                margin: '24px -24px -24px -24px',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '8px',
                zIndex: 10,
              }}
            >
              <Button variant="secondary" type="button" onClick={() => setEditingUser(null)}>
                {t('common.cancel')}
              </Button>
              <Button variant="primary" type="submit" loading={isSavingEdit}>
                <Check data-icon="inline-start" /> {t('admin.users.saveChanges')}
              </Button>
            </div>
          </form>
        </Drawer>
      )}

      {/* Add User Drawer */}
      <Drawer
        title={t('admin.users.addUser')}
        kicker={t('admin.users.teamDirectory')}
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
      >
        <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div className="form-grid" style={{ gridTemplateColumns: '1fr', gap: '16px' }}>
            <label>
              {t('admin.users.fullNameLabel')}
              <input
                required
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                placeholder="e.g. John Doe"
              />
            </label>
            <label>
              {t('admin.users.workEmailLabel')}
              <input
                required
                type="email"
                value={addEmail}
                onChange={(e) => setAddEmail(e.target.value)}
                placeholder="john.doe@navigenpharma.net"
              />
              <FieldError message={addEmailError} />
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <label>
                {t('admin.users.roleLabel')}
                <select value={addRole} onChange={(e) => setAddRole(e.target.value as UserRole)}>
                  <option value="rep">Medical Representative</option>
                  <option value="admin">Admin</option>
                </select>
              </label>
              <label>
                {t('admin.users.regionLabel')}
                <select value={addRegion} onChange={(e) => setAddRegion(e.target.value)}>
                  <option value="North region">North region</option>
                  <option value="West region">West region</option>
                  <option value="Central region">Central region</option>
                  <option value="East region">East region</option>
                  <option value="HQ - Global">HQ - Global</option>
                </select>
              </label>
            </div>
          </div>

          <div className="sheet-actions">
            <Button variant="secondary" type="button" onClick={() => setIsAddOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="primary" type="submit" loading={isSavingAdd}>
              {t('admin.users.saveUser')}
            </Button>
          </div>
        </form>
      </Drawer>

      {/* Approve Sign-up Request Drawer */}
      {approvingUser && (
        <Drawer
          title={t('admin.users.approveTitle', { name: approvingUser.name })}
          kicker={t('admin.users.accountApproval')}
          isOpen={Boolean(approvingUser)}
          onClose={() => setApprovingUser(null)}
        >
          <form onSubmit={handleConfirmApprove} style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
            {approveError && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  color: 'var(--rose, #d9798b)',
                  fontSize: '13px',
                  marginBottom: '16px',
                }}
              >
                {approveError}
              </div>
            )}

            {/* User Info Strip */}
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '10px',
                background: 'var(--surface-raised)',
                border: '1px solid var(--border-soft)',
                marginBottom: '16px',
                fontSize: '12px',
                color: 'var(--muted-text)',
              }}
            >
              <div style={{ color: 'var(--heading-text)', fontWeight: 600, fontSize: '13px', marginBottom: '2px' }}>
                {approvingUser.name}
              </div>
              <div>{approvingUser.email} · {approvingUser.phone || t('admin.users.noPhone')} · {t('admin.users.requestedDate', { date: approvingUser.requestedDate || t('admin.users.recent') })}</div>
            </div>

            {/* Email Verification Warning if unverified */}
            {!approvingUser.emailVerified && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'rgba(217, 119, 6, 0.1)',
                  border: '1px solid rgba(217, 119, 6, 0.3)',
                  color: 'var(--amber-text, #d97706)',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '16px',
                }}
              >
                <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                <span>
                  <strong>Unverified email:</strong> This user has not entered their verification code yet. You can still approve them.
                </span>
              </div>
            )}

            <div className="form-grid" style={{ gridTemplateColumns: '1fr', gap: '16px', flex: 1 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <label>
                  {t('admin.users.roleLabel')}
                  <select
                    value={approveRole}
                    onChange={(e) => handleApproveRoleChange(e.target.value as UserRole)}
                    disabled={isSavingApprove}
                  >
                    <option value="rep">Medical Representative</option>
                    <option value="admin">Admin</option>
                  </select>
                </label>

                <label>
                  {t('admin.users.regionLabel')}
                  <select
                    value={approveRegion}
                    onChange={(e) => setApproveRegion(e.target.value)}
                    disabled={isSavingApprove}
                  >
                    <option value="North region">North region</option>
                    <option value="West region">West region</option>
                    <option value="Central region">Central region</option>
                    <option value="East region">East region</option>
                    <option value="HQ - Global">HQ - Global</option>
                  </select>
                </label>
              </div>

              {/* Extra Confirmation for Admin Role */}
              {approveRole === 'admin' && (
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: '8px',
                    background: 'rgba(217, 121, 139, 0.1)',
                    border: '1px solid rgba(217, 121, 139, 0.3)',
                  }}
                >
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', fontSize: '12px' }}>
                    <input
                      type="checkbox"
                      checked={confirmAdminGrant}
                      onChange={(e) => setConfirmAdminGrant(e.target.checked)}
                      style={{ marginTop: '2px', accentColor: 'var(--rose, #d9798b)' }}
                    />
                    <span style={{ color: 'var(--heading-text)', fontWeight: 600 }}>
                      I confirm granting full Administrative privileges to this user.
                    </span>
                  </label>
                </div>
              )}

              {/* Grouped Checklist: Permissions Overrides */}
              <div
                style={{
                  borderTop: '1px solid var(--border-soft)',
                  paddingTop: '16px',
                  marginTop: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span className="eyebrow" style={{ margin: 0 }}>PERMISSIONS OVERRIDES</span>
                  <span style={{ fontSize: '11px', color: 'var(--muted-text)' }}>
                    Role defaults pre-filled
                  </span>
                </div>

                {/* Pages Checklist */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted-text)', marginBottom: '6px', textTransform: 'uppercase' }}>
                    Standard Workspace Pages
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                    {ALL_STANDARD_PAGES.map((pg) => {
                      const isChecked = approvePermissions.pages?.includes(pg) || (pg === 'Dashboard' && approvePermissions.pages?.includes('Home'))
                      return (
                        <label
                          key={pg}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '6px 8px',
                            borderRadius: '6px',
                            background: 'var(--surface-raised)',
                            border: '1px solid var(--border-soft)',
                            cursor: 'pointer',
                            fontSize: '12px',
                            color: 'var(--heading-text)',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={Boolean(isChecked)}
                            onChange={() => handleToggleApprovePage(pg)}
                            style={{ accentColor: 'var(--ocean)' }}
                          />
                          <span>{pg}</span>
                        </label>
                      )
                    })}
                  </div>

                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted-text)', marginBottom: '6px', textTransform: 'uppercase' }}>
                    Administrative Hub Pages
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {ALL_ADMIN_PAGES.map((pg) => {
                      const isChecked = approvePermissions.pages?.includes(pg)
                      return (
                        <label
                          key={pg}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '6px 8px',
                            borderRadius: '6px',
                            background: 'var(--surface-raised)',
                            border: '1px solid var(--border-soft)',
                            cursor: 'pointer',
                            fontSize: '12px',
                            color: 'var(--heading-text)',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={Boolean(isChecked)}
                            onChange={() => handleToggleApprovePage(pg)}
                            style={{ accentColor: 'var(--ocean)' }}
                          />
                          <span>{pg}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>

                {/* Actions Checklist */}
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted-text)', marginBottom: '6px', textTransform: 'uppercase' }}>
                    Action Privileges
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {[
                      { key: 'canApproveInvoices' as const, label: 'Approve invoices' },
                      { key: 'canEditPrices' as const, label: 'Edit product prices' },
                      { key: 'canExport' as const, label: 'Export data (CSV/PDF)' },
                      { key: 'canDeleteData' as const, label: 'Delete data' },
                    ].map((act) => (
                      <label
                        key={act.key}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '6px 8px',
                          borderRadius: '6px',
                          background: 'var(--surface-raised)',
                          border: '1px solid var(--border-soft)',
                          cursor: 'pointer',
                          fontSize: '12px',
                          color: 'var(--heading-text)',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={Boolean(approvePermissions[act.key])}
                          onChange={() => handleToggleApproveAction(act.key)}
                          style={{ accentColor: 'var(--ocean)' }}
                        />
                        <span>{act.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="sheet-actions" style={{ marginTop: '24px' }}>
              <Button variant="secondary" type="button" onClick={() => setApprovingUser(null)}>
                {t('common.cancel')}
              </Button>
              <Button variant="primary" type="submit" loading={isSavingApprove}>
                <Check data-icon="inline-start" /> {t('admin.users.approveAccount')}
              </Button>
            </div>
          </form>
        </Drawer>
      )}

      {/* Reject Confirmation Modal Dialog */}
      {rejectingUser && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '16px',
          }}
          onClick={() => setRejectingUser(null)}
        >
          <div
            className="panel"
            style={{ maxWidth: '440px', width: '100%', borderRadius: '16px', padding: '24px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '18px', margin: '0 0 8px', color: 'var(--heading-text)' }}>
              {t('admin.users.rejectModalTitle')}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--muted-text)', margin: '0 0 16px', lineHeight: 1.5 }}>
              {t('admin.users.rejectConfirmDesc', { name: rejectingUser.name, email: rejectingUser.email })}
            </p>
            <form onSubmit={handleConfirmReject}>
              <label style={{ display: 'block', fontSize: '13px', marginBottom: '16px' }}>
                {t('admin.users.rejectReasonLabel')} <span style={{ color: 'var(--muted-text)' }}>{t('admin.users.optional')}</span>
                <input
                  type="text"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Unrecognized team member"
                  style={{ width: '100%', marginTop: '6px' }}
                />
              </label>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <Button variant="secondary" type="button" onClick={() => setRejectingUser(null)}>
                  {t('common.cancel')}
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  loading={isSavingReject}
                  style={{ background: 'var(--rose, #d9798b)', borderColor: 'var(--rose, #d9798b)' }}
                >
                  {t('admin.users.rejectRequest')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
