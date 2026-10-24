'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { StatusPill } from '@/ui/design-system/components/StatusPill'
import { Button } from '@/ui/design-system/components/Button'
import { Drawer } from '@/ui/design-system/components/Drawer'
import { FieldError } from '@/ui/design-system/components/FieldError'
import { adminUsersMockData, type AdminUserRecord } from '../mock-data'
import { useUndo } from '@/lib/useUndo'

export function UserListTable() {
  const [users, setUsers] = useState<AdminUserRecord[]>(adminUsersMockData)
  const [deletedUser, setDeletedUser] = useState<AdminUserRecord | null>(null)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [toastUndo, setToastUndo] = useState<(() => void) | null>(null)

  // Add user form state
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('Medical Representative')
  const [emailError, setEmailError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const { trigger, undo } = useUndo(8000)

  const showToast = (msg: string, undoCb?: () => void) => {
    setToastMessage(msg)
    setToastUndo(undoCb ? () => undoCb : null)
    setTimeout(() => {
      setToastMessage(null)
      setToastUndo(null)
    }, 8000)
  }

  const handleDelete = (user: AdminUserRecord) => {
    if (!window.confirm(`Are you sure you want to delete user ${user.name}?`)) {
      return
    }

    setDeletedUser(user)
    setUsers((prev) => prev.filter((u) => u.name !== user.name))

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

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setEmailError(null)

    if (!email.includes('@') || !email.includes('.')) {
      setEmailError('Please enter a valid work email address')
      return
    }

    setIsSaving(true)
    setTimeout(() => {
      const newUser: AdminUserRecord = {
        name,
        role,
        region: 'Central',
        status: 'Active',
      }
      setUsers((prev) => [newUser, ...prev])
      setIsSaving(false)
      setIsAddOpen(false)
      setName('')
      setEmail('')
      showToast(`User ${newUser.name} created successfully`)
    }, 500)
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
          <div key={user.name} className="collection-item">
            <div>
              <strong>{user.name}</strong>
              <span>{user.role} · {user.region}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <StatusPill status={user.status} />
              <button
                onClick={() => handleDelete(user)}
                title={`Delete user ${user.name}`}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--muted-text)',
                  padding: '4px',
                }}
              >
                <Trash2 style={{ width: '16px', height: '16px' }} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Inline Toast Notification with Undo */}
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
              Full Name
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. John Doe"
              />
            </label>
            <label>
              Work Email
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john.doe@medora.health"
              />
              <FieldError message={emailError} />
            </label>
            <label>
              Role
              <select value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="Medical Representative">Medical Representative</option>
                <option value="Supervisor">Supervisor</option>
                <option value="Regional Director">Regional Director</option>
                <option value="Admin">Admin</option>
              </select>
            </label>
          </div>

          <div className="sheet-actions">
            <Button variant="secondary" type="button" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={isSaving}>
              Save user
            </Button>
          </div>
        </form>
      </Drawer>
    </div>
  )
}
