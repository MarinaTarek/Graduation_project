'use client'

import { Bell, Clock, CalendarDays, Hash, Activity, MapPin, User, X, Stethoscope } from 'lucide-react'
import { Button } from '@/ui/design-system/components/Button'
import { useT } from '@/lib/i18n'
import { formatDate } from '@/lib/format'
import type { ActiveVisitAlarm } from '@/data/mock/visitAlarm'

export interface VisitAlarmModalProps {
  alarm: ActiveVisitAlarm | null
  isOpen: boolean
  onClose: () => void
  onDismiss: (alarmId: string) => void
  onSnooze?: (alarmId: string, minutes?: number) => void
  onNavigateToCalendar?: () => void
  onNavigateToCustomer?: (customerId: string) => void
}

export function VisitAlarmModal({
  alarm,
  isOpen,
  onClose,
  onDismiss,
  onSnooze,
  onNavigateToCalendar,
  onNavigateToCustomer,
}: VisitAlarmModalProps) {
  const { lang } = useT()

  if (!isOpen || !alarm) return null

  const details = alarm.details
  const doctorName = lang === 'ar' ? (details.doctorName_ar || details.doctorName) : details.doctorName
  const isRtl = lang === 'ar'

  return (
    /* Full-screen backdrop */
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Modal panel — stop click propagation so clicks inside don't close */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--surface-raised, #fff)',
          borderRadius: '20px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          padding: '24px',
          maxWidth: '520px',
          width: '100%',
          boxSizing: 'border-box',
          position: 'relative',
        }}
      >
        {/* Header Kicker & Close */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.12)',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Bell size={18} />
            </div>
            <div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: '#ef4444',
                  display: 'block',
                }}
              >
                {lang === 'ar' ? 'تنبيه موعد زيارة ميدانية' : 'FIELD VISIT ALARM & REMINDER'}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--muted-text)' }}>
                {alarm.scheduledTime ? `⏰ ${alarm.scheduledTime}` : ''} {alarm.scheduledDate ? `· ${formatDate(alarm.scheduledDate, lang)}` : ''}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--muted-text)',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '6px',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* 1. Visually Prominent Doctor Name */}
        <div
          style={{
            padding: '16px',
            borderRadius: '14px',
            background: 'var(--surface-raised)',
            border: '1px solid var(--border-soft)',
            marginBottom: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: 'rgba(37, 99, 235, 0.12)',
                  color: 'var(--ocean)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Stethoscope size={22} />
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--muted-text)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                  {lang === 'ar' ? 'الطبيب / العميل المستهدف' : 'Target Healthcare Professional (HCP)'}
                </span>
                <h2
                  style={{
                    margin: '2px 0 4px',
                    fontSize: '19px',
                    fontWeight: 800,
                    color: 'var(--heading-text)',
                    lineHeight: 1.25,
                  }}
                >
                  {doctorName}
                </h2>
                <div style={{ fontSize: '12px', color: 'var(--muted-text)', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  {details.specialty && <span>{details.specialty}</span>}
                  {details.address && (
                    <>
                      <span>·</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        <MapPin size={12} /> {details.address}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            {details.customerClass && (
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '99px',
                  background: 'rgba(37, 99, 235, 0.1)',
                  color: 'var(--ocean)',
                  whiteSpace: 'nowrap',
                }}
              >
                {details.customerClass}
              </span>
            )}
          </div>
        </div>

        {/* 2. Compact, clearly readable information sections: Call Number, Coverage, Frequency */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '10px',
            marginBottom: '16px',
          }}
        >
          {/* Call Number Section */}
          <div
            style={{
              padding: '12px',
              borderRadius: '12px',
              background: 'var(--surface)',
              border: '1px solid var(--border-soft)',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 600, color: 'var(--muted-text)' }}>
              <Hash size={13} style={{ color: 'var(--ocean)' }} />
              <span>{lang === 'ar' ? 'رقم الزيارة' : 'Call Number'}</span>
            </div>
            <div
              style={{
                fontSize: '14px',
                fontWeight: 800,
                color: 'var(--heading-text)',
                marginTop: '2px',
              }}
            >
              {details.callNumber}
            </div>
            <span style={{ fontSize: '10px', color: 'var(--muted-text)' }}>
              {lang === 'ar' ? 'تسلسل الزيارات' : 'Visit sequence'}
            </span>
          </div>

          {/* Coverage Section */}
          <div
            style={{
              padding: '12px',
              borderRadius: '12px',
              background: 'var(--surface)',
              border: '1px solid var(--border-soft)',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 600, color: 'var(--muted-text)' }}>
              <Activity size={13} style={{ color: details.isOverdue ? '#ef4444' : '#16a34a' }} />
              <span>{lang === 'ar' ? 'التغطية' : 'Coverage'}</span>
            </div>
            <div
              style={{
                fontSize: '13px',
                fontWeight: 800,
                color: details.isOverdue ? '#ef4444' : '#16a34a',
                marginTop: '2px',
                lineHeight: 1.2,
              }}
            >
              {details.coverage}
            </div>
            <span style={{ fontSize: '10px', color: 'var(--muted-text)' }}>
              {details.isOverdue
                ? (lang === 'ar' ? 'مطلوب إتمام الزيارة' : 'Visit needed')
                : (lang === 'ar' ? 'ضمن دورة التغطية' : 'Active cycle')}
            </span>
          </div>

          {/* Frequency Policy Section */}
          <div
            style={{
              padding: '12px',
              borderRadius: '12px',
              background: 'var(--surface)',
              border: '1px solid var(--border-soft)',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 600, color: 'var(--muted-text)' }}>
              <CalendarDays size={13} style={{ color: '#d97706' }} />
              <span>{lang === 'ar' ? 'المعدل المطلوب' : 'Frequency'}</span>
            </div>
            <div
              style={{
                fontSize: '13px',
                fontWeight: 700,
                color: 'var(--heading-text)',
                marginTop: '2px',
                lineHeight: 1.2,
              }}
            >
              {details.frequency}
            </div>
            <span style={{ fontSize: '10px', color: 'var(--muted-text)' }}>
              {lang === 'ar' ? 'سياسة الزيارات' : 'Configured policy'}
            </span>
          </div>
        </div>

        {/* Schedule & Rep Meta */}
        <div
          style={{
            fontSize: '12px',
            color: 'var(--muted-text)',
            padding: '10px 12px',
            borderRadius: '8px',
            background: 'var(--surface-raised)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '8px',
            marginBottom: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <User size={13} />
            <span>{lang === 'ar' ? 'المندوب:' : 'Rep:'} <strong>{alarm.repName}</strong></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CalendarDays size={13} />
            <span>{formatDate(alarm.scheduledDate, lang)} {alarm.scheduledTime ? `· ${alarm.scheduledTime}` : ''}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              variant="secondary"
              style={{ fontSize: '12px', padding: '6px 14px' }}
              onClick={() => onDismiss(alarm.id)}
            >
              {lang === 'ar' ? 'إغلاق التنبيه' : 'Dismiss'}
            </Button>
            {onSnooze && (
              <Button
                variant="secondary"
                style={{ fontSize: '12px', padding: '6px 12px' }}
                onClick={() => onSnooze(alarm.id, 15)}
              >
                <Clock size={13} data-icon="inline-start" /> {lang === 'ar' ? 'تأجيل 15 د' : 'Snooze 15m'}
              </Button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {(details.doctorId || alarm.doctorId) && onNavigateToCustomer && (
              <Button
                variant="secondary"
                style={{ fontSize: '12px', padding: '6px 12px' }}
                onClick={() => {
                  onNavigateToCustomer(details.doctorId || alarm.doctorId!)
                  onClose()
                }}
              >
                {lang === 'ar' ? 'ملف الطبيب' : 'Doctor Profile'}
              </Button>
            )}
            {onNavigateToCalendar && (
              <Button
                variant="primary"
                style={{ fontSize: '12px', padding: '6px 14px' }}
                onClick={() => {
                  onNavigateToCalendar()
                  onClose()
                }}
              >
                <CalendarDays size={13} data-icon="inline-start" /> {lang === 'ar' ? 'عرض بالتقويم' : 'View Calendar'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
