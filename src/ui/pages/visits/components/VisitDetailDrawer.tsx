import { Calendar, CheckCircle2, Clock, MapPin, Package, Stethoscope, User } from 'lucide-react'
import { Drawer } from '@/ui/design-system/components/Drawer'
import { StatusPill } from '@/ui/design-system/components/StatusPill'
import type { VisitRecord } from '../mock-data'

export interface VisitDetailDrawerProps {
  isOpen: boolean
  onClose: () => void
  visit: VisitRecord | null
}

export function VisitDetailDrawer({
  isOpen,
  onClose,
  visit,
}: VisitDetailDrawerProps) {
  if (!isOpen || !visit) return null

  return (
    <Drawer
      title={visit.clientName}
      kicker={`VISIT LOG · ${visit.id}`}
      onClose={onClose}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Verification & Status Banner */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderRadius: '14px',
            background: 'var(--blue-tint)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin style={{ width: '16px', height: '16px', color: 'var(--ocean)' }} />
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ocean)' }}>
              {visit.gpsVerified ? 'GPS Location Verified' : 'Standard Log'}
            </span>
          </div>
          <StatusPill status={visit.status} />
        </div>

        {/* Date, Time & Rep Meta */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Clock style={{ width: '16px', height: '16px', color: 'var(--muted-text)' }} />
            <span style={{ fontSize: '13px', color: 'var(--card-text)' }}>
              <strong>Date & Time:</strong> {visit.date} at {visit.time}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <User style={{ width: '16px', height: '16px', color: 'var(--muted-text)' }} />
            <span style={{ fontSize: '13px', color: 'var(--card-text)' }}>
              <strong>Representative:</strong> {visit.repName}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Stethoscope style={{ width: '16px', height: '16px', color: 'var(--muted-text)' }} />
            <span style={{ fontSize: '13px', color: 'var(--card-text)' }}>
              <strong>Doctor / Clinic:</strong> {visit.clientName}
            </span>
          </div>
        </div>

        {/* Products & Samples */}
        <div className="panel">
          <span className="eyebrow" style={{ display: 'block', marginBottom: '8px' }}>
            PRODUCTS & SAMPLES
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
            {visit.productsPresented.map((product) => (
              <span
                key={product}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '99px',
                  background: 'var(--paper)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--card-text)',
                }}
              >
                <Package style={{ width: '14px', height: '14px', color: 'var(--ocean)' }} />
                {product}
              </span>
            ))}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--muted-text)' }}>
            <strong>Samples Delivered:</strong> {visit.samplesQuantity} units transferred
          </div>
        </div>

        {/* Physician Reaction */}
        <div className="panel">
          <span className="eyebrow" style={{ display: 'block', marginBottom: '8px' }}>
            PHYSICIAN REACTION
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }} role="img" aria-label="Reaction">
              {visit.reactionEmoji}
            </span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--heading-text)' }}>
              {visit.reactionLabel}
            </span>
          </div>
        </div>

        {/* Field Notes */}
        <div className="panel">
          <span className="eyebrow" style={{ display: 'block', marginBottom: '8px' }}>
            ENGAGEMENT NOTES
          </span>
          <p style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--card-text)', margin: 0 }}>
            {visit.notes}
          </p>
        </div>

        {/* Next Scheduled Visit */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '14px 18px',
            borderRadius: '16px',
            background: 'var(--paper)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <Calendar style={{ width: '20px', height: '20px', color: 'var(--ocean)' }} />
          <div>
            <span style={{ fontSize: '11px', color: 'var(--muted-text)', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 700, display: 'block' }}>
              Next Follow-Up Visit
            </span>
            <strong style={{ fontSize: '14px', color: 'var(--heading-text)' }}>
              {visit.nextVisitDate}
            </strong>
          </div>
          <CheckCircle2 style={{ marginLeft: 'auto', width: '18px', height: '18px', color: 'var(--green-text)' }} />
        </div>
      </div>
    </Drawer>
  )
}
