import { useState, useEffect, useMemo } from 'react'
import { X, Check, Trash2, Search, Lock, UserCheck, AlertCircle } from 'lucide-react'
import { Button } from '@/ui/design-system/components/Button'
import { ALL_MOCK_REPS } from '@/ui/design-system/components/RecordFormDrawer'
import { updateCustomer, deleteCustomer, type Customer } from '@/data/mock/customers'

export interface EditCustomerDrawerProps {
  customer: Customer | null
  isOpen: boolean
  onClose: () => void
  onSave?: (updated: Customer, previous: Customer) => void
  onDelete?: (customer: Customer) => void
  role?: 'admin' | 'rep'
  currentUserName?: string
}

export function EditCustomerDrawer({
  customer,
  isOpen,
  onClose,
  onSave,
  onDelete,
  role = 'admin',
  currentUserName = 'Alex Morgan',
}: EditCustomerDrawerProps) {
  if (!isOpen || !customer) return null

  // Role permissions
  const isRep = role === 'rep'
  const isOwnCustomer = !isRep || (
    (customer.repName && customer.repName.toLowerCase() === currentUserName.toLowerCase()) ||
    (customer.rep_id && currentUserName && customer.rep_id.toLowerCase().includes(currentUserName.toLowerCase().split(' ')[0]))
  )

  // Form states
  const [name, setName] = useState(customer.name || '')
  const [nameAr, setNameAr] = useState(customer.name_ar || '')
  const [specialty, setSpecialty] = useState(customer.specialty || 'General Medicine')
  const [classification, setClassification] = useState(
    customer.classification?.startsWith('Class') ? customer.classification : `Class ${customer.classification || 'A'}`
  )
  const [region, setRegion] = useState(customer.region || 'North region')
  const [phone, setPhone] = useState(customer.phone || '01012345678')
  const [address, setAddress] = useState(customer.address || 'Cairo, Egypt')
  const [assignedRepName, setAssignedRepName] = useState(customer.repName || 'Alex Morgan')
  const [assignedRepId, setAssignedRepId] = useState(customer.rep_id || 'u-admin-1')
  const [notes, setNotes] = useState(customer.notes || '')
  const [active, setActive] = useState(customer.active !== false && customer.status !== 'Inactive')

  // Rep search dropdown state
  const [repSearch, setRepSearch] = useState('')
  const [isRepDropdownOpen, setIsRepDropdownOpen] = useState(false)

  // Validation
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({})

  // Track dirty changes
  const isDirty = useMemo(() => {
    return (
      name !== (customer.name || '') ||
      nameAr !== (customer.name_ar || '') ||
      specialty !== (customer.specialty || '') ||
      classification !== (customer.classification || '') ||
      region !== (customer.region || '') ||
      phone !== (customer.phone || '01012345678') ||
      address !== (customer.address || 'Cairo, Egypt') ||
      assignedRepName !== (customer.repName || '') ||
      notes !== (customer.notes || '') ||
      active !== (customer.active !== false && customer.status !== 'Inactive')
    )
  }, [customer, name, nameAr, specialty, classification, region, phone, address, assignedRepName, notes, active])

  const filteredReps = useMemo(() => {
    if (!repSearch.trim()) return ALL_MOCK_REPS
    const q = repSearch.toLowerCase()
    return ALL_MOCK_REPS.filter(
      (r) => r.name.toLowerCase().includes(q) || r.region.toLowerCase().includes(q)
    )
  }, [repSearch])

  const handleClose = () => {
    if (isDirty) {
      const confirmDiscard = window.confirm(
        'You have unsaved changes. Are you sure you want to discard them?'
      )
      if (!confirmDiscard) return
    }
    onClose()
  }

  const validate = () => {
    const nextErrors: { name?: string; phone?: string } = {}
    if (!name.trim()) {
      nextErrors.name = 'Customer name is required'
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '')
    if (phone.trim() && cleanPhone.length < 8) {
      nextErrors.phone = 'Phone number must have at least 8 digits'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSave = () => {
    if (!validate()) return

    const previous = { ...customer }
    const updated: Customer = {
      ...customer,
      name: name.trim(),
      name_ar: nameAr.trim() || undefined,
      specialty,
      classification,
      region,
      phone: phone.trim(),
      address: address.trim(),
      repName: assignedRepName,
      rep_id: assignedRepId,
      notes: notes.trim(),
      active,
      status: active ? (customer.status === 'Overdue' ? 'Overdue' : 'Active') : 'Inactive',
      meta: `${specialty} · ${region} · ${classification}`,
    }

    if (customer.id) {
      updateCustomer(customer.id, updated)
    }

    onSave?.(updated, previous)
    onClose()
  }

  const handleDelete = () => {
    if (!customer.id) return
    const confirmed = window.confirm(
      `Are you sure you want to delete ${customer.name}? You can undo this action.`
    )
    if (!confirmed) return

    deleteCustomer(customer.id)
    onDelete?.(customer)
    onClose()
  }

  return (
    <div className="modal-backdrop" onClick={handleClose}>
      <aside
        className="side-sheet"
        onClick={(e) => e.stopPropagation()}
        style={{
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '100vh',
          width: '100%',
          maxWidth: '540px',
        }}
      >
        {/* Header */}
        <div className="sheet-head" style={{ flexShrink: 0 }}>
          <div>
            <span className="eyebrow">
              {customer.specialty === 'Pharmacy' ? 'EDIT PHARMACY' : 'EDIT DOCTOR'}
            </span>
            <h2>{customer.name}</h2>
          </div>
          <button className="icon-button" onClick={handleClose} aria-label="Close">
            <X />
          </button>
        </div>

        {/* Form Body - scrollable */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 24px' }}>
          {!isOwnCustomer && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 16px',
                margin: '16px 0',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.1)',
                color: 'var(--rose-text, #ef4444)',
                fontSize: '13px',
              }}
            >
              <AlertCircle size={18} />
              <span>You can only edit customers assigned to you.</span>
            </div>
          )}

          <div className="form-grid" style={{ marginTop: '16px' }}>
            {/* Name */}
            <label className="full">
              Full Name *
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Dr. Sarah Kim"
                disabled={!isOwnCustomer}
                style={errors.name ? { borderColor: 'var(--rose-text, #ef4444)' } : undefined}
              />
              {errors.name && (
                <span style={{ fontSize: '12px', color: 'var(--rose-text, #ef4444)', marginTop: '4px' }}>
                  {errors.name}
                </span>
              )}
            </label>

            {/* Arabic Name */}
            <label className="full">
              Name (Arabic)
              <input
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                placeholder="e.g. د. سارة كيم"
                dir="rtl"
                disabled={!isOwnCustomer}
              />
            </label>

            {/* Specialty */}
            <label>
              Specialty
              <select
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                disabled={!isOwnCustomer}
              >
                <option value="Cardiology">Cardiology</option>
                <option value="Pediatrics">Pediatrics</option>
                <option value="General Medicine">General Medicine</option>
                <option value="Pharmacy">Pharmacy</option>
                <option value="Dermatology">Dermatology</option>
                <option value="Orthopedics">Orthopedics</option>
                <option value="Neurology">Neurology</option>
              </select>
            </label>

            {/* Classification */}
            <label>
              Class
              <select
                value={classification}
                onChange={(e) => setClassification(e.target.value)}
                disabled={!isOwnCustomer}
              >
                <option value="Class A">Class A (High priority)</option>
                <option value="Class B">Class B (Medium priority)</option>
                <option value="Class C">Class C (Standard)</option>
              </select>
            </label>

            {/* Region */}
            <label>
              Region
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                disabled={!isOwnCustomer}
              >
                <option value="North region">North region</option>
                <option value="West region">West region</option>
                <option value="Central region">Central region</option>
                <option value="East region">East region</option>
              </select>
            </label>

            {/* Phone */}
            <label>
              Phone *
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01012345678"
                disabled={!isOwnCustomer}
                style={errors.phone ? { borderColor: 'var(--rose-text, #ef4444)' } : undefined}
              />
              {errors.phone && (
                <span style={{ fontSize: '12px', color: 'var(--rose-text, #ef4444)', marginTop: '4px' }}>
                  {errors.phone}
                </span>
              )}
            </label>

            {/* Address */}
            <label className="full">
              Address
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. 12 Medical Plaza, North District"
                disabled={!isOwnCustomer}
              />
            </label>

            {/* Assigned Rep Section */}
            <div className="full" style={{ position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>Assigned Representative</span>
                {isRep ? (
                  <span style={{ fontSize: '12px', color: 'var(--muted-text)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Lock size={12} /> Rep cannot change rep
                  </span>
                ) : (
                  <Button
                    variant="text"
                    type="button"
                    style={{ fontSize: '12px', padding: 0, height: 'auto', color: 'var(--ocean)' }}
                    onClick={() => setIsRepDropdownOpen(!isRepDropdownOpen)}
                  >
                    Reassign rep
                  </Button>
                )}
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-soft)',
                  background: 'var(--surface-raised, rgba(0,0,0,0.02))',
                }}
              >
                <UserCheck size={18} style={{ color: 'var(--ocean)' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '14px' }}>{assignedRepName}</div>
                  <div style={{ fontSize: '12px', color: 'var(--muted-text)' }}>ID: {assignedRepId}</div>
                </div>
              </div>

              {/* Rep Dropdown (Admin only) */}
              {!isRep && isRepDropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    zIndex: 50,
                    marginTop: '6px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-soft)',
                    background: 'var(--surface, #ffffff)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                    padding: '8px',
                  }}
                >
                  <div style={{ position: 'relative', marginBottom: '8px' }}>
                    <Search
                      size={14}
                      style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--muted-text)' }}
                    />
                    <input
                      value={repSearch}
                      onChange={(e) => setRepSearch(e.target.value)}
                      placeholder="Search reps by name or region..."
                      style={{ width: '100%', paddingLeft: '32px', height: '34px', fontSize: '13px' }}
                      autoFocus
                    />
                  </div>
                  <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
                    {filteredReps.map((rep) => (
                      <div
                        key={rep.id}
                        onClick={() => {
                          setAssignedRepName(rep.name)
                          setAssignedRepId(rep.id)
                          setIsRepDropdownOpen(false)
                        }}
                        style={{
                          padding: '8px 12px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '13px',
                          background: assignedRepId === rep.id ? 'var(--ocean-light, rgba(2, 132, 199, 0.1))' : 'transparent',
                        }}
                      >
                        <div>
                          <strong>{rep.name}</strong>
                          <span style={{ fontSize: '11px', color: 'var(--muted-text)', marginLeft: '8px' }}>
                            {rep.region}
                          </span>
                        </div>
                        {assignedRepId === rep.id && <Check size={14} style={{ color: 'var(--ocean)' }} />}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Notes */}
            <label className="full">
              Notes
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add relationship notes, target preferences, scheduling constraints..."
                rows={3}
                disabled={!isOwnCustomer}
              />
            </label>

            {/* Active Toggle */}
            <div
              className="full"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderRadius: '8px',
                background: 'var(--surface-raised, rgba(0,0,0,0.02))',
                border: '1px solid var(--border-soft)',
              }}
            >
              <div>
                <strong style={{ fontSize: '14px', display: 'block' }}>Customer Active Status</strong>
                <span style={{ fontSize: '12px', color: 'var(--muted-text)' }}>
                  Active customers appear in visit scheduling and coverage metrics
                </span>
              </div>
              <label style={{ display: 'inline-flex', alignItems: 'center', cursor: isOwnCustomer ? 'pointer' : 'default', margin: 0 }}>
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  disabled={!isOwnCustomer}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--ocean)' }}
                />
                <span style={{ marginLeft: '8px', fontSize: '13px', fontWeight: 600 }}>
                  {active ? 'Active' : 'Inactive'}
                </span>
              </label>
            </div>

            {/* Delete Customer Action */}
            <div
              className="full"
              style={{
                marginTop: '12px',
                paddingTop: '16px',
                borderTop: '1px solid var(--border-soft)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--rose-text, #ef4444)' }}>
                  Delete customer
                </span>
                <span style={{ display: 'block', fontSize: '12px', color: 'var(--muted-text)' }}>
                  Soft delete will archive this customer with 8s undo.
                </span>
              </div>
              <Button
                variant="secondary"
                type="button"
                onClick={handleDelete}
                disabled={!isOwnCustomer}
                style={{
                  color: 'var(--rose-text, #ef4444)',
                  borderColor: 'var(--rose-text, #ef4444)',
                  padding: '6px 14px',
                  fontSize: '13px',
                }}
              >
                <Trash2 size={14} style={{ marginRight: '6px' }} />
                Delete
              </Button>
            </div>
          </div>
        </div>

        {/* Sticky Action Footer */}
        <div
          className="sheet-actions"
          style={{
            position: 'sticky',
            bottom: 0,
            background: 'var(--surface, #ffffff)',
            padding: '16px 24px',
            borderTop: '1px solid var(--border-soft)',
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end',
            flexShrink: 0,
            zIndex: 10,
          }}
        >
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={!isOwnCustomer}
          >
            <Check size={16} style={{ marginRight: '6px' }} />
            Save changes
          </Button>
        </div>
      </aside>
    </div>
  )
}
