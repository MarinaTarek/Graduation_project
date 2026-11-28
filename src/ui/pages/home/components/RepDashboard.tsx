'use client'

import { useMemo, useState } from 'react'
import {
  TrendingUp,
  Award,
  CalendarCheck,
  Plus,
  CalendarDays,
  FileText,
  AlertCircle,
  MapPin,
  Clock,
  CheckCircle2,
  Stethoscope,
  Building,
  Package,
  ChevronRight,
  Sparkles,
  ArrowRight,
} from 'lucide-react'
import { Button } from '@/ui/design-system/components/Button'
import { useT } from '@/lib/i18n'
import { formatCurrencyCompact } from '@/lib/format'
import { getRepDashboardMetrics } from '@/lib/analytics/roleAnalytics'
import { useStore } from '@/data/mock/store'
import { invoicesStore } from '@/data/mock/invoices'
import { targetsStore } from '@/data/mock/targets'
import { visitsStore } from '@/data/mock/visits'
import { visitPlansStore } from '@/data/mock/visit-plans'
import type { User } from '@/lib/auth/types'

import {
  MetricCard,
  DarkHeroCard,
  DonutGaugeCard,
  DashboardHeader,
  ActionCenter,
  RecentActivityFeed,
  type ActionCenterItem,
  type ActivityFeedItem,
} from './DashboardShared'

export interface RepDashboardProps {
  user: User | null
  onAction: (s: string) => void
  onOpen: (s: string) => void
  onNavigateWithFilter?: (page: string, options?: { filter?: string; overlay?: string }) => void
  setActive: (s: string) => void
}

