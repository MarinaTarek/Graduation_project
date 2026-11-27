'use client'

import { useState, useEffect } from 'react'
import {
  ArrowLeft,
  BarChart2,
  CalendarDays,
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
  ShieldAlert,
} from 'lucide-react'
import { Button } from '@/ui/design-system/components/Button'
import { Skeleton } from '@/ui/design-system/components/Skeleton'
import { EmptyState } from '@/ui/design-system/components/EmptyState'
import { ErrorState } from '@/ui/design-system/components/ErrorState'
import { ReportHubGrid } from './components/ReportHubGrid'
import { ReportFilters, type ReportFiltersState } from './components/ReportFilters'
import { SalesPerformanceReport } from './components/SalesPerformanceReport'
import { SellInVsSellOutReport } from './components/SellInVsSellOutReport'
import { VisitCoverageReport } from './components/VisitCoverageReport'
import { StockExpiryReport } from './components/StockExpiryReport'
import { InvoicesApprovalsReport } from './components/InvoicesApprovalsReport'
import { RepScorecardReport } from './components/RepScorecardReport'
import { useBackHandler } from '@/lib/useBackHandler'
import { useT } from '@/lib/i18n'
import { isReportAuthorizedForRole, REPORT_CATALOG } from './reportCatalog'
import { exportReportToExcel, validateExportPermission } from '@/lib/export/reportExport'
import {
  getAuthoritativeSalesPerformance,
  getAuthoritativeVisitCoverage,
  getAuthoritativeInvoicesApprovalsSummary,
  getAuthoritativeRepScorecard,
} from '@/data/mock/reportingAnalytics'
import { batchesStore, stockMovementsStore, getBatchesNearExpiry } from '@/data/mock/stockDerived'
import type { UserRole } from '@/lib/auth/types'

export interface ReportsPageProps {
  role?: UserRole | string
  currentUserName?: string
  currentUserId?: string
  businessUnit?: string
  initialReportId?: string
  onClearFilter?: () => void
  onAction?: (msg: string) => void
}

