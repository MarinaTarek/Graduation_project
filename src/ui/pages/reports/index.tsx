import { useState } from 'react'
import {
  ArrowLeft,
  BarChart2,
  CalendarDays,
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
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

export interface ReportsPageProps {
  role?: 'admin' | 'rep'
  currentUserName?: string
  onAction?: (msg: string) => void
}

export default function ReportsPage({
  role = 'admin',
  currentUserName = 'Alex Morgan',
  onAction,
}: ReportsPageProps) {
  // If rep, default to 'rep-scorecard' directly or show only scorecard card
  const [selectedReportId, setSelectedReportId] = useState<string | null>(
    role === 'rep' ? 'rep-scorecard' : null
  )

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
    if (onAction) {
      onAction('Export will be available when the backend is connected')
    } else {
      alert('Export will be available when the backend is connected')
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

  // Register back handler: if a report is open and admin, go back to hub
  useBackHandler(() => {
    if (selectedReportId && role === 'admin') {
      setSelectedReportId(null)
      return true
    }
    return false
  })

  const getReportTitle = (id: string | null) => {
    switch (id) {
      case 'sales-performance':
        return 'Sales Performance Report'
      case 'sell-in-vs-sell-out':
        return 'Sell-in vs Sell-out Analytics'
      case 'visit-coverage':
        return 'Doctor Detailing & Visit Coverage'
      case 'stock-expiry':
        return 'Stock Balance & Expiry Runway'
      case 'invoices-approvals':
        return 'Claims Audit & Invoice Approvals'
      case 'rep-scorecard':
        return role === 'rep' ? 'My Representative Scorecard' : 'Representative Performance Scorecard'
      default:
        return 'Analytics Report'
    }
  }

  return (
    <section className="content" style={{ paddingBottom: '60px' }}>
      {/* Page Header */}
      <div className="page-intro" style={{ marginBottom: '24px' }}>
        <div>
          <span className="eyebrow">
            <BarChart2 /> ANALYTICS & INSIGHTS
          </span>
          <h1>{selectedReportId ? getReportTitle(selectedReportId) : 'Reports'}</h1>
          <p className="story">
            {role === 'rep'
              ? 'Your personal KPI progress, physician visit frequency, and monthly sales quota attainment.'
              : selectedReportId
              ? 'Comprehensive performance metrics, historical distribution data, and field execution audit.'
              : 'Enterprise analytics hub, field force activity, inventory turnover, and billing reconciliation.'}
          </p>
        </div>

        {/* Header Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {selectedReportId && (
            <>
              {role === 'admin' && (
                <Button
                  variant="secondary"
                  onClick={() => setSelectedReportId(null)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <ArrowLeft style={{ width: '15px', height: '15px' }} />
                  All reports
                </Button>
              )}
              <Button
                variant="secondary"
                onClick={() => handleExport('Excel')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                title="Export as Excel spreadsheet"
              >
                <FileSpreadsheet style={{ width: '15px', height: '15px' }} />
                Export Excel
              </Button>
              <Button
                variant="secondary"
                onClick={() => handleExport('PDF')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                title="Export as PDF document"
              >
                <Download style={{ width: '15px', height: '15px' }} />
                Export PDF
              </Button>
              <Button
                variant="secondary"
                onClick={handlePrint}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                title="Print report"
              >
                <Printer style={{ width: '15px', height: '15px' }} />
                Print
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Error State Banner */}
      {hasError && (
        <ErrorState
          title="Unable to compile analytics dataset"
          message="A temporary connection timeout occurred while retrieving monthly ledger metrics."
          onRetry={handleRetry}
          className="mb-6"
        />
      )}

      {/* HUB VIEW: Grid of 6 Report Cards (Admin) or 1 Card (Rep) */}
      {!selectedReportId && (
        <div>
          {/* Hub Filters */}
          <ReportFilters
            filters={filters}
            onChangeFilters={handleFilterChange}
            role={role}
            currentUserName={currentUserName}
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
              <EmptyState message="No data for this period" />
              <Button
                variant="secondary"
                onClick={() => setFilters({ month: 'October 2026', regions: [], reps: [], products: [] })}
              >
                Reset active filters
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
                />
              )}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
