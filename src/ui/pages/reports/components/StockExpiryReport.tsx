'use client'

import { useMemo } from 'react'
import { AlertTriangle, Clock, Package, ShieldCheck, Sparkles } from 'lucide-react'
import { useT } from '@/lib/i18n'
import type { ReportFiltersState } from './ReportFilters'
import { useStore } from '@/data/mock/store'
import {
  batchesStore,
  stockMovementsStore,
  deriveBatches,
  type DerivedBatch,
} from '@/data/mock/stockDerived'

export interface StockExpiryReportProps {
  filters: ReportFiltersState
}

export function StockExpiryReport({ filters }: StockExpiryReportProps) {
  const { t } = useT()
  const rawBatches = useStore(batchesStore)
  const movements = useStore(stockMovementsStore)
  const allDerived = deriveBatches(rawBatches, movements)

  const batches = allDerived.filter((b) => {
    if (filters.products.length > 0 && !filters.products.includes(b.productName)) return false
    return true
  })

  // Summary stats derived from batches
  const totalAvailable = batches
    .filter((b) => !b.is_expired)
    .reduce((sum, b) => sum + b.qty_remaining, 0)
  const criticalCount = batches.filter((b) => b.status === 'critical').length
  const expiredCount = batches.filter((b) => b.is_expired).length

  // Per-product available-stock share for the chart, from the same
  // derived batches (non-expired only), largest holding first.
  const productShares = useMemo(() => {
    const byProduct = new Map<string, number>()
    batches.forEach((b) => {
      if (b.is_expired) return
      byProduct.set(b.productName, (byProduct.get(b.productName) ?? 0) + b.qty_remaining)
    })
    const total = [...byProduct.values()].reduce((sum, value) => sum + value, 0)
    return [...byProduct.entries()]
      .map(([product, units]) => ({
        product,
        units,
        pct: total > 0 ? Math.round((units / total) * 100) : 0,
      }))
      .sort((a, b) => b.units - a.units)
  }, [batches])

  const summary = [
    {
      label: t('reports.stock.summaryAvailable'),
      value: t('reports.stock.unitsCount', { count: totalAvailable.toLocaleString() }),
      change: t('reports.stock.changeAvailable'),
      isPositive: true,
    },
    {
      label: t('reports.stock.summaryExpiring'),
      value: t('reports.stock.lotsCount', { count: criticalCount }),
      change: t('reports.stock.changeExpiring'),
      isPositive: criticalCount === 0,
    },
    {
      label: t('reports.stock.summaryExpired'),
      value: t('reports.stock.lotsCount', { count: expiredCount }),
      change: expiredCount > 0 ? t('reports.stock.changeExcluded') : t('reports.stock.changeZeroExpired'),
      isPositive: expiredCount === 0,
    },
  ]

  const getExpiryPill = (b: DerivedBatch) => {
    if (b.is_expired) {
      return (
        <span
          style={{
            fontSize: '11px',
            fontWeight: 600,
            padding: '4px 10px',
            borderRadius: '99px',
            background: '#64748b',
            color: '#ffffff',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          {t('reports.stock.pillExpired', { count: b.qty_remaining.toLocaleString() })}
        </span>
      )
    }
    if (b.status === 'critical') {
      return (
        <span
          style={{
            fontSize: '11px',
            fontWeight: 600,
            padding: '4px 10px',
            borderRadius: '99px',
            background: 'var(--rose-bg)',
            color: 'var(--rose-text)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <AlertTriangle style={{ width: '12px', height: '12px' }} />
          {t('reports.stock.pillCritical', { days: b.days_to_expiry })}
        </span>
      )
    }
    if (b.status === 'warning') {
      return (
        <span
          style={{
            fontSize: '11px',
            fontWeight: 600,
            padding: '4px 10px',
            borderRadius: '99px',
            background: 'var(--amber-bg)',
            color: 'var(--amber-text)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <Clock style={{ width: '12px', height: '12px' }} />
          {t('reports.stock.pillExpiring', { mo: Math.ceil(b.days_to_expiry / 30) })}
        </span>
      )
    }
    return (
      <span
        style={{
          fontSize: '11px',
          fontWeight: 600,
          padding: '4px 10px',
          borderRadius: '99px',
          background: 'var(--green-bg)',
          color: 'var(--green-text)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        <ShieldCheck style={{ width: '12px', height: '12px' }} />
        {t('reports.stock.pillGood')}
      </span>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 3 Summary Capsules */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
        }}
      >
        {summary.map((stat) => (
          <div
            key={stat.label}
            className="panel"
            style={{
              padding: '20px 24px',
              borderRadius: '20px',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--muted-text)' }}>
              {stat.label}
            </span>
            <div
              style={{
                fontSize: '26px',
                fontWeight: 700,
                color: 'var(--heading-text)',
                margin: '6px 0 2px',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {stat.value}
            </div>
            <div
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: stat.isPositive ? 'var(--story-em, #3e9a78)' : 'var(--rose-text)',
              }}
            >
              {stat.change}
            </div>
          </div>
        ))}
      </div>

      {/* Main Chart: Stock Quantity Per Product */}
      <div
        className="panel"
        style={{
          padding: '24px',
          borderRadius: '24px',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 600, color: 'var(--heading-text)' }}>
            {t('reports.stock.chartTitle')}
          </h3>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted-text)' }}>
            {t('reports.stock.chartSubtitle')}
          </p>
        </div>

        {/* Horizontal Stacked Bars */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {productShares.length === 0 ? (
            <div style={{ padding: '16px 0', textAlign: 'center', fontSize: '13px', color: 'var(--muted-text)' }}>
              {t('reports.stock.chartEmpty')}
            </div>
          ) : (
            productShares.map((prod) => (
            <div key={prod.product}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '13px',
                  fontWeight: 500,
                  marginBottom: '6px',
                }}
              >
                <span style={{ color: 'var(--heading-text)' }}>{prod.product}</span>
                <span style={{ color: 'var(--muted-text)', fontVariantNumeric: 'tabular-nums' }}>
                  {t('reports.stock.unitsPct', { units: prod.units.toLocaleString(), pct: prod.pct })}
                </span>
              </div>
              <div
                style={{
                  width: '100%',
                  height: '14px',
                  borderRadius: '99px',
                  background: 'var(--input-bg)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${prod.pct}%`,
                    background: 'var(--ocean)',
                    borderRadius: '99px',
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
            </div>
            ))
          )}
        </div>
      </div>

      {/* Batches Table with Expiration Runway */}
      <div
        className="panel"
        style={{
          padding: '24px',
          borderRadius: '24px',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 600, color: 'var(--heading-text)' }}>
              {t('reports.stock.tableTitle')}
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted-text)' }}>
              {t('reports.stock.tableSubtitle')}
            </p>
          </div>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ocean)' }}>
            {t('reports.stock.activeLots', { count: batches.length })}
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px', fontSize: '13px' }}>
            <thead>
              <tr style={{ color: 'var(--muted-text)', textAlign: 'start', fontSize: '11px', textTransform: 'uppercase' }}>
                <th style={{ padding: '8px 12px' }}>{t('reports.stock.thBatchNo')}</th>
                <th style={{ padding: '8px 12px' }}>{t('reports.stock.thProduct')}</th>
                <th style={{ padding: '8px 12px', textAlign: 'right' }}>{t('reports.stock.thOnHand')}</th>
                <th style={{ padding: '8px 12px' }}>{t('reports.stock.thExpiry')}</th>
                <th style={{ padding: '8px 12px', textAlign: 'center' }}>{t('reports.stock.thStatus')}</th>
              </tr>
            </thead>
            <tbody>
              {batches.map((b) => (
                <tr
                  key={b.id || b.batch_no}
                  style={{
                    background: 'var(--input-bg)',
                    borderRadius: '14px',
                  }}
                >
                  <td
                    style={{
                      padding: '12px 14px',
                      fontWeight: 600,
                      color: 'var(--heading-text)',
                      fontFamily: 'monospace',
                      borderTopLeftRadius: '14px',
                      borderBottomLeftRadius: '14px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {b.batch_no}
                      {b.is_fefo_first && (
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '1px 6px',
                            borderRadius: '99px',
                            background: 'rgba(2, 132, 199, 0.15)',
                            color: 'var(--ocean)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                          }}
                        >
                          <Sparkles size={10} /> {t('reports.stock.sellFirst')}
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '12px', fontWeight: 500, color: 'var(--heading-text)' }}>{b.productName}</td>
                  <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                    {t('reports.stock.packsUnit', { count: b.qty_remaining.toLocaleString() })}
                  </td>
                  <td style={{ padding: '12px', color: 'var(--heading-text)', fontVariantNumeric: 'tabular-nums' }}>
                    {b.expiry_date}
                  </td>
                  <td
                    style={{
                      padding: '12px 14px',
                      textAlign: 'center',
                      borderTopRightRadius: '14px',
                      borderBottomRightRadius: '14px',
                    }}
                  >
                    {getExpiryPill(b)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
