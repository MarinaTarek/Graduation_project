import { useState, useMemo, useEffect } from 'react'
import {
  CalendarDays,
  Route,
  Briefcase,
  Plus,
  Edit3,
  Check,
  X,
  AlertTriangle,
  Send,
  CheckSquare,
  Clock,
  User as UserIcon,
} from 'lucide-react'
import { Button } from '@/ui/design-system/components/Button'
import { EmptyState } from '@/ui/design-system/components/EmptyState'
import { StatusPill } from '@/ui/design-system/components/StatusPill'
import { Toast } from '@/ui/design-system/components/Toast'
import { Modal } from '@/ui/design-system/components/Modal'
import { useT } from '@/lib/i18n'
import { formatDate } from '@/lib/format'
import { useStore } from '@/data/mock/store'
import {
  visitPlansStore,
  approveVisitPlan,
  rejectVisitPlan,
  submitVisitPlanForApproval,
  type VisitPlan,
} from '@/data/mock/visit-plans'
import { filterVisitPlansByScope } from '@/data/mock/dataScope'
import type { UserRole } from '@/lib/auth/types'
import { PlanCalendar } from './components/PlanCalendar'
import { RouteStops } from './components/RouteStops'
import { EditVisitPlanDrawer } from './components/EditVisitPlanDrawer'
import { VacationManagement } from './components/VacationManagement'

export interface VisitPlanPageProps {
  role?: UserRole | string
  currentUserName?: string
  currentUserId?: string
  businessUnit?: string
  filter?: string | null
  initialTab?: 'plans' | 'calendar' | 'vacations' | 'approvals'
}

