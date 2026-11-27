'use client'

import { useMemo, useState } from 'react'
import {
  TrendingUp,
  Award,
  CalendarCheck,
  Package,
  AlertTriangle,
  UserCheck,
  FileCheck,
  ArrowRight,
  DollarSign,
  ShieldAlert,
  Building2,
  Users,
  Activity,
  Layers,
  CheckCircle2,
  Clock,
  Briefcase,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/ui/design-system/components/Button'
import { useT } from '@/lib/i18n'
import { formatCurrencyCompact } from '@/lib/format'
import { getAdminDashboardMetrics } from '@/lib/analytics/roleAnalytics'
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
  AreaTrendChartCard,
  DashboardHeader,
  ActionCenter,
  RecentActivityFeed,
  type ActionCenterItem,
  type ActivityFeedItem,
} from './DashboardShared'

export interface AdminDashboardProps {
  user: User | null
  onAction: (s: string) => void
  onOpen: (s: string) => void
  onNavigateWithFilter?: (page: string, options?: { filter?: string; overlay?: string }) => void
  setActive: (s: string) => void
}

export function AdminDashboard({
  user,
  onAction,
  onOpen,
  onNavigateWithFilter,
  setActive,
}: AdminDashboardProps) {
  const { t, lang } = useT()
  const isAr = lang === 'ar'
  const [dateRange, setDateRange] = useState('month')

  // Subscribe to reactive stores
  const invoices = useStore(invoicesStore)
  const targets = useStore(targetsStore)
  const visits = useStore(visitsStore)
  const visitPlans = useStore(visitPlansStore)
  const users = useStore(usersStore)

  const metrics = useMemo(() => getAdminDashboardMetrics(), [invoices, targets, visits, visitPlans, users])

  // Responsive multiplier based on dateRange
  const multiplier = dateRange === 'quarter' ? 2.8 : dateRange === 'year' ? 10.5 : 1
  const displayedSales = Math.round(metrics.totalSales * multiplier)
  const displayedTarget = Math.round(metrics.targetSales * multiplier)
  const displayedCashIn = Math.round(metrics.totalCashIn * multiplier)

  // Multi-month trend points for Area chart
  const revenueTrendPoints = [
    Math.round(displayedSales * 0.62),
    Math.round(displayedSales * 0.74),
    Math.round(displayedSales * 0.81),
    Math.round(displayedSales * 0.78),
    Math.round(displayedSales * 0.91),
    displayedSales || 290000,
  ]
  const trendLabels = ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct 2026']

  // Action Center Items
  const actionItems: ActionCenterItem[] = [
    {
      id: 'pending-users',
      title: isAr ? 'طلبات تسجيل حسابات مستخدمين' : 'Pending User Signups',
      count: metrics.pendingUsersCount,
      description: isAr ? 'حسابات ميدانية تنتظر التفعيل والصلاحيات' : 'Accounts awaiting executive authorization & territory assignment',
      severity: metrics.pendingUsersCount > 0 ? 'warning' : 'success',
      icon: UserCheck,
      actionLabel: isAr ? 'مراجعة الحسابات' : 'Review Accounts',
      onClick: () => onNavigateWithFilter ? onNavigateWithFilter('Users', { filter: 'pending' }) : setActive('Users'),
    },
    {
      id: 'pending-plans',
      title: isAr ? 'خطط زيارات معلقة للاعتماد' : 'Visit Plans Awaiting Approval',
      count: metrics.pendingPlansCount,
      description: isAr ? 'خطط شهرية مرفوعة من مندوبي الوحدات' : 'Monthly itineraries submitted by field reps across all BUs',
      severity: metrics.pendingPlansCount > 0 ? 'info' : 'success',
      icon: FileCheck,
      actionLabel: isAr ? 'طابور الاعتماد' : 'Approval Queue',
      onClick: () => setActive('Visit plan'),
    },
    {
      id: 'expiring-batches',
      title: isAr ? 'تشغيلات تقترب من الصلاحية' : 'Warehouse Batches Near Expiry',
      count: metrics.expiringBatchesCount,
      description: isAr ? 'تشغيلات تتطلب صرفاً عاجلاً خلال 90 يوماً' : 'Batches requiring rapid commercial liquidation (90 days window)',
      severity: metrics.expiringBatchesCount > 0 ? 'critical' : 'success',
      icon: Package,
      actionLabel: isAr ? 'إدارة المخزون' : 'Inspect Batches',
      onClick: () => onNavigateWithFilter ? onNavigateWithFilter('Reports', { filter: 'stock-expiry' }) : setActive('Reports'),
    },
  ]

  // Recent Chronological Activity Feed
  const recentActivities: ActivityFeedItem[] = useMemo(() => {
    const list: ActivityFeedItem[] = []

    // Recent invoices
    const sortedInvs = [...invoices].sort((a, b) => (b.issueDate || '').localeCompare(a.issueDate || '')).slice(0, 3)
    sortedInvs.forEach((inv) => {
      list.push({
        id: `inv-${inv.id}`,
        title: isAr ? `فاتورة مبيعات جديدة: ${inv.invoiceNumber || inv.id}` : `Sales Invoice Recorded: ${inv.invoiceNumber || inv.id}`,
        timestamp: inv.issueDate || 'Today',
        actor: inv.repName || 'Field Representative',
        badgeText: formatCurrencyCompact(inv.originalAmount || 0, 'EGP', lang),
        badgeVariant: 'blue',
        icon: DollarSign,
        detail: inv.customerName ? `Client: ${inv.customerName}` : undefined,
        onClick: () => setActive('Invoices'),
      })
    })

    // Recent completed visits
    const sortedVisits = [...visits].filter((v) => v.status === 'Completed').slice(0, 2)
    sortedVisits.forEach((v) => {
      list.push({
        id: `visit-${v.id}`,
        title: isAr ? `زيارة طبية مكتملة: ${v.clientName || 'طبيب'}` : `Field Visit Logged: ${v.clientName || 'Dr. Client'}`,
        timestamp: v.date || 'Today',
        actor: v.repName || 'Medical Rep',
        badgeText: isAr ? 'مكتملة' : 'Completed',
        badgeVariant: 'green',
        icon: CalendarCheck,
        detail: v.detail || 'Doctor detailing completed with feedback',
        onClick: () => setActive('Visits'),
      })
    })

    return list
  }, [invoices, visits, isAr, lang, setActive])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* ── Section A: Header ──────────────────────────────────────── */}
      <DashboardHeader
        badgeLabel={isAr ? 'الإدارة التنفيذية العامة' : 'Executive Headquarters'}
        badgeIcon={Building2}
        badgeTone="blue"
        contextLabel={isAr ? 'بيانات المؤسسة الموحدة' : 'Unified Enterprise Data'}
        welcomeName={user?.name || (isAr ? 'المدير العام' : 'Executive Admin')}
        description={
          isAr
            ? 'متابعة شاملة للإيرادات والأهداف المالية ومقارنة وحدات الأعمال الخمس في الجمهورية'
            : 'Enterprise-wide revenue pacing, quota attainment, cash collections, and cross-BU intelligence.'
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
              {isAr ? 'كافة التقارير' : 'All Reports'}
            </Button>
            <Button
              variant="primary"
              onClick={() => onNavigateWithFilter ? onNavigateWithFilter('Users') : setActive('Users')}
              style={{ fontSize: '0.84rem', fontWeight: 600, borderRadius: '12px' }}
            >
              {isAr ? 'إدارة المستخدمين' : 'Manage Users'}
            </Button>
          </div>
        }
      />

      {/* ── Section B: Colorful KPI Cards Grid ──────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: '16px',
        }}
      >
        {/* KPI 1: Blue - Sales & Revenue */}
        <MetricCard
          title={isAr ? 'المبيعات الإجمالية' : 'Total Revenue'}
          value={formatCurrencyCompact(displayedSales, 'EGP', lang)}
          subtext={isAr ? `المستهدف: ${formatCurrencyCompact(displayedTarget, 'EGP', lang)}` : `Quota: ${formatCurrencyCompact(displayedTarget, 'EGP', lang)}`}
          trend="+14.2%"
          isPositive={true}
          variant="blue"
          icon={TrendingUp}
          sparkline={[42, 58, 65, 78, 88, 98, 108]}
          onClick={() => onNavigateWithFilter ? onNavigateWithFilter('Reports', { filter: 'sales-performance' }) : setActive('Reports')}
        />

        {/* KPI 2: Green - Collections */}
        <MetricCard
          title={isAr ? 'التحصيلات النقدية' : 'Cash Collected'}
          value={formatCurrencyCompact(displayedCashIn, 'EGP', lang)}
          subtext={isAr ? `المتأخرات: ${formatCurrencyCompact(metrics.totalOverdue, 'EGP', lang)}` : `Overdue: ${formatCurrencyCompact(metrics.totalOverdue, 'EGP', lang)}`}
          trend="+9.4%"
          isPositive={true}
          variant="green"
          icon={DollarSign}
          sparkline={[50, 62, 70, 75, 84, 92]}
          onClick={() => setActive('Cash In')}
        />

        {/* KPI 3: Teal - Field Coverage */}
        <MetricCard
          title={isAr ? 'تغطية الزيارات' : 'Visit Coverage'}
          value={`${metrics.visitCoveragePct}%`}
          subtext={isAr ? `${metrics.completedVisits} من أصل ${metrics.scheduledVisits} زيارة` : `${metrics.completedVisits} of ${metrics.scheduledVisits} logged`}
          trend={metrics.visitCoveragePct >= 80 ? '+5.3%' : '-2.1%'}
          isPositive={metrics.visitCoveragePct >= 80}
          variant="teal"
          icon={CalendarCheck}
          sparkline={[70, 75, 80, 85, 89, 93]}
          onClick={() => onNavigateWithFilter ? onNavigateWithFilter('Reports', { filter: 'visit-coverage' }) : setActive('Reports')}
        />

        {/* KPI 4: Navy - Strategic Contrast Hero Card */}
        <DarkHeroCard
          badge={isAr ? 'نسبة الهدف' : 'Quota Attainment'}
          title={isAr ? 'تحقيق الأهداف الكلية' : 'Enterprise Quota'}
          amount={`${metrics.achievementPct}%`}
          subtitle={isAr ? `${metrics.activeRepsCount} مندوب ميداني نشط` : `${metrics.activeRepsCount} active field representatives`}
          progressPct={metrics.achievementPct}
          footerLeft={isAr ? 'حالة الأداء' : 'Enterprise Pace'}
          footerRight={metrics.achievementPct >= 100 ? (isAr ? 'متجاوز للمستهدف' : 'Exceeding Quota') : (isAr ? 'على المسار' : 'On Track')}
          onClick={() => onNavigateWithFilter ? onNavigateWithFilter('Reports', { filter: 'sales-performance' }) : setActive('Reports')}
        />
      </div>

      {/* ── Section C: Visual Analytics (Area Chart + Doctor Coverage) ─ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', alignItems: 'stretch' }}>
        <div style={{ flex: '2 1 500px' }}>
          <AreaTrendChartCard
            title={isAr ? 'اتجاهات نمو الإيرادات والسرعة البيعية' : 'Monthly Revenue Pacing & Velocity Trajectory'}
            subtitle={isAr ? 'تحليل مسار المبيعات المحققة عبر الأشهر التشغيلية الستة الأخيرة' : 'Realized invoiced revenue trajectory across recent operating cycles'}
            totalText={formatCurrencyCompact(displayedSales, 'EGP', lang)}
            growthBadge="+14.2% vs baseline"
            dataPoints={revenueTrendPoints}
            labels={trendLabels}
            strokeColor="#2563EB"
            gradientId="adminAreaGrad"
            onClick={() => onNavigateWithFilter ? onNavigateWithFilter('Reports', { filter: 'sales-performance' }) : setActive('Reports')}
          />
        </div>

        <div style={{ flex: '1 1 300px' }}>
          <DonutGaugeCard
            title={isAr ? 'توزيع تغطية الأطباء' : 'Doctor Class Coverage'}
            subtitle={isAr ? 'نسب الزيارات حسب فئة الطبيب المستهدف' : 'Physician coverage breakdown by target tier'}
            percent={metrics.visitCoveragePct || 84}
            primaryLabel="Coverage"
            secondaryLabel={isAr ? 'الفئة (أ) تشكل 68% من إجمالي الزيارات الميدانية' : 'Class A represents 68% of logged field visits'}
            accentColor="#2563EB"
            segments={[
              { label: 'Class A (High Priority)', value: '68%', color: '#2563EB' },
              { label: 'Class B (Standard)', value: '24%', color: '#60A5FA' },
              { label: 'Class C (General)', value: '8%', color: '#CBD5E1' },
            ]}
          />
        </div>
      </div>

      {/* ── Section D: Action Center ───────────────────────────────── */}
      <ActionCenter items={actionItems} lang={lang} />

      {/* ── Section E: Business Unit Comparison Matrix ─────────────── */}
      <div
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
              <Layers style={{ width: '18px', height: '18px', color: '#2563EB' }} />
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0F172A' }}>
                {isAr ? 'مصفوفة أداء وحدات الأعمال (Business Units)' : 'Business Unit Commercial Performance Matrix'}
              </h3>
            </div>
            <p style={{ margin: '3px 0 0 0', fontSize: '0.8rem', color: '#64748B' }}>
              {isAr
                ? 'مقارنة دقيقة للإيرادات والأهداف ومعدلات الإنجاز على مستوى جميع وحدات الشركة'
                : 'Direct cross-comparison of revenues, targets, and visit volumes across all 5 business units.'}
            </p>
          </div>

          <Button
            variant="secondary"
            onClick={() => onNavigateWithFilter ? onNavigateWithFilter('Reports', { filter: 'sales-performance' }) : setActive('Reports')}
            style={{ fontSize: '0.82rem', borderRadius: '10px' }}
          >
            {isAr ? 'عرض التقرير التفصيلي' : 'View Full Report'}
          </Button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: isAr ? 'right' : 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1.5px solid #E2E8F0', color: '#64748B', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <th style={{ padding: '12px 14px' }}>{isAr ? 'وحدة الأعمال' : 'Business Unit'}</th>
                <th style={{ padding: '12px 14px' }}>{isAr ? 'المبيعات الفعلية' : 'Actual Sales'}</th>
                <th style={{ padding: '12px 14px' }}>{isAr ? 'الهدف المالي' : 'Quota Target'}</th>
                <th style={{ padding: '12px 14px' }}>{isAr ? 'نسبة الإنجاز' : 'Achievement %'}</th>
                <th style={{ padding: '12px 14px' }}>{isAr ? 'المندوبين' : 'Field Reps'}</th>
                <th style={{ padding: '12px 14px' }}>{isAr ? 'الزيارات المنفذة' : 'Completed Visits'}</th>
                <th style={{ padding: '12px 14px' }}>{isAr ? 'إجراء' : 'Action'}</th>
              </tr>
            </thead>
            <tbody>
              {metrics.buComparison.map((buItem) => (
                <tr
                  key={buItem.bu}
                  style={{ borderBottom: '1px solid #F1F5F9', fontSize: '0.88rem' }}
                >
                  <td style={{ padding: '14px 14px', fontWeight: 700, color: '#0F172A' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          background: buItem.achievementPct >= 100 ? '#10B981' : buItem.achievementPct >= 80 ? '#2563EB' : '#F59E0B',
                        }}
                      />
                      {buItem.bu}
                    </div>
                  </td>
                  <td style={{ padding: '14px 14px', fontWeight: 800, color: '#0F172A' }}>
                    {formatCurrencyCompact(buItem.sales, 'EGP', lang)}
                  </td>
                  <td style={{ padding: '14px 14px', color: '#64748B' }}>
                    {formatCurrencyCompact(buItem.target, 'EGP', lang)}
                  </td>
                  <td style={{ padding: '14px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '90px', height: '7px', background: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${Math.min(100, buItem.achievementPct)}%`,
                            height: '100%',
                            background: buItem.achievementPct >= 100 ? '#10B981' : '#2563EB',
                            borderRadius: '4px',
                          }}
                        />
                      </div>
                      <span style={{ fontWeight: 800, fontSize: '0.82rem', color: buItem.achievementPct >= 100 ? '#059669' : '#0F172A' }}>
                        {buItem.achievementPct}%
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 14px', color: '#475569', fontWeight: 600 }}>{buItem.repsCount}</td>
                  <td style={{ padding: '14px 14px', color: '#475569' }}>{buItem.visitsCompleted}</td>
                  <td style={{ padding: '14px 14px' }}>
                    <Button
                      variant="secondary"
                      onClick={() => onNavigateWithFilter ? onNavigateWithFilter('Reports', { filter: 'sales-performance' }) : setActive('Reports')}
                      style={{ padding: '5px 12px', fontSize: '0.78rem', borderRadius: '8px' }}
                    >
                      {isAr ? 'فحص' : 'Inspect'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Section F: Bottom 2-Column (Leaderboard & Recent Activity) ─ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* Top Reps Leaderboard */}
        <div
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award style={{ width: '18px', height: '18px', color: '#D97706' }} />
              <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>
                {isAr ? 'المندوبون الأعلى تحقيقاً للأهداف' : 'Top Performing Field Representatives'}
              </h4>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700 }}>
              {isAr ? 'حسب نسبة الهدف' : 'By Quota %'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {metrics.topPerformers.map((rep, idx) => (
              <div
                key={rep.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  background: idx === 0 ? 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)' : '#F8FAFC',
                  border: idx === 0 ? '1.5px solid rgba(245, 158, 11, 0.3)' : '1px solid #E2E8F0',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      background: idx === 0 ? '#F59E0B' : '#E2E8F0',
                      color: idx === 0 ? '#FFFFFF' : '#475569',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                    }}
                  >
                    #{idx + 1}
                  </span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0F172A' }}>{rep.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{rep.bu}</div>
                  </div>
                </div>

                <div style={{ textAlign: isAr ? 'left' : 'right' }}>
                  <div style={{ fontWeight: 800, color: '#059669', fontSize: '0.98rem' }}>
                    {rep.achievementPct}%
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                    {formatCurrencyCompact(rep.sales, 'EGP', lang)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chronological Recent Activity Feed */}
        <RecentActivityFeed items={recentActivities} lang={lang} />
      </div>
    </div>
  )
}