export function RepDashboard({
  user,
  onAction,
  onOpen,
  onNavigateWithFilter,
  setActive,
}: RepDashboardProps) {
  const { t, lang } = useT()
  const isAr = lang === 'ar'
  const [dateRange, setDateRange] = useState('month')

  // Reactive store subscriptions
  const invoices = useStore(invoicesStore)
  const targets = useStore(targetsStore)
  const visits = useStore(visitsStore)
  const visitPlans = useStore(visitPlansStore)

  const metrics = useMemo(() => {
    return getRepDashboardMetrics({
      id: user?.id,
      name: user?.name,
      role: user?.role,
      businessUnit: user?.businessUnit,
      region: user?.region,
    })
  }, [invoices, targets, visits, visitPlans, user?.id, user?.name, user?.role, user?.businessUnit, user?.region])

  const multiplier = dateRange === 'quarter' ? 2.8 : dateRange === 'year' ? 10.5 : 1
  const displayedSales = Math.round(metrics.mySales * multiplier)
  const displayedTarget = Math.round(metrics.myTarget * multiplier)

  // Action Center Items for Rep
  const actionItems: ActionCenterItem[] = [
    {
      id: 'today-itinerary',
      title: isAr ? 'زيارات اليوم المتبقية' : "Today's Clinic Itinerary",
      count: `${metrics.visitsTodayCompleted} / ${metrics.visitsTodayPlanned || 4}`,
      description: isAr ? 'أطباء وصيدليات بجدول خطتك اليوم' : 'Target doctors planned on your itinerary route today',
      severity: metrics.visitsTodayCompleted < (metrics.visitsTodayPlanned || 4) ? 'info' : 'success',
      icon: Stethoscope,
      actionLabel: isAr ? 'تسجيل زيارة' : 'Log Visit',
      onClick: () => onOpen('new visit'),
    },
    {
      id: 'visit-plan-status',
      title: isAr ? 'حالة خطة الزيارات الشهرية' : 'Monthly Visit Plan Status',
      count: metrics.activePlan ? metrics.activePlan.status : (isAr ? 'غير مقدمة' : 'Not Submitted'),
      description: metrics.activePlan
        ? (metrics.activePlan.status === 'Active'
            ? (isAr ? 'الخطة معتمدة ونشطة في الميدان' : 'Plan approved & active in the field')
            : (isAr ? 'الخطة قيد المراجعة لدى المشرف' : 'Plan submitted, awaiting supervisor sign-off'))
        : (isAr ? 'يرجى إعداد خطة الشهر ورفعها' : 'Please compose and submit your monthly plan'),
      severity: metrics.activePlan?.status === 'Active' ? 'success' : metrics.activePlan ? 'warning' : 'critical',
      icon: CalendarDays,
      actionLabel: isAr ? 'فتح الخطة' : 'Open Plan',
      onClick: () => setActive('Visit plan'),
    },
    {
      id: 'target-gap',
      title: isAr ? 'المتبقي لتحقيق الهدف' : 'Remaining to Monthly Quota',
      count: formatCurrencyCompact(metrics.remainingToTarget, 'EGP', lang),
      description: isAr ? `${metrics.targetPct}% نسبة تحقيق الهدف الحالي` : `${metrics.targetPct}% of your individual target attained`,
      severity: metrics.targetPct >= 100 ? 'success' : metrics.targetPct >= 80 ? 'info' : 'warning',
      icon: Award,
      actionLabel: isAr ? 'بطاقة الأداء' : 'View Scorecard',
      onClick: () => onNavigateWithFilter ? onNavigateWithFilter('Reports', { filter: 'rep-scorecard' }) : setActive('Reports'),
    },
  ]

  // Recent Activity Feed for Rep
  const recentActivities: ActivityFeedItem[] = useMemo(() => {
    const list: ActivityFeedItem[] = []

    // Rep's own visits
    const myVisits = visits.filter(
      (v) => v.repId === user?.id || (v.repName && v.repName.toLowerCase() === (user?.name || '').toLowerCase())
    ).slice(0, 3)

    myVisits.forEach((v) => {
      list.push({
        id: `my-v-${v.id}`,
        title: isAr ? `زيارة: ${v.clientName || 'طبيب'}` : `Visit: ${v.clientName || 'Dr. Client'}`,
        timestamp: v.date || 'Today',
        actor: v.detail || 'Doctor Call',
        badgeText: v.status,
        badgeVariant: v.status === 'Completed' ? 'green' : 'blue',
        icon: Stethoscope,
        detail: v.time ? `Scheduled: ${v.time}` : 'Completed and logged',
        onClick: () => setActive('Visits'),
      })
    })

    // Rep's own invoices
    const myInvs = invoices.filter(
      (inv) => inv.repId === user?.id || (inv.repName && inv.repName.toLowerCase() === (user?.name || '').toLowerCase())
    ).slice(0, 2)

    myInvs.forEach((inv) => {
      list.push({
        id: `my-inv-${inv.id}`,
        title: isAr ? `فاتورة مبيعات: ${inv.invoiceNumber || inv.id}` : `Sales Invoiced: ${inv.invoiceNumber || inv.id}`,
        timestamp: inv.issueDate || 'Today',
        actor: inv.customerName || 'Pharmacy',
        badgeText: formatCurrencyCompact(inv.originalAmount || 0, 'EGP', lang),
        badgeVariant: 'blue',
        icon: FileText,
        onClick: () => setActive('Invoices'),
      })
    })

    return list
  }, [visits, invoices, user?.id, user?.name, isAr, lang, setActive])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* ── Section A: Header ──────────────────────────────────────── */}
      <DashboardHeader
        badgeLabel={metrics.territory}
        badgeIcon={Stethoscope}
        badgeTone="teal"
        contextLabel={metrics.businessUnit}
        welcomeName={user?.name || (isAr ? 'مندوب الدعاية' : 'Medical Representative')}
        description={
          isAr
            ? 'مساحة عملك اليومية: جدول الزيارات الميدانية، تحقيق الهدف البيعي، وحالة خطط الزيارات'
            : 'Your personal field cockpit: today’s doctor itinerary, quota tracking, and visit plans.'
        }
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        lang={lang}
        actions={
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button
              variant="primary"
              onClick={() => onOpen('new visit')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.84rem', fontWeight: 600, borderRadius: '12px' }}
            >
              <Plus style={{ width: '15px', height: '15px' }} />
              {isAr ? 'تسجيل زيارة جديدة' : 'New Visit'}
            </Button>
            <Button
              variant="secondary"
              onClick={() => setActive('Visit plan')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.84rem', fontWeight: 600, borderRadius: '12px' }}
            >
              <CalendarDays style={{ width: '15px', height: '15px' }} />
              {isAr ? 'خطة الزيارات' : 'Visit Plan'}
            </Button>
          </div>
        }
      />

      {/* ── Section B: Colorful KPI Cards ──────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: '16px',
        }}
      >
        {/* KPI 1: Blue - My Sales */}
        <MetricCard
          title={isAr ? 'مبيعاتي المحققة' : 'My Invoiced Sales'}
          value={formatCurrencyCompact(displayedSales, 'EGP', lang)}
          subtext={isAr ? `هدفي الشخصي: ${formatCurrencyCompact(displayedTarget, 'EGP', lang)}` : `Personal Quota: ${formatCurrencyCompact(displayedTarget, 'EGP', lang)}`}
          trend="+18.4%"
          isPositive={true}
          variant="blue"
          icon={TrendingUp}
          sparkline={[30, 42, 55, 68, 79, 92]}
          onClick={() => onNavigateWithFilter ? onNavigateWithFilter('Reports', { filter: 'rep-scorecard' }) : setActive('Reports')}
        />

        {/* KPI 2: Green - Visited Doctors */}
        <MetricCard
          title={isAr ? 'إنجاز الزيارات الشهرية' : 'Monthly Visits'}
          value={`${metrics.visitsMonthCompleted} / ${metrics.visitsMonthTotal || 45}`}
          subtext={isAr ? `${metrics.visitCompletionPct}% نسبة إنجاز الخطة` : `${metrics.visitCompletionPct}% route completed`}
          trend="+12.0%"
          isPositive={true}
          variant="green"
          icon={CalendarCheck}
          sparkline={[8, 16, 24, 32, 40, 48]}
          onClick={() => setActive('Visits')}
        />

        {/* KPI 3: Purple - Class A Physician Coverage */}
        <MetricCard
          title={isAr ? 'زيارات الفئة (أ)' : 'Class A Doctor Calls'}
          value={metrics.classAVisitsCount || 18}
          subtext={isAr ? 'زيارات الأطباء الأعلى أولوية' : 'High-impact key opinion leaders'}
          trend="+8.5%"
          isPositive={true}
          variant="purple"
          icon={Award}
          sparkline={[4, 8, 12, 15, 18, 22]}
          onClick={() => setActive('Visits')}
        />

        {/* KPI 4: Navy - Strategic Quota Card */}
        <DarkHeroCard
          badge={metrics.businessUnit}
          title={isAr ? 'تحقيق هدفي الشهري' : 'My Quota Attainment'}
          amount={`${metrics.targetPct}%`}
          subtitle={
            metrics.targetPct >= 100
              ? (isAr ? 'رائع! لقد تجاوزت هدفك البيعي' : 'Outstanding! You achieved 100%+ of quota')
              : (isAr ? `متبقي ${formatCurrencyCompact(metrics.remainingToTarget, 'EGP', lang)} للهدف` : `${formatCurrencyCompact(metrics.remainingToTarget, 'EGP', lang)} remaining to goal`)
          }
          progressPct={metrics.targetPct}
          footerLeft={isAr ? 'العينات الموزعة' : 'Samples Given'}
          footerRight={`${metrics.samplesDistributed} units`}
          onClick={() => onNavigateWithFilter ? onNavigateWithFilter('Reports', { filter: 'rep-scorecard' }) : setActive('Reports')}
        />
      </div>

      {/* ── Section C: Visual Analytics (Doctor Gauge & Today's Schedule) ─ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        <div style={{ flex: '1 1 300px' }}>
          <DonutGaugeCard
            title={isAr ? 'معدل إنجاز خطة الزيارات' : 'Visit Route Attainment'}
            subtitle={isAr ? 'التقدم نحو تغطية أطباء الشهر' : 'Progress across current month stops'}
            percent={metrics.visitCompletionPct}
            primaryLabel="Visited"
            secondaryLabel={isAr ? `${metrics.visitsMonthCompleted} من ${metrics.visitsMonthTotal || 45} زيارة منجزة` : `${metrics.visitsMonthCompleted} of ${metrics.visitsMonthTotal || 45} stops completed`}
            accentColor="#10B981"
            segments={[
              { label: isAr ? 'مكتملة' : 'Completed', value: metrics.visitsMonthCompleted, color: '#10B981' },
              { label: isAr ? 'متبقية' : 'Remaining', value: Math.max(0, (metrics.visitsMonthTotal || 45) - metrics.visitsMonthCompleted), color: '#CBD5E1' },
            ]}
          />
        </div>

        <div style={{ flex: '2 1 500px' }}>
          {/* Today's Detailing Schedule */}
          <div
            className="dashboard-card-section"
            style={{
              background: '#FFFFFF',
              borderRadius: '20px',
              border: '1.5px solid #E2E8F0',
              padding: '24px',
              boxShadow: '0 2px 12px rgba(15, 23, 42, 0.03)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Stethoscope style={{ width: '18px', height: '18px', color: '#0D9488' }} />
                  <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>
                    {isAr ? 'جدول زيارات اليوم الميداني' : "Today's Detailing Schedule & Route"}
                  </h4>
                </div>
                <p style={{ margin: '3px 0 0 0', fontSize: '0.8rem', color: '#64748B' }}>
                  {isAr ? 'قائمة الأطباء المجدولين لزيارتهم اليوم في منطقتك' : 'Planned doctor and clinic stops for your route today'}
                </p>
              </div>

              <Button
                variant="secondary"
                onClick={() => setActive('Visits')}
                style={{ fontSize: '0.78rem', padding: '5px 12px', borderRadius: '8px' }}
              >
                {isAr ? 'عرض الكل' : 'View All'}
              </Button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {metrics.todaySchedule.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: '#94A3B8', fontSize: '0.85rem' }}>
                  {isAr ? 'لا توجد زيارات مجدولة لليوم. يمكنك تسجيل زيارة جديدة فوراً.' : 'No stops scheduled today. You can log an ad-hoc visit anytime.'}
                </div>
              ) : (
                metrics.todaySchedule.map((stop) => (
                  <div
                    key={stop.stopId}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 14px',
                      borderRadius: '12px',
                      background: stop.status === 'Completed' ? 'var(--green-bg, #F0FDF4)' : 'var(--surface-raised, #F8FAFC)',
                      border: stop.status === 'Completed' ? '1.5px solid var(--green, #BBF7D0)' : '1px solid var(--border-soft, #E2E8F0)',
                      gap: '10px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: stop.status === 'Completed' ? 'var(--green-bg, #DCFCE7)' : 'var(--paper, #F1F5F9)',
                          color: stop.status === 'Completed' ? 'var(--green-text, #16A34A)' : 'var(--muted-text, #64748B)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {stop.status === 'Completed' ? <CheckCircle2 style={{ width: '16px', height: '16px' }} /> : <Clock style={{ width: '16px', height: '16px' }} />}
                      </div>

                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--heading-text, #0F172A)' }}>{stop.clientName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--muted-text, #64748B)' }}>
                          {stop.specialty} • <span style={{ fontWeight: 600, color: 'var(--heading-text, #0F172A)' }}>{stop.clientClass}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: isAr ? 'left' : 'right' }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--heading-text, #0F172A)' }}>{stop.plannedTime}</div>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '6px',
                          background: stop.status === 'Completed' ? '#D1FAE5' : '#DBEAFE',
                          color: stop.status === 'Completed' ? '#065F46' : '#1E40AF',
                        }}
                      >
                        {stop.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Section D: Action Center ───────────────────────────────── */}
      <ActionCenter items={actionItems} lang={lang} />

      {/* ── Section E: Recent Activity Feed ────────────────────────── */}
      <RecentActivityFeed items={recentActivities} lang={lang} />
    </div>
  )
}
