'use client'

import { SALES_PERFORMANCE_MOCK, type SalesRepBreakdown } from '../mock-data'
import { StatusPill } from '@/ui/design-system/components/StatusPill'
import { Avatar } from '@/ui/design-system/components/Avatar'
import type { ReportFiltersState } from './ReportFilters'

export interface SalesPerformanceReportProps {
  filters: ReportFiltersState
}

export function SalesPerformanceReport({ filters }: SalesPerformanceReportProps) {
  // Filter by reps and regions if selected
  const reps = SALES_PERFORMANCE_MOCK.byRep.filter((r) => {
    if (filters.reps.length > 0 && !filters.reps.includes(r.rep)) return false
    if (filters.regions.length > 0 && !filters.regions.some((reg) => r.territory.includes(reg.split(' ')[0]))) return false
    return true
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 3 Stat Capsules */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
        }}
      >
        {SALES_PERFORMANCE_MOCK.summary.map((stat) => (
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

      {/* Main Chart: Sales vs Target by Rep & Product Breakdown */}
      <div
        className="panel"
        style={{
          padding: '24px',
          borderRadius: '24px',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            gap: '12px',
          }}
        >
          <div>
            <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 600, color: 'var(--heading-text)' }}>
              Sales Revenue vs Target by Field Rep
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted-text)' }}>
              Comparison of actual sales achieved against quota with product contribution breakdown.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px', color: 'var(--muted-text)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--ocean)' }} />
              Cardiwell
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--sky)' }} />
              Neurofen
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--green)' }} />
              Immunex / Others
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '2px', background: 'var(--rose)' }} />
              Target line
            </span>
          </div>
        </div>

        {/* SVG Grouped/Stacked Bar Chart */}
        <div style={{ width: '100%', overflowX: 'auto' }}>
          <div style={{ minWidth: '550px' }}>
            <svg viewBox="0 0 650 240" style={{ width: '100%', height: 'auto', display: 'block' }}>
              {/* Horizontal Grid lines */}
              {[0, 50000, 100000, 150000, 200000, 250000].map((val) => {
                const y = 200 - (val / 250000) * 170
                return (
                  <g key={val}>
                    <line x1="50" y1={y} x2="630" y2={y} stroke="var(--border-subtle)" strokeDasharray="3 3" />
                    <text x="42" y={y + 4} textAnchor="end" fontSize="10" fill="var(--muted-text)">
                      ${val / 1000}k
                    </text>
                  </g>
                )
              })}

              {/* Rep Bars */}
              {reps.map((r, idx) => {
                const repSlotWidth = (630 - 60) / Math.max(reps.length, 1)
                const groupX = 65 + idx * repSlotWidth + repSlotWidth * 0.15
                const barWidth = Math.min(repSlotWidth * 0.45, 52)

                // Target line position
                const targetY = 200 - (r.target / 250000) * 170

                // Product stacked heights
                let currentY = 200
                return (
                  <g key={r.id}>
                    {/* Actual Stacked Bar */}
                    {r.productBars.map((p, pIdx) => {
                      const h = (p.amount / 250000) * 170
                      currentY -= h
                      return (
                        <rect
                          key={p.product}
                          x={groupX}
                          y={currentY}
                          width={barWidth}
                          height={h}
                          fill={p.color}
                          rx={pIdx === r.productBars.length - 1 ? 4 : 0}
                        />
                      )
                    })}

                    {/* Target benchmark marker */}
                    <line
                      x1={groupX - 6}
                      y1={targetY}
                      x2={groupX + barWidth + 6}
                      y2={targetY}
                      stroke="var(--rose)"
                      strokeWidth="2.5"
                      strokeDasharray="2 2"
                    />

                    {/* Rep Name Label */}
                    <text
                      x={groupX + barWidth / 2}
                      y="218"
                      textAnchor="middle"
                      fontSize="11"
                      fontWeight="500"
                      fill="var(--heading-text)"
                    >
                      {r.rep.split(' ')[0]}
                    </text>
                    <text
                      x={groupX + barWidth / 2}
                      y="232"
                      textAnchor="middle"
                      fontSize="9.5"
                      fill="var(--muted-text)"
                    >
                      {r.achievementRate}%
                    </text>
                  </g>
                )
              })}
            </svg>
          </div>
        </div>
      </div>

      {/* Rounded-row Table */}
      <div
        className="panel"
        style={{
          padding: '20px 24px',
          borderRadius: '24px',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600, color: 'var(--heading-text)' }}>
          Territory Rep Performance Breakdown
        </h3>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px', fontSize: '13px' }}>
            <thead>
              <tr style={{ color: 'var(--muted-text)', textAlign: 'left', fontSize: '11px', textTransform: 'uppercase' }}>
                <th style={{ padding: '8px 12px' }}>Representative</th>
                <th style={{ padding: '8px 12px' }}>Territory</th>
                <th style={{ padding: '8px 12px', textAlign: 'right' }}>Target Quota</th>
                <th style={{ padding: '8px 12px', textAlign: 'right' }}>Actual Revenue</th>
                <th style={{ padding: '8px 12px', textAlign: 'right' }}>Attainment</th>
                <th style={{ padding: '8px 12px' }}>Top Performing SKU</th>
                <th style={{ padding: '8px 12px', textAlign: 'center' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {reps.map((r) => (
                <tr
                  key={r.id}
                  style={{
                    background: 'var(--input-bg)',
                    borderRadius: '14px',
                  }}
                >
                  <td style={{ padding: '12px 14px', borderTopLeftRadius: '14px', borderBottomLeftRadius: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Avatar initials={r.rep.split(' ').map((n) => n[0]).join('')} size="sm" />
                      <span style={{ fontWeight: 600, color: 'var(--heading-text)' }}>{r.rep}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px', color: 'var(--muted-text)' }}>{r.territory}</td>
                  <td style={{ padding: '12px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                    ${r.target.toLocaleString()}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: 'var(--heading-text)', fontVariantNumeric: 'tabular-nums' }}>
                    ${r.actual.toLocaleString()}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                    <span style={{ color: r.achievementRate >= 100 ? 'var(--story-em)' : 'var(--amber-text)' }}>
                      {r.achievementRate}%
                    </span>
                  </td>
                  <td style={{ padding: '12px', color: 'var(--heading-text)' }}>{r.topProduct}</td>
                  <td style={{ padding: '12px 14px', textAlign: 'center', borderTopRightRadius: '14px', borderBottomRightRadius: '14px' }}>
                    <StatusPill status={r.achievementRate >= 100 ? 'Achieved' : 'Pending'} />
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
