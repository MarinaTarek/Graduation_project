import { useMemo, useState } from 'react'
import {
  Stethoscope, TrendingUp, FileText, Package,
  ChevronRight, X, AlertTriangle, RotateCcw
} from 'lucide-react'
import { Skeleton } from '@/ui/design-system/components/Skeleton'
import { customersStore, type Customer } from '@/data/mock/customers'
import { stockMovementsStore, batchesStore, getBatchesNearExpiry } from '@/data/mock/stockDerived'
import { useStore } from '@/data/mock/store'
import { useT, type TranslationKey } from '@/lib/i18n'
import { formatCurrency, formatCurrencyCompact } from '@/lib/format'
import {
  VISIT_INTERVAL_DAYS,
  homeCustomers,
  homeSamples,
  homeExpiringBatches,
  homeRegions,
  homeReceivables,
  homeReturns,
  homeKpiStrip,
  type HomeCustomer,
  type HomeReceivable,
} from '../mock-data'

function adaptCustomer(c: Customer): HomeCustomer {
  const rawClass = c.classification?.replace('Class ', '').trim() || 'A'
  const classification = (rawClass === 'B' || rawClass === 'C') ? rawClass : 'A'
  return {
    customer_id: c.id || '',
    name: c.name,
    name_ar: c.name_ar,
    classification,
    rep_id: c.rep_id || 'u-admin-1',
    rep_name: c.repName || 'Alex Morgan',
    region: c.region || 'North region',
    last_visit_date: c.last_visit_date || '2026-10-18',
    status: c.status || 'Active',
  }
}

// ── shared helpers ──────────────────────────────────────────────────────────
function daysSince(isoDate: string): number {
  return Math.floor((Date.now() - new Date(isoDate).getTime()) / 86_400_000)
}

function isOverdue(c: HomeCustomer): boolean {
  return daysSince(c.last_visit_date) > VISIT_INTERVAL_DAYS[c.classification]
}

function pill(label: string, color: string, textColor = '#fff') {
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        padding: '2px 8px', borderRadius: '99px', fontSize: '11px', fontWeight: 700,
        background: color, color: textColor, whiteSpace: 'nowrap',
        unicodeBidi: 'plaintext',
      }}
    >
      {label}
    </span>
  )
}

function CardShell({ children, onClick, style }: {
  children: React.ReactNode; onClick?: () => void; style?: React.CSSProperties
}) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--border-card)',
        boxShadow: 'var(--card-shadow)',
        borderRadius: '20px',
        padding: '20px',
        cursor: onClick ? 'pointer' : 'default',
        display: 'flex', flexDirection: 'column', gap: '14px',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

function CardTitle({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <Icon style={{ width: '15px', height: '15px', color: 'var(--ocean)' }} />
      <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--muted-text)' }}>
        {label}
      </span>
    </div>
  )
}

// ── 1. KPI Strip ────────────────────────────────────────────────────────────
export function KpiStrip({
  repId, onNav,
}: {
  repId?: string
  onNav?: (page: string, opts?: { filter?: string }) => void
}) {
  const { t } = useT()
  const stored = useStore(customersStore).filter((c) => !c.deleted_at && c.active !== false)
  const allList = stored.length > 0 ? stored.map(adaptCustomer) : homeCustomers
  const customers = repId ? allList.filter(c => c.rep_id === repId) : allList
  const total = customers.length
  const visited = customers.filter(c => !isOverdue(c)).length
  const coveragePct = total > 0 ? Math.round((visited / total) * 100) : 0

  const batches = useStore(batchesStore)
  const movements = useStore(stockMovementsStore)
  const batchesNearExpiryCount = getBatchesNearExpiry(movements, batches, 90).length

  const tiles = [
    {
      label: t('home.kpi.visitCoverage'),
      value: `${coveragePct}%`,
      sub: t('home.kpi.visitedDoctors', { visited, total }),
      color: coveragePct >= 80 ? 'var(--green-text, #16a34a)' : coveragePct >= 60 ? '#d97706' : 'var(--rose-text)',
      onClick: () => onNav?.('Clients', { filter: 'Overdue only' }),
    },
    {
      label: t('home.kpi.sellThrough'),
      value: `${homeKpiStrip.sell_through_pct}%`,
      sub: t('home.kpi.vsLastMonth'),
      color: 'var(--ocean)',
      onClick: () => onNav?.('Reports'),
    },
    {
      label: t('home.kpi.invoicesPending'),
      value: String(homeKpiStrip.invoices_pending),
      sub: t('home.kpi.avgApproval', { hours: homeKpiStrip.avg_approval_hours }),
      color: '#d97706',
      onClick: () => onNav?.('Invoices', { filter: 'Pending' }),
    },
    {
      label: t('home.kpi.batchesExpiring'),
      value: String(batchesNearExpiryCount),
      sub: t('home.kpi.next90Days'),
      color: 'var(--rose-text)',
      onClick: () => onNav?.('Stock', { filter: 'Expiring' }),
    },
  ]

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '12px',
      }}
    >
      {tiles.map((t) => (
        <button
          key={t.label}
          onClick={t.onClick}
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--border-card)',
            boxShadow: 'var(--card-shadow)',
            borderRadius: '16px',
            padding: '16px',
            textAlign: 'start',
            cursor: 'pointer',
            display: 'flex', flexDirection: 'column', gap: '4px',
          }}
        >
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted-text)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {t.label}
          </span>
          <span style={{ fontSize: '26px', fontWeight: 800, color: t.color, lineHeight: 1.1 }}>
            {t.value}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--muted-text)' }}>{t.sub}</span>
        </button>
      ))}
    </div>
  )
}