export default function ReportsPage({
  role = 'admin',
  currentUserName = 'Alex Morgan',
  currentUserId,
  businessUnit,
  initialReportId,
  onClearFilter,
  onAction,
}: ReportsPageProps) {
  const { t, lang } = useT()

  // Determine authorized initial report ID
  const defaultReportId = role === 'rep'
    ? 'rep-scorecard'
    : (initialReportId && isReportAuthorizedForRole(initialReportId, role) ? initialReportId : null)

  const [selectedReportId, setSelectedReportId] = useState<string | null>(defaultReportId)

  // React to initialReportId changes (e.g. from Dashboard drilldown)
  useEffect(() => {
    if (initialReportId && isReportAuthorizedForRole(initialReportId, role)) {
      setSelectedReportId(initialReportId)
    }
  }, [initialReportId, role])

  const [filters, setFilters] = useState<ReportFiltersState>({
    month: 'October 2026',
    regions: [],
    reps: role === 'rep' ? [currentUserName] : [],
    products: [],
  })

  // States for loading skeleton, empty state, and error handling
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [hasError, setHasError] = useState<boolean>(false)

  const handleFilterChange = (newFilters: ReportFiltersState) => {
    setIsLoading(true)
    setFilters(newFilters)
    setTimeout(() => {
      setIsLoading(false)
    }, 250)
  }

  const handleExport = (type: 'Excel' | 'PDF') => {
    // 1. Validate export permission
    const currentUserObj = {
      id: currentUserId,
      name: currentUserName,
      role,
      businessUnit,
    }
    const authCheck = validateExportPermission(currentUserObj, selectedReportId || undefined)

    if (!authCheck.allowed) {
      const msg = lang === 'ar'
        ? (authCheck.error || 'غير مصرح بتصدير البيانات والتقارير المالية أو التشغيلية.')
        : (authCheck.error || 'Permission Denied: Medical Representatives are not permitted to export data.')
      if (onAction) onAction(msg)
      else alert(msg)
      return
    }

    if (type === 'PDF') {
      window.print()
      return
    }

    // 2. Perform Excel SpreadsheetML export for selected report
    if (!selectedReportId) return

    let columns: Array<{ key: string; label: string; type?: 'string' | 'number' | 'currency' | 'percent'; width?: number }> = []
    let data: Record<string, any>[] = []

    if (selectedReportId === 'sales-performance') {
      const perf = getAuthoritativeSalesPerformance(filters, currentUserObj)
      columns = [
        { key: 'rep', label: 'Representative', width: 140 },
        { key: 'territory', label: 'Territory', width: 120 },
        { key: 'target', label: 'Target (EGP)', type: 'currency', width: 110 },
        { key: 'actual', label: 'Actual Sales (EGP)', type: 'currency', width: 110 },
        { key: 'achievementRate', label: 'Achievement %', type: 'percent', width: 100 },
        { key: 'topProduct', label: 'Top Product', width: 130 },
      ]
      data = perf.reps.map((r) => ({
        ...r,
        target: r.target,
        actual: r.actual,
        achievementRate: r.achievementRate,
      }))
    } else if (selectedReportId === 'visit-coverage') {
      const cov = getAuthoritativeVisitCoverage(filters, currentUserObj)
      columns = [
        { key: 'rep', label: 'Representative', width: 140 },
        { key: 'planned', label: 'Planned Visits', type: 'number', width: 100 },
        { key: 'completed', label: 'Completed Visits', type: 'number', width: 100 },
        { key: 'missed', label: 'Missed Visits', type: 'number', width: 100 },
        { key: 'coveragePct', label: 'Coverage %', type: 'percent', width: 100 },
      ]
      data = cov.repCoverage
    } else if (selectedReportId === 'stock-expiry') {
      const batches = batchesStore.get()
      const movements = stockMovementsStore.get()
      const nearExpiry = getBatchesNearExpiry(movements, batches, 90)
      columns = [
        { key: 'productName', label: 'Product Name', width: 160 },
        { key: 'batchNumber', label: 'Batch #', width: 110 },
        { key: 'currentStock', label: 'Units Left', type: 'number', width: 100 },
        { key: 'expiryDate', label: 'Expiry Date', width: 110 },
        { key: 'daysToExpiry', label: 'Days to Expiry', type: 'number', width: 110 },
      ]
      data = nearExpiry.map((b) => ({
        productName: b.productName,
        batchNumber: b.batch_no,
        currentStock: b.qty_physical,
        expiryDate: b.expiry_date,
        daysToExpiry: b.days_to_expiry,
      }))
    } else if (selectedReportId === 'rep-scorecard') {
      const rep = getAuthoritativeRepScorecard(filters.reps[0] || currentUserName, currentUserObj)
      columns = [
        { key: 'metric', label: 'KPI Metric', width: 180 },
        { key: 'target', label: 'Target Benchmark', width: 130 },
        { key: 'actual', label: 'Actual Achieved', width: 130 },
        { key: 'rate', label: 'Attainment %', width: 100 },
      ]
      data = [
        { metric: 'Sales Revenue', target: `EGP ${rep.salesTarget.toLocaleString()}`, actual: `EGP ${rep.sales.toLocaleString()}`, rate: `${rep.targetPct}%` },
        { metric: 'Visits Logged', target: `${rep.visitsTarget} visits`, actual: `${rep.visitsLogged} visits`, rate: `${rep.visitsTarget > 0 ? Math.round((rep.visitsLogged / rep.visitsTarget) * 100) : 0}%` },
        { metric: 'Samples Distributed', target: '400 units', actual: `${rep.samplesDistributed} units`, rate: '100%' },
      ]
    } else {
      // Generic fallback for other reports
      columns = [
        { key: 'title', label: 'Report', width: 160 },
        { key: 'exportedAt', label: 'Date', width: 140 },
        { key: 'status', label: 'Status', width: 100 },
      ]
      data = [{ title: getReportTitle(selectedReportId), exportedAt: new Date().toISOString().slice(0, 10), status: 'Generated' }]
    }

    const res = exportReportToExcel({
      reportId: selectedReportId,
      reportTitle: getReportTitle(selectedReportId),
      columns,
      data,
      user: {
        id: currentUserId,
        name: currentUserName,
        role,
        businessUnit,
      },
    })

    if (res.success) {
      const msg = lang === 'ar' ? `تم تصدير تقرير ${getReportTitle(selectedReportId)} بنجاح.` : `Exported ${getReportTitle(selectedReportId)} to Excel successfully.`
      if (onAction) onAction(msg)
    } else {
      const err = res.error || (lang === 'ar' ? 'فشل التصدير' : 'Export failed')
      if (onAction) onAction(err)
      else alert(err)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleRetry = () => {
    setHasError(false)
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
    }, 300)
  }

  // Check if current filter produces empty results
  const isEmptyPeriod = filters.month === 'Q2 2026 (Apr - Jun)' && filters.regions.length > 3

  // Register back handler: if a report is open and not rep, go back to hub
  useBackHandler(() => {
    if (selectedReportId && role !== 'rep') {
      setSelectedReportId(null)
      onClearFilter?.()
      return true
    }
    return false
  })

  const getReportTitle = (id: string | null) => {
    switch (id) {
      case 'sales-performance':
        return t('reports.titles.salesPerformance')
      case 'sell-in-vs-sell-out':
        return t('reports.titles.sellInSellOut')
      case 'visit-coverage':
        return t('reports.titles.visitCoverage')
      case 'stock-expiry':
        return t('reports.titles.stockExpiry')
      case 'invoices-approvals':
        return t('reports.titles.invoicesApprovals')
      case 'rep-scorecard':
        return role === 'rep' ? t('reports.titles.myScorecard') : t('reports.titles.repScorecard')
      default:
        return t('reports.titles.default')
    }
  }

  const activeReportMeta = REPORT_CATALOG.find((r) => r.id === selectedReportId)

  return (
    <section className="content" style={{ paddingBottom: '60px' }}>
      {/* Page Header */}
      <div className="page-intro" style={{ marginBottom: '24px' }}>
        <div>
          <span className="eyebrow">
            <BarChart2 /> {t('reports.eyebrow')}
          </span>
          <h1>{selectedReportId ? getReportTitle(selectedReportId) : t('reports.title')}</h1>
          <p className="story">
            {role === 'rep'
              ? t('reports.storyRep')
              : selectedReportId
              ? t('reports.storyDetail')
              : t('reports.storyHub')}
          </p>
        </div>

        {/* Header Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {selectedReportId && (
            <>
              {role !== 'rep' && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSelectedReportId(null)
                    onClearFilter?.()
                  }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <ArrowLeft style={{ width: '15px', height: '15px' }} />
                  {t('reports.allReports')}
                </Button>
              )}
              <Button
                variant="secondary"
                onClick={() => handleExport('Excel')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  opacity: role === 'rep' ? 0.6 : 1,
                  cursor: role === 'rep' ? 'not-allowed' : 'pointer',
                }}
                title={role === 'rep' ? (lang === 'ar' ? 'التصدير غير مصرح للمندوبين' : 'Export not permitted for Representatives') : t('reports.exportExcelTitle')}
              >
                <FileSpreadsheet style={{ width: '15px', height: '15px' }} />
                {t('reports.exportExcel')}
              </Button>
              <Button
                variant="secondary"
                onClick={() => handleExport('PDF')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  opacity: role === 'rep' ? 0.6 : 1,
                  cursor: role === 'rep' ? 'not-allowed' : 'pointer',
                }}
                title={role === 'rep' ? (lang === 'ar' ? 'التصدير غير مصرح للمندوبين' : 'Export not permitted for Representatives') : t('reports.exportPdfTitle')}
              >
                <Download style={{ width: '15px', height: '15px' }} />
                {t('reports.exportPdf')}
              </Button>
              <Button
                variant="secondary"
                onClick={handlePrint}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                title={t('reports.printTitle')}
              >
                <Printer style={{ width: '15px', height: '15px' }} />
                {t('reports.print')}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Error State Banner */}
      {hasError && (
        <ErrorState
          title={t('reports.errorTitle')}
          message={t('reports.errorMessage')}
          onRetry={handleRetry}
          className="mb-6"
        />
      )}

      {/* HUB VIEW: Scoped Grid of Report Cards for the Authenticated Role */}
      {!selectedReportId && (
        <div>
          {/* Hub Filters */}
          <ReportFilters
            filters={filters}
            onChangeFilters={handleFilterChange}
            role={role}
            currentUserName={currentUserName}
            currentUserId={currentUserId}
            businessUnit={businessUnit}
          />

          {isLoading ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '20px',
                marginTop: '24px',
              }}
            >
              {[1, 2, 3, 4, 5, 6].map((idx) => (
                <div key={idx} className="panel" style={{ padding: '24px', borderRadius: '24px' }}>
                  <Skeleton width="52px" height="52px" radius="50%" />
                  <div style={{ marginTop: '16px' }}>
                    <Skeleton width="60%" height="22px" radius="6px" />
                    <div style={{ marginTop: '8px' }}>
                      <Skeleton width="100%" height="16px" radius="4px" />
                    </div>
                  </div>
                  <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between' }}>
                    <Skeleton width="40%" height="14px" radius="4px" />
                    <Skeleton width="70px" height="32px" radius="10px" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <ReportHubGrid onOpenReport={(id) => setSelectedReportId(id)} role={role} />
          )}
        </div>
      )}

      {/* DETAIL REPORT VIEW: Filters + Stat Capsules + Main Chart + Table */}
      {selectedReportId && (
        <div>
          {/* Top Filter Chips */}
          <ReportFilters
            filters={filters}
            onChangeFilters={handleFilterChange}
            role={role}
            currentUserName={currentUserName}
            currentUserId={currentUserId}
            businessUnit={businessUnit}
            availableFilters={activeReportMeta?.availableFilters}
          />

          {/* Loading Skeleton during data reload */}
          {isLoading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <Skeleton height="90px" radius="20px" />
                <Skeleton height="90px" radius="20px" />
                <Skeleton height="90px" radius="20px" />
              </div>
              <Skeleton height="260px" radius="24px" />
              <Skeleton height="220px" radius="24px" />
            </div>
          )}

          {/* Empty State */}
          {!isLoading && isEmptyPeriod && (
            <div
              className="panel"
              style={{
                padding: '48px 32px',
                borderRadius: '24px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px',
                marginTop: '16px',
              }}
            >
              <EmptyState message={t('reports.emptyStateMessage')} />
              <Button
                variant="secondary"
                onClick={() => setFilters({ month: 'October 2026', regions: [], reps: [], products: [] })}
              >
                {t('reports.resetFilters')}
              </Button>
            </div>
          )}

          {/* Render Selected Report Component */}
          {!isLoading && !isEmptyPeriod && (
            <div style={{ marginTop: '8px' }}>
              {selectedReportId === 'sales-performance' && (
                <SalesPerformanceReport filters={filters} />
              )}
              {selectedReportId === 'sell-in-vs-sell-out' && (
                <SellInVsSellOutReport filters={filters} />
              )}
              {selectedReportId === 'visit-coverage' && (
                <VisitCoverageReport filters={filters} />
              )}
              {selectedReportId === 'stock-expiry' && (
                <StockExpiryReport filters={filters} />
              )}
              {selectedReportId === 'invoices-approvals' && (
                <InvoicesApprovalsReport filters={filters} />
              )}
              {selectedReportId === 'rep-scorecard' && (
                <RepScorecardReport
                  filters={filters}
                  role={role}
                  currentUserName={currentUserName}
                  currentUserId={currentUserId}
                  businessUnit={businessUnit}
                />
              )}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
