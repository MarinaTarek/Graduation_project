'use client'

import { useMemo, useState } from 'react'
import {
  TrendingUp,
  Award,
  CalendarCheck,
  CheckCircle2,
  Users,
  FileCheck,
  Clock,
  AlertTriangle,
  ArrowRight,
  UserCheck,
  MapPin,
  Stethoscope,
  ShieldAlert,
  Calendar,
} from 'lucide-react'
import { Button } from '@/ui/design-system/components/Button'
import { useT } from '@/lib/i18n'
import { formatCurrencyCompact } from '@/lib/format'
import { getFLMDashboardMetrics } from '@/lib/analytics/roleAnalytics'
import { useStore } from '@/data/mock/store'
import { invoicesStore } from '@/data/mock/invoices'
import { targetsStore } from '@/data/mock/targets'
import { visitsStore } from '@/data/mock/visits'
import { visitPlansStore } from '@/data/mock/visit-plans'
import { usersStore } from '@/data/mock/users'
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

export interface FLMDashboardProps {
  user: User | null
  onAction: (s: string) => void
  onOpen: (s: string) => void
  onNavigateWithFilter?: (page: string, options?: { filter?: string; overlay?: string }) => void
  setActive: (s: string) => void
}

export function FLMDashboard({
  user,
  onAction,
  onOpen,
  onNavigateWithFilter,
  setActive,
}: FLMDashboardProps) {
  const { t, lang } = useT()
  const isAr = lang === 'ar'
  const [dateRange, setDateRange] = useState('month')

  // Subscribe to reactive stores
  const invoices = useStore(invoicesStore)
  const targets = useStore(targetsStore)
  const visits = useStore(visitsStore)
  const visitPlans = useStore(visitPlansStore)
  const users = useStore(usersStore)

  const metrics = useMemo(() => {
    return getFLMDashboardMetrics({
      id: user?.id,
      name: user?.name,
      role: user?.role,
      businessUnit: user?.businessUnit,
      region: user?.region,
    })
  }, [invoices, targets, visits, visitPlans, users, user?.id, user?.name, user?.role, user?.businessUnit, user?.region])

  const multiplier = dateRange === 'quarter' ? 2.8 : dateRange === 'year' ? 10.5 : 1
  const displayedSales = Math.round(metrics.totalSales * multiplier)
  const displayedTarget = Math.round(metrics.targetSales * multiplier)

  // Action Center for FLM
  const actionItems: ActionCenterItem[] = [
    {
      id: 'flm-plan-approvals',
      title: isAr ? 'خطط مندوبيك المعلقة للاعتماد' : 'Pending Team Visit Plans',
      count: metrics.pendingPlansCount,
      description: isAr ? 'خطط شهرية تنتظر مراجعتك واعتمادك الميداني' : 'Direct rep itineraries requiring managerial validation',
      severity: metrics.pendingPlansCount > 0 ? 'warning' : 'success',
      icon: FileCheck,
      actionLabel: isAr ? 'اعتماد الخطط' : 'Review & Approve',
      onClick: () => onNavigateWithFilter ? onNavigateWithFilter('Visit plan', { filter: 'approvals' }) : setActive('Visit plan'),
    },
    {
      id: 'reps-attention',
      title: isAr ? 'مندوبون بحاجة إلى تدخل ميداني' : 'Reps Needing Field Coaching',
      count: metrics.repsNeedingAttention.length,
      description: isAr ? 'مندوبون بمعدل إنجاز أقل من 80% للمستهدف' : 'Reps pacing under 80% or behind on target frequency',
      severity: metrics.repsNeedingAttention.length > 0 ? 'critical' : 'success',
      icon: AlertTriangle,
      actionLabel: isAr ? 'تفاصيل الفريق' : 'Inspect Roster',
      onClick: () => onNavigateWithFilter ? onNavigateWithFilter('Reports', { filter: 'sales-performance' }) : setActive('Reports'),
    },
    {
      id: 'joint-field-coaching',
      title: isAr ? 'زيارات اليوم المخططة للفريق' : "Today's Field Itinerary",
      count: `${metrics.completedVisitsToday} / ${metrics.plannedVisitsToday}`,
      description: isAr ? 'الزيارات المنفذة اليوم من إجمالي المجدول' : 'Completed visits out of total planned stops today',
      severity: metrics.completedVisitsToday < metrics.plannedVisitsToday ? 'info' : 'success',
      icon: Stethoscope,
      actionLabel: isAr ? 'سجل الزيارات' : 'View Visits',
      onClick: () => setActive('Visits'),
    },
  ]

  // Recent Activity Feed for FLM
  const recentActivities: ActivityFeedItem[] = useMemo(() => {
    const list: ActivityFeedItem[] = []

    metrics.todayTeamVisits.slice(0, 3).forEach((v) => {
      list.push({
        id: `team-visit-${v.id}`,
        title: `${v.repName} → ${v.doctorName}`,
        timestamp: v.time || 'Today',
        actor: v.specialty,
        badgeText: v.status,
        badgeVariant: v.status === 'Completed' ? 'green' : 'orange',
        icon: Stethoscope,
        detail: `Field Stop Status: ${v.status}`,
        onClick: () => setActive('Visits'),
      })
    })

    metrics.pendingPlans.slice(0, 2).forEach((p) => {
      list.push({
        id: `plan-sub-${p.id}`,
        title: isAr ? `خطة مرفوعة: ${p.repName}` : `Plan Submitted: ${p.repName}`,
        timestamp: p.submittedAt || 'Today',
        actor: p.repName,
        badgeText: `${p.stopsCount} Stops`,
        badgeVariant: 'blue',
        icon: FileCheck,
        detail: `Period: ${p.monthYear}`,
        onClick: () => setActive('Visit plan'),
      })
    })

    return list
  }, [metrics.todayTeamVisits, metrics.pendingPlans, isAr, setActive])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* ── Section A: Header ──────────────────────────────────────── */}
      <DashboardHeader
        badgeLabel={metrics.region}
        badgeIcon={Users}
        badgeTone="green"
        contextLabel={isAr ? 'الإشراف الميداني المباشر' : 'Direct Supervisory Workspace'}
        welcomeName={user?.name || (isAr ? 'مشرف الفريق الميداني' : 'First Line Manager')}
        description={
          isAr
            ? `متابعة يومية وميدانية لنشاط ${metrics.directRepsCount} مندوبين تحت إشرافك المباشر في منطقة: ${metrics.region}`
            : `Operational supervision, daily doctor detailing, and quota coaching for your ${metrics.directRepsCount} field reps in ${metrics.region}.`
        }
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        lang={lang}
        actions={
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button
              variant="secondary"
              onClick={() => onNavigateWithFilter ? onNavigateWithFilter('Reports', { filter: 'sales-performance' }) : setActive('Reports')}
              style={{ fontSize: '0.84rem', fontWeight: 600, borderRadius: '12px' }}
            >
              {isAr ? 'تقرير الفريق' : 'Team Report'}
            </Button>
            <Button
              variant="primary"
              onClick={() => onNavigateWithFilter ? onNavigateWithFilter('Visit plan', { filter: 'approvals' }) : setActive('Visit plan')}
              style={{ fontSize: '0.84rem', fontWeight: 600, borderRadius: '12px' }}
            >
              {isAr ? `طابور الاعتماد (${metrics.pendingPlansCount})` : `Approval Queue (${metrics.pendingPlansCount})`}
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
        {/* KPI 1: Blue - Team Sales */}
        <MetricCard
          title={isAr ? 'مبيعات الفريق' : 'Team Sales'}
          value={formatCurrencyCompact(displayedSales, 'EGP', lang)}
          subtext={isAr ? `الهدف: ${formatCurrencyCompact(displayedTarget, 'EGP', lang)}` : `Quota: ${formatCurrencyCompact(displayedTarget, 'EGP', lang)}`}
          trend="+14.0%"
          isPositive={true}
          variant="blue"
          icon={TrendingUp}
          sparkline={[40, 52, 64, 76, 88, 100]}
          onClick={() => onNavigateWithFilter ? onNavigateWithFilter('Reports', { filter: 'sales-performance' }) : setActive('Reports')}
        />

        {/* KPI 2: Green - Today's Visits */}
        <MetricCard
          title={isAr ? 'زيارات اليوم الميدانية' : "Today's Team Visits"}
          value={`${metrics.completedVisitsToday} / ${metrics.plannedVisitsToday || 12}`}
          subtext={isAr ? 'زيارات مسجلة اليوم' : 'Completed vs planned today'}
          trend="+18.5%"
          isPositive={true}
          variant="green"
          icon={CalendarCheck}
          sparkline={[2, 4, 7, 9, 11, 14]}
          onClick={() => setActive('Visits')}
        />

        {/* KPI 3: Teal - Monthly Visit Completion */}
        <MetricCard
          title={isAr ? 'إنجاز زيارات الشهر' : 'Monthly Visit Rate'}
          value={`${metrics.visitCompletionRate}%`}
          subtext={isAr ? `${metrics.completedVisitsMonth} من ${metrics.scheduledVisitsMonth} زيارة` : `${metrics.completedVisitsMonth} of ${metrics.scheduledVisitsMonth} logged`}
          trend={metrics.visitCompletionRate >= 80 ? '+7.2%' : '-3.0%'}
          isPositive={metrics.visitCompletionRate >= 80}
          variant="teal"
          icon={CheckCircle2}
          sparkline={[60, 68, 74, 82, 88, 92]}
          onClick={() => onNavigateWithFilter ? onNavigateWithFilter('Reports', { filter: 'visit-coverage' }) : setActive('Reports')}
        />

        {/* KPI 4: Navy - Strategic Quota Card */}
        <DarkHeroCard
          badge={metrics.region}
          title={isAr ? 'تحقيق هدف الفريق' : 'Team Quota Pace'}
          amount={`${metrics.achievementPct}%`}
          subtitle={isAr ? `${metrics.directRepsCount} مندوب ميداني تحت إشرافك المباشر` : `${metrics.directRepsCount} direct representatives assigned`}
          progressPct={metrics.achievementPct}
          footerLeft={isAr ? 'حالة التغطية' : 'Coverage Health'}
          footerRight={metrics.achievementPct >= 85 ? (isAr ? 'صحي' : 'Healthy') : (isAr ? 'يحتاج دعم' : 'Needs Support')}
          onClick={() => onNavigateWithFilter ? onNavigateWithFilter('Reports', { filter: 'sales-performance' }) : setActive('Reports')}
        />
      </div>

      {/* ── Section C: Visual Analytics (Doctor Tier Gauge & Coverage) ─ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        <div style={{ flex: '1 1 300px' }}>
          <DonutGaugeCard
            title={isAr ? 'معدل إنجاز الزيارات الشهري' : 'Monthly Team Detailing Progress'}
            subtitle={isAr ? 'التقدم نحو تغطية أطباء الخطة الشهرية' : 'Progress toward targeted doctor visit quotas'}
            percent={metrics.visitCompletionRate}
            primaryLabel="Completed"
            secondaryLabel={isAr ? `${metrics.completedVisitsMonth} زيارة مكتملة من إجمالي الخطة` : `${metrics.completedVisitsMonth} stops completed across your supervised routes`}
            accentColor="#10B981"
            segments={[
              { label: isAr ? 'زيارات مكتملة' : 'Completed', value: metrics.completedVisitsMonth, color: '#10B981' },
              { label: isAr ? 'متبقية' : 'Remaining', value: Math.max(0, metrics.scheduledVisitsMonth - metrics.completedVisitsMonth), color: '#CBD5E1' },
            ]}
          />
        </div>

        <div style={{ flex: '2 1 500px' }}>
          {/* Direct Rep Coaching Alert Strip */}
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
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldAlert style={{ width: '18px', height: '18px', color: 'var(--amber-text, #D97706)' }} />
                <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--heading-text, #0F172A)' }}>
                  {isAr ? 'مؤشرات المتابعة والتدخل الميداني' : 'Field Coaching & Performance Alerts'}
                </h4>
              </div>
              <p style={{ margin: '3px 0 0 0', fontSize: '0.8rem', color: 'var(--muted-text, #64748B)' }}>
                {isAr
                  ? 'رصد المندوبين الذين يقل تحقيقهم عن 80% أو يتأخرون في تغطية الأطباء'
                  : 'Automated detection of reps underperforming on sales targets or doctor frequency.'}
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {metrics.repsNeedingAttention.length === 0 ? (
                <div style={{ padding: '16px', background: 'rgba(16, 185, 129, 0.12)', borderRadius: '12px', color: 'var(--green-text, #065F46)', fontSize: '0.85rem', fontWeight: 600 }}>
                  {isAr ? 'ممتاز! جميع المندوبين على المسار الصحيح بنسبة تفوق 80%' : 'All supervised representatives are on track and pacing above 80%!'}
                </div>
              ) : (
                metrics.repsNeedingAttention.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 14px',
                      borderRadius: '12px',
                      background: 'rgba(245, 158, 11, 0.12)',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--heading-text, #0F172A)' }}>{item.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--amber-text, #B45309)', fontWeight: 500 }}>{item.reason}</div>
                    </div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--amber-text, #92400E)', background: 'rgba(245, 158, 11, 0.2)', padding: '3px 8px', borderRadius: '6px' }}>
                      {item.metric}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Section D: Action Center ───────────────────────────────── */}
      <ActionCenter items={actionItems} lang={lang} />

      {/* ── Section E: Direct Rep Team Roster ──────────────────────── */}
      <div
        className="dashboard-card-section"
        style={{
          background: '#FFFFFF',
          borderRadius: '20px',
          border: '1.5px solid #E2E8F0',
          padding: '24px',
          boxShadow: '0 2px 12px rgba(15, 23, 42, 0.03)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users style={{ width: '18px', height: '18px', color: 'var(--green-text, #059669)' }} />
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--heading-text, #0F172A)' }}>
                {isAr ? 'لوحة أداء المندوبين التابعين لك مباشرة' : 'Supervised Representative Performance Roster'}
              </h3>
            </div>
            <p style={{ margin: '3px 0 0 0', fontSize: '0.8rem', color: 'var(--muted-text, #64748B)' }}>
              {isAr
                ? 'متابعة حية للمبيعات، تحقيق الأهداف، ونشاط الزيارات اليومية والشهرية لكل مندوب'
                : 'Direct comparison of monthly quota attainment, today’s logged visits, and pace status.'}
            </p>
          </div>

          <Button
            variant="secondary"
            onClick={() => onNavigateWithFilter ? onNavigateWithFilter('Reports', { filter: 'sales-performance' }) : setActive('Reports')}
            style={{ fontSize: '0.82rem', borderRadius: '10px' }}
          >
            {isAr ? 'تقرير الأداء الكامل' : 'Full Team Report'}
          </Button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: isAr ? 'right' : 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1.5px solid #E2E8F0', color: '#64748B', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <th style={{ padding: '12px 14px' }}>{isAr ? 'المندوب' : 'Representative'}</th>
                <th style={{ padding: '12px 14px' }}>{isAr ? 'الإقليم' : 'Territory'}</th>
                <th style={{ padding: '12px 14px' }}>{isAr ? 'المبيعات' : 'Sales'}</th>
                <th style={{ padding: '12px 14px' }}>{isAr ? 'الهدف' : 'Target'}</th>
                <th style={{ padding: '12px 14px' }}>{isAr ? 'نسبة الهدف' : 'Quota %'}</th>
                <th style={{ padding: '12px 14px' }}>{isAr ? 'زيارات اليوم' : 'Visits Today'}</th>
                <th style={{ padding: '12px 14px' }}>{isAr ? 'زيارات الشهر' : 'Month Visits'}</th>
                <th style={{ padding: '12px 14px' }}>{isAr ? 'الحالة' : 'Status'}</th>
              </tr>
            </thead>
            <tbody>
              {metrics.repPerformance.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '24px', textAlign: 'center', color: '#94A3B8' }}>
                    {isAr ? 'لا يوجد مندوبين مسجلين تحت إشرافك حالياً' : 'No direct representatives currently assigned to your team'}
                  </td>
                </tr>
              ) : (
                metrics.repPerformance.map((rep) => (
                  <tr
                    key={rep.id}
                    style={{ borderBottom: '1px solid #F1F5F9', fontSize: '0.88rem' }}
                  >
                    <td style={{ padding: '14px 14px', fontWeight: 700, color: 'var(--heading-text, #0F172A)' }}>{rep.name}</td>
                    <td style={{ padding: '14px 14px', color: 'var(--muted-text, #64748B)' }}>{rep.region}</td>
                    <td style={{ padding: '14px 14px', fontWeight: 800, color: 'var(--heading-text, #0F172A)' }}>
                      {formatCurrencyCompact(rep.sales, 'EGP', lang)}
                    </td>
                    <td style={{ padding: '14px 14px', color: 'var(--muted-text, #64748B)' }}>
                      {formatCurrencyCompact(rep.target, 'EGP', lang)}
                    </td>
                    <td style={{ padding: '14px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '80px', height: '7px', background: 'var(--border-soft, #E2E8F0)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${Math.min(100, rep.achievementPct)}%`,
                              height: '100%',
                              background: rep.achievementPct >= 100 ? '#10B981' : rep.achievementPct >= 80 ? '#2563EB' : '#EF4444',
                              borderRadius: '4px',
                            }}
                          />
                        </div>
                        <span style={{ fontWeight: 800, fontSize: '0.82rem', color: rep.achievementPct >= 100 ? 'var(--green-text, #059669)' : rep.achievementPct >= 80 ? 'var(--heading-text, #0F172A)' : 'var(--rose-text, #DC2626)' }}>
                          {rep.achievementPct}%
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 14px', fontWeight: 700, color: 'var(--heading-text, #0F172A)' }}>{rep.visitsCompletedToday}</td>
                    <td style={{ padding: '14px 14px', color: 'var(--heading-text, #475569)' }}>{rep.visitsCompletedMonth}</td>
                    <td style={{ padding: '14px 14px' }}>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '99px',
                          background:
                            rep.status === 'exceeding'
                              ? '#D1FAE5'
                              : rep.status === 'on_track'
                              ? '#DBEAFE'
                              : '#FEE2E2',
                          color:
                            rep.status === 'exceeding'
                              ? '#065F46'
                              : rep.status === 'on_track'
                              ? '#1E40AF'
                              : '#991B1B',
                        }}
                      >
                        {rep.status === 'exceeding' ? 'Exceeding' : rep.status === 'on_track' ? 'On Track' : 'Needs Focus'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Section F: Recent Activity Feed ────────────────────────── */}
      <RecentActivityFeed items={recentActivities} lang={lang} />
    </div>
  )
}
