'use client'

import { AlertTriangle, Clock, Package, ShieldCheck } from 'lucide-react'
import { STOCK_EXPIRY_MOCK, type StockBatchRecord } from '../mock-data'
import type { ReportFiltersState } from './ReportFilters'

export interface StockExpiryReportProps {
  filters: ReportFiltersState
}

export function StockExpiryReport({ filters }: StockExpiryReportProps) {
  const batches = STOCK_EXPIRY_MOCK.batches.filter((b) => {
    if (filters.products.length > 0 && !filters.products.includes(b.product)) return false
    return true
  })

  const getExpiryPill = (status: StockBatchRecord['status'], monthsRemaining: number) => {
    if (status === 'critical' || monthsRemaining < 3) {
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
          Critical ({monthsRemaining} mo)
        </span>
      )
    }
    if (status === 'expiring' || monthsRemaining <= 6) {
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
          Expiring ({monthsRemaining} mo)
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
        Good ({monthsRemaining} mo)
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
        {STOCK_EXPIRY_MOCK.summary.map((stat) => (
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
            Total Inventory Volume by SKU
          </h3>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted-text)' }}>
            Physical inventory units distributed across central warehouse and regional depot points.
          </p>
        </div>

        {/* Horizontal Stacked Bars */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {STOCK_EXPIRY_MOCK.productShare.map((prod) => (
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
                  <b>{prod.units.toLocaleString()}</b> units ({prod.pct}%)
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
                    width: `${prod.pct * 2}%`,
                    maxWidth: '100%',
                    height: '100%',
                    borderRadius: '99px',
                    background: prod.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rounded-row Table: Batches with Expiry Pills */}
      <div
        className="panel"
        style={{
          padding: '20px 24px',
          borderRadius: '24px',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 600, color: 'var(--heading-text)' }}>
              Batch Manifest & Expiration Runway
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted-text)' }}>
              Pills categorize batch shelf life: Green (&gt;6 months), Amber (3-6 months), Rose (&lt;3 months).
            </p>
          </div>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ocean)' }}>
            {batches.length} active lots
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px', fontSize: '13px' }}>
            <thead>
              <tr style={{ color: 'var(--muted-text)', textAlign: 'left', fontSize: '11px', textTransform: 'uppercase' }}>
                <th style={{ padding: '8px 12px' }}>Batch Number</th>
                <th style={{ padding: '8px 12px' }}>Product</th>
                <th style={{ padding: '8px 12px' }}>Storage Location</th>
                <th style={{ padding: '8px 12px', textAlign: 'right' }}>On-Hand Qty</th>
                <th style={{ padding: '8px 12px' }}>Expiry Date</th>
                <th style={{ padding: '8px 12px', textAlign: 'center' }}>Shelf Life Status</th>
              </tr>
            </thead>
            <tbody>
              {batches.map((b) => (
                <tr
                  key={b.id}
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
                    {b.batchNo}
                  </td>
                  <td style={{ padding: '12px', fontWeight: 500, color: 'var(--heading-text)' }}>{b.product}</td>
                  <td style={{ padding: '12px', color: 'var(--muted-text)' }}>{b.location}</td>
                  <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                    {b.quantity.toLocaleString()} packs
                  </td>
                  <td style={{ padding: '12px', color: 'var(--heading-text)', fontVariantNumeric: 'tabular-nums' }}>
                    {b.expiryDate}
                  </td>
                  <td
                    style={{
                      padding: '12px 14px',
                      textAlign: 'center',
                      borderTopRightRadius: '14px',
                      borderBottomRightRadius: '14px',
                    }}
                  >
                    {getExpiryPill(b.status, b.monthsRemaining)}
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
