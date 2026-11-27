import { useEffect, useState } from 'react'
import { Calendar, CheckCircle2, Clock, MapPin, Package, Stethoscope, User, Users, Check, X, Camera } from 'lucide-react'
import { Drawer } from '@/ui/design-system/components/Drawer'
import { Button } from '@/ui/design-system/components/Button'
import { StatusPill } from '@/ui/design-system/components/StatusPill'
import { useT } from '@/lib/i18n'
import { formatProductName } from '@/lib/format'
import { respondToJointVisitInvitation } from '@/data/mock/visits'
import { usersStore } from '@/data/mock/users'
import { getVisitImage } from '@/lib/storage/visitImageDb'
import type { UserRole } from '@/lib/auth/types'
import type { VisitRecord } from '../mock-data'

export interface VisitDetailDrawerProps {
  isOpen: boolean
  onClose: () => void
  visit: VisitRecord | null
  currentUserName?: string
  role?: UserRole | string
  onAction?: (msg: string) => void
}

export function VisitDetailDrawer({
  isOpen,
  onClose,
  visit,
  currentUserName = 'Alex Morgan',
  role = 'admin',
  onAction,
}: VisitDetailDrawerProps) {
  const { t, lang } = useT()
  const [loadedImageUrl, setLoadedImageUrl] = useState<string | null>(null)
  const [imageLoadError, setImageLoadError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setLoadedImageUrl(visit?.presentationImage || null)
    setImageLoadError(null)

    if (!visit?.presentationImage && visit?.presentationImageId) {
      getVisitImage(visit.presentationImageId)
        .then((url) => {
          if (active) setLoadedImageUrl(url)
        })
        .catch((err) => {
          if (active) setImageLoadError((err as Error).message)
        })
    }
    return () => {
      active = false
    }
  }, [visit?.id, visit?.presentationImage, visit?.presentationImageId])

  if (!isOpen || !visit) return null

  const clientName = lang === 'ar' ? (visit.clientName_ar || visit.clientName) : visit.clientName
  const repName = lang === 'ar' ? (visit.repName_ar || visit.repName) : visit.repName
  const date = lang === 'ar' ? (visit.date_ar || visit.date) : visit.date

  const isInvitedRep = Boolean(
    (visit.jointRepName && visit.jointRepName.toLowerCase() === currentUserName.toLowerCase()) ||
    (visit.jointRepId && usersStore.get().find((u) => u.name.toLowerCase() === currentUserName.toLowerCase())?.id === visit.jointRepId) ||
    role === 'admin'
  )

  const handleRespond = (response: 'Accepted' | 'Rejected') => {
    try {
      let reason: string | undefined
      if (response === 'Rejected') {
        const inputReason = window.prompt(
          lang === 'ar' ? 'يرجى كتابة سبب رفض الدعوة:' : 'Please enter a reason for rejecting the invitation:'
        )
        if (inputReason === null) return // cancelled prompt
        reason = inputReason.trim() || (lang === 'ar' ? 'تعارض في المواعيد' : 'Schedule conflict')
      }
      respondToJointVisitInvitation(visit.id, response, currentUserName, reason)
      onAction?.(
        response === 'Accepted'
          ? (lang === 'ar' ? 'تم قبول دعوة الزيارة المشتركة' : 'Joint visit invitation accepted')
          : (lang === 'ar' ? 'تم رفض دعوة الزيارة المشتركة' : 'Joint visit invitation rejected')
      )
    } catch (err) {
      alert((err as Error).message)
    }
  }

  return (
    <Drawer
      title={clientName}
      kicker={t('visits.detail.kicker', { id: visit.id })}
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
              {visit.gpsVerified ? t('visits.detail.gpsVerified') : t('visits.detail.standardLog')}
            </span>
          </div>
          <StatusPill status={visit.status} />
        </div>

        {/* Date, Time & Rep Meta */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Clock style={{ width: '16px', height: '16px', color: 'var(--muted-text)' }} />
            <span style={{ fontSize: '13px', color: 'var(--card-text)' }}>
              <strong>{t('visits.detail.dateTime')}</strong> {date} at {visit.time}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <User style={{ width: '16px', height: '16px', color: 'var(--muted-text)' }} />
            <span style={{ fontSize: '13px', color: 'var(--card-text)' }}>
              <strong>{t('visits.detail.representative')}</strong> {repName}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Stethoscope style={{ width: '16px', height: '16px', color: 'var(--muted-text)' }} />
            <span style={{ fontSize: '13px', color: 'var(--card-text)' }}>
              <strong>{t('visits.detail.doctorClinic')}</strong> {clientName}
            </span>
          </div>
        </div>

        {/* Double Visit Details */}
        {visit.isDoubleVisit && (
          <div
            className="panel"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              border: '1.5px solid rgba(2, 132, 199, 0.25)',
              background: 'rgba(2, 132, 199, 0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users style={{ width: '16px', height: '16px', color: 'var(--ocean)' }} />
                <span className="eyebrow" style={{ color: 'var(--ocean)', fontWeight: 700 }}>
                  {lang === 'ar' ? 'زيارة مشتركة (DOUBLE VISIT)' : 'DOUBLE VISIT (JOINT VISIT)'}
                </span>
              </div>
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: 700,
                  background:
                    visit.jointVisitStatus === 'Accepted'
                      ? 'rgba(22, 163, 74, 0.15)'
                      : visit.jointVisitStatus === 'Rejected'
                      ? 'rgba(239, 68, 68, 0.15)'
                      : 'rgba(245, 158, 11, 0.15)',
                  color:
                    visit.jointVisitStatus === 'Accepted'
                      ? '#16a34a'
                      : visit.jointVisitStatus === 'Rejected'
                      ? '#ef4444'
                      : '#d97706',
                }}
              >
                {visit.jointVisitStatus === 'Accepted'
                  ? (lang === 'ar' ? 'مقبولة / مؤكدة' : 'Confirmed / Accepted')
                  : visit.jointVisitStatus === 'Rejected'
                  ? (lang === 'ar' ? 'مرفوضة' : 'Rejected')
                  : (lang === 'ar' ? 'قيد الانتظار' : 'Pending Response')}
              </span>
            </div>

            <div style={{ fontSize: '12.5px', color: 'var(--card-text)', lineHeight: 1.5 }}>
              <div>
                <strong>{lang === 'ar' ? 'المندوب الأساسي: ' : 'Primary Representative: '}</strong>
                {repName}
              </div>
              <div>
                <strong>{lang === 'ar' ? 'المشارك في الزيارة: ' : 'Joint Participant: '}</strong>
                {visit.jointRepName}
              </div>
            </div>

            {/* Accept / Reject actions for invited rep */}
            {visit.jointVisitStatus === 'Pending' && isInvitedRep && (
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  marginTop: '6px',
                  paddingTop: '8px',
                  borderTop: '1px solid rgba(2, 132, 199, 0.15)',
                }}
              >
                <Button
                  variant="primary"
                  type="button"
                  onClick={() => handleRespond('Accepted')}
                  style={{ flex: 1, height: '32px', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                >
                  <Check size={14} /> {lang === 'ar' ? 'قبول الدعوة' : 'Accept Invitation'}
                </Button>
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => handleRespond('Rejected')}
                  style={{ flex: 1, height: '32px', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: 'var(--rose-text)' }}
                >
                  <X size={14} /> {lang === 'ar' ? 'رفض الدعوة' : 'Reject'}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Products & Samples */}
        <div className="panel">
          <span className="eyebrow" style={{ display: 'block', marginBottom: '8px' }}>
            {t('visits.detail.productsEyebrow')}
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
                {formatProductName(product, lang)}
              </span>
            ))}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--muted-text)' }}>
            <strong>{t('visits.detail.samplesDelivered')}</strong> {t('visits.detail.unitsTransferred', { qty: visit.samplesQuantity })}
          </div>
        </div>

        {/* Physician Reaction */}
        <div className="panel">
          <span className="eyebrow" style={{ display: 'block', marginBottom: '8px' }}>
            {t('visits.detail.reactionEyebrow')}
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
            {t('visits.detail.notesEyebrow')}
          </span>
          <p style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--card-text)', margin: 0 }}>
            {visit.notes}
          </p>
        </div>

        {/* Doctor Presentation Image */}
        {(loadedImageUrl || visit.presentationImageId || imageLoadError) && (
          <div className="panel">
            <span className="eyebrow" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <Camera size={14} color="var(--ocean)" />
              {lang === 'ar' ? 'صورة العرض التقديمي المرفقة' : 'Doctor Presentation Photo'}
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {loadedImageUrl ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={loadedImageUrl}
                    alt={visit.presentationImageName || 'Doctor presentation'}
                    style={{
                      width: '100%',
                      maxHeight: '220px',
                      objectFit: 'cover',
                      borderRadius: '8px',
                      border: '1px solid var(--border-soft)',
                    }}
                  />
                </>
              ) : imageLoadError ? (
                <span style={{ fontSize: '12px', color: 'var(--rose-text, #ef4444)' }}>
                  {lang === 'ar' ? `تعذر تحميل الصورة: ${imageLoadError}` : `Failed to load image: ${imageLoadError}`}
                </span>
              ) : (
                <span style={{ fontSize: '12px', color: 'var(--muted-text)' }}>
                  {lang === 'ar' ? 'جارٍ تحميل الصورة من التخزين المحلي...' : 'Loading presentation image...'}
                </span>
              )}
              <span style={{ fontSize: '11px', color: 'var(--muted-text)' }}>
                {visit.presentationImageName || 'presentation-photo.jpg'}
              </span>
            </div>
          </div>
        )}

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
              {t('visits.detail.nextFollowUp')}
            </span>
            <strong style={{ fontSize: '14px', color: 'var(--heading-text)' }}>
              {visit.nextVisitDate}
            </strong>
          </div>
          <CheckCircle2 style={{ marginInlineStart: 'auto', width: '18px', height: '18px', color: 'var(--green-text)' }} />
        </div>
      </div>
    </Drawer>
  )
}