// ── 2. Visit Coverage by Class ──────────────────────────────────────────────
export function VisitCoverageByClass({
  repId, onNav,
}: {
  repId?: string
  onNav?: (page: string, opts?: { filter?: string }) => void
}) {
  const { t } = useT()
  const stored = useStore(customersStore).filter((c) => !c.deleted_at && c.active !== false)
  const allList = stored.length > 0 ? stored.map(adaptCustomer) : homeCustomers
  const customers = repId ? allList.filter(c => c.rep_id === repId) : allList
  const classes = ['A', 'B', 'C'] as const

  const stats = classes.map((cls) => {
    const group = customers.filter(c => c.classification === cls)
    const total = group.length
    const overdue = group.filter(isOverdue).length
    const visited = total - overdue
    const pct = total > 0 ? Math.round((visited / total) * 100) : 0
    return { cls, total, visited, overdue, pct }
  })

  return (
    <CardShell>
      <CardTitle icon={Stethoscope} label={t('home.pharma.visitCoverageTitle')} />
      {stats.map(({ cls, pct, total, overdue }) => (
        <button
          key={cls}
          onClick={() => onNav?.('Clients', { filter: `Class ${cls}` })}
          style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'start', padding: 0 }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--heading-text)' }}>{t('home.pharma.class', { cls })}</span>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: 'var(--muted-text)' }}>
                {overdue > 0 ? t('home.pharma.overdueCount', { count: overdue }) : t('home.pharma.allVisited')}
              </span>
              <span style={{ fontSize: '13px', fontWeight: 700, color: pct >= 80 ? 'var(--green-text, #16a34a)' : pct >= 60 ? '#d97706' : 'var(--rose-text)' }}>
                {pct}%
              </span>
            </div>
          </div>
          <div style={{ height: '8px', borderRadius: '99px', background: 'var(--surface-raised, var(--border-soft))', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: '99px',
              width: `${pct}%`,
              background: pct >= 80 ? '#16a34a' : pct >= 60 ? '#d97706' : '#ef4444',
              transition: 'width 0.4s',
            }} />
          </div>
          <span style={{ fontSize: '11px', color: 'var(--muted-text)' }}>
            {t('home.pharma.targetInterval', { days: VISIT_INTERVAL_DAYS[cls], total })}
          </span>
        </button>
      ))}
    </CardShell>
  )
}

