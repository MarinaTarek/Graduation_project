import { useState, useMemo, useEffect, useRef } from 'react'
import { Check, X, Search, ChevronDown, Building2, Package, ClipboardCheck, AlertTriangle } from 'lucide-react'
import { Button } from './Button'
import { Avatar } from './Avatar'
import { FieldError } from './FieldError'
import { addCustomer, validateCustomerClassification } from '@/data/mock/customers'
import { addProduct } from '@/lib/productService'
import { useT } from '@/lib/i18n'
import { EGYPT_REGIONS } from '@/data/regions'
import { productsStore } from '@/data/mock/products'
import { batchesStore, stockMovementsStore, addStockMovement, deriveProductStock } from '@/data/mock/stockDerived'
import { warehousesStore } from '@/data/mock/warehouses'
import { addAuditLog } from '@/data/mock/audit'
import { useStore } from '@/data/mock/store'

export interface RecordFormDrawerProps {
  title: string
  isOpen?: boolean
  onClose: () => void
  onSave: (message?: string) => void
  role?: import('@/lib/auth/types').UserRole | string
  currentUser?: { id: string; name: string; role?: string } | null
}

export const ALL_MOCK_REPS = [
  { id: 'rep-olivia', name: 'Olivia Martin', region: 'North region' },
  { id: 'rep-maya', name: 'Maya Patel', region: 'West region' },
  { id: 'rep-james', name: 'James Wilson', region: 'Central region' },
  { id: 'rep-sofia', name: 'Sofia Chen', region: 'East region' },
  { id: 'u-rep-1', name: 'Ahmed Samir', region: 'North region' },
  { id: 'u-rep-2', name: 'Sara Ali', region: 'West region' },
]

