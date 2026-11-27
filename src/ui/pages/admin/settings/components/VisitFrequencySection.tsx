'use client'

import { useState } from 'react'
import { Target, ShieldAlert, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/ui/design-system/components/Button'
import { useT } from '@/lib/i18n'
import { useStore } from '@/data/mock/store'
import {
  visitFrequencyStore,
  updateVisitFrequencyPolicy,
  DEFAULT_VISIT_FREQUENCY_POLICY,
  type VisitFrequencyPolicy,
  type CustomerClass,
} from '@/data/mock/visitFrequency'

export interface VisitFrequencySectionProps {
  role?: 'admin' | 'rep'
  currentUserName?: string
  onAction?: (msg: string) => void
}

export function VisitFrequencySection({
  role = 'admin',
  currentUserName = 'Alex Morgan',
  onAction,
}: VisitFrequencySectionProps) {
  const { t, lang } = useT()
  const activePolicy = useStore(visitFrequencyStore)

  // Local form state initialized from active policy
  const [classAVisits, setClassAVisits] = useState(String(activePolicy.A.targetVisits))
  const [classAPeriod, setClassAPeriod] = useState(String(activePolicy.A.periodMonths))

  const [classBVisits, setClassBVisits] = useState(String(activePolicy.B.targetVisits))
  const [classBPeriod, setClassBPeriod] = useState(String(activePolicy.B.periodMonths))

  const [classCVisits, setClassCVisits] = useState(String(activePolicy.C.targetVisits))
  const [classCPeriod, setClassCPeriod] = useState(String(activePolicy.C.periodMonths))

  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Permission check: only authorized administrators may change business configuration
  const canEdit = role === 'admin'

  const handleSave = () => {
    setErrorMsg(null)
    setSuccessMsg(null)

    if (!canEdit) {
      setErrorMsg(
        lang === 'ar'
          ? 'غير مصرح: المشرفون المعتمدون فقط يمكنهم تعديل سياسة تكرار الزيارات.'
          : 'Unauthorized: Only authorized administrators can update visit frequency policies.'
      )
      return
    }

    const aV = Number(classAVisits)
    const aP = Number(classAPeriod)
    const bV = Number(classBVisits)
    const bP = Number(classBPeriod)
    const cV = Number(classCVisits)
    const cP = Number(classCPeriod)

    // Validation: positive whole numbers
    if (!Number.isInteger(aV) || aV <= 0 || !Number.isInteger(bV) || bV <= 0 || !Number.isInteger(cV) || cV <= 0) {
      setErrorMsg(
        lang === 'ar'
          ? 'مستهدفات الزيارات يجب أن تكون أعداداً صحيحة موجبة (أكبر من صفر).'
          : 'Visit targets must be positive whole numbers greater than zero.'
      )
      return
    }

    if (!Number.isInteger(aP) || aP <= 0 || !Number.isInteger(bP) || bP <= 0 || !Number.isInteger(cP) || cP <= 0) {
      setErrorMsg(
        lang === 'ar'
          ? 'فترات الاستهداف يجب أن تكون أشهراً صحيحة وموجبة.'
          : 'Target periods must be valid positive numbers of calendar months.'
      )
      return
    }

    try {
      const newPolicy: VisitFrequencyPolicy = {
        A: { customerClass: 'A', targetVisits: aV, periodMonths: aP },
        B: { customerClass: 'B', targetVisits: bV, periodMonths: bP },
        C: { customerClass: 'C', targetVisits: cV, periodMonths: cP },
      }

      updateVisitFrequencyPolicy(newPolicy, currentUserName)
      const msg = lang === 'ar' ? 'تم حفظ وتفعيل سياسة تكرار الزيارات بنجاح' : 'Visit frequency policy updated successfully'
      setSuccessMsg(msg)
      onAction?.(msg)
    } catch (err) {
      setErrorMsg((err as Error).message)
    }
  }

  const handleResetDefaults = () => {
    if (!canEdit) return
    const confirmed = window.confirm(
      lang === 'ar'
        ? 'هل أنت متأكد من استعادة الإعدادات الافتراضية للنظام؟'
        : 'Are you sure you want to reset visit targets to default business rules?'
    )
    if (!confirmed) return

    updateVisitFrequencyPolicy(DEFAULT_VISIT_FREQUENCY_POLICY, currentUserName)
    setClassAVisits(String(DEFAULT_VISIT_FREQUENCY_POLICY.A.targetVisits))
    setClassAPeriod(String(DEFAULT_VISIT_FREQUENCY_POLICY.A.periodMonths))
    setClassBVisits(String(DEFAULT_VISIT_FREQUENCY_POLICY.B.targetVisits))
    setClassBPeriod(String(DEFAULT_VISIT_FREQUENCY_POLICY.B.periodMonths))
    setClassCVisits(String(DEFAULT_VISIT_FREQUENCY_POLICY.C.targetVisits))
    setClassCPeriod(String(DEFAULT_VISIT_FREQUENCY_POLICY.C.periodMonths))
    setErrorMsg(null)
    setSuccessMsg(lang === 'ar' ? 'تمت استعادة الإعدادات الافتراضية بنجاح' : 'Reset to default policy successfully')
  }

  const periodOptions = [
    { value: 1, labelEn: 'Per calendar month (1 month)', labelAr: 'شهرياً (كل شهر تقويمي)' },
    { value: 2, labelEn: 'Every 2 calendar months', labelAr: 'كل شهرين تقويميين' },
    { value: 3, labelEn: 'Every 3 calendar months (Quarterly)', labelAr: 'كل 3 أشهر (ربع سنوي)' },
    { value: 6, labelEn: 'Every 6 calendar months (Semi-annually)', labelAr: 'كل 6 أشهر (نصف سنوي)' },
    { value: 12, labelEn: 'Every 12 calendar months (Annually)', labelAr: 'كل 12 شهراً (سنوي)' },
  ]

  const inputStyle = {
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid var(--border-soft)',
    background: 'var(--surface)',
    color: 'var(--heading-text)',
    fontSize: '13px',
    width: '100%',
    boxSizing: 'border-box' as const,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '800px' }}>
      {/* Intro Header */}
      <div>
        <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 6px', color: 'var(--heading-text)' }}>
          {lang === 'ar' ? 'سياسة تكرار وأهداف الزيارات' : 'Visit Frequency & Monthly Targets'}
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--muted-text)', margin: 0, lineHeight: 1.5 }}>
          {lang === 'ar'
            ? 'تحديد عدد الزيارات المطلوبة لكل تصنيف من العملاء وفترة الاستهداف. يتم تطبيق هذه السياسة كمرجع موحد في لوحة التحكم وتخطيط الزيارات.'
            : 'Configure required visit targets by customer classification and target period. This serves as the single source of truth for Dashboard coverage and Visit Plan validation.'}
        </p>
      </div>

      {/* Permission Warning if not Admin */}
      {!canEdit && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 16px',
            borderRadius: '10px',
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            color: 'var(--rose-text, #ef4444)',
            fontSize: '13px',
          }}
        >
          <ShieldAlert size={18} />
          <span>
            {lang === 'ar'
              ? 'تعديل سياسة تكرار الزيارات مقصور على المشرفين المصرح لهم فقط.'
              : 'Modifying visit frequency policies is restricted to authorized administrators.'}
          </span>
        </div>
      )}

      {/* Error / Success Feedback */}
      {errorMsg && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 14px',
            borderRadius: '8px',
            background: 'rgba(239, 68, 68, 0.1)',
            color: 'var(--rose-text, #ef4444)',
            fontSize: '13px',
          }}
        >
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 14px',
            borderRadius: '8px',
            background: 'rgba(16, 185, 129, 0.1)',
            color: 'var(--green-text, #16a34a)',
            fontSize: '13px',
          }}
        >
          <CheckCircle2 size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Active Configuration Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
        {/* Class A */}
        <div
          style={{
            padding: '16px',
            borderRadius: '12px',
            border: '1.5px solid rgba(37, 99, 235, 0.25)',
            background: 'var(--surface)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong style={{ fontSize: '15px', color: 'var(--ocean)' }}>
              {lang === 'ar' ? 'تصنيف A (أعلى أولوية)' : 'Class A (Highest Priority)'}
            </strong>
            <span
              style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '8px',
                background: 'rgba(37, 99, 235, 0.1)',
                color: 'var(--ocean)',
                fontWeight: 700,
              }}
            >
              Active: {activePolicy.A.targetVisits} / {activePolicy.A.periodMonths}m
            </span>
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted-text)', display: 'block', marginBottom: '4px' }}>
              {lang === 'ar' ? 'عدد الزيارات المستهدفة *' : 'Target Visits *'}
            </label>
            <input
              type="number"
              min="1"
              step="1"
              disabled={!canEdit}
              style={inputStyle}
              value={classAVisits}
              onChange={(e) => setClassAVisits(e.target.value)}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted-text)', display: 'block', marginBottom: '4px' }}>
              {lang === 'ar' ? 'فترة الاستهداف *' : 'Target Period *'}
            </label>
            <select
              disabled={!canEdit}
              style={inputStyle}
              value={classAPeriod}
              onChange={(e) => setClassAPeriod(e.target.value)}
            >
              {periodOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {lang === 'ar' ? opt.labelAr : opt.labelEn}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Class B */}
        <div
          style={{
            padding: '16px',
            borderRadius: '12px',
            border: '1.5px solid rgba(245, 158, 11, 0.25)',
            background: 'var(--surface)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong style={{ fontSize: '15px', color: '#d97706' }}>
              {lang === 'ar' ? 'تصنيف B (أولوية متوسطة)' : 'Class B (Medium Priority)'}
            </strong>
            <span
              style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '8px',
                background: 'rgba(245, 158, 11, 0.1)',
                color: '#d97706',
                fontWeight: 700,
              }}
            >
              Active: {activePolicy.B.targetVisits} / {activePolicy.B.periodMonths}m
            </span>
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted-text)', display: 'block', marginBottom: '4px' }}>
              {lang === 'ar' ? 'عدد الزيارات المستهدفة *' : 'Target Visits *'}
            </label>
            <input
              type="number"
              min="1"
              step="1"
              disabled={!canEdit}
              style={inputStyle}
              value={classBVisits}
              onChange={(e) => setClassBVisits(e.target.value)}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted-text)', display: 'block', marginBottom: '4px' }}>
              {lang === 'ar' ? 'فترة الاستهداف *' : 'Target Period *'}
            </label>
            <select
              disabled={!canEdit}
              style={inputStyle}
              value={classBPeriod}
              onChange={(e) => setClassBPeriod(e.target.value)}
            >
              {periodOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {lang === 'ar' ? opt.labelAr : opt.labelEn}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Class C */}
        <div
          style={{
            padding: '16px',
            borderRadius: '12px',
            border: '1.5px solid rgba(16, 185, 129, 0.25)',
            background: 'var(--surface)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong style={{ fontSize: '15px', color: '#059669' }}>
              {lang === 'ar' ? 'تصنيف C (عادي)' : 'Class C (Standard)'}
            </strong>
            <span
              style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '8px',
                background: 'rgba(16, 185, 129, 0.1)',
                color: '#059669',
                fontWeight: 700,
              }}
            >
              Active: {activePolicy.C.targetVisits} / {activePolicy.C.periodMonths}m
            </span>
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted-text)', display: 'block', marginBottom: '4px' }}>
              {lang === 'ar' ? 'عدد الزيارات المستهدفة *' : 'Target Visits *'}
            </label>
            <input
              type="number"
              min="1"
              step="1"
              disabled={!canEdit}
              style={inputStyle}
              value={classCVisits}
              onChange={(e) => setClassCVisits(e.target.value)}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted-text)', display: 'block', marginBottom: '4px' }}>
              {lang === 'ar' ? 'فترة الاستهداف *' : 'Target Period *'}
            </label>
            <select
              disabled={!canEdit}
              style={inputStyle}
              value={classCPeriod}
              onChange={(e) => setClassCPeriod(e.target.value)}
            >
              {periodOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {lang === 'ar' ? opt.labelAr : opt.labelEn}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Actions */}
      {canEdit && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
          <Button variant="secondary" onClick={handleResetDefaults} style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <RefreshCw size={13} />
            {lang === 'ar' ? 'استعادة الإعدادات الافتراضية' : 'Reset to Defaults'}
          </Button>

          <Button variant="primary" onClick={handleSave}>
            {lang === 'ar' ? 'حفظ وتفعيل السياسة' : 'Save & Apply Policy'}
          </Button>
        </div>
      )}
    </div>
  )
}