// ── 3. Samples This Month ───────────────────────────────────────────────────
export function SamplesPanel({ repId, onNav }: { repId?: string; onNav?: (page: string) => void }) {
  const { t } = useT()
  const movements = useStore(stockMovementsStore).filter((m) => m.type === 'sample')
  const baseEntries = repId ? homeSamples.filter(s => s.rep_id === repId) : homeSamples
  const movementUnits = movements.reduce((acc, m) => acc + m.quantity, 0)
  const totalUnits = baseEntries.reduce((s, e) => s + e.samples_this_month, 0) + movementUnits

  // top 5 products
  const byProduct: Record<string, number> = {}
  baseEntries.forEach(e => { byProduct[e.product_name] = (byProduct[e.product_name] ?? 0) + e.samples_this_month })
  movements.forEach(m => { byProduct[m.productName] = (byProduct[m.productName] ?? 0) + m.quantity })
  const topProducts = Object.entries(byProduct).sort((a, b) => b[1] - a[1]).slice(0, 5)
  const maxProd = topProducts[0]?.[1] ?? 1

  // top 3 reps
  const byRep: Record<string, number> = {}
  baseEntries.forEach(e => { byRep[e.rep_name] = (byRep[e.rep_name] ?? 0) + e.samples_this_month })
  const topReps = Object.entries(byRep).sort((a, b) => b[1] - a[1]).slice(0, 3)

  return (
    <CardShell onClick={() => onNav?.('Visits')}>
      <CardTitle icon={Package} label={t('home.samples.title')} />
      <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--heading-text)', lineHeight: 1 }}>
        {totalUnits.toLocaleString()}
        <span style={{ fontSize: '14px', fontWeight: 400, color: 'var(--muted-text)', marginLeft: '6px' }}>{t('home.samples.unitsDistributed')}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {topProducts.map(([name, qty]) => (
          <div key={name}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
              <span style={{ fontSize: '12px', color: 'var(--heading-text)', fontWeight: 500 }}>{name}</span>
              <span style={{ fontSize: '12px', color: 'var(--muted-text)' }}>{qty}</span>
            </div>
            <div style={{ height: '5px', borderRadius: '99px', background: 'var(--surface-raised, var(--border-soft))' }}>
              <div style={{ height: '100%', borderRadius: '99px', width: `${Math.round((qty / maxProd) * 100)}%`, background: 'var(--ocean)' }} />
            </div>
          </div>
        ))}
      </div>
      {!repId && (
        <div style={{ borderTop: '1px solid var(--border-soft)', paddingTop: '10px' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--muted-text)', letterSpacing: '0.05em' }}>{t('home.samples.topReps')}</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
            {topReps.map(([name, qty], i) => (
              <div key={name} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', color: 'var(--heading-text)' }}>{i + 1}. {name}</span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ocean)' }}>{t('home.samples.units', { qty })}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </CardShell>
  )
}

// ── 4. Expiring Soon ────────────────────────────────────────────────────────
function expiryTone(isoDate: string): { label: string; bg: string } {
  const days = Math.floor((new Date(isoDate).getTime() - Date.now()) / 86_400_000)
  if (days < 90) return { label: `${days}d`, bg: '#ef4444' }
  if (days < 180) return { label: `${days}d`, bg: '#d97706' }
  return { label: `${days}d`, bg: '#16a34a' }
}

export function ExpiringBatchesPanel({ onOpenDetail }: { onOpenDetail?: (batchId: string) => void }) {
  const { t, lang } = useT()
  const batches = useStore(batchesStore)
  const movements = useStore(stockMovementsStore)
  const expiring = getBatchesNearExpiry(movements, batches, 90)

  const STATUS_LABELS_AR: Record<string, string> = {
    Critical: 'حرج',
    'Expiring soon': 'قارب على الانتهاء',
    Healthy: 'سليم',
    Expired: 'منتهي',
  }

  return (
    <CardShell>
      <CardTitle icon={AlertTriangle} label={t('home.batches.title')} />
      {expiring.length > 0 ? (
        expiring.slice(0, 4).map((b) => {
          const statusText = lang === 'ar' ? (STATUS_LABELS_AR[b.status_label] || b.status_label) : b.status_label
          return (
            <button
              key={b.id || b.batch_no}
              onClick={() => onOpenDetail?.(b.id)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'start', padding: '8px 0', borderBottom: '1px solid var(--border-soft)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--heading-text)' }}>{b.productName}</div>
                  <div style={{ fontSize: '11px', color: 'var(--muted-text)' }}>{t('home.batches.remaining', { batchNo: b.batch_no, qty: b.qty_remaining.toLocaleString() })}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {pill(statusText, b.status_color === 'rose' ? '#ef4444' : '#d97706')}
                  <ChevronRight style={{ width: '14px', height: '14px', color: 'var(--muted-text)' }} />
                </div>
              </div>
            </button>
          )
        })
      ) : (
        <div style={{ padding: '16px 0', textAlign: 'center', color: 'var(--muted-text)', fontSize: '12px' }}>
          {t('home.batches.empty')}
        </div>
      )}
    </CardShell>
  )
}

// ── 5. Regions Panel (Admin only) ───────────────────────────────────────────
const REGION_NAMES_AR: Record<string, string> = {
  'North region': 'المنطقة الشمالية',
  'West region': 'المنطقة الغربية',
  'Central region': 'المنطقة الوسطى',
  'East region': 'المنطقة الشرقية',
  'Tanta': 'طنطا',
  'El Mahalla El Kubra': 'المحلة الكبرى',
  'Assiut': 'أسيوط',
}

export function RegionsPanel({ onNav }: { onNav?: (page: string, opts?: { filter?: string }) => void }) {
  const { t, lang } = useT()
  const sorted = [...homeRegions].sort((a, b) => (b.sales_amount / b.target_amount) - (a.sales_amount / a.target_amount))
  const maxTarget = Math.max(...sorted.map(r => r.target_amount))

  return (
    <CardShell>
      <CardTitle icon={TrendingUp} label={t('home.regions.title')} />
      {sorted.map((r) => {
        const pct = Math.round((r.sales_amount / r.target_amount) * 100)
        return (
          <button
            key={r.region}
            onClick={() => onNav?.('Reports', { filter: r.region })}
            style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'start', padding: 0 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--heading-text)' }}>
                {lang === 'ar' ? (REGION_NAMES_AR[r.region] || r.region) : r.region}
              </span>
              <span style={{ fontSize: '12px', fontWeight: 700, color: pct >= 90 ? 'var(--green-text,#16a34a)' : pct >= 75 ? '#d97706' : 'var(--rose-text)' }}>
                {pct}%
              </span>
            </div>
            <div style={{ position: 'relative', height: '7px', borderRadius: '99px', background: 'var(--surface-raised, var(--border-soft))', overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: '99px', width: `${Math.round((r.target_amount / maxTarget) * 100)}%`, background: 'var(--border-soft)', position: 'absolute' }} />
              <div style={{ height: '100%', borderRadius: '99px', width: `${Math.round((r.sales_amount / maxTarget) * 100)}%`, background: pct >= 90 ? '#16a34a' : pct >= 75 ? '#d97706' : '#ef4444', position: 'absolute' }} />
            </div>
            <span style={{ fontSize: '11px', color: 'var(--muted-text)' }}>
              {t('home.regions.salesOfTarget', { sales: (r.sales_amount / 1000).toFixed(0), target: (r.target_amount / 1000).toFixed(0), rep: r.lead_rep })}
            </span>
          </button>
        )
      })}
    </CardShell>
  )
}

// ── 6. Receivables Panel (Admin only) ───────────────────────────────────────
export function ReceivablesPanel() {
  const { t, lang } = useT()
  const [open, setOpen] = useState(false)
  const totalOutstanding = homeReceivables.reduce((s, r) => s + r.outstanding_amount, 0)
  const totalOverdue = homeReceivables.reduce((s, r) => s + r.overdue_amount, 0)
  const top3 = [...homeReceivables].filter(r => r.days_overdue > 0).sort((a, b) => b.days_overdue - a.days_overdue).slice(0, 3)

  return (
    <>
      <CardShell onClick={() => setOpen(true)}>
        <CardTitle icon={FileText} label={t('home.receivables.title')} />
        <div style={{ display: 'flex', gap: '24px' }}>
          <div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--heading-text)' }}>
              {formatCurrencyCompact(totalOutstanding, 'EGP', lang)}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--muted-text)' }}>{t('home.receivables.outstanding')}</div>
          </div>
          <div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--rose-text)' }}>
              {formatCurrencyCompact(totalOverdue, 'EGP', lang)}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--muted-text)' }}>{t('home.receivables.overdue')}</div>
          </div>
        </div>
        <div style={{ borderTop: '1px solid var(--border-soft)', paddingTop: '10px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--muted-text)', marginBottom: '6px', letterSpacing: '0.05em' }}>
            {t('home.receivables.topLate')}
          </div>
          {top3.map(r => (
            <div key={r.customer_id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <span style={{ fontSize: '12px', color: 'var(--heading-text)', fontWeight: 500 }}>{r.customer_name}</span>
              <span style={{ fontSize: '12px', color: 'var(--rose-text)', fontWeight: 700 }}>{t('home.receivables.daysLate', { days: r.days_overdue })}</span>
            </div>
          ))}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--ocean)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
          {t('home.receivables.viewFullList')} <ChevronRight style={{ width: '13px', height: '13px' }} />
        </div>
      </CardShell>

      {/* Receivables Drawer */}
      {open && (
        <div className="modal-backdrop" onClick={() => setOpen(false)}>
          <aside className="side-sheet" onClick={e => e.stopPropagation()}>
            <div className="sheet-head">
              <div>
                <span className="eyebrow">{t('home.receivables.eyebrow')}</span>
                <h2>{t('home.receivables.drawerTitle')}</h2>
              </div>
              <button className="icon-button" onClick={() => setOpen(false)} aria-label={t('common.close')}>
                <X />
              </button>
            </div>
            <div style={{ padding: '0 24px 24px' }}>
              {homeReceivables.map(r => (
                <div key={r.customer_id} style={{ padding: '14px 0', borderBottom: '1px solid var(--border-soft)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--heading-text)' }}>{r.customer_name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--muted-text)' }}>{r.rep_name}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--heading-text)' }}>
                        {formatCurrency(r.outstanding_amount, 'EGP', lang)}
                      </div>
                      {r.overdue_amount > 0 && (
                        <div style={{ fontSize: '12px', color: 'var(--rose-text)', fontWeight: 600 }}>
                          {t('home.receivables.overdueDetail', { amount: r.overdue_amount.toLocaleString(), days: r.days_overdue })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </div>
      )}
    </>
  )
}

// ── 7. Returns Panel ────────────────────────────────────────────────────────
// Reason labels resolve through i18n; unknown reasons fall back to the raw
// mock-data string.
const REASON_KEYS: Record<string, TranslationKey> = {
  'Near expiry': 'home.returns.reasons.nearExpiry',
  'Customer rejected': 'home.returns.reasons.customerRejected',
  'Damaged packaging': 'home.returns.reasons.damagedPackaging',
}

export function ReturnsPanel({ repId }: { repId?: string }) {
  const { t } = useT()
  const entries = repId ? homeReturns.filter(r => r.rep_id === repId) : homeReturns
  const totalUnits = entries.reduce((s, r) => s + r.units_returned, 0)
  const totalSold = 12840 + 8620 + 7290 + 5410 + 4110
  const returnRate = ((totalUnits / totalSold) * 100).toFixed(1)

  // Compact breakdown of the recorded return reasons (real mock-data source).
  const reasonCounts: Record<string, number> = {}
  entries.forEach(r => { reasonCounts[r.reason] = (reasonCounts[r.reason] ?? 0) + r.units_returned })
  const reasonList = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1])
  const maxReason = reasonList[0]?.[1] ?? 1

  return (
    <CardShell>
      <CardTitle icon={RotateCcw} label={t('home.returns.title')} />
      <div className="returns-metrics">
        <div className="returns-metric">
          <span className="returns-metric__label">{t('home.returns.title')}</span>
          <span className="returns-metric__value">{totalUnits}</span>
          <span className="returns-metric__sub">{t('home.returns.unitsThisMonth')}</span>
        </div>
        <div className="returns-metric">
          <span className="returns-metric__label">{t('home.returns.rateTitle')}</span>
          <span
            className="returns-metric__value"
            style={{ color: parseFloat(returnRate) > 2 ? 'var(--rose-text)' : 'var(--green-text, #16a34a)' }}
          >
            {returnRate}%
          </span>
          <span className="returns-metric__sub">{t('home.returns.ofTotal')}</span>
        </div>
      </div>
      {reasonList.length > 0 && (
        <div style={{ borderTop: '1px solid var(--border-soft)', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--muted-text)', letterSpacing: '0.05em' }}>
            {t('home.returns.topReason')}
          </span>
          <div className="returns-reasons">
            {reasonList.slice(0, 3).map(([reason, qty]) => {
              const key = REASON_KEYS[reason]
              return (
                <div key={reason}>
                  <div className="returns-reason-row">
                    <span>{key ? t(key) : reason}</span>
                    <span>{t('home.samples.units', { qty })}</span>
                  </div>
                  <div className="returns-reason-bar">
                    <div style={{ width: `${Math.round((qty / maxReason) * 100)}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </CardShell>
  )
}