export function RecordFormDrawer({
  title,
  isOpen = true,
  onClose,
  onSave,
  role = 'admin',
  currentUser,
}: RecordFormDrawerProps) {
  const { t, lang } = useT()
  // Common states
  const isDoctor = title === 'Add doctor'
  const isProduct = title === 'Add product'
  const isPharmacy = title === 'Add pharmacy'
  const isStockCount = title === 'Stock count'

  // Pharmacy Form State
  const [pharmacyName, setPharmacyName] = useState('')
  const [pharmacyNameAr, setPharmacyNameAr] = useState('')
  const [pharmacyType, setPharmacyType] = useState('Community Pharmacy')
  const [pharmacyRegion, setPharmacyRegion] = useState(EGYPT_REGIONS[0]?.name_en || 'North region')
  const [pharmacyAddress, setPharmacyAddress] = useState('')
  const [pharmacyPhone, setPharmacyPhone] = useState('')
  const [pharmacyClassification, setPharmacyClassification] = useState('Class A')

  // Stock Count Form State
  const availableProducts = useStore(productsStore)
  const availableWarehouses = useStore(warehousesStore)
  const allBatches = useStore(batchesStore)
  const allStockMovements = useStore(stockMovementsStore)
  const [scProduct, setScProduct] = useState(availableProducts[0]?.name || 'Bevato')
  const [scWarehouse, setScWarehouse] = useState(availableWarehouses[0]?.name || 'Cairo Central Logistics Hub')
  
  // Derived batches for selected stock count product
  const derivedBatches = useMemo(() => {
    const legacyRole: 'admin' | 'rep' = role === 'admin' ? 'admin' : 'rep'
    const derived = deriveProductStock(scProduct, allStockMovements, allBatches, legacyRole, currentUser?.name)
    return derived.batches
  }, [scProduct, allStockMovements, allBatches, role, currentUser])

  const [scBatch, setScBatch] = useState(derivedBatches[0]?.batch_no || '')
  
  useEffect(() => {
    if (derivedBatches.length > 0 && !derivedBatches.some((b) => b.batch_no === scBatch)) {
      setScBatch(derivedBatches[0].batch_no)
    }
  }, [derivedBatches, scBatch])

  const scSelectedBatchObj = derivedBatches.find((b) => b.batch_no === scBatch)
  const scSystemQty = scSelectedBatchObj ? scSelectedBatchObj.qty_remaining : 0
  const [scCountedQty, setScCountedQty] = useState<string>(String(scSystemQty))

  useEffect(() => {
    setScCountedQty(String(scSystemQty))
  }, [scSystemQty])

  const [scReason, setScReason] = useState('Routine Cycle Count')
  const [scNotes, setScNotes] = useState('')

  // Reps list setup
  const repsList = useMemo(() => {
    const list = [...ALL_MOCK_REPS]
    if (
      currentUser &&
      role === 'rep' &&
      !list.some((r) => r.id === currentUser.id || r.name.toLowerCase() === currentUser.name.toLowerCase())
    ) {
      list.unshift({ id: currentUser.id, name: currentUser.name, region: 'Assigned region' })
    }
    return list
  }, [currentUser, role])

  // Doctor Form State
  const initialRep = useMemo(() => {
    if (role === 'rep' && currentUser) {
      return repsList.find((r) => r.id === currentUser.id || r.name.toLowerCase() === currentUser.name.toLowerCase()) || {
        id: currentUser.id,
        name: currentUser.name,
        region: 'Assigned region',
      }
    }
    return repsList[0]
  }, [role, currentUser, repsList])

  const [docName, setDocName] = useState('')
  const [docSpecialty, setDocSpecialty] = useState('Cardiology')
  const [docRegion, setDocRegion] = useState('North region')
  const [docPhone, setDocPhone] = useState('')
  const [docClassification, setDocClassification] = useState('Class A')
  const [selectedRep, setSelectedRep] = useState(initialRep)
  const [repDropdownOpen, setRepDropdownOpen] = useState(false)
  const [repSearchQuery, setRepSearchQuery] = useState('')
  const repDropdownRef = useRef<HTMLDivElement>(null)

  // Product Form State
  const [prodName, setProdName] = useState('')
  const [prodCategory, setProdCategory] = useState('Cardiovascular')
  const [prodStandardPack, setProdStandardPack] = useState('30 tablets / box')
  const [prodPrice, setProdPrice] = useState('')
  const [priceTouched, setPriceTouched] = useState(false)
  const [priceError, setPriceError] = useState<string | null>(null)
  const [genericError, setGenericError] = useState<string | null>(null)

  useEffect(() => {
    if (role === 'rep' && initialRep) {
      setSelectedRep(initialRep)
    }
  }, [role, initialRep])

  // Close rep dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (repDropdownRef.current && !repDropdownRef.current.contains(e.target as Node)) {
        setRepDropdownOpen(false)
      }
    }
    if (repDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [repDropdownOpen])

  if (!isOpen) return null

  const filteredReps = repsList.filter((r) =>
    r.name.toLowerCase().includes(repSearchQuery.toLowerCase()) ||
    (r.region && r.region.toLowerCase().includes(repSearchQuery.toLowerCase()))
  )

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  }

  const validatePrice = (val: string): boolean => {
    if (val.trim() === '') {
      setPriceError('Price is required')
      return false
    }
    const num = Number(val)
    if (isNaN(num) || num < 0) {
      setPriceError('Price must be a valid number (0 or greater)')
      return false
    }
    setPriceError(null)
    return true
  }

  const handleSave = () => {
    setGenericError(null)

    if (isDoctor) {
      if (!docName.trim()) {
        setGenericError('Doctor name is required')
        return
      }

      if (!docClassification || !docClassification.trim()) {
        setGenericError('Classification is required')
        return
      }

      const repToSave = role === 'rep' && currentUser ? initialRep : selectedRep
      const newCustomer = {
        id: `c-${Date.now()}`,
        name: docName.trim(),
        meta: `${docSpecialty} · ${docRegion} · ${docClassification}`,
        status: 'Active',
        specialty: docSpecialty,
        classification: docClassification,
        region: docRegion,
        repName: repToSave.name,
        rep_id: repToSave.id,
        phone: docPhone.trim() || undefined,
        clientCategory: 'hcp' as const,
        hcpType: docSpecialty === 'Pharmacy' ? ('pharmacist' as const) : ('doctor' as const),
        relationshipStatus: 'Regular',
      }

      addCustomer(newCustomer)
      onSave(`Doctor ${newCustomer.name} added successfully`)
      return
    }

    if (isProduct) {
      if (!prodName.trim()) {
        setGenericError('Product name is required')
        return
      }

      setPriceTouched(true)
      if (!validatePrice(prodPrice)) {
        return
      }

      try {
        addProduct({
          name: prodName.trim(),
          category: prodCategory,
          standardPack: prodStandardPack.trim() || 'Standard pack',
          price: Number(prodPrice),
          role,
          userName: currentUser?.name || 'Admin',
        })
        onSave(`Product ${prodName.trim()} added successfully`)
      } catch (err: any) {
        setGenericError(err.message || 'Failed to add product')
      }
      return
    }

    if (isPharmacy) {
      if (!pharmacyName.trim()) {
        setGenericError(lang === 'ar' ? 'اسم الصيدلية / المؤسسة مطلوب' : 'Pharmacy name is required')
        return
      }

      const classVal = validateCustomerClassification(pharmacyClassification)
      if (!classVal.valid) {
        setGenericError(lang === 'ar' ? 'التصنيف مطلوب' : 'Classification is required')
        return
      }

      const repToSave = role === 'rep' && currentUser ? initialRep : selectedRep
      const newPharmacy = {
        id: `c-${Date.now()}`,
        name: pharmacyName.trim(),
        name_ar: pharmacyNameAr.trim() || undefined,
        meta: `${pharmacyType} · ${pharmacyRegion} · ${pharmacyClassification}`,
        status: 'Active',
        clientCategory: 'hco' as const,
        hcoType: 'pharmacy' as const,
        type: 'pharmacy' as const,
        specialty: 'Pharmacy',
        classification: pharmacyClassification,
        region: pharmacyRegion,
        address: pharmacyAddress.trim() || undefined,
        phone: pharmacyPhone.trim() || undefined,
        repName: repToSave.name,
        rep_id: repToSave.id,
        relationshipStatus: 'Regular',
      }

      addCustomer(newPharmacy)
      onSave(`Pharmacy ${newPharmacy.name} added successfully`)
      return
    }

    if (isStockCount) {
      const counted = Number(scCountedQty)
      if (isNaN(counted) || counted < 0 || !Number.isInteger(counted)) {
        setGenericError('Counted quantity must be a non-negative whole integer')
        return
      }

      if (!scBatch) {
        setGenericError('Batch number is required')
        return
      }

      const variance = counted - scSystemQty
      const today = new Date().toISOString().slice(0, 10)
      const actorName = currentUser?.name || 'Admin'

      if (variance !== 0) {
        addStockMovement({
          productName: scProduct,
          batchNumber: scBatch,
          quantity: variance,
          type: 'adjustment',
          date: today,
          repName: actorName,
          reason: `Stock count audit: ${scReason}`,
          notes: scNotes || `Variance of ${variance > 0 ? '+' : ''}${variance} units reconciled during physical count at ${scWarehouse}`,
        })
      }

      addAuditLog({
        action: 'Stock Count Reconciled',
        actor: actorName,
        time: 'Just now',
        details: `Physical count for ${scProduct} (Batch ${scBatch}) at ${scWarehouse}: Counted ${counted}, System ${scSystemQty}, Variance ${variance >= 0 ? '+' : ''}${variance}`,
      })

      onSave(`Stock count saved: ${scProduct} (Batch ${scBatch})`)
      return
    }

    // Default save for other forms
    onSave('Record saved successfully')
  }

  return (
    <div className="modal-backdrop">
      <aside className="side-sheet">
        <div className="sheet-head">
          <div>
            <span className="eyebrow">NEW RECORD</span>
            <h2>{title}</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close">
            <X />
          </button>
        </div>

        {genericError && (
          <div style={{ margin: '0 24px 16px', padding: '10px 14px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--rose-text)', fontSize: '13px' }}>
            {genericError}
          </div>
        )}

        {/* 1. Add Doctor Form */}
        {isDoctor && (
          <div className="form-grid">
            <label>
              Doctor name *
              <input
                placeholder="Dr. Full Name"
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                autoFocus
              />
            </label>
            <label>
              Specialty
              <select value={docSpecialty} onChange={(e) => setDocSpecialty(e.target.value)}>
                <option>Cardiology</option>
                <option>Pediatrics</option>
                <option>General Medicine</option>
                <option>Gastroenterology</option>
                <option>Neurology</option>
                <option>Pharmacy</option>
              </select>
            </label>
            <label>
              Region
              <select value={docRegion} onChange={(e) => setDocRegion(e.target.value)}>
                {EGYPT_REGIONS.map((r) => (
                  <option key={r.id} value={r.name_en}>
                    {lang === 'ar' ? `${r.name_ar} (${r.governorate_ar})` : `${r.name_en} (${r.governorate_en})`}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Classification *
              <select value={docClassification} onChange={(e) => setDocClassification(e.target.value)}>
                <option>Class A</option>
                <option>Class B</option>
                <option>Class C</option>
              </select>
            </label>
            <label>
              Phone
              <input
                placeholder="+20 100 000 0000"
                value={docPhone}
                onChange={(e) => setDocPhone(e.target.value)}
              />
            </label>

            {/* Searchable Select for Assign Rep */}
            <div style={{ position: 'relative' }} ref={repDropdownRef}>
              <label style={{ display: 'block', marginBottom: '6px' }}>
                Assign rep *
              </label>

              {role === 'rep' ? (
                // Rep role: Auto-assigned, disabled
                <div
                  title="A rep creating a doctor gets auto-assigned"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-soft)',
                    background: 'var(--surface-raised)',
                    opacity: 0.8,
                    cursor: 'not-allowed',
                  }}
                >
                  <Avatar initials={getInitials(selectedRep.name)} size="sm" />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--heading-text)' }}>
                      {selectedRep.name}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--muted-text)' }}>
                      {t('salesOrders.autoAssignedYou')}
                    </span>
                  </div>
                </div>
              ) : (
                // Admin role: Searchable dropdown
                <div>
                  <button
                    type="button"
                    onClick={() => setRepDropdownOpen((prev) => !prev)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-soft)',
                      background: 'var(--surface)',
                      cursor: 'pointer',
                      textAlign: 'start',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Avatar initials={getInitials(selectedRep.name)} size="sm" />
                      <div>
                        <span style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--heading-text)' }}>
                          {selectedRep.name}
                        </span>
                        {selectedRep.region && (
                          <span style={{ fontSize: '11px', color: 'var(--muted-text)' }}>
                            {selectedRep.region}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronDown style={{ width: '16px', height: '16px', color: 'var(--muted-text)' }} />
                  </button>

                  {repDropdownOpen && (
                    <div
                      className="panel"
                      style={{
                        position: 'absolute',
                        top: 'calc(100% + 4px)',
                        left: 0,
                        right: 0,
                        zIndex: 40,
                        padding: '8px',
                        boxShadow: 'var(--shadow-raised)',
                        borderRadius: '12px',
                        maxHeight: '260px',
                        display: 'flex',
                        flexDirection: 'column',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 8px',
                          borderBottom: '1px solid var(--border-soft)',
                          marginBottom: '6px',
                        }}
                      >
                        <Search style={{ width: '14px', height: '14px', color: 'var(--muted-text)' }} />
                        <input
                          type="text"
                          placeholder="Search reps by name..."
                          value={repSearchQuery}
                          onChange={(e) => setRepSearchQuery(e.target.value)}
                          style={{
                            border: 'none',
                            outline: 'none',
                            width: '100%',
                            fontSize: '13px',
                            background: 'transparent',
                            color: 'var(--heading-text)',
                          }}
                          autoFocus
                        />
                      </div>
                      <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {filteredReps.length > 0 ? (
                          filteredReps.map((r) => {
                            const isSelected = selectedRep.id === r.id
                            return (
                              <button
                                key={r.id}
                                type="button"
                                onClick={() => {
                                  setSelectedRep(r)
                                  setRepDropdownOpen(false)
                                  setRepSearchQuery('')
                                }}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '10px',
                                  padding: '8px 10px',
                                  borderRadius: '8px',
                                  border: 'none',
                                  background: isSelected ? 'var(--surface-raised)' : 'transparent',
                                  cursor: 'pointer',
                                  textAlign: 'start',
                                  width: '100%',
                                }}
                              >
                                <Avatar initials={getInitials(r.name)} size="sm" />
                                <div style={{ flex: 1 }}>
                                  <span style={{ display: 'block', fontSize: '13px', fontWeight: isSelected ? 600 : 400, color: 'var(--heading-text)' }}>
                                    {r.name}
                                  </span>
                                  {r.region && (
                                    <span style={{ fontSize: '11px', color: 'var(--muted-text)' }}>
                                      {r.region}
                                    </span>
                                  )}
                                </div>
                                {isSelected && <Check style={{ width: '14px', height: '14px', color: 'var(--ocean)' }} />}
                              </button>
                            )
                          })
                        ) : (
                          <div style={{ padding: '8px', fontSize: '12px', color: 'var(--muted-text)', textAlign: 'center' }}>
                            No matching reps found
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <label className="full">
              Clinical notes
              <textarea placeholder="Specialties, target prescription volume, preferences..." />
            </label>
          </div>
        )}

        {/* 2. Add Product Form */}
        {isProduct && (
          <div className="form-grid">
            <label className="full">
              Product name *
              <input
                placeholder="e.g. Bevato"
                value={prodName}
                onChange={(e) => setProdName(e.target.value)}
                autoFocus
              />
            </label>
            <label>
              Category
              <select value={prodCategory} onChange={(e) => setProdCategory(e.target.value)}>
                <option>Cardiovascular</option>
                <option>Neurology</option>
                <option>Pediatrics</option>
                <option>Gastroenterology</option>
                <option>Pulmonology</option>
                <option>Antibiotics</option>
              </select>
            </label>
            <label>
              Standard pack
              <input
                placeholder="e.g. 30 tablets / box"
                value={prodStandardPack}
                onChange={(e) => setProdStandardPack(e.target.value)}
              />
            </label>

            {/* Required Price Field with EGP Prefix and Validation Message */}
            <div className="full">
              <label style={{ display: 'block', marginBottom: '6px' }}>
                Price (EGP) *
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: '8px',
                  border: `1px solid ${priceError ? 'var(--rose-text)' : 'var(--border-soft)'}`,
                  background: 'var(--surface)',
                  overflow: 'hidden',
                }}
              >
                <span
                  style={{
                    padding: '8px 12px',
                    background: 'var(--surface-raised)',
                    borderRight: '1px solid var(--border-soft)',
                    color: 'var(--muted-text)',
                    fontSize: '13px',
                    fontWeight: 700,
                  }}
                >
                  EGP
                </span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0.00"
                  value={prodPrice}
                  onChange={(e) => {
                    setProdPrice(e.target.value)
                    if (priceTouched) validatePrice(e.target.value)
                  }}
                  onBlur={() => {
                    setPriceTouched(true)
                    validatePrice(prodPrice)
                  }}
                  style={{
                    border: 'none',
                    outline: 'none',
                    padding: '8px 12px',
                    flex: 1,
                    background: 'transparent',
                    color: 'var(--heading-text)',
                    fontSize: '14px',
                  }}
                />
              </div>
              {priceError && <FieldError message={priceError} />}
            </div>

            <label className="full">
              Formulation & dosage description
              <textarea placeholder="Clinical specs, active ingredient strength, storage instructions..." />
            </label>
          </div>
        )}

        {/* 3. Add Pharmacy (HCO) Form */}
        {isPharmacy && (
          <div className="form-grid">
            <label className="full">
              Pharmacy / Organization name (EN) *
              <input
                placeholder="e.g. Green Cross Pharmacy"
                value={pharmacyName}
                onChange={(e) => setPharmacyName(e.target.value)}
                autoFocus
              />
            </label>

            <label className="full">
              Pharmacy name (Arabic)
              <input
                placeholder="مثال: صيدلية جرين كروس"
                value={pharmacyNameAr}
                onChange={(e) => setPharmacyNameAr(e.target.value)}
                dir="rtl"
              />
            </label>

            <label>
              Organization Type
              <select value={pharmacyType} onChange={(e) => setPharmacyType(e.target.value)}>
                <option>Community Pharmacy</option>
                <option>Chain Pharmacy</option>
                <option>Hospital Pharmacy</option>
                <option>Poly-Clinic Pharmacy</option>
                <option>Medical Center</option>
              </select>
            </label>

            <label>
              Classification *
              <select value={pharmacyClassification} onChange={(e) => setPharmacyClassification(e.target.value)}>
                <option>Class A</option>
                <option>Class B</option>
                <option>Class C</option>
              </select>
            </label>

            <label>
              Region
              <select value={pharmacyRegion} onChange={(e) => setPharmacyRegion(e.target.value)}>
                {EGYPT_REGIONS.map((r) => (
                  <option key={r.id} value={r.name_en}>
                    {lang === 'ar' ? `${r.name_ar} (${r.governorate_ar})` : `${r.name_en} (${r.governorate_en})`}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Phone
              <input
                placeholder="+20 100 000 0000"
                value={pharmacyPhone}
                onChange={(e) => setPharmacyPhone(e.target.value)}
              />
            </label>

            <label className="full">
              Commercial Address
              <input
                placeholder="Street address, building number, landmark..."
                value={pharmacyAddress}
                onChange={(e) => setPharmacyAddress(e.target.value)}
              />
            </label>

            {/* Rep selector for Pharmacy */}
            <div className="full" style={{ position: 'relative' }} ref={repDropdownRef}>
              <label style={{ display: 'block', marginBottom: '6px' }}>
                Account Representative *
              </label>

              {role === 'rep' ? (
                <div
                  title="Auto-assigned to your account"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-soft)',
                    background: 'var(--surface-raised)',
                    opacity: 0.85,
                  }}
                >
                  <Avatar initials={getInitials(selectedRep.name)} size="sm" />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--heading-text)' }}>
                      {selectedRep.name}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--muted-text)' }}>
                      {t('salesOrders.autoAssignedYou')}
                    </span>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setRepDropdownOpen((prev) => !prev)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-soft)',
                    background: 'var(--surface)',
                    cursor: 'pointer',
                    textAlign: 'start',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Avatar initials={getInitials(selectedRep.name)} size="sm" />
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--heading-text)' }}>
                      {selectedRep.name} ({selectedRep.region})
                    </span>
                  </div>
                  <ChevronDown style={{ width: '16px', height: '16px', color: 'var(--muted-text)' }} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* 4. Stock Count Audit Form */}
        {isStockCount && (
          <div className="form-grid">
            <label>
              Product *
              <select value={scProduct} onChange={(e) => setScProduct(e.target.value)}>
                {availableProducts.map((p) => (
                  <option key={p.name} value={p.name}>{p.name}</option>
                ))}
              </select>
            </label>

            <label>
              Warehouse / Hub *
              <select value={scWarehouse} onChange={(e) => setScWarehouse(e.target.value)}>
                {availableWarehouses.map((w) => (
                  <option key={w.id} value={w.name}>{w.name}</option>
                ))}
                <option value="Field Rep Custody">Field Rep Custody</option>
              </select>
            </label>

            <label>
              Batch Number *
              <select value={scBatch} onChange={(e) => setScBatch(e.target.value)}>
                {derivedBatches.length > 0 ? (
                  derivedBatches.map((b) => (
                    <option key={b.batch_no} value={b.batch_no}>
                      {b.batch_no} (Exp: {b.expiry_date} · Current: {b.qty_remaining} units)
                    </option>
                  ))
                ) : (
                  <option value="">No active batches found</option>
                )}
              </select>
            </label>

            <label>
              Audit Reason
              <select value={scReason} onChange={(e) => setScReason(e.target.value)}>
                <option>Routine Cycle Count</option>
                <option>Monthly Inventory Audit</option>
                <option>Discrepancy Investigation</option>
                <option>Damaged Goods Write-off</option>
              </select>
            </label>

            {/* System Quantity vs Counted Quantity */}
            <div style={{ display: 'flex', gap: '12px', gridColumn: 'span 2' }}>
              <div style={{ flex: 1, padding: '12px 14px', borderRadius: '10px', background: 'var(--surface-raised)', border: '1px solid var(--border-soft)' }}>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--muted-text)', fontWeight: 700, display: 'block' }}>
                  System Book Quantity
                </span>
                <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--heading-text)' }}>
                  {scSystemQty.toLocaleString()} <span style={{ fontSize: '12px', fontWeight: 500 }}>units</span>
                </span>
              </div>

              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 600 }}>
                  Physical Counted Quantity *
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={scCountedQty}
                  onChange={(e) => setScCountedQty(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-soft)',
                    background: 'var(--surface)',
                    fontSize: '16px',
                    fontWeight: 700,
                    color: 'var(--heading-text)',
                  }}
                />
              </div>
            </div>

            {/* Live Variance Calculation Badge */}
            <div className="full" style={{ padding: '10px 14px', borderRadius: '8px', background: Number(scCountedQty) === scSystemQty ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)', border: `1px solid ${Number(scCountedQty) === scSystemQty ? 'rgba(16, 185, 129, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: Number(scCountedQty) === scSystemQty ? '#059669' : '#d97706' }}>
                {Number(scCountedQty) === scSystemQty ? 'Counts Match: No variance adjustment needed' : `Discrepancy: ${Number(scCountedQty) - scSystemQty > 0 ? '+' : ''}${Number(scCountedQty) - scSystemQty} units adjustment will be applied`}
              </span>
              <span style={{ fontSize: '13px', fontWeight: 800, color: Number(scCountedQty) === scSystemQty ? '#059669' : '#d97706' }}>
                Variance: {Number(scCountedQty) - scSystemQty > 0 ? '+' : ''}{Number(scCountedQty) - scSystemQty}
              </span>
            </div>

            <label className="full">
              Audit Notes & Findings
              <textarea
                placeholder="Document cause of any discrepancy, package condition, inspector notes..."
                value={scNotes}
                onChange={(e) => setScNotes(e.target.value)}
                rows={2}
              />
            </label>
          </div>
        )}

        {/* 5. Fallback for any other drawer types */}
        {!isDoctor && !isProduct && !isPharmacy && !isStockCount && (
          <div className="form-grid">
            <label>
              Name
              <input placeholder="Enter a name" />
            </label>
            <label>
              Region
              <select defaultValue="North">
                <option>North</option>
                <option>West</option>
                <option>Central</option>
              </select>
            </label>
            <label>
              Phone
              <input placeholder="+20 100 000 0000" />
            </label>
            <label className="full">
              Notes
              <textarea placeholder="Add context for your team..." />
            </label>
          </div>
        )}

        <div className="sheet-actions">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave}>
            <Check data-icon="inline-start" /> Save record
          </Button>
        </div>
      </aside>
    </div>
  )
}
