import { useState, useEffect, useMemo } from 'react'
import {
  ChevronRight,
  ChevronLeft,
  Check,
  Search,
  MapPin,
  Calendar,
  AlertCircle,
  Stethoscope,
  Plus,
  Minus,
  Sparkles,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/ui/design-system/components/Button'
import { Drawer } from '@/ui/design-system/components/Drawer'
import { Stepper } from '@/ui/design-system/components/Stepper'
import { customersStore, updateCustomer, type Customer } from '@/data/mock/customers'
import { productsStore, stockProductsStore } from '@/data/mock/products'
import { stockMovementsStore, addStockMovement } from '@/data/mock/stock-movements'
import { visitsStore, addVisit, type StoredVisit } from '@/data/mock/visits'
import { useStore } from '@/data/mock/store'

export interface NewVisitWizardProps {
  isOpen?: boolean
  initialClientId?: string | null
  onClose: () => void
  onSave?: () => void
  onViewVisit?: (visitId: string) => void
  role?: 'admin' | 'rep'
  currentUserName?: string
}

const REACTION_OPTIONS = [
  { id: 'interested', emoji: '😍', label: 'Interested' },
  { id: 'neutral', emoji: '😐', label: 'Neutral' },
  { id: 'not-interested', emoji: '👎', label: 'Not interested' },
] as const

function addDaysToDate(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

function formatDisplayDate(dateStr: string): string {
  try {
    const parts = dateStr.split('-')
    if (parts.length === 3) {
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return dateStr
  }
}

export function NewVisitWizard({
  isOpen = true,
  initialClientId = null,
  onClose,
  onSave,
  onViewVisit,
  role = 'admin',
  currentUserName = 'Alex Morgan',
}: NewVisitWizardProps) {
  const allCustomers = useStore(customersStore)
  const catalogProducts = useStore(productsStore)
  const stockMovements = useStore(stockMovementsStore)
  const stockProducts = useStore(stockProductsStore)

  const [currentStep, setCurrentStep] = useState(1)
  const [selectedClientId, setSelectedClientId] = useState<string | null>(initialClientId)
  const [clientSearch, setClientSearch] = useState('')

  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [reactions, setReactions] = useState<Record<string, string>>({})
  const [samples, setSamples] = useState<Record<string, number>>({})

  const [notes, setNotes] = useState('')
  const [nextVisitDate, setNextVisitDate] = useState('')
  const [gpsVerified] = useState(true)

  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [savedVisitId, setSavedVisitId] = useState<string | null>(null)

  // Sync initial client ID if passed
  useEffect(() => {
    if (initialClientId) {
      setSelectedClientId(initialClientId)
    }
  }, [initialClientId])

  // Filter active customers
  const activeCustomers = useMemo(() => {
    const list = allCustomers.filter((c) => !c.deleted_at && c.active !== false && c.status !== 'Inactive')
    if (role === 'rep') {
      return list.filter(
        (c) =>
          (c.repName && c.repName.toLowerCase() === currentUserName.toLowerCase()) ||
          (c.rep_id && currentUserName && c.rep_id.toLowerCase().includes(currentUserName.toLowerCase().split(' ')[0]))
      )
    }
    return list
  }, [allCustomers, role, currentUserName])

  const filteredCustomers = useMemo(() => {
    if (!clientSearch.trim()) return activeCustomers
    const q = clientSearch.toLowerCase()
    return activeCustomers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.name_ar && c.name_ar.includes(q)) ||
        c.specialty.toLowerCase().includes(q) ||
        c.region.toLowerCase().includes(q)
    )
  }, [activeCustomers, clientSearch])

  // Selected client object
  const selectedClient = useMemo(() => {
    return allCustomers.find((c) => c.id === selectedClientId) || null
  }, [allCustomers, selectedClientId])

  // Set default next visit date according to classification
  useEffect(() => {
    if (selectedClient && !nextVisitDate) {
      const cls = selectedClient.classification || 'Class A'
      let days = 14
      if (cls.includes('B')) days = 30
      else if (cls.includes('C')) days = 60
      setNextVisitDate(addDaysToDate(days))
    }
  }, [selectedClient, nextVisitDate])

  // Available products
  const productOptions = useMemo(() => {
    const names = catalogProducts.map((p) => p.name)
    if (names.length > 0) return names
    return [
      'Bevato',
      'Naviro D3 50,000 IU',
      'Naviro D3 10,000 IU',
      'Naviro D3 Drops',
      'Navigen Product 5',
    ]
  }, [catalogProducts])

  // Sample stock available per product
  const getAvailableSampleStock = (productName: string) => {
    const used = stockMovements
      .filter((m) => m.productName === productName && m.type === 'sample')
      .reduce((sum, m) => sum + m.quantity, 0)
    return Math.max(0, 30 - used)
  }

  const steps = [
    { number: 1, label: 'Client' },
    { number: 2, label: 'Products' },
    { number: 3, label: 'Samples' },
    { number: 4, label: 'Notes' },
    { number: 5, label: 'Saved' },
  ]

  const handleStepClick = (step: number) => {
    if (step < currentStep && currentStep < 5) {
      setErrorMsg(null)
      setCurrentStep(step)
    }
  }

  const handleNext = () => {
    setErrorMsg(null)
    if (currentStep === 1) {
      if (!selectedClientId) {
        setErrorMsg('Please select a client to proceed.')
        return
      }
      setCurrentStep(2)
    } else if (currentStep === 2) {
      if (selectedProducts.length === 0) {
        setErrorMsg('Please select at least one product discussed.')
        return
      }
      setCurrentStep(3)
    } else if (currentStep === 3) {
      setCurrentStep(4)
    } else if (currentStep === 4) {
      executeSave()
    }
  }

  const handleBack = () => {
    setErrorMsg(null)
    if (currentStep > 1 && currentStep < 5) {
      setCurrentStep(currentStep - 1)
    }
  }

  const executeSave = () => {
    if (!selectedClient) {
      setErrorMsg('No client selected. Please go back to Step 1.')
      return
    }

    setIsSaving(true)
    setErrorMsg(null)

    try {
      const now = new Date()
      const totalSamples = Object.values(samples).reduce((a, b) => a + b, 0)

      // Primary reaction
      const firstProduct = selectedProducts[0] || ''
      const firstReactionKey = reactions[firstProduct] || 'interested'
      const matchedReaction = REACTION_OPTIONS.find((r) => r.id === firstReactionKey) || REACTION_OPTIONS[0]

      // 1. Add visit to visitsStore
      const newVisit: StoredVisit = addVisit({
        clientName: selectedClient.name,
        clientName_ar: selectedClient.name_ar,
        repName: currentUserName,
        date: now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        detail: `${selectedProducts.slice(0, 2).join(' & ')} presentation`,
        status: 'Completed',
        productsPresented: selectedProducts,
        samplesQuantity: totalSamples,
        reactionEmoji: matchedReaction.emoji,
        reactionLabel: matchedReaction.label,
        notes: notes.trim() || 'Routine scientific visit and product update.',
        nextVisitDate: formatDisplayDate(nextVisitDate || addDaysToDate(14)),
        gpsVerified: true,
      })

      // 2. Deduct samples via stock movement
      selectedProducts.forEach((p) => {
        const qty = samples[p] || 0
        if (qty > 0) {
          addStockMovement({
            productName: p,
            quantity: qty,
            type: 'sample',
          })
        }
      })

      // 3. Update stock products store units left
      stockProductsStore.update((list) =>
        list.map((sp) => {
          const qty = samples[sp.name] || 0
          if (qty <= 0) return sp
          const currentLeft = parseInt(sp.left.replace(/,/g, ''), 10) || 0
          const updatedLeft = Math.max(0, currentLeft - qty)
          return {
            ...sp,
            left: updatedLeft.toLocaleString(),
            meta: `${updatedLeft.toLocaleString()} units left`,
          }
        })
      )

      // 4. Update client's last visit date and status
      updateCustomer(selectedClient.id!, {
        last_visit_date: now.toISOString().split('T')[0],
        status: 'Active',
      })

      setSavedVisitId(newVisit.id)
      setCurrentStep(5)
      onSave?.()
    } catch {
      setErrorMsg('Failed to save visit. You can retry without losing your draft.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleResetForAnother = () => {
    setCurrentStep(1)
    setSelectedClientId(null)
    setSelectedProducts([])
    setReactions({})
    setSamples({})
    setNotes('')
    setNextVisitDate('')
    setSavedVisitId(null)
    setErrorMsg(null)
  }

  if (!isOpen) return null

  return (
    <Drawer
      title="New visit"
      kicker={currentStep === 5 ? 'COMPLETED' : `STEP ${currentStep} OF 5`}
      onClose={onClose}
    >
      <div style={{ padding: '0 24px', display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Stepper
          steps={steps}
          currentStep={currentStep}
          onStepClick={handleStepClick}
        />

        {errorMsg && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              margin: '12px 0',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.1)',
              color: 'var(--rose-text, #ef4444)',
              fontSize: '13px',
            }}
          >
            <AlertCircle size={16} />
            <span style={{ flex: 1 }}>{errorMsg}</span>
            {currentStep === 4 && (
              <Button
                variant="secondary"
                type="button"
                onClick={executeSave}
                style={{ height: '26px', padding: '0 8px', fontSize: '12px' }}
              >
                <RefreshCw size={12} style={{ marginRight: '4px' }} /> Retry
              </Button>
            )}
          </div>
        )}

        {/* Step 1: Client */}
        {currentStep === 1 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ position: 'relative' }}>
              <Search
                size={16}
                style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--muted-text)' }}
              />
              <input
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                placeholder="Search active doctors & pharmacies..."
                style={{ width: '100%', paddingLeft: '38px', height: '40px' }}
              />
            </div>

            <div style={{ flex: 1, overflowY: 'auto', maxHeight: '55vh', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((c) => {
                  const isSelected = selectedClientId === c.id
                  return (
                    <div
                      key={c.id || c.name}
                      onClick={() => setSelectedClientId(c.id || null)}
                      style={{
                        padding: '12px 16px',
                        borderRadius: '10px',
                        border: isSelected ? '2px solid var(--ocean)' : '1px solid var(--border-soft)',
                        background: isSelected ? 'var(--ocean-light, rgba(2, 132, 199, 0.08))' : 'var(--surface)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '8px',
                            background: 'var(--surface-raised, rgba(0,0,0,0.04))',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--ocean)',
                          }}
                        >
                          <Stethoscope size={18} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '14px' }}>
                            {c.name}{' '}
                            {c.name_ar && (
                              <span style={{ fontSize: '12px', color: 'var(--muted-text)', fontWeight: 400 }}>
                                ({c.name_ar})
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--muted-text)' }}>
                            {c.specialty} · {c.region} · {c.classification}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--muted-text)', marginTop: '2px' }}>
                            Last visit: {c.last_visit_date ? formatDisplayDate(c.last_visit_date) : 'No recent visits'}
                          </div>
                        </div>
                      </div>
                      <div
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          border: isSelected ? '6px solid var(--ocean)' : '2px solid var(--border-soft)',
                          background: 'var(--surface)',
                        }}
                      />
                    </div>
                  )
                })
              ) : (
                <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--muted-text)', fontSize: '13px' }}>
                  No active customers match your search.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Products & Reactions */}
        {currentStep === 2 && (
          <div style={{ flex: 1, overflowY: 'auto', maxHeight: '60vh', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <span style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                Select products presented (multi-select) *
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {productOptions.map((p) => {
                  const isSelected = selectedProducts.includes(p)
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setSelectedProducts(selectedProducts.filter((item) => item !== p))
                        } else {
                          setSelectedProducts([...selectedProducts, p])
                          if (!reactions[p]) {
                            setReactions((prev) => ({ ...prev, [p]: 'interested' }))
                          }
                        }
                      }}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '20px',
                        border: isSelected ? '1px solid var(--ocean)' : '1px solid var(--border-soft)',
                        background: isSelected ? 'var(--ocean)' : 'var(--surface-raised, transparent)',
                        color: isSelected ? '#ffffff' : 'inherit',
                        fontWeight: 600,
                        fontSize: '13px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      {isSelected && <Check size={14} />}
                      {p}
                    </button>
                  )
                })}
              </div>
            </div>

            {selectedProducts.length > 0 && (
              <div style={{ marginTop: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                  Physician reaction per product
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {selectedProducts.map((p) => {
                    const currentReaction = reactions[p] || 'interested'
                    return (
                      <div
                        key={p}
                        style={{
                          padding: '12px 14px',
                          borderRadius: '8px',
                          border: '1px solid var(--border-soft)',
                          background: 'var(--surface-raised, rgba(0,0,0,0.02))',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px',
                        }}
                      >
                        <strong style={{ fontSize: '13px' }}>{p}</strong>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {REACTION_OPTIONS.map((opt) => {
                            const isChosen = currentReaction === opt.id
                            return (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => setReactions((prev) => ({ ...prev, [p]: opt.id }))}
                                title={opt.label}
                                style={{
                                  padding: '4px 8px',
                                  borderRadius: '6px',
                                  border: isChosen ? '1px solid var(--ocean)' : '1px solid var(--border-soft)',
                                  background: isChosen ? 'var(--ocean-light, rgba(2, 132, 199, 0.15))' : 'var(--surface)',
                                  fontSize: '15px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                              >
                                <span>{opt.emoji}</span>
                                <span style={{ fontSize: '11px', fontWeight: isChosen ? 700 : 400 }}>
                                  {opt.label}
                                </span>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Samples Stepper */}
        {currentStep === 3 && (
          <div style={{ flex: 1, overflowY: 'auto', maxHeight: '60vh', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <span style={{ fontSize: '13px', color: 'var(--muted-text)' }}>
              Specify sample units handed over during this visit. Units are deducted from your buffer.
            </span>

            {selectedProducts.map((p) => {
              const currentQty = samples[p] || 0
              const availableStock = getAvailableSampleStock(p)
              return (
                <div
                  key={p}
                  style={{
                    padding: '14px 16px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-soft)',
                    background: 'var(--surface-raised, rgba(0,0,0,0.02))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <strong style={{ fontSize: '14px', display: 'block' }}>{p}</strong>
                    <span style={{ fontSize: '12px', color: availableStock <= 5 ? 'var(--rose-text)' : 'var(--muted-text)' }}>
                      Left with you: {availableStock} units
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button
                      type="button"
                      disabled={currentQty <= 0}
                      onClick={() => setSamples((prev) => ({ ...prev, [p]: Math.max(0, currentQty - 1) }))}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-soft)',
                        background: 'var(--surface)',
                        cursor: currentQty <= 0 ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: currentQty <= 0 ? 0.4 : 1,
                      }}
                    >
                      <Minus size={14} />
                    </button>
                    <span style={{ minWidth: '32px', textAlign: 'center', fontWeight: 700, fontSize: '15px' }}>
                      {currentQty}
                    </span>
                    <button
                      type="button"
                      disabled={currentQty >= availableStock}
                      onClick={() => setSamples((prev) => ({ ...prev, [p]: currentQty + 1 }))}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-soft)',
                        background: 'var(--surface)',
                        cursor: currentQty >= availableStock ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: currentQty >= availableStock ? 0.4 : 1,
                      }}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Step 4: Notes & Scheduling */}
        {currentStep === 4 && (
          <div style={{ flex: 1, overflowY: 'auto', maxHeight: '60vh', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* GPS Verified Badge */}
            {gpsVerified && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'rgba(22, 163, 74, 0.1)',
                  color: 'var(--green-text, #16a34a)',
                  border: '1px solid rgba(22, 163, 74, 0.25)',
                  fontSize: '13px',
                  fontWeight: 600,
                }}
              >
                <MapPin size={16} />
                <span>GPS Location Verified · Cairo Medical Hub (30.0444° N, 31.2357° E)</span>
              </div>
            )}

            {/* Next visit date */}
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                Next visit scheduled date
              </label>
              <div style={{ position: 'relative' }}>
                <Calendar
                  size={16}
                  style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--muted-text)' }}
                />
                <input
                  type="date"
                  value={nextVisitDate}
                  onChange={(e) => setNextVisitDate(e.target.value)}
                  style={{ width: '100%', paddingLeft: '38px', height: '40px' }}
                />
              </div>
              <span style={{ fontSize: '11px', color: 'var(--muted-text)', marginTop: '4px', display: 'block' }}>
                Defaulted according to {selectedClient?.classification || 'Class A'} cycle
              </span>
            </div>

            {/* Notes */}
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                Visit notes & clinical discussion
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Doctor's clinical feedback, patient profile, sample restocking needs..."
                rows={4}
                style={{ width: '100%' }}
              />
            </div>
          </div>
        )}

        {/* Step 5: Saved Summary */}
        {currentStep === 5 && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px 0',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'rgba(22, 163, 74, 0.12)',
                color: 'var(--green-text, #16a34a)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
              }}
            >
              <Sparkles size={28} />
            </div>

            <h3 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 700 }}>
              Visit Successfully Saved!
            </h3>
            <p style={{ margin: '0 0 20px', color: 'var(--muted-text)', fontSize: '14px' }}>
              Samples deducted, client profile updated, and visit logged to system.
            </p>

            <div
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '16px',
                borderRadius: '10px',
                background: 'var(--surface-raised, rgba(0,0,0,0.02))',
                border: '1px solid var(--border-soft)',
                marginBottom: '24px',
                fontSize: '13px',
                lineHeight: 1.8,
              }}
            >
              <div>
                <strong>Client:</strong> {selectedClient?.name} ({selectedClient?.specialty})
              </div>
              <div>
                <strong>Products:</strong> {selectedProducts.join(', ')}
              </div>
              <div>
                <strong>Samples given:</strong>{' '}
                {Object.values(samples).reduce((a, b) => a + b, 0)} units total
              </div>
              <div>
                <strong>Next visit:</strong> {formatDisplayDate(nextVisitDate)}
              </div>
              <div>
                <strong>GPS Status:</strong> Verified
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
              <Button
                variant="secondary"
                onClick={handleResetForAnother}
                style={{ flex: 1, height: '42px' }}
              >
                + Add another
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  onClose()
                  if (savedVisitId) onViewVisit?.(savedVisitId)
                }}
                style={{ flex: 1, height: '42px' }}
              >
                View visit
              </Button>
            </div>
          </div>
        )}

        {/* Bottom Actions for steps 1 - 4 */}
        {currentStep < 5 && (
          <div
            className="sheet-actions"
            style={{
              position: 'sticky',
              bottom: 0,
              background: 'var(--surface, #ffffff)',
              padding: '16px 0',
              borderTop: '1px solid var(--border-soft)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 'auto',
            }}
          >
            {currentStep > 1 ? (
              <Button variant="secondary" type="button" onClick={handleBack}>
                <ChevronLeft size={16} style={{ marginRight: '4px' }} /> Back
              </Button>
            ) : (
              <Button variant="secondary" type="button" onClick={onClose}>
                Cancel
              </Button>
            )}

            <Button
              variant="primary"
              type="button"
              onClick={handleNext}
              loading={isSaving}
            >
              {currentStep === 4 ? (
                <>
                  <Check size={16} style={{ marginRight: '6px' }} /> Save visit
                </>
              ) : (
                <>
                  Continue <ChevronRight size={16} style={{ marginLeft: '4px' }} />
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </Drawer>
  )
}
