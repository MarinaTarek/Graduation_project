'use client'

import React, { useMemo, useState } from 'react'
import {
  Package,
  TrendingUp,
  MapPin,
  AlertTriangle,
  BarChart2,
  PieChart,
  Layers,
  ArrowUpRight,
  ShieldAlert,
  Sparkles,
  ExternalLink,
  DollarSign,
  Activity,
  CheckCircle2,
} from 'lucide-react'
import { Button } from '@/ui/design-system/components/Button'
import { useT } from '@/lib/i18n'
import { formatCurrencyCompact } from '@/lib/format'
import { getMarketingDashboardMetrics } from '@/lib/analytics/roleAnalytics'
import { useStore } from '@/data/mock/store'
import { productsStore } from '@/data/mock/products'
import { invoicesStore } from '@/data/mock/invoices'
import { batchesStore, stockMovementsStore } from '@/data/mock/stockDerived'
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

export interface MarketingDashboardProps {
  user: User | null
  onAction: (s: string) => void
  onOpen: (s: string) => void
  onNavigateWithFilter?: (page: string, options?: { filter?: string; overlay?: string }) => void
  setActive: (s: string) => void
}

const BRAND_COLORS = ['#2563EB', '#10B981', '#F59E0B', '#9333EA', '#EC4899', '#0D9488']

