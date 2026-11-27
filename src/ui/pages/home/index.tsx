import { useState, useEffect, useMemo } from 'react'
import { Plus, Users, Clock3, FileText, Stethoscope } from 'lucide-react'
import { Button } from '@/ui/design-system/components/Button'
import { useAuth, canAccessPage } from '@/lib/auth'
import { storedUsersStore } from '@/lib/auth/mock-users'
import { useStore } from '@/data/mock/store'
import { batchesStore, stockMovementsStore, getBatchesNearExpiry } from '@/data/mock/stockDerived'
import { invoicesStore } from '@/data/mock/invoices'
import { targetsStore } from '@/data/mock/targets'
import { getAuthoritativeRepScorecard } from '@/data/mock/reportingAnalytics'
import { useT, interpolate } from '@/lib/i18n'
import { formatCurrencyCompact } from '@/lib/format'
import {
  getCurrentMonthYearLabel,
  getSystemCurrentYearMonth,
  monthLabelToYearMonth,
  MONTH_NAMES_AR,
} from '@/lib/dateUtils'
import { HomeFilters, type HomeFiltersState } from './components/HomeFilters'
import { AttentionSection } from './components/AttentionSection'
import { SellInChartPanel } from './components/SellInChartPanel'
import { TargetPanel } from './components/TargetPanel'
import { ProductsPanel } from './components/ProductsPanel'
import { TopRepsPanel } from './components/TopRepsPanel'
import { QuoteCard } from './components/QuoteCard'
import {
  KpiStrip,
  VisitCoverageByClass,
  SamplesPanel,
  ExpiringBatchesPanel,
  RegionsPanel,
  ReceivablesPanel,
  ReturnsPanel,
} from './components/PharmaSections'
import { homeAttentionItems, homeProducts, homeReps } from './mock-data'

import { AdminDashboard } from './components/AdminDashboard'
import { BUMDashboard } from './components/BUMDashboard'
import { FLMDashboard } from './components/FLMDashboard'
import { RepDashboard } from './components/RepDashboard'
import { MarketingDashboard } from './components/MarketingDashboard'

export interface HomePageProps {
  onAction: (s: string) => void
  onOpen: (s: string) => void
  range: string
  setRange: (s: string) => void
  setActive: (s: string) => void
  onNavigateWithFilter?: (page: string, options?: { filter?: string; overlay?: string }) => void
  onSelectRep?: (repName: string) => void
}

export default function HomePage({
  onAction,
  onOpen,
  range,
  setRange,
  setActive,
  onNavigateWithFilter,
  onSelectRep,
}: HomePageProps) {
  const { user, role } = useAuth()
  const { t, lang } = useT()

  // ── Role-Specific Personalized Dashboards ──────────────────────────────────
  if (role === 'business_unit_manager') {
    return (
      <section className="content" style={{ paddingBottom: '60px' }}>
        <BUMDashboard
          user={user}
          onAction={onAction}
          onOpen={onOpen}
          onNavigateWithFilter={onNavigateWithFilter}
          setActive={setActive}
        />
      </section>
    )
  }

  if (role === 'first_line_manager') {
    return (
      <section className="content" style={{ paddingBottom: '60px' }}>
        <FLMDashboard
          user={user}
          onAction={onAction}
          onOpen={onOpen}
          onNavigateWithFilter={onNavigateWithFilter}
          setActive={setActive}
        />
      </section>
    )
  }

  if (role === 'rep') {
    return (
      <section className="content" style={{ paddingBottom: '60px' }}>
        <RepDashboard
          user={user}
          onAction={onAction}
          onOpen={onOpen}
          onNavigateWithFilter={onNavigateWithFilter}
          setActive={setActive}
        />
      </section>
    )
  }

  if (role === 'marketing_manager') {
    return (
      <section className="content" style={{ paddingBottom: '60px' }}>
        <MarketingDashboard
          user={user}
          onAction={onAction}
          onOpen={onOpen}
          onNavigateWithFilter={onNavigateWithFilter}
          setActive={setActive}
        />
      </section>
    )
  }

  if (role === 'admin') {
    return (
      <section className="content" style={{ paddingBottom: '60px' }}>
        <AdminDashboard
          user={user}
          onAction={onAction}
          onOpen={onOpen}
          onNavigateWithFilter={onNavigateWithFilter}
          setActive={setActive}
        />
      </section>
    )
  }

  // Fallback for default / unassigned sessions
  return (
    <section className="content" style={{ paddingBottom: '60px' }}>
      <AdminDashboard
        user={user}
        onAction={onAction}
        onOpen={onOpen}
        onNavigateWithFilter={onNavigateWithFilter}
        setActive={setActive}
      />
    </section>
  )
}
