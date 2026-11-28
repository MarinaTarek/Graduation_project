'use client'

import { useMemo, useState } from 'react'
import {
  TrendingUp,
  Award,
  CalendarCheck,
  Package,
  Users,
  FileCheck,
  Building,
  DollarSign,
  MapPin,
  CheckCircle2,
  Clock,
  Layers,
  ArrowRight,
  Briefcase,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '@/ui/design-system/components/Button'
import { useT } from '@/lib/i18n'
import { formatCurrencyCompact } from '@/lib/format'
import { getBUMDashboardMetrics } from '@/lib/analytics/roleAnalytics'
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

export interface BUMDashboardProps {
  user: User | null
  onAction: (s: string) => void
  onOpen: (s: string) => void
  onNavigateWithFilter?: (page: string, options?: { filter?: string; overlay?: string }) => void
  setActive: (s: string) => void
}

export function BUMDashboard({
  user,
  onAction,
  onOpen,
  onNavigateWithFilter,
  setActive,
}: BUMDashboardProps) {
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
    return getBUMDashboardMetrics({
      id: user?.id,
      name: user?.name,
      role: user?.role,
      businessUnit: user?.businessUnit || 'Cardio-Metabolic',
      region: user?.region,
    })
  }, [invoices, targets, visits, visitPlans, users, user?.id, user?.name, user?.role, user?.businessUnit, user?.region])

  // Multiplier for dateRange
  const multiplier = dateRange === 'quarter' ? 2.8 : dateRange === 'year' ? 10.5 : 1
  const displayedSales = Math.round(metrics.totalSales * multiplier)
  const displayedTarget = Math.round(metrics.targetSales * multiplier)
  const displayedCashIn = Math.round(metrics.totalCashIn * multiplier)

  const buTrendPoints = [
    Math.round(displayedSales * 0.65),
    Math.round(displayedSales * 0.78),
    Math.round(displayedSales * 0.85),
    Math.round(displayedSales * 0.92),
    Math.round(displayedSales * 0.98),
    displayedSales || 150000,
  ]
  const trendLabels = ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct 2026']

  // Action Center Items for BUM
  const actionItems: ActionCenterItem[] = [
    {
      id: 'pending-plans-bum',
      title: isAr ? 'خطط زيارات معلقة للاعتماد' : 'Visit Plans Awaiting BU Approval',
      count: metrics.pendingPlansCount,
      description: isAr ? `${metrics.pendingPlansCount} خطط زيارات تحتاج اعتمادك المباشر` : `${metrics.pendingPlansCount} field itineraries awaiting your operational sign-off`,
      severity: metrics.pendingPlansCount > 0 ? 'warning' : 'success',
      icon: FileCheck,
      actionLabel: isAr ? 'طابور الاعتماد' : 'Approval Queue',
      onClick: () => onNavigateWithFilter ? onNavigateWithFilter('Visit plan', { filter: 'approvals' }) : setActive('Visit plan'),
    },
    {
      id: 'outstanding-receivables',
      title: isAr ? 'مستحقات نقدية بحاجة لمتابعة' : 'Outstanding BU Receivables',
      count: formatCurrencyCompact(metrics.outstandingReceivables, 'EGP', lang),
      description: isAr ? 'مبالغ فواتير مستحقة التحصيل لدى عملاء الوحدة' : 'Customer account balances requiring collection follow-up',
      severity: metrics.outstandingReceivables > 50000 ? 'critical' : 'info',
      icon: DollarSign,
      actionLabel: isAr ? 'التحصيلات' : 'View Cash In',
      onClick: () => setActive('Cash In'),
    },
    {
      id: 'expiring-batches-bu',
      title: isAr ? 'تشغيلات تقترب من الصلاحية' : 'BU Batches Near Expiry',
      count: metrics.expiringBatchesCount,
      description: isAr ? `مستحضرات تابعة لوحدة ${metrics.businessUnit}` : `Portfolio products in ${metrics.businessUnit} needing push`,
      severity: metrics.expiringBatchesCount > 0 ? 'warning' : 'success',
      icon: Package,
      actionLabel: isAr ? 'تقرير الصلاحية' : 'Expiry Report',
      onClick: () => onNavigateWithFilter ? onNavigateWithFilter('Reports', { filter: 'stock-expiry' }) : setActive('Reports'),
    },
  ]

  // Recent Chronological Activity Feed
  const recentActivities: ActivityFeedItem[] = useMemo(() => {
    const list: ActivityFeedItem[] = []

    metrics.pendingPlans.slice(0, 2).forEach((plan) => {
      list.push({
        id: `plan-${plan.id}`,
        title: isAr ? `خطة زيارات معلقة: ${plan.repName}` : `Plan Submitted: ${plan.repName}`,
        timestamp: plan.submittedDate || 'Recent',
        actor: plan.repName,
        badgeText: `${plan.totalStops} Stops`,
        badgeVariant: 'orange',
        icon: FileCheck,
        detail: `Period: ${plan.monthYear}`,
        onClick: () => setActive('Visit plan'),
      })
    })

    // Recent BU Invoices
    const buInvs = invoices
      .filter((inv) => !inv.needsReconciliation && inv.status !== 'Rejected')
      .slice(0, 3)
    buInvs.forEach((inv) => {
      list.push({
        id: `bu-inv-${inv.id}`,
        title: isAr ? `فاتورة بيع: ${inv.invoiceNumber || inv.id}` : `Sales Invoiced: ${inv.invoiceNumber || inv.id}`,
        timestamp: inv.issueDate || 'Today',
        actor: inv.repName || 'Field Rep',
        badgeText: formatCurrencyCompact(inv.originalAmount || 0, 'EGP', lang),
        badgeVariant: 'blue',
        icon: DollarSign,
        detail: inv.customerName ? `Client: ${inv.customerName}` : undefined,
        onClick: () => setActive('Invoices'),
      })
    })

    return list
  }, [metrics.pendingPlans, invoices, isAr, lang, setActive])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* ── Section A: Header ──────────────────────────────────────── */}
      <DashboardHeader
        badgeLabel={metrics.businessUnit}
        badgeIcon={Building}
        badgeTone="purple"
        contextLabel={isAr ? 'لوحة قيادة وحدة الأعمال' : 'Business Unit Command Center'}
        welcomeName={user?.name || (isAr ? 'مدير وحدة الأعمال' : 'Business Unit Manager')}
        description={
          isAr
            ? `المتابعة التشغيلية والتجارية الحصرية لوحدة أعمال: ${metrics.businessUnit} وفريقها الميداني`
            : `Commercial pacing, field execution, and quota attainment strictly scoped to ${metrics.businessUnit}.`
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
              {isAr ? 'تقارير الوحدة' : 'BU Reports'}
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
        {/* KPI 1: Blue - Sales */}
        <MetricCard
          title={isAr ? 'مبيعات الوحدة' : 'BU Revenue'}
          value={formatCurrencyCompact(displayedSales, 'EGP', lang)}
          subtext={isAr ? `المستهدف: ${formatCurrencyCompact(displayedTarget, 'EGP', lang)}` : `Target: ${formatCurrencyCompact(displayedTarget, 'EGP', lang)}`}
          trend="+15.8%"
          isPositive={true}
          variant="blue"
          icon={TrendingUp}
          sparkline={[48, 59, 72, 80, 91, 104]}
          onClick={() => onNavigateWithFilter ? onNavigateWithFilter('Reports', { filter: 'sales-performance' }) : setActive('Reports')}
        />

        {/* KPI 2: Green - Collections */}
        <MetricCard
          title={isAr ? 'التحصيلات النقدية' : 'BU Collections'}
          value={formatCurrencyCompact(displayedCashIn, 'EGP', lang)}
          subtext={isAr ? `المتبقي: ${formatCurrencyCompact(metrics.outstandingReceivables, 'EGP', lang)}` : `Receivables: ${formatCurrencyCompact(metrics.outstandingReceivables, 'EGP', lang)}`}
          trend="+8.2%"
          isPositive={true}
          variant="green"
          icon={DollarSign}
          sparkline={[45, 55, 68, 74, 82, 89]}
          onClick={() => setActive('Cash In')}
        />

        {/* KPI 3: Teal - Visits */}
        <MetricCard
          title={isAr ? 'تغطية زيارات الوحدة' : 'BU Visit Coverage'}
          value={`${metrics.visitCoveragePct}%`}
          subtext={isAr ? `${metrics.completedVisits} من أصل ${metrics.scheduledVisits} زيارة` : `${metrics.completedVisits} of ${metrics.scheduledVisits} visits logged`}
          trend={metrics.visitCoveragePct >= 80 ? '+6.1%' : '-1.5%'}
          isPositive={metrics.visitCoveragePct >= 80}
          variant="teal"
          icon={CalendarCheck}
          sparkline={[65, 72, 78, 82, 86, 91]}
          onClick={() => onNavigateWithFilter ? onNavigateWithFilter('Reports', { filter: 'visit-coverage' }) : setActive('Reports')}
        />

        {/* KPI 4: Navy - Strategic Hero Card */}
        <DarkHeroCard
          badge={metrics.businessUnit}
          title={isAr ? 'تحقيق هدف الوحدة' : 'BU Quota Attainment'}
          amount={`${metrics.achievementPct}%`}
          subtitle={isAr ? `${metrics.activeTeamCount} عضو فريق (${metrics.repCount} مندوبين، ${metrics.flmCount} مشرفين)` : `${metrics.activeTeamCount} active team members (${metrics.repCount} Reps, ${metrics.flmCount} FLMs)`}
          progressPct={metrics.achievementPct}
          footerLeft={isAr ? 'المرتبة في الشركة' : 'Company Ranking'}
          footerRight="#1 in Enterprise"
          onClick={() => onNavigateWithFilter ? onNavigateWithFilter('Reports', { filter: 'sales-performance' }) : setActive('Reports')}
        />
      </div>

      {/* ── Section C: Visual Analytics (Trend Chart + Regional Demand) ─ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        <div style={{ flex: '2 1 500px' }}>
          <AreaTrendChartCard
            title={isAr ? `مسار نمو وحدة ${metrics.businessUnit}` : `${metrics.businessUnit} Monthly Sales Velocity`}
            subtitle={isAr ? 'تحليل الإيرادات المحققة للفريق الميداني التابع للوحدة' : 'Historical revenue trajectory generated by your regional representatives'}
            totalText={formatCurrencyCompact(displayedSales, 'EGP', lang)}
            growthBadge="+12.8% vs benchmark"
            dataPoints={buTrendPoints}
            labels={trendLabels}
            strokeColor="#9333EA"
            gradientId="buAreaGrad"
            onClick={() => onNavigateWithFilter ? onNavigateWithFilter('Reports', { filter: 'sales-performance' }) : setActive('Reports')}
          />
        </div>

        <div style={{ flex: '1 1 300px' }}>
          <DonutGaugeCard
            title={isAr ? 'أداء المناطق الجغرافية' : 'Regional Sales Share'}
            subtitle={isAr ? 'توزيع المبيعات عبر أقاليم الوحدة' : 'Revenue distribution across BU territories'}
            percent={metrics.achievementPct}
            primaryLabel="Attained"
            secondaryLabel={isAr ? 'المنطقة الشمالية تحقق 46% من المستهدف' : 'North region drives 46% of total BU volume'}
            accentColor="#9333EA"
            segments={metrics.regionalPerformance.slice(0, 3).map((r, i) => ({
              label: r.region,
              value: `${r.achievementPct}%`,
              color: ['#9333EA', '#38BDF8', '#10B981'][i % 3],
            }))}
          />
        </div>
      </div>

      {/* ── Section D: Action Center ───────────────────────────────── */}
      <ActionCenter items={actionItems} lang={lang} />

      {/* ── Section E: FLM & Rep Breakdown Table ───────────────────── */}
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
              <Users style={{ width: '18px', height: '18px', color: 'var(--purple-text, #9333EA)' }} />
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--heading-text, #0F172A)' }}>
                {isAr ? 'أداء المشرفين والفرق الميدانية (FLM Teams)' : 'Supervisory Teams & Rep Performance'}
              </h3>
            </div>
            <p style={{ margin: '3px 0 0 0', fontSize: '0.8rem', color: 'var(--muted-text, #64748B)' }}>
              {isAr
                ? 'متابعة تفصيلية للمبيعات والأهداف ونشاط الزيارات لكل مشرف ميداني في الوحدة'
                : 'Quota pacing, rep coverage, and completed field visits organized by direct FLM team.'}
            </p>
          </div>

          <Button
            variant="secondary"
            onClick={() => onNavigateWithFilter ? onNavigateWithFilter('Reports', { filter: 'sales-performance' }) : setActive('Reports')}
            style={{ fontSize: '0.82rem', borderRadius: '10px' }}
          >
            {isAr ? 'تقرير الأداء الكامل' : 'Full Performance Report'}
          </Button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: isAr ? 'right' : 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1.5px solid #E2E8F0', color: '#64748B', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <th style={{ padding: '12px 14px' }}>{isAr ? 'المشرف الميداني / الفريق' : 'Supervisor / Team'}</th>
                <th style={{ padding: '12px 14px' }}>{isAr ? 'الإقليم' : 'Territory'}</th>
                <th style={{ padding: '12px 14px' }}>{isAr ? 'عدد المندوبين' : 'Rep Count'}</th>
                <th style={{ padding: '12px 14px' }}>{isAr ? 'المبيعات' : 'Sales Volume'}</th>
                <th style={{ padding: '12px 14px' }}>{isAr ? 'المستهدف' : 'Target'}</th>
                <th style={{ padding: '12px 14px' }}>{isAr ? 'نسبة الإنجاز' : 'Attainment'}</th>
                <th style={{ padding: '12px 14px' }}>{isAr ? 'الزيارات' : 'Visits'}</th>
              </tr>
            </thead>
            <tbody>
              {metrics.flmBreakdown.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '24px', textAlign: 'center', color: '#94A3B8' }}>
                    {isAr ? 'لا يوجد مشرفون مسجلون تحت هذه الوحدة حالياً' : 'No direct FLM teams assigned to this BU yet'}
                  </td>
                </tr>
              ) : (
                metrics.flmBreakdown.map((flm) => (
                  <tr
                    key={flm.id}
                    style={{ borderBottom: '1px solid #F1F5F9', fontSize: '0.88rem' }}
                  >
                    <td style={{ padding: '14px 14px', fontWeight: 700, color: 'var(--heading-text, #0F172A)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            background: flm.achievementPct >= 100 ? '#10B981' : flm.achievementPct >= 80 ? '#9333EA' : '#F59E0B',
                          }}
                        />
                        {flm.name}
                      </div>
                    </td>
                    <td style={{ padding: '14px 14px', color: 'var(--muted-text, #64748B)' }}>{flm.region}</td>
                    <td style={{ padding: '14px 14px', fontWeight: 600, color: 'var(--heading-text, #0F172A)' }}>{flm.repsCount}</td>
                    <td style={{ padding: '14px 14px', fontWeight: 800, color: 'var(--heading-text, #0F172A)' }}>
                      {formatCurrencyCompact(flm.sales, 'EGP', lang)}
                    </td>
                    <td style={{ padding: '14px 14px', color: 'var(--muted-text, #64748B)' }}>
                      {formatCurrencyCompact(flm.target, 'EGP', lang)}
                    </td>
                    <td style={{ padding: '14px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '85px', height: '7px', background: 'var(--border-soft, #E2E8F0)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${Math.min(100, flm.achievementPct)}%`,
                              height: '100%',
                              background: flm.achievementPct >= 100 ? '#10B981' : '#9333EA',
                              borderRadius: '4px',
                            }}
                          />
                        </div>
                        <span style={{ fontWeight: 800, fontSize: '0.82rem', color: flm.achievementPct >= 100 ? 'var(--green-text, #059669)' : 'var(--heading-text, #0F172A)' }}>
                          {flm.achievementPct}%
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 14px', color: 'var(--heading-text, #475569)' }}>{flm.completedVisits}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Section F: Bottom 2-Column (Product Portfolio & Recent Activity) ─ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* BU Product Performance */}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Package style={{ width: '18px', height: '18px', color: 'var(--purple-text, #9333EA)' }} />
              <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--heading-text, #0F172A)' }}>
                {isAr ? 'مبيعات منتجات الوحدة' : 'BU Product Sales Breakdown'}
              </h4>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--muted-text, #64748B)', fontWeight: 700 }}>
              {isAr ? 'بالقيمة والوحدات' : 'By Revenue & Units'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {metrics.productPerformance.map((prod) => (
              <div
                key={prod.productName}
                className="leaderboard-row"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  background: 'var(--surface-raised, #F8FAFC)',
                  border: '1px solid var(--border-soft, #E2E8F0)',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--heading-text, #0F172A)' }}>{prod.productName}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted-text, #64748B)' }}>
                    {prod.unitsSold.toLocaleString('en-US')} {isAr ? 'عبوة مباعة' : 'Units Sold'}
                  </div>
                </div>

                <div style={{ textAlign: isAr ? 'left' : 'right' }}>
                  <div style={{ fontWeight: 800, color: 'var(--heading-text, #0F172A)', fontSize: '0.96rem' }}>
                    {formatCurrencyCompact(prod.revenue, 'EGP', lang)}
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
