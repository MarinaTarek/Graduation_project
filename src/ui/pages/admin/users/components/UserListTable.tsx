'use client'

import React, { useState } from 'react'
import { Plus, Trash2, Pencil, Check, X, Shield, Users as UsersIcon } from 'lucide-react'
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
import { adminUsersMockData, type AdminUserRecord } from '../mock-data'
import { adminAuditLogMockData } from '../../audit-log/mock-data'
import { useUndo } from '@/lib/useUndo'

export function UserListTable() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<AdminUserRecord[]>(adminUsersMockData)
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

    // Update in state
    setUsers((prev) => prev.map((u) => (u.id === editingUser.id ? updatedUser : u)))

    // Update in mock data array
    const targetIdx = adminUsersMockData.findIndex((u) => u.id === editingUser.id)
    if (targetIdx !== -1) {
      adminUsersMockData[targetIdx] = updatedUser
    }

    // Sync live mock user & session
    updateMockUser({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.roleType,
      region: updatedUser.region,
      status: updatedUser.status,
      permissions: updatedUser.permissions,
    })

    // Audit log entry: "Permissions changed for {user}"
    const newLogId = `LOG-${adminAuditLogMockData.length + 410}`
    adminAuditLogMockData.unshift({
      id: newLogId,
      action: 'Permissions Updated',
      actor: currentUser?.name || 'Admin',
      time: 'Just now',
      details: `Permissions changed for ${updatedUser.name}`,
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
    setUsers((prev) => prev.filter((u) => u.id !== user.id))

    trigger(
      `User ${user.name} deleted`,
      () => {
        setDeletedUser(null)
      },
      () => {
        setUsers((prev) => [...prev, user])
        setDeletedUser(null)
      }
    )

    showToast(`User ${user.name} deleted`, () => {
      undo()
      setUsers((prev) => [...prev, user])
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

      setUsers((prev) => [newUser, ...prev])
      adminUsersMockData.unshift(newUser)

      updateMockUser({
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.roleType,
        region: newUser.region,
        status: newUser.status,
        permissions: newUser.permissions,
      })

      setIsSavingAdd(false)
      setIsAddOpen(false)
      setAddName('')
      setAddEmail('')
      showToast(`User ${newUser.name} created successfully`)
    }, 400)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <Button variant="primary" onClick={() => setIsAddOpen(true)}>
          <Plus data-icon="inline-start" /> Add user
        </Button>
      </div>

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
                title={`Edit permissions for ${user.name}`}
                aria-label={`Edit permissions for ${user.name}`}
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
                <span>Edit</span>
              </button>

              <button
                onClick={() => handleDelete(user)}
                title={`Delete user ${user.name}`}
                aria-label={`Delete user ${user.name}`}
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
              Undo
            </button>
          )}
        </div>
      )}

      {/* Edit User & Permissions Drawer */}
      {editingUser && (
        <Drawer
          title={`Edit permissions: ${editingUser.name}`}
          kicker="USER MANAGEMENT"
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
                Full Name *
                <input
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                />
              </label>

              <label>
                Work Email *
                <input
                  required
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="alex.morgan@medora.com"
                />
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <label>
                  Role
                  <select
                    value={editRoleType}
                    onChange={(e) => handleEditRoleChange(e.target.value as UserRole)}
                  >
                    <option value="admin">Admin</option>
                    <option value="rep">Medical Representative</option>
                  </select>
                </label>

                <label>
                  Region
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
                    Active Account
                  </span>
                </label>
                <span style={{ display: 'block', fontSize: '11px', color: 'var(--muted-text)', marginLeft: '26px' }}>
                  Deactivated users cannot log in to the CRM.
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
                Cancel
              </Button>
              <Button variant="primary" type="submit" loading={isSavingEdit}>
                <Check data-icon="inline-start" /> Save changes
              </Button>
            </div>
          </form>
        </Drawer>
      )}

      {/* Add User Drawer */}
      <Drawer
        title="Add user"
        kicker="TEAM DIRECTORY"
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
      >
        <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div className="form-grid" style={{ gridTemplateColumns: '1fr', gap: '16px' }}>
            <label>
              Full Name *
              <input
                required
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                placeholder="e.g. John Doe"
              />
            </label>
            <label>
              Work Email *
              <input
                required
                type="email"
                value={addEmail}
                onChange={(e) => setAddEmail(e.target.value)}
                placeholder="john.doe@medora.com"
              />
              <FieldError message={addEmailError} />
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <label>
                Role
                <select value={addRole} onChange={(e) => setAddRole(e.target.value as UserRole)}>
                  <option value="rep">Medical Representative</option>
                  <option value="admin">Admin</option>
                </select>
              </label>
              <label>
                Region
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
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={isSavingAdd}>
              Save user
            </Button>
          </div>
        </form>
      </Drawer>
    </div>
  )
}
