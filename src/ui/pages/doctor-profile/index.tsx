import { useState, useRef } from 'react'
import { Button } from '@/ui/design-system/components/Button'
import { Drawer } from '@/ui/design-system/components/Drawer'
import { Toast } from '@/ui/design-system/components/Toast'
import { DoctorHero } from './components/DoctorHero'
import { DoctorTimeline } from './components/DoctorTimeline'
import { EditCustomerDrawer } from '@/ui/pages/clients/components/EditCustomerDrawer'
import { customersStore, updateCustomer, type Customer } from '@/data/mock/customers'
import { useStore } from '@/data/mock/store'
import { visitsStore } from '@/data/mock/visits'
import { useT } from '@/lib/i18n'

export interface DoctorProfilePageProps {
  customerId?: string | null
  onClose: () => void
  onNewVisit: () => void
  onSave?: () => void
  role?: 'admin' | 'rep'
  currentUserName?: string
}

export default function DoctorProfilePage({
  customerId,
  onClose,
  onNewVisit,
  onSave,
  role = 'admin',
  currentUserName = 'Alex Morgan',
}: DoctorProfilePageProps) {
  const { t } = useT()
  const allCustomers = useStore(customersStore)
  const allVisits = useStore(visitsStore)
  const [isEditing, setIsEditing] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [toastUndo, setToastUndo] = useState<(() => void) | null>(null)
  const toastTimeoutRef = useRef<number | null>(null)

  const showUndoToast = (msg: string, undoCb: () => void) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
    setToastMessage(msg)
    setToastUndo(() => undoCb)
    toastTimeoutRef.current = window.setTimeout(() => {
      setToastMessage(null)
      setToastUndo(null)
    }, 8000)
  }

  // Find customer by id or fallback to first non-deleted
  const customer =
    (customerId ? allCustomers.find((c) => c.id === customerId) : null) ||
    allCustomers.find((c) => !c.deleted_at) ||
    allCustomers[0]

  if (!customer) {
    return (
      <Drawer title="Customer Profile" kicker={t('doctor.profileKicker')} onClose={onClose}>
        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--muted-text)' }}>
          {t('doctor.notFound')}
        </div>
      </Drawer>
    )
  }

  // Derive initials
  const cleanName = customer.name.replace(/^(Dr\.|Pharm\.|Doctor)\s*/i, '').trim()
  const initials = cleanName
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'DR'

  // Dynamic timeline combining visits
  const customerVisits = allVisits.filter((v) => v.clientName === customer.name)
  const timelineEvents = customerVisits.length > 0
    ? customerVisits.slice(0, 5).map((v) => ({
        date: v.date.split(',')[0],
        detail: t('doctor.visitCompleted', { products: v.productsPresented.join(', ') }),
      }))
    : [
        { date: 'Oct 18', detail: t('doctor.visitCompleted', { products: 'Bevato discussed' }) },
        { date: 'Sep 26', detail: t('doctor.sampleDelivery', { units: 24 }) },
      ]

  return (
    <>
      <Drawer
        title={customer.name}
        kicker={`${(customer.specialty || 'GENERAL').toUpperCase()} · ${(customer.classification || 'CLASS A').toUpperCase()}`}
        onClose={onClose}
      >
        <DoctorHero
          initials={initials}
          region={customer.region || 'North region'}
          assignedRep={t('doctor.assignedRep', { name: customer.repName || 'Alex Morgan' })}
        />
        <div style={{ padding: '0 24px 16px' }}>
          <div style={{ fontSize: '13px', color: 'var(--muted-text)', marginBottom: '4px' }}>
            <strong>{t('doctor.phone')}</strong> {customer.phone || '01012345678'}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--muted-text)', marginBottom: '4px' }}>
            <strong>{t('doctor.address')}</strong> {customer.address || 'Cairo Medical Plaza'}
          </div>
          {customer.notes && (
            <div style={{ fontSize: '13px', color: 'var(--muted-text)', marginTop: '8px', fontStyle: 'italic' }}>
              &ldquo;{customer.notes}&rdquo;
            </div>
          )}
        </div>
        <DoctorTimeline events={timelineEvents} />
        <div className="sheet-actions">
          <Button variant="secondary" onClick={onNewVisit}>
            {t('doctor.newVisit')}
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setIsEditing(true)
              onSave?.()
            }}
          >
            {t('doctor.editDoctor')}
          </Button>
        </div>
      </Drawer>

      <EditCustomerDrawer
        customer={customer}
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        role={role}
        currentUserName={currentUserName}
        onSave={(updated, previous) => {
          showUndoToast(t('clients.savedChanges', { name: updated.name }), () => {
            if (previous.id) {
              updateCustomer(previous.id, previous)
            }
          })
        }}
        onDelete={(deleted) => {
          showUndoToast(t('clients.deleted', { name: deleted.name }), () => {
            if (deleted.id) {
              updateCustomer(deleted.id, { deleted_at: null })
            }
          })
          onClose()
        }}
      />

      {toastMessage && (
        <Toast message={toastMessage} onUndo={toastUndo ?? undefined} />
      )}
    </>
  )
}