export function MarketingDashboard({
  user,
  onAction,
  onOpen,
  onNavigateWithFilter,
  setActive,
}: MarketingDashboardProps) {
  const { t, lang } = useT()
  const isAr = lang === 'ar'
  const [dateRange, setDateRange] = useState('month')

  // Reactive store subscriptions
  const products = useStore(productsStore)
  const invoices = useStore(invoicesStore)
  const batches = useStore(batchesStore)
  const stockMovements = useStore(stockMovementsStore)

  const metrics = useMemo(() => getMarketingDashboardMetrics(), [products, invoices, batches, stockMovements])

  const multiplier = dateRange === 'quarter' ? 2.8 : dateRange === 'year' ? 10.5 : 1
  const displayedRevenue = Math.round(metrics.totalRevenue * multiplier)
  const displayedUnits = Math.round(metrics.totalUnitsSold * multiplier)

  // Prepare brand segments for Donut chart
  const brandSegments = useMemo(() => {
    return metrics.portfolioBreakdown.slice(0, 5).map((item, idx) => ({
      label: item.name,
      value: `${item.marketSharePct}%`,
      color: BRAND_COLORS[idx % BRAND_COLORS.length],
    }))
  }, [metrics.portfolioBreakdown])

  // Multi-month trend points for Area chart
  const marketingTrendPoints = [
    Math.round(displayedRevenue * 0.65),
    Math.round(displayedRevenue * 0.72),
    Math.round(displayedRevenue * 0.84),
    Math.round(displayedRevenue * 0.90),
    Math.round(displayedRevenue * 0.95),
    displayedRevenue || 220000,
  ]
  const trendLabels = ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct 2026']

  // Action Center for Marketing Manager
  const actionItems: ActionCenterItem[] = [
    {
      id: 'critical-expiry-batches',
      title: isAr ? 'تشغيلات دوائية تقترب من الصلاحية' : 'Warehouse Batches Near Expiry',
      count: metrics.nearExpiryBatches.length,
      description: isAr ? 'تشغيلات تتطلب حملات ترويجية عاجلة خلال 90 يوماً' : 'Formulary batches requiring commercial liquidation campaigns',
      severity: metrics.nearExpiryBatches.length > 0 ? 'critical' : 'success',
      icon: AlertTriangle,
      actionLabel: isAr ? 'تحليل الصلاحية' : 'Inspect Batches',
      onClick: () => onNavigateWithFilter ? onNavigateWithFilter('Reports', { filter: 'stock-expiry' }) : setActive('Reports'),
    },
    {
      id: 'top-brand-velocity',
      title: isAr ? `المستحضر القيادي: ${metrics.topProduct.name}` : `Leading SKU: ${metrics.topProduct.name}`,
      count: `${metrics.topProduct.sharePct}%`,
      description: isAr ? 'الحصة السوقية النسبية من إجمالي مبيعات الشركة' : 'Market share contribution across total sales volume',
      severity: 'info',
      icon: Sparkles,
      actionLabel: isAr ? 'تحليل المبيعات' : 'Sales Analytics',
      onClick: () => onNavigateWithFilter ? onNavigateWithFilter('Reports', { filter: 'sell-in-vs-sell-out' }) : setActive('Reports'),
    },
    {
      id: 'regional-demand-action',
      title: isAr ? 'الطلب الإقليمي الأكثر نمواً' : 'Top Performing Sales Region',
      count: metrics.regionalDemand[0]?.region || 'North region',
      description: isAr ? 'أعلى منطقة طلباً لمستحضرات المحفظة الدوائية' : 'Region generating highest formulary sales demand',
      severity: 'success',
      icon: MapPin,
      actionLabel: isAr ? 'توزيع الطلب' : 'Regional Demand',
      onClick: () => onNavigateWithFilter ? onNavigateWithFilter('Reports', { filter: 'sell-in-vs-sell-out' }) : setActive('Reports'),
    },
  ]

  // Recent Activity Feed for Marketing
  const recentActivities: ActivityFeedItem[] = useMemo(() => {
    const list: ActivityFeedItem[] = []

    // Near expiry batches
    metrics.nearExpiryBatches.slice(0, 3).forEach((b) => {
      list.push({
        id: `exp-${b.batchNumber}`,
        title: isAr ? `تشغيلة تقترب من الصلاحية: ${b.productName}` : `Batch Near Expiry: ${b.productName}`,
        timestamp: `${b.daysUntilExpiry} ${isAr ? 'يوم متبقي' : 'days remaining'}`,
        actor: `Batch #${b.batchNumber}`,
        badgeText: `${b.remainingQty} Units`,
        badgeVariant: b.daysUntilExpiry < 60 ? 'red' : 'orange',
        icon: AlertTriangle,
        detail: `Expires on: ${b.expiryDate}`,
        onClick: () => onNavigateWithFilter ? onNavigateWithFilter('Reports', { filter: 'stock-expiry' }) : setActive('Reports'),
      })
    })

    // Recent portfolio updates
    products.slice(0, 2).forEach((p, idx) => {
      list.push({
        id: `prod-${p.code || idx}`,
        title: isAr ? `مستحضر نشط: ${p.name}` : `Formulary Product: ${p.name}`,
        timestamp: 'Active in Formulary',
        actor: p.category || 'Pharmaceutical',
        badgeText: formatCurrencyCompact(p.price || 0, 'EGP', lang),
        badgeVariant: 'teal',
        icon: Package,
        onClick: () => setActive('Stock'),
      })
    })

    return list
  }, [metrics.nearExpiryBatches, products, isAr, lang, onNavigateWithFilter, setActive])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* ── Section A: Header ──────────────────────────────────────── */}
      <DashboardHeader
        badgeLabel={isAr ? 'ذكاء السوق والمحفظة الدوائية' : 'Market Intelligence & Portfolio'}
        badgeIcon={Sparkles}
        badgeTone="purple"
        contextLabel={isAr ? `${metrics.activeProductsCount} مستحضرات نشطة` : `${metrics.activeProductsCount} Active Formulary Products`}
        welcomeName={user?.name || (isAr ? 'مدير التسويق' : 'Marketing Manager')}
        description={
          isAr
            ? 'متابعة أداء محفظة المنتجات الدوائية، الحصص السوقية النسبية، والطلب الإقليمي ومخاطر الصلاحية'
            : 'Strategic formulary monitoring, brand market share breakdown, regional demand, and batch expiry risks.'
        }
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        lang={lang}
        actions={
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button
              variant="secondary"
              onClick={() => onNavigateWithFilter ? onNavigateWithFilter('Reports', { filter: 'sell-in-vs-sell-out' }) : setActive('Reports')}
              style={{ fontSize: '0.84rem', fontWeight: 600, borderRadius: '12px' }}
            >
              {isAr ? 'تحليل المبيعات' : 'Sales Analytics'}
            </Button>
            <Button
              variant="primary"
              onClick={() => onNavigateWithFilter ? onNavigateWithFilter('Reports', { filter: 'stock-expiry' }) : setActive('Reports')}
              style={{ fontSize: '0.84rem', fontWeight: 600, borderRadius: '12px' }}
            >
              {isAr ? `تنبيهات الصلاحية (${metrics.nearExpiryBatches.length})` : `Expiry Alerts (${metrics.nearExpiryBatches.length})`}
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
        {/* KPI 1: Blue - Formulary Revenue */}
        <MetricCard
          title={isAr ? 'إجمالي إيرادات المحفظة' : 'Formulary Revenue'}
          value={formatCurrencyCompact(displayedRevenue, 'EGP', lang)}
          subtext={isAr ? 'إجمالي المبيعات المحققة للمستحضرات' : 'Invoiced revenue across active catalog'}
          trend="+16.4%"
          isPositive={true}
          variant="blue"
          icon={TrendingUp}
          sparkline={[45, 58, 68, 77, 89, 102]}
          onClick={() => onNavigateWithFilter ? onNavigateWithFilter('Reports', { filter: 'sell-in-vs-sell-out' }) : setActive('Reports')}
        />

        {/* KPI 2: Purple - Units Sold */}
        <MetricCard
          title={isAr ? 'إجمالي العبوات المباعة' : 'Units Sold'}
          value={displayedUnits.toLocaleString('en-US')}
          subtext={isAr ? 'حجم السحب الإجمالي من الصيدليات والموزعين' : 'Total units moved across all accounts'}
          trend="+11.2%"
          isPositive={true}
          variant="purple"
          icon={Package}
          sparkline={[30, 44, 52, 63, 75, 88]}
          onClick={() => onNavigateWithFilter ? onNavigateWithFilter('Reports', { filter: 'sell-in-vs-sell-out' }) : setActive('Reports')}
        />

        {/* KPI 3: Orange - Batches Near Expiry */}
        <MetricCard
          title={isAr ? 'تشغيلات تقترب من الصلاحية' : 'Batches Near Expiry'}
          value={metrics.nearExpiryBatches.length}
          subtext={isAr ? 'تشغيلات خلال 90 يوماً تحتاج تصريفاً' : 'Batches needing promotion priority (90d)'}
          trend={metrics.nearExpiryBatches.length > 0 ? '+2 batches' : '0 risk'}
          isPositive={metrics.nearExpiryBatches.length === 0}
          variant="orange"
          icon={AlertTriangle}
          sparkline={[1, 2, 3, 2, 3, metrics.nearExpiryBatches.length]}
          onClick={() => onNavigateWithFilter ? onNavigateWithFilter('Reports', { filter: 'stock-expiry' }) : setActive('Reports')}
        />

        {/* KPI 4: Navy - Strategic Top Brand Hero Card */}
        <DarkHeroCard
          badge={isAr ? 'المستحضر الرائد' : 'Market Leader'}
          title={metrics.topProduct.name}
          amount={`${metrics.topProduct.sharePct}%`}
          subtitle={isAr ? `${formatCurrencyCompact(metrics.topProduct.revenue, 'EGP', lang)} إيراد محقق` : `${formatCurrencyCompact(metrics.topProduct.revenue, 'EGP', lang)} generated`}
          progressPct={metrics.topProduct.sharePct}
          footerLeft={isAr ? 'حجم المبيعات' : 'Units Sold'}
          footerRight={`${metrics.topProduct.units.toLocaleString('en-US')} units`}
          onClick={() => onNavigateWithFilter ? onNavigateWithFilter('Reports', { filter: 'sell-in-vs-sell-out' }) : setActive('Reports')}
        />
      </div>

      {/* ── Section C: Visual Analytics (Revenue Velocity & Market Share) ─ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        <div style={{ flex: '2 1 500px' }}>
          <AreaTrendChartCard
            title={isAr ? 'اتجاهات نمو مبيعات المحفظة الدوائية' : 'Monthly Portfolio Revenue Pacing & Velocity'}
            subtitle={isAr ? 'تحليل سرعة المبيعات الإجمالية لكافة المستحضرات الدوائية' : 'Cumulative revenue trajectory generated across all therapeutic categories'}
            totalText={formatCurrencyCompact(displayedRevenue, 'EGP', lang)}
            growthBadge="+16.4% vs baseline"
            dataPoints={marketingTrendPoints}
            labels={trendLabels}
            strokeColor="#2563EB"
            gradientId="mktAreaGrad"
            onClick={() => onNavigateWithFilter ? onNavigateWithFilter('Reports', { filter: 'sell-in-vs-sell-out' }) : setActive('Reports')}
          />
        </div>

        <div style={{ flex: '1 1 300px' }}>
          <DonutGaugeCard
            title={isAr ? 'الحصص السوقية للمستحضرات' : 'Brand Market Share Breakdown'}
            subtitle={isAr ? 'نسبة مساهمة كل منتج في الإيراد' : 'Relative revenue contribution by product'}
            percent={metrics.topProduct.sharePct || 54}
            primaryLabel="Top Brand"
            secondaryLabel={isAr ? `${metrics.topProduct.name} يستحوذ على الأغلبية` : `${metrics.topProduct.name} holds primary market share`}
            accentColor="#2563EB"
            segments={brandSegments}
          />
        </div>
      </div>

      {/* ── Section D: Action Center ───────────────────────────────── */}
      <ActionCenter items={actionItems} lang={lang} />

      {/* ── Section E: Product Portfolio Table ─────────────────────── */}
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
              <Package style={{ width: '18px', height: '18px', color: '#2563EB' }} />
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0F172A' }}>
                {isAr ? 'مصفوفة أداء المحفظة الدوائية (Formulary Breakdown)' : 'Formulary Performance & Market Share Matrix'}
              </h3>
            </div>
            <p style={{ margin: '3px 0 0 0', fontSize: '0.8rem', color: '#64748B' }}>
              {isAr
                ? 'مقارنة شاملة لأسعار المستحضرات، الكميات المباعة، الإيرادات، والحصص السوقية'
                : 'Detailed SKU-level performance across unit price, volume, revenue, and relative market penetration.'}
            </p>
          </div>

          <Button
            variant="secondary"
            onClick={() => onNavigateWithFilter ? onNavigateWithFilter('Reports', { filter: 'sell-in-vs-sell-out' }) : setActive('Reports')}
            style={{ fontSize: '0.82rem', borderRadius: '10px' }}
          >
            {isAr ? 'تقرير المبيعات التفصيلي' : 'View Full Report'}
          </Button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: isAr ? 'right' : 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1.5px solid #E2E8F0', color: '#64748B', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <th style={{ padding: '12px 14px' }}>{isAr ? 'المستحضر الدوائي' : 'Product Name'}</th>
                <th style={{ padding: '12px 14px' }}>{isAr ? 'الفئة العلاجية' : 'Category'}</th>
                <th style={{ padding: '12px 14px' }}>{isAr ? 'السعر' : 'Unit Price'}</th>
                <th style={{ padding: '12px 14px' }}>{isAr ? 'العبوات المباعة' : 'Units Sold'}</th>
                <th style={{ padding: '12px 14px' }}>{isAr ? 'الإيراد المحقق' : 'Revenue'}</th>
                <th style={{ padding: '12px 14px' }}>{isAr ? 'الحصة السوقية' : 'Market Share'}</th>
              </tr>
            </thead>
            <tbody>
              {metrics.portfolioBreakdown.map((prod) => (
                <tr
                  key={prod.name}
                  style={{ borderBottom: '1px solid #F1F5F9', fontSize: '0.88rem' }}
                >
                  <td style={{ padding: '14px 14px', fontWeight: 700, color: '#0F172A' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          background: prod.marketSharePct >= 20 ? '#2563EB' : prod.marketSharePct >= 10 ? '#10B981' : '#94A3B8',
                        }}
                      />
                      {prod.name}
                    </div>
                  </td>
                  <td style={{ padding: '14px 14px', color: '#64748B' }}>{prod.category}</td>
                  <td style={{ padding: '14px 14px', color: '#64748B' }}>{formatCurrencyCompact(prod.price, 'EGP', lang)}</td>
                  <td style={{ padding: '14px 14px', fontWeight: 700, color: '#0F172A' }}>
                    {prod.unitsSold.toLocaleString('en-US')}
                  </td>
                  <td style={{ padding: '14px 14px', fontWeight: 800, color: '#0F172A' }}>
                    {formatCurrencyCompact(prod.revenue, 'EGP', lang)}
                  </td>
                  <td style={{ padding: '14px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '80px', height: '7px', background: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${Math.min(100, prod.marketSharePct * 1.5)}%`,
                            height: '100%',
                            background: prod.marketSharePct >= 20 ? '#2563EB' : '#10B981',
                            borderRadius: '4px',
                          }}
                        />
                      </div>
                      <span style={{ fontWeight: 800, fontSize: '0.82rem', color: 'var(--heading-text, #0F172A)' }}>
                        {prod.marketSharePct}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Section F: Bottom 2-Column (Regional Demand & Recent Activity) ─ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* Regional Demand Card */}
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
              <MapPin style={{ width: '18px', height: '18px', color: '#2563EB' }} />
              <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>
                {isAr ? 'الطلب الإقليمي عبر المحافظات' : 'Territory Demand Distribution'}
              </h4>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700 }}>
              {isAr ? 'حسب الحجم المالي' : 'By Invoiced Volume'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {metrics.regionalDemand.map((reg) => (
              <div
                key={reg.region}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0F172A' }}>{reg.region}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                    {isAr ? 'الأكثر طلباً:' : 'Top SKU:'} <span style={{ fontWeight: 600, color: '#2563EB' }}>{reg.topProduct}</span>
                  </div>
                </div>

                <div style={{ textAlign: isAr ? 'left' : 'right' }}>
                  <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.96rem' }}>
                    {formatCurrencyCompact(reg.totalRevenue, 'EGP', lang)}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#64748B' }}>
                    {reg.unitsSold.toLocaleString('en-US')} {isAr ? 'عبوة' : 'units'}
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