export default function VisitPlanPage({
  role = 'admin',
  currentUserName = 'Alex Morgan',
  currentUserId,
  businessUnit,
  filter,
  initialTab,
}: VisitPlanPageProps) {
  const { t, lang } = useT()
  const visitPlans = useStore(visitPlansStore)

  const scopedPlans = useMemo(
    () => filterVisitPlansByScope(visitPlans, { id: currentUserId, name: currentUserName, role, businessUnit }),
    [visitPlans, currentUserId, currentUserName, role, businessUnit]
  )

  const defaultTab = initialTab || (filter === 'approvals' || filter === 'pending' ? 'approvals' : 'plans')
  const [activeTab, setActiveTab] = useState<'plans' | 'calendar' | 'vacations' | 'approvals'>(defaultTab)

  useEffect(() => {
    if (filter === 'approvals' || filter === 'pending') {
      setActiveTab('approvals')
    } else if (filter === 'calendar') {
      setActiveTab('calendar')
    } else if (filter === 'vacations') {
      setActiveTab('vacations')
    } else if (filter === 'plans') {
      setActiveTab('plans')
    }
  }, [filter])
  const [editingPlan, setEditingPlan] = useState<VisitPlan | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Rejection Modal state (replaces window.prompt)
  const [rejectingPlan, setRejectingPlan] = useState<VisitPlan | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [rejectionError, setRejectionError] = useState('')

  const notify = (msg: string) => {
    setToastMessage(msg)
    window.setTimeout(() => setToastMessage(null), 3500)
  }

  const isManager = role === 'admin' || role === 'first_line_manager' || role === 'business_unit_manager'

  const isOwnPlan = (plan: VisitPlan): boolean => {
    // Prefer stable ID comparison when both sides are available
    if (currentUserId && plan.repId) {
      return plan.repId === currentUserId
    }
    // Fallback: exact full-name comparison (case-insensitive)
    return plan.repName.toLowerCase() === currentUserName.toLowerCase()
  }

  // Pending approval plans targeted to this manager or company-wide admin
  const pendingApprovalPlans = useMemo(() => {
    return scopedPlans.filter((p) => {
      if (p.status !== 'Pending Approval') return false
      if (isOwnPlan(p)) return false // cannot approve own plan
      if (role === 'admin') return true
      if (currentUserId && p.assignedApproverId) {
        return p.assignedApproverId === currentUserId
      }
      return true
    })
  }, [scopedPlans, role, currentUserId, currentUserName])

  const handleApprove = (plan: VisitPlan) => {
    if (isOwnPlan(plan)) {
      notify(lang === 'ar' ? 'لا يمكن للمندوب اعتماد خطته الخاصة' : 'A representative cannot approve their own plan')
      return
    }

    try {
      approveVisitPlan(plan.id, { id: currentUserId, name: currentUserName, role })
      notify(lang === 'ar' ? `تم اعتماد الخطة ${plan.name} بنجاح` : `Plan ${plan.name} approved successfully`)
    } catch (err) {
      notify((err as Error).message)
    }
  }

  const handleOpenRejectModal = (plan: VisitPlan) => {
    if (isOwnPlan(plan)) {
      notify(lang === 'ar' ? 'لا يمكن للمندوب رفض خطته الخاصة' : 'A representative cannot reject their own plan')
      return
    }
    setRejectingPlan(plan)
    setRejectionReason('')
    setRejectionError('')
  }

  const handleConfirmReject = () => {
    if (!rejectingPlan) return
    const cleanReason = rejectionReason.trim()
    if (!cleanReason) {
      setRejectionError(
        lang === 'ar'
          ? 'سبب الرفض إلزامي. يرجى توضيح سبب الرفض للمندوب.'
          : 'Rejection reason is mandatory. Please explain why the plan is rejected.'
      )
      return
    }

    try {
      rejectVisitPlan(rejectingPlan.id, cleanReason, { id: currentUserId, name: currentUserName, role })
      notify(lang === 'ar' ? `تم رفض الخطة ${rejectingPlan.name}` : `Plan ${rejectingPlan.name} rejected`)
      setRejectingPlan(null)
      setRejectionReason('')
      setRejectionError('')
    } catch (err) {
      notify((err as Error).message)
    }
  }

  const handleSubmit = (plan: VisitPlan) => {
    try {
      submitVisitPlanForApproval(plan.id, { id: currentUserId, name: currentUserName, role })
      notify(lang === 'ar' ? `تم إرسال الخطة ${plan.name} للاعتماد` : `Plan ${plan.name} submitted for manager approval`)
    } catch (err) {
      notify((err as Error).message)
    }
  }

  return (
    <section className="content">
      <div className="page-intro">
        <div>
          <span className="eyebrow">
            <CalendarDays /> {t('visitPlan.eyebrow')}
          </span>
          <h1>{t('visitPlan.title')}</h1>
          <p className="story">{t('visitPlan.subtitle')}</p>
        </div>
      </div>

      {/* Sub-navigation Tabs */}
      <div style={{ display: 'flex', gap: '8px', margin: '24px 0 16px', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setActiveTab('plans')}
          style={{
            padding: '8px 16px',
            borderRadius: '20px',
            border: activeTab === 'plans' ? '1px solid var(--accent-primary, #2563eb)' : '1px solid var(--border-soft)',
            background: activeTab === 'plans' ? 'rgba(37, 99, 235, 0.1)' : 'var(--surface)',
            color: activeTab === 'plans' ? 'var(--accent-primary, #2563eb)' : 'var(--muted-text)',
            fontWeight: 600,
            fontSize: '13px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Route size={15} />
          {lang === 'ar' ? 'خطط الزيارات' : 'Visit Plans'} ({scopedPlans.length})
        </button>

        {isManager && (
          <button
            type="button"
            onClick={() => setActiveTab('approvals')}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              border: activeTab === 'approvals' ? '1px solid #7c3aed' : '1px solid var(--border-soft)',
              background: activeTab === 'approvals' ? 'rgba(124, 58, 237, 0.12)' : 'var(--surface)',
              color: activeTab === 'approvals' ? '#7c3aed' : 'var(--muted-text)',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <CheckSquare size={15} />
            {lang === 'ar' ? 'طلبات الاعتماد' : 'Approval Queue'} ({pendingApprovalPlans.length})
          </button>
        )}

        <button
          type="button"
          onClick={() => setActiveTab('calendar')}
          style={{
            padding: '8px 16px',
            borderRadius: '20px',
            border: activeTab === 'calendar' ? '1px solid #059669' : '1px solid var(--border-soft)',
            background: activeTab === 'calendar' ? 'rgba(16, 185, 129, 0.1)' : 'var(--surface)',
            color: activeTab === 'calendar' ? '#059669' : 'var(--muted-text)',
            fontWeight: 600,
            fontSize: '13px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <CalendarDays size={15} />
          {lang === 'ar' ? 'التقويم التفاعلي الموحد' : 'Unified Calendar'}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('vacations')}
          style={{
            padding: '8px 16px',
            borderRadius: '20px',
            border: activeTab === 'vacations' ? '1px solid #d97706' : '1px solid var(--border-soft)',
            background: activeTab === 'vacations' ? 'rgba(245, 158, 11, 0.1)' : 'var(--surface)',
            color: activeTab === 'vacations' ? '#d97706' : 'var(--muted-text)',
            fontWeight: 600,
            fontSize: '13px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Briefcase size={15} />
          {lang === 'ar' ? 'إجازات الموظفين' : 'Employee Vacations'}
        </button>
      </div>

      {/* TAB 1: VISIT PLANS */}
      {activeTab === 'plans' && (
        <div style={{ marginTop: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px' }}>
                {lang === 'ar' ? 'الخطط الميدانية النشطة والمسودات' : 'Field Visit Plans'}
              </h3>
              <span style={{ fontSize: '12px', color: 'var(--muted-text)' }}>
                {lang === 'ar'
                  ? 'إدارة الخطط الشهرية والأسبوعية وتحديد المستهدفين'
                  : 'Manage weekly/monthly target routes, assigned representatives, and target organizations'}
              </span>
            </div>

            <Button variant="primary" onClick={() => setIsCreateOpen(true)}>
              <Plus data-icon="inline-start" /> {lang === 'ar' ? 'خطة جديدة' : 'New Plan'}
            </Button>
          </div>

          <div className="collection-list">
            {scopedPlans.length > 0 ? (
              scopedPlans.map((plan) => (
                <div
                  key={plan.id}
                  className="collection-card"
                  style={{
                    padding: '16px 20px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-soft)',
                    background: 'var(--surface)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    marginBottom: '12px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ocean)' }}>
                          {plan.id}
                        </span>
                        <strong style={{ fontSize: '15px' }}>{plan.name}</strong>
                      </div>
                      <span style={{ fontSize: '12px', color: 'var(--muted-text)' }}>
                        👤 {plan.repName} · 📅 {formatDate(plan.startDate, lang)} &rarr; {formatDate(plan.endDate, lang)} · ⏱️ {plan.frequency}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <StatusPill status={plan.status} />

                      {/* Manager Approval Controls */}
                      {plan.status === 'Pending Approval' && isManager && !isOwnPlan(plan) && (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <Button
                            variant="primary"
                            type="button"
                            style={{ fontSize: '12px', height: '30px', padding: '0 10px', background: '#16a34a', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            onClick={() => handleApprove(plan)}
                          >
                            <Check size={13} />
                            {lang === 'ar' ? 'اعتماد' : 'Approve'}
                          </Button>
                          <Button
                            variant="secondary"
                            type="button"
                            style={{ fontSize: '12px', height: '30px', padding: '0 10px', color: 'var(--rose-text)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            onClick={() => handleOpenRejectModal(plan)}
                          >
                            <X size={13} />
                            {lang === 'ar' ? 'رفض' : 'Reject'}
                          </Button>
                        </div>
                      )}

                      {/* Rep self-approval restriction notification */}
                      {plan.status === 'Pending Approval' && isOwnPlan(plan) && (
                        <span style={{ fontSize: '11px', color: '#d97706', fontWeight: 600 }}>
                          ⏳ {lang === 'ar' ? 'بانتظار اعتماد المدير' : 'Pending manager review'}
                        </span>
                      )}

                      {/* Draft quick submit */}
                      {plan.status === 'Draft' && (
                        <Button
                          variant="secondary"
                          type="button"
                          style={{ fontSize: '12px', height: '30px', padding: '0 10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          onClick={() => handleSubmit(plan)}
                        >
                          <Send size={13} />
                          {lang === 'ar' ? 'إرسال للاعتماد' : 'Submit'}
                        </Button>
                      )}

                      <Button
                        variant="secondary"
                        type="button"
                        style={{ fontSize: '12px', height: '30px', padding: '0 10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        onClick={() => setEditingPlan(plan)}
                      >
                        <Edit3 size={13} />
                        {lang === 'ar' ? 'تعديل الخطة' : 'Edit Plan'}
                      </Button>
                    </div>
                  </div>

                  {/* Rejection Alert Banner if rejected */}
                  {plan.status === 'Rejected' && plan.rejectionReason && (
                    <div
                      style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        background: 'rgba(239, 68, 68, 0.08)',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        color: 'var(--rose-text, #ef4444)',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <AlertTriangle size={14} />
                      <span>
                        <strong>{lang === 'ar' ? 'سبب الرفض: ' : 'Rejection Reason: '}</strong>
                        {plan.rejectionReason}
                        {plan.reviewedBy ? ` (${lang === 'ar' ? 'بواسطة: ' : 'by: '}${plan.reviewedBy})` : ''}
                      </span>
                    </div>
                  )}

                  <div style={{ fontSize: '12px', color: 'var(--muted-text)', lineHeight: 1.5 }}>
                    <div>
                      <strong>{lang === 'ar' ? 'المستهدفون: ' : 'Target Clients: '}</strong>
                      {plan.targetClients.join(', ')}
                    </div>
                    <div>
                      <strong>{lang === 'ar' ? 'المنتجات / الحملات: ' : 'Planned Products: '}</strong>
                      {plan.plannedProducts.join(', ')}
                    </div>
                    {plan.stops && plan.stops.length > 0 && (
                      <div style={{ marginTop: '4px' }}>
                        <strong>{lang === 'ar' ? 'المحطات المجدولة: ' : 'Scheduled Stops: '}</strong>
                        {plan.stops.length} {lang === 'ar' ? 'محطات' : 'stops'}
                      </div>
                    )}
                    {plan.notes && (
                      <div style={{ marginTop: '4px', fontStyle: 'italic' }}>
                        &ldquo;{plan.notes}&rdquo;
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <EmptyState message={lang === 'ar' ? 'لا توجد خطط زيارات مسجلة' : 'No visit plans recorded'} />
            )}
          </div>

          <div style={{ marginTop: '24px' }}>
            <h4 style={{ margin: '0 0 12px', fontSize: '14px', color: 'var(--muted-text)' }}>
              {t('visitPlan.todayRoute')}
            </h4>
            <RouteStops
              role={role}
              currentUserName={currentUserName}
              currentUserId={currentUserId}
              businessUnit={businessUnit}
            />
          </div>
        </div>
      )}

      {/* TAB 4: MANAGER APPROVAL QUEUE */}
      {activeTab === 'approvals' && isManager && (
        <div style={{ marginTop: '16px' }}>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '16px' }}>
              {lang === 'ar' ? 'قائمة الخطط المعلقة بانتظار الاعتماد' : 'Plans Awaiting Manager Review'}
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--muted-text)' }}>
              {lang === 'ar'
                ? 'مراجعة الخطط المرفوعة من المندوبين التابعين واعتمادها لتفعيلها في التقويم وجدول الزيارات'
                : 'Review submitted plans from direct reports. Approving a plan activates its visits in the calendar and daily routing.'}
            </span>
          </div>

          <div className="collection-list">
            {pendingApprovalPlans.length > 0 ? (
              pendingApprovalPlans.map((plan) => (
                <div
                  key={plan.id}
                  className="collection-card"
                  style={{
                    padding: '16px 20px',
                    borderRadius: '12px',
                    border: '1px solid #7c3aed33',
                    background: 'var(--surface)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    marginBottom: '12px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#7c3aed' }}>
                          {plan.id}
                        </span>
                        <strong style={{ fontSize: '15px' }}>{plan.name}</strong>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--muted-text)', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <span>👤 <strong>{plan.repName}</strong></span>
                        <span>📅 {formatDate(plan.startDate, lang)} &rarr; {formatDate(plan.endDate, lang)}</span>
                        <span>⏱️ {plan.frequency}</span>
                        {plan.createdAt && (
                          <span>🕒 {lang === 'ar' ? 'تاريخ التقديم:' : 'Submitted:'} {formatDate(plan.createdAt.slice(0, 10), lang)}</span>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <StatusPill status={plan.status} />
                      <Button
                        variant="primary"
                        type="button"
                        style={{ fontSize: '12px', height: '32px', padding: '0 12px', background: '#16a34a', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        onClick={() => handleApprove(plan)}
                      >
                        <Check size={14} />
                        {lang === 'ar' ? 'اعتماد الخطة' : 'Approve'}
                      </Button>
                      <Button
                        variant="secondary"
                        type="button"
                        style={{ fontSize: '12px', height: '32px', padding: '0 12px', color: 'var(--rose-text)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        onClick={() => handleOpenRejectModal(plan)}
                      >
                        <X size={14} />
                        {lang === 'ar' ? 'رفض' : 'Reject'}
                      </Button>
                    </div>
                  </div>

                  <div style={{ fontSize: '12px', color: 'var(--muted-text)', lineHeight: 1.5, background: 'var(--surface-raised, rgba(0,0,0,0.02))', padding: '10px 14px', borderRadius: '8px' }}>
                    <div>
                      <strong>{lang === 'ar' ? 'المستهدفون: ' : 'Target Clients: '}</strong>
                      {plan.targetClients.join(', ')}
                    </div>
                    <div>
                      <strong>{lang === 'ar' ? 'المنتجات / الحملات: ' : 'Planned Products: '}</strong>
                      {plan.plannedProducts.join(', ')}
                    </div>
                    {plan.stops && plan.stops.length > 0 && (
                      <div style={{ marginTop: '4px' }}>
                        <strong>{lang === 'ar' ? 'المحطات المجدولة: ' : 'Stops: '}</strong>
                        {plan.stops.length} {lang === 'ar' ? 'زيارة مخطط لها' : 'planned stops'} ({plan.stops.map(s => s.clientName).slice(0, 3).join(', ')}{plan.stops.length > 3 ? '...' : ''})
                      </div>
                    )}
                    {plan.notes && (
                      <div style={{ marginTop: '4px', fontStyle: 'italic' }}>
                        &ldquo;{plan.notes}&rdquo;
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                message={
                  lang === 'ar'
                    ? 'لا توجد طلبات اعتماد معلقة في قائمة انتظارك حالياً'
                    : 'No pending visit plans in your approval queue'
                }
              />
            )}
          </div>
        </div>
      )}

      {/* TAB 2: UNIFIED INTERACTIVE CALENDAR */}
      {activeTab === 'calendar' && (
        <div>
          <PlanCalendar
            role={role}
            currentUserName={currentUserName}
            currentUserId={currentUserId}
            businessUnit={businessUnit}
            onTriggerAlarm={(details) =>
              notify(
                lang === 'ar'
                  ? `تم تفعيل تنبيه الزيارة للدكتور ${details.doctorName}`
                  : `Visit alarm triggered for ${details.doctorName}`
              )
            }
          />
        </div>
      )}

      {/* TAB 3: EMPLOYEE VACATIONS */}
      {activeTab === 'vacations' && (
        <div>
          <VacationManagement
            role={role}
            currentUserName={currentUserName}
            currentUserId={currentUserId}
            onAction={notify}
          />
        </div>
      )}

      {/* Rejection Modal (Mandatory explanation) */}
      {rejectingPlan && (
        <Modal
          isOpen={Boolean(rejectingPlan)}
          onClose={() => {
            setRejectingPlan(null)
            setRejectionReason('')
            setRejectionError('')
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '8px 4px' }}>
            <h3 style={{ margin: 0, fontSize: '16px' }}>
              {lang === 'ar' ? `رفض الخطة: ${rejectingPlan.name}` : `Reject Plan: ${rejectingPlan.name}`}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--muted-text)', margin: 0 }}>
              {lang === 'ar'
                ? `يرجى تزويد المندوب (${rejectingPlan.repName}) بالسبب التفصيلي للرفض لتعديل الخطة وإعادة رفعها:`
                : `Please provide a clear reason to representative (${rejectingPlan.repName}) explaining why the plan was rejected:`}
            </p>

            <textarea
              rows={4}
              value={rejectionReason}
              onChange={(e) => {
                setRejectionReason(e.target.value)
                if (rejectionError) setRejectionError('')
              }}
              placeholder={
                lang === 'ar'
                  ? 'اكتب سبب الرفض هنا بالتفصيل (إلزامي)...'
                  : 'Enter detailed rejection reason here (mandatory)...'
              }
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: rejectionError ? '1px solid var(--rose-text, #ef4444)' : '1px solid var(--border-soft)',
                background: 'var(--surface-raised, rgba(0,0,0,0.03))',
                fontSize: '13px',
                fontFamily: 'inherit',
                resize: 'vertical',
              }}
            />

            {rejectionError && (
              <span style={{ fontSize: '12px', color: 'var(--rose-text, #ef4444)', fontWeight: 600 }}>
                {rejectionError}
              </span>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
              <Button
                variant="secondary"
                type="button"
                onClick={() => {
                  setRejectingPlan(null)
                  setRejectionReason('')
                  setRejectionError('')
                }}
              >
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button
                variant="primary"
                type="button"
                style={{ background: 'var(--rose-text, #ef4444)' }}
                onClick={handleConfirmReject}
              >
                {lang === 'ar' ? 'تأكيد الرفض' : 'Confirm Rejection'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Create or Edit Visit Plan Drawer */}
      <EditVisitPlanDrawer
        plan={editingPlan}
        isOpen={Boolean(editingPlan) || isCreateOpen}
        onClose={() => {
          setEditingPlan(null)
          setIsCreateOpen(false)
        }}
        onSaved={(plan) => {
          notify(
            isCreateOpen
              ? (lang === 'ar' ? `تم إنشاء خطة ${plan.name} بنجاح` : `Plan ${plan.name} created successfully`)
              : (lang === 'ar' ? `تم تحديث خطة ${plan.name}` : `Plan ${plan.name} updated successfully`)
          )
        }}
        currentUserName={currentUserName}
        currentUserId={currentUserId}
        role={role}
      />

      {toastMessage && <Toast message={toastMessage} />}
    </section>
  )
}
