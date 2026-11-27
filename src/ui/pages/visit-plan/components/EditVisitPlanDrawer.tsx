import { useState } from 'react'
import { AlertTriangle, CheckCircle2, Send, Info, Calendar, Plus, Trash2 } from 'lucide-react'
import { Drawer } from '@/ui/design-system/components/Drawer'
import { Button } from '@/ui/design-system/components/Button'
import { FieldError } from '@/ui/design-system/components/FieldError'
import { useT } from '@/lib/i18n'
import { useStore } from '@/data/mock/store'
import { customersStore, type Customer } from '@/data/mock/customers'
import { productsStore } from '@/data/mock/products'
import { usersStore } from '@/data/mock/users'
import { ALL_MOCK_REPS } from '@/ui/design-system/components/RecordFormDrawer'
import {
  addVisitPlan,
  updateVisitPlan,
  submitVisitPlanForApproval,
  type VisitPlan,
  type VisitPlanStop,
  type VisitPlanStatus,
  type VisitFrequency,
} from '@/data/mock/visit-plans'
import type { UserRole } from '@/lib/auth/types'
import {
  validateVisitPlan,
  getCustomerVisitStats,
  type CustomerValidationFeedback,
} from '@/data/mock/visitFrequency'

export interface EditVisitPlanDrawerProps {
  plan: VisitPlan | null
  isOpen: boolean
  onClose: () => void
  onSaved: (plan: VisitPlan) => void
  currentUserName?: string
  currentUserId?: string
  role?: UserRole | string
}

export function EditVisitPlanDrawer({
  plan,
  isOpen,
  onClose,
  onSaved,
  currentUserName = 'Alex Morgan',
  currentUserId,
  role = 'rep',
}: EditVisitPlanDrawerProps) {
  const { t, lang } = useT()
  const customers = useStore(customersStore).filter((c) => !c.deleted_at && c.active !== false)
  const products = useStore(productsStore)

  if (!isOpen) return null

  return (
    <EditVisitPlanDrawerInner
      plan={plan}
      onClose={onClose}
      onSaved={onSaved}
      customers={customers}
      products={products}
      currentUserName={currentUserName}
      currentUserId={currentUserId}
      role={role}
      lang={lang}
    />
  )
}

function getDefaultDates() {
  const start = new Date()
  const end = new Date()
  end.setDate(end.getDate() + 30)
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  }
}

function EditVisitPlanDrawerInner({
  plan,
  onClose,
  onSaved,
  customers,
  products,
  currentUserName,
  currentUserId,
  role,
  lang,
}: {
  plan: VisitPlan | null
  onClose: () => void
  onSaved: (p: VisitPlan) => void
  customers: Customer[]
  products: any[]
  currentUserName: string
  currentUserId?: string
  role: UserRole | string
  lang: 'en' | 'ar'
}) {
  const isCreate = !plan
  const isRepLocked = role !== 'admin'
  const defaultDates = getDefaultDates()

  const [name, setName] = useState(plan ? plan.name : '')
  const [repName, setRepName] = useState(
    plan ? plan.repName : (isRepLocked ? currentUserName : (ALL_MOCK_REPS[0]?.name || currentUserName))
  )
  const [startDate, setStartDate] = useState(plan ? plan.startDate : defaultDates.start)
  const [endDate, setEndDate] = useState(plan ? plan.endDate : defaultDates.end)
  const [frequency, setFrequency] = useState<VisitFrequency>(plan ? plan.frequency : 'Monthly')
  const [status, setStatus] = useState<VisitPlanStatus>(plan ? plan.status : 'Draft')
  const [targetClients, setTargetClients] = useState<string[]>(plan?.targetClients || [])
  const [plannedProducts, setPlannedProducts] = useState<string[]>(plan?.plannedProducts || [])
  const [stops, setStops] = useState<VisitPlanStop[]>(plan?.stops || [])
  const [notes, setNotes] = useState(plan?.notes || '')

  // Target planned visits per customer
  const [clientVisitCounts, setClientVisitCounts] = useState<Record<string, number>>(() => {
    if (plan?.clientVisitCounts) return { ...plan.clientVisitCounts }
    const initial: Record<string, number> = {}
    if (plan?.targetClients) {
      plan.targetClients.forEach((cName) => {
        const stats = getCustomerVisitStats(cName, plan.startDate)
        initial[cName] = stats ? Math.max(1, stats.remainingRequired) : 1
      })
    }
    return initial
  })

  const [error, setError] = useState<string | null>(null)
  const [validationFeedbacks, setValidationFeedbacks] = useState<CustomerValidationFeedback[] | null>(null)
  const [saving, setSaving] = useState(false)

  const handleToggleClient = (client: Customer) => {
    const cKey = client.name
    setTargetClients((prev) => {
      const isSelected = prev.includes(cKey)
      if (isSelected) {
        setStops((currStops) => currStops.filter((s) => s.clientName !== cKey))
        return prev.filter((c) => c !== cKey)
      } else {
        // Automatically default planned visits to remaining required visits for customer
        if (!clientVisitCounts[client.id || cKey]) {
          const stats = getCustomerVisitStats(client.id || cKey, startDate)
          const needed = stats ? Math.max(1, stats.remainingRequired) : 1
          setClientVisitCounts((curr) => ({ ...curr, [client.id || cKey]: needed, [cKey]: needed }))
        }
        // Auto-create an editable scheduled stop for this client so stops have real date & time
        setStops((currStops) => {
          if (currStops.some((s) => s.clientName === cKey)) return currStops
          return [
            ...currStops,
            {
              id: `stop-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              clientName: cKey,
              clientId: client.id,
              address: client.address || client.region || 'Clinic',
              priority: client.classification || 'Class A',
              purpose: 'Clinical detailing & follow-up',
              plannedTime: '10:00 AM',
              plannedDate: startDate,
            },
          ]
        })
        return [...prev, cKey]
      }
    })
    setValidationFeedbacks(null)
    setError(null)
  }

  const handleUpdateStop = (stopId: string, patch: Partial<VisitPlanStop>) => {
    setStops((prev) => prev.map((s) => (s.id === stopId ? { ...s, ...patch } : s)))
    setError(null)
  }

  const handleAddStop = () => {
    const firstClientName = targetClients[0]
    const matchedClient = customers.find((c) => c.name === firstClientName) || customers[0]
    if (!matchedClient) return
    setStops((prev) => [
      ...prev,
      {
        id: `stop-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        clientName: matchedClient.name,
        clientId: matchedClient.id,
        address: matchedClient.address || matchedClient.region || 'Clinic',
        priority: matchedClient.classification || 'Class A',
        purpose: 'Scheduled visit',
        plannedTime: '11:00 AM',
        plannedDate: startDate,
      },
    ])
    if (!targetClients.includes(matchedClient.name)) {
      setTargetClients((prev) => [...prev, matchedClient.name])
    }
  }

  const handleRemoveStop = (stopId: string) => {
    setStops((prev) => prev.filter((s) => s.id !== stopId))
  }

  const handleToggleProduct = (productName: string) => {
    setPlannedProducts((prev) =>
      prev.includes(productName) ? prev.filter((p) => p !== productName) : [...prev, productName]
    )
  }

  const handleVisitCountChange = (clientKey: string, count: number) => {
    setClientVisitCounts((prev) => ({
      ...prev,
      [clientKey]: Math.max(1, count),
    }))
    setValidationFeedbacks(null)
    setError(null)
  }

  const validateBasicForm = (): boolean => {
    if (!name.trim()) {
      setError(lang === 'ar' ? 'اسم الخطة مطلوب' : 'Plan name is required')
      return false
    }
    if (!startDate || !endDate) {
      setError(lang === 'ar' ? 'التواريخ مطلوبة' : 'Start and end dates are required')
      return false
    }
    if (startDate > endDate) {
      setError(lang === 'ar' ? 'تاريخ البدء يجب أن يسبق تاريخ الانتهاء' : 'Start date must be before end date')
      return false
    }
    if (targetClients.length === 0) {
      setError(lang === 'ar' ? 'يرجى اختيار عميل واحد على الأقل في الخطة' : 'Please select at least one target customer for the plan')
      return false
    }
    return true
  }

  const resolveCreatorIdentity = () => {
    if (isRepLocked) {
      return {
        repName: currentUserName,
        repId: currentUserId || usersStore.get().find((u) => u.name === currentUserName)?.id || 'rep-1',
      }
    }
    const fromUsers = usersStore.get().find((u) => u.name === repName)
    const fromMock = ALL_MOCK_REPS.find((r) => r.name === repName)
    return {
      repName,
      repId: fromUsers?.id || fromMock?.id || plan?.repId || 'rep-1',
    }
  }

  const handleSaveDraft = () => {
    if (!validateBasicForm()) return
    setSaving(true)
    setError(null)
    setValidationFeedbacks(null)

    try {
      const creator = resolveCreatorIdentity()
      if (isCreate) {
        const created = addVisitPlan({
          name: name.trim(),
          repName: creator.repName,
          repId: creator.repId,
          createdBy: creator.repId,
          startDate,
          endDate,
          frequency,
          status: 'Draft',
          targetClients,
          plannedProducts,
          stops,
          notes: notes.trim(),
          clientVisitCounts,
        })
        onSaved(created)
      } else {
        // Do NOT allow Save as Draft to silently bypass required reapproval on Approved/Active plans
        const shouldKeepDraft = plan.status === 'Draft' || plan.status === 'Rejected'
        const updated = updateVisitPlan(
          plan.id,
          {
            name: name.trim(),
            repName: creator.repName,
            repId: creator.repId,
            startDate,
            endDate,
            frequency,
            ...(shouldKeepDraft ? { status: 'Draft' as VisitPlanStatus } : {}),
            targetClients,
            plannedProducts,
            stops,
            notes: notes.trim(),
            clientVisitCounts,
          },
          { id: currentUserId || creator.repId, name: currentUserName, role: String(role) }
        )
        onSaved(updated)
      }
      onClose()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const handleSubmitForApproval = () => {
    if (!validateBasicForm()) return

    if (stops.length === 0) {
      setError(
        lang === 'ar'
          ? 'يجب إضافة موعد زيارة مجدول واحد على الأقل (التاريخ والوقت) قبل إرسال الخطة.'
          : 'At least one scheduled stop with date and time is required before submitting the plan.'
      )
      return
    }

    const missingSchedule = stops.find((s) => !s.plannedDate || !s.plannedTime?.trim())
    if (missingSchedule) {
      setError(
        lang === 'ar'
          ? `يرجى تحديد التاريخ والوقت للزيارة المجدولة للعميل ${missingSchedule.clientName}.`
          : `Please specify planned date and time for scheduled stop (${missingSchedule.clientName}).`
      )
      return
    }

    // Step 2: Validate the plan using configurable visit-frequency rules
    const validation = validateVisitPlan({
      id: plan?.id ?? '',
      startDate,
      endDate,
      targetClients,
      clientVisitCounts,
      stops,
    })

    if (!validation.isValid) {
      // Step 3: Block submission and display clear, actionable validation messages
      setValidationFeedbacks(validation.feedbacks)
      setError(
        lang === 'ar'
          ? validation.summaryMessageAr || 'فشل التحقق من أهداف الزيارات'
          : validation.summaryMessageEn || 'Plan validation failed against visit frequency targets.'
      )
      return
    }

    setSaving(true)
    setError(null)
    setValidationFeedbacks(null)

    try {
      const creator = resolveCreatorIdentity()
      let planToSubmit: VisitPlan

      if (isCreate) {
        planToSubmit = addVisitPlan({
          name: name.trim(),
          repName: creator.repName,
          repId: creator.repId,
          createdBy: creator.repId,
          startDate,
          endDate,
          frequency,
          status: 'Draft', // initial prior to submit
          targetClients,
          plannedProducts,
          stops,
          notes: notes.trim(),
          clientVisitCounts,
        })
      } else {
        planToSubmit = updateVisitPlan(
          plan.id,
          {
            name: name.trim(),
            repName: creator.repName,
            repId: creator.repId,
            startDate,
            endDate,
            frequency,
            targetClients,
            plannedProducts,
            stops,
            notes: notes.trim(),
            clientVisitCounts,
          },
          { id: currentUserId || creator.repId, name: currentUserName, role: String(role) }
        )
      }

      // Submit for direct manager approval
      const submitted = submitVisitPlanForApproval(planToSubmit.id, {
        id: currentUserId || creator.repId,
        name: currentUserName,
        role: String(role),
      })
      onSaved(submitted)
      onClose()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const inputStyle = {
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid var(--border-soft)',
    background: 'var(--surface-raised)',
    color: 'var(--heading-text)',
    fontSize: '13px',
    width: '100%',
    boxSizing: 'border-box' as const,
  }

  const labelStyle = {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--muted-text)',
  }

  const drawerTitle = isCreate
    ? (lang === 'ar' ? 'إعداد خطة زيارات جديدة' : 'Prepare New Visit Plan')
    : (lang === 'ar' ? `تعديل الخطة: ${plan?.name || plan?.id}` : `Edit Plan: ${plan?.name || plan?.id}`)

  const drawerKicker = isCreate ? 'NEW VISIT PLAN' : (plan?.id || 'VISIT PLAN')

  return (
    <Drawer title={drawerTitle} kicker={drawerKicker} onClose={onClose}>
      <div style={{ padding: '0 24px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* Rejection Notice Banner */}
        {plan?.status === 'Rejected' && plan.rejectionReason && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1.5px solid rgba(239, 68, 68, 0.3)',
              color: 'var(--rose-text, #ef4444)',
              fontSize: '13px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
              <AlertTriangle size={16} />
              <span>{lang === 'ar' ? 'تم رفض الخطة سابقاً من قبل المدير' : 'Plan Previously Rejected by Manager'}</span>
            </div>
            <div>
              <strong>{lang === 'ar' ? 'سبب الرفض: ' : 'Reason: '}</strong>
              {plan.rejectionReason}
            </div>
          </div>
        )}

        {/* Current Approval Status Notice */}
        {plan?.status === 'Pending Approval' && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '8px',
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              color: '#d97706',
              fontSize: '12.5px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Info size={16} />
            <span>
              {lang === 'ar'
                ? 'الخطة قيد انتظار اعتماد المدير. أي تعديلات جوهرية ستتطلب إعادة الاعتماد.'
                : 'Plan is currently Pending Manager Approval. Material modifications will require re-approval.'}
            </span>
          </div>
        )}

        {error && <FieldError message={error} />}

        {/* Detailed Actionable Validation Feedback */}
        {validationFeedbacks && validationFeedbacks.some((f) => f.status !== 'valid') && (
          <div
            style={{
              padding: '14px',
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1.5px solid rgba(239, 68, 68, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--rose-text, #ef4444)', fontWeight: 700, fontSize: '13.5px' }}>
              <AlertTriangle size={18} />
              <span>
                {lang === 'ar'
                  ? 'تم حظر الإرسال: توجد مخالفات لسياسة تكرار الزيارات'
                  : 'Submission Blocked: Visit Frequency Policy Violations'}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {validationFeedbacks
                .filter((f) => f.status !== 'valid')
                .map((f) => (
                  <div
                    key={f.customerId}
                    style={{
                      fontSize: '12px',
                      background: 'var(--surface)',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-soft)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ color: 'var(--heading-text)', fontSize: '13px' }}>
                        {f.customerName}
                      </strong>
                      <span
                        style={{
                          fontSize: '11px',
                          padding: '1px 6px',
                          borderRadius: '6px',
                          background: 'rgba(2, 132, 199, 0.1)',
                          color: 'var(--ocean)',
                          fontWeight: 700,
                        }}
                      >
                        {f.customerClassification} · ID: {f.customerId}
                      </span>
                    </div>

                    <div style={{ fontSize: '11.5px', color: 'var(--muted-text)', lineHeight: 1.4 }}>
                      <div>
                        <strong>{lang === 'ar' ? 'فترة الاستهداف والمستهدف: ' : 'Target Period & Required: '}</strong>
                        {f.requiredVisits} {lang === 'ar' ? 'زيارة' : 'visit(s)'} ({f.targetPeriod})
                      </div>
                      <div>
                        <strong>{lang === 'ar' ? 'المكتمل: ' : 'Completed: '}</strong>{f.completedVisits} ·{' '}
                        <strong>{lang === 'ar' ? 'المجدول سابقاً: ' : 'Already Scheduled: '}</strong>{f.alreadyScheduledVisits} ·{' '}
                        <strong>{lang === 'ar' ? 'بالخطة الحالية: ' : 'In Plan: '}</strong>{f.currentPlanVisits}
                      </div>
                    </div>

                    <div style={{ color: 'var(--rose-text, #ef4444)', fontWeight: 600, marginTop: '2px' }}>
                      {lang === 'ar' ? f.messageAr : f.messageEn}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Plan Name */}
        <label style={labelStyle}>
          {lang === 'ar' ? 'اسم الخطة' : 'Plan Name'} *
          <input
            style={inputStyle}
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              setError(null)
            }}
          />
        </label>

        {/* Assigned Rep */}
        <label style={labelStyle}>
          {lang === 'ar' ? 'المندوب / منشئ الخطة' : 'Plan Owner / Representative'}
          {isRepLocked ? (
            <input
              type="text"
              readOnly
              value={repName}
              style={{ ...inputStyle, opacity: 0.8, cursor: 'not-allowed' }}
            />
          ) : (
            <select style={inputStyle} value={repName} onChange={(e) => setRepName(e.target.value)}>
              {ALL_MOCK_REPS.map((r) => (
                <option key={r.id} value={r.name}>
                  {r.name} ({r.region})
                </option>
              ))}
              {!ALL_MOCK_REPS.some((r) => r.name === repName) && (
                <option value={repName}>{repName}</option>
              )}
            </select>
          )}
        </label>

        {/* Date Range */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <label style={labelStyle}>
            {lang === 'ar' ? 'تاريخ البدء' : 'Start Date'} *
            <input
              type="date"
              style={inputStyle}
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value)
                setValidationFeedbacks(null)
              }}
            />
          </label>
          <label style={labelStyle}>
            {lang === 'ar' ? 'تاريخ الانتهاء' : 'End Date'} *
            <input
              type="date"
              style={inputStyle}
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value)
                setValidationFeedbacks(null)
              }}
            />
          </label>
        </div>

        {/* Frequency & Status Info */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <label style={labelStyle}>
            {lang === 'ar' ? 'دورية الخطة' : 'Plan Frequency'}
            <select
              style={inputStyle}
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as VisitFrequency)}
            >
              <option value="Daily">{lang === 'ar' ? 'يومي' : 'Daily'}</option>
              <option value="Weekly">{lang === 'ar' ? 'أسبوعي' : 'Weekly'}</option>
              <option value="Bi-weekly">{lang === 'ar' ? 'كل أسبوعين' : 'Bi-weekly'}</option>
              <option value="Monthly">{lang === 'ar' ? 'شهري' : 'Monthly'}</option>
            </select>
          </label>

          <label style={labelStyle}>
            {lang === 'ar' ? 'حالة الاعتماد' : 'Approval Status'}
            <div
              style={{
                ...inputStyle,
                display: 'flex',
                alignItems: 'center',
                fontWeight: 600,
                background: 'var(--surface)',
                color:
                  status === 'Approved' || status === 'Active'
                    ? '#16a34a'
                    : status === 'Rejected'
                    ? '#ef4444'
                    : status === 'Pending Approval'
                    ? '#d97706'
                    : 'var(--muted-text)',
              }}
            >
              {status === 'Pending Approval'
                ? (lang === 'ar' ? 'قيد انتظار الاعتماد' : 'Pending Approval')
                : status === 'Approved'
                ? (lang === 'ar' ? 'معتمدة' : 'Approved')
                : status === 'Rejected'
                ? (lang === 'ar' ? 'مرفوضة' : 'Rejected')
                : status === 'Active'
                ? (lang === 'ar' ? 'نشطة' : 'Active')
                : (lang === 'ar' ? 'مسودة' : 'Draft')}
            </div>
          </label>
        </div>

        {/* Target Customers and Configured Visit Targets */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={labelStyle}>
              {lang === 'ar' ? 'العملاء المستهدفون وحساب الزيارات' : 'Target Customers & Visit Allocation'} ({targetClients.length})
            </span>
            <span style={{ fontSize: '11px', color: 'var(--muted-text)' }}>
              {lang === 'ar' ? 'يتم احتساب المستهدف آلياً' : 'Auto-calculated per policy'}
            </span>
          </div>

          <div
            style={{
              maxHeight: '180px',
              overflowY: 'auto',
              border: '1px solid var(--border-soft)',
              borderRadius: '8px',
              padding: '8px 10px',
              background: 'var(--surface-raised)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            {customers.map((c) => {
              const isSelected = targetClients.includes(c.name)
              const cKey = c.id || c.name
              const stats = getCustomerVisitStats(cKey, startDate)
              const rawClass = c.classification?.replace('Class ', '').trim() || 'A'
              const plannedCount = clientVisitCounts[cKey] ?? (stats ? Math.max(1, stats.remainingRequired) : 1)

              return (
                <div
                  key={c.id || c.name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 8px',
                    borderRadius: '6px',
                    background: isSelected ? 'var(--surface)' : 'transparent',
                    border: isSelected ? '1px solid var(--border-soft)' : '1px solid transparent',
                  }}
                >
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      flex: 1,
                      color: isSelected ? 'var(--heading-text)' : 'var(--muted-text)',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleClient(c)}
                    />
                    <div>
                      <div style={{ fontWeight: 600 }}>
                        {c.name} <span style={{ opacity: 0.6, fontSize: '11px' }}>({c.specialty})</span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--muted-text)' }}>
                        Class {rawClass} · {stats ? `${stats.targetVisits} target (${stats.completedVisits} done, ${stats.alreadyScheduledVisits} sched)` : ''}
                      </div>
                    </div>
                  </label>

                  {isSelected && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--muted-text)', whiteSpace: 'nowrap' }}>
                        {lang === 'ar' ? 'بالخطة:' : 'Plan:'}
                      </span>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={plannedCount}
                        onChange={(e) => handleVisitCountChange(cKey, parseInt(e.target.value, 10) || 1)}
                        style={{
                          width: '48px',
                          height: '28px',
                          textAlign: 'center',
                          borderRadius: '6px',
                          border: '1px solid var(--border-soft)',
                          background: 'var(--surface)',
                          fontSize: '12px',
                          fontWeight: 700,
                          color: 'var(--heading-text)',
                        }}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Scheduled Stops (Date & Time for Calendar Integration) */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={labelStyle}>
              {lang === 'ar' ? 'المواعيد المجدولة للزيارات' : 'Scheduled Stops (Date & Time)'} ({stops.length}) *
            </span>
            <Button
              variant="secondary"
              type="button"
              onClick={handleAddStop}
              style={{ height: '26px', fontSize: '11px', padding: '0 8px' }}
            >
              <Plus size={12} style={{ marginInlineEnd: '4px' }} />
              {lang === 'ar' ? 'إضافة موعد' : 'Add Stop'}
            </Button>
          </div>
          <div
            style={{
              maxHeight: '190px',
              overflowY: 'auto',
              border: '1px solid var(--border-soft)',
              borderRadius: '8px',
              padding: '8px',
              background: 'var(--surface-raised)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            {stops.length === 0 ? (
              <span style={{ fontSize: '11.5px', color: 'var(--muted-text)', textAlign: 'center', padding: '8px' }}>
                {lang === 'ar'
                  ? 'اختر عميلاً أو اضغط "إضافة موعد" لتحديد تاريخ ووقت الزيارة.'
                  : 'Select a target customer or click "Add Stop" to schedule visit date & time.'}
              </span>
            ) : (
              stops.map((stop) => (
                <div
                  key={stop.id}
                  style={{
                    padding: '8px',
                    borderRadius: '6px',
                    background: 'var(--surface)',
                    border: '1px solid var(--border-soft)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
                    <select
                      value={stop.clientName}
                      onChange={(e) => {
                        const c = customers.find((x) => x.name === e.target.value)
                        handleUpdateStop(stop.id, {
                          clientName: e.target.value,
                          clientId: c?.id,
                          address: c?.address || c?.region || 'Clinic',
                        })
                      }}
                      style={{ ...inputStyle, padding: '4px 8px', fontSize: '12px', flex: 1 }}
                    >
                      {customers.map((c) => (
                        <option key={c.id || c.name} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => handleRemoveStop(stop.id)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--rose-text, #ef4444)', cursor: 'pointer', padding: '4px' }}
                      aria-label="Remove stop"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px', gap: '6px' }}>
                    <input
                      type="date"
                      value={stop.plannedDate || startDate}
                      onChange={(e) => handleUpdateStop(stop.id, { plannedDate: e.target.value })}
                      style={{ ...inputStyle, padding: '4px 8px', fontSize: '11.5px' }}
                    />
                    <input
                      type="text"
                      value={stop.plannedTime}
                      placeholder="10:00 AM"
                      onChange={(e) => handleUpdateStop(stop.id, { plannedTime: e.target.value })}
                      style={{ ...inputStyle, padding: '4px 8px', fontSize: '11.5px' }}
                    />
                  </div>
                  <input
                    type="text"
                    value={stop.purpose}
                    placeholder={lang === 'ar' ? 'هدف الزيارة...' : 'Visit purpose...'}
                    onChange={(e) => handleUpdateStop(stop.id, { purpose: e.target.value })}
                    style={{ ...inputStyle, padding: '4px 8px', fontSize: '11.5px' }}
                  />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Planned Products */}
        <div>
          <span style={{ ...labelStyle, marginBottom: '6px' }}>
            {lang === 'ar' ? 'المنتجات والحملات المخططة' : 'Planned Products / Campaigns'} ({plannedProducts.length})
          </span>
          <div
            style={{
              maxHeight: '110px',
              overflowY: 'auto',
              border: '1px solid var(--border-soft)',
              borderRadius: '8px',
              padding: '6px 10px',
              background: 'var(--surface-raised)',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            {products.map((p) => {
              const isSelected = plannedProducts.includes(p.name)
              return (
                <label
                  key={p.code || p.name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    color: isSelected ? 'var(--heading-text)' : 'var(--muted-text)',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleToggleProduct(p.name)}
                  />
                  <span>{p.name}</span>
                </label>
              )
            })}
          </div>
        </div>

        {/* Notes */}
        <label style={labelStyle}>
          {lang === 'ar' ? 'ملاحظات وتوجيهات' : 'Plan Notes & Directives'}
          <textarea
            style={{ ...inputStyle, minHeight: '55px', resize: 'vertical' }}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </label>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', gap: '8px', flexWrap: 'wrap' }}>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            {lang === 'ar' ? 'إلغاء' : 'Cancel'}
          </Button>

          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="secondary" onClick={handleSaveDraft} disabled={saving}>
              {lang === 'ar' ? 'حفظ كمسودة' : 'Save as Draft'}
            </Button>
            <Button variant="primary" onClick={handleSubmitForApproval} loading={saving} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Send size={13} />
              {lang === 'ar' ? 'إرسال للاعتماد' : 'Submit for Approval'}
            </Button>
          </div>
        </div>
      </div>
    </Drawer>
  )
}
