'use client'

import { CheckCircle2, Clock, FileText, XCircle } from 'lucide-react'
import { INVOICES_APPROVALS_MOCK, type RejectionReasonStat } from '../mock-data'
import type { ReportFiltersState } from './ReportFilters'

export interface InvoicesApprovalsReportProps {
  filters: ReportFiltersState
}

export function InvoicesApprovalsReport({ filters }: InvoicesApprovalsReportProps) {
  const reasons = INVOICES_APPROVALS_MOCK.rejectionReasons
  const timeline = INVOICES_APPROVALS_MOCK.statusTimeline

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
        {INVOICES_APPROVALS_MOCK.summary.map((stat) => (
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

      {/* Main Chart: Invoice Status Counts by Week */}
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
              Weekly Claims Processed by Validation Status
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted-text)' }}>
              Breakdown of approved, pending review, and rejected pharmacy claims per cycle.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px', color: 'var(--muted-text)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--story-em, #3e9a78)' }} />
              Approved claims
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--amber)' }} />
              Pending review
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--rose)' }} />
              Rejected
            </span>
          </div>
        </div>

        <div style={{ width: '100%', overflowX: 'auto' }}>
          <div style={{ minWidth: '550px' }}>
            <svg viewBox="0 0 650 220" style={{ width: '100%', height: 'auto', display: 'block' }}>
              {/* Horizontal grid lines */}
              {[0, 25, 50, 75, 100].map((val) => {
                const y = 180 - (val / 100) * 150
                return (
                  <g key={val}>
                    <line x1="50" y1={y} x2="620" y2={y} stroke="var(--border-subtle)" strokeDasharray="3 3" />
                    <text x="42" y={y + 4} textAnchor="end" fontSize="10" fill="var(--muted-text)">
                      {val}
                    </text>
                  </g>
                )
              })}

              {/* Grouped Bars per week */}
              {timeline.map((item, idx) => {
                const slotW = (620 - 60) / timeline.length
                const groupX = 65 + idx * slotW + slotW * 0.22
                const barW = 28

                const appH = (item.approved / 100) * 150
                const pendH = (item.pending / 100) * 150
                const rejH = (item.rejected / 100) * 150

                return (
                  <g key={item.week}>
                    {/* Approved bar */}
                    <rect
                      x={groupX}
                      y={180 - appH}
                      width={barW}
                      height={appH}
                      fill="var(--story-em, #3e9a78)"
                      rx="4"
                    />

                    {/* Pending bar */}
                    <rect
                      x={groupX + barW + 4}
                      y={180 - pendH}
                      width={barW}
                      height={pendH}
                      fill="var(--amber)"
                      rx="4"
                    />

                    {/* Rejected bar */}
                    <rect
                      x={groupX + (barW + 4) * 2}
                      y={180 - rejH}
                      width={barW}
                      height={rejH}
                      fill="var(--rose)"
                      rx="4"
                    />

                    {/* Week Label */}
                    <text
                      x={groupX + barW * 1.5 + 4}
                      y="198"
                      textAnchor="middle"
                      fontSize="11"
                      fontWeight="600"
                      fill="var(--heading-text)"
                    >
                      Week {idx + 1} ({item.week})
                    </text>
                    <text
                      x={groupX + barW * 1.5 + 4}
                      y="212"
                      textAnchor="middle"
                      fontSize="9.5"
                      fill="var(--muted-text)"
                    >
                      {item.approved + item.pending + item.rejected} total
                    </text>
                  </g>
                )
              })}
            </svg>
          </div>
        </div>
      </div>

      {/* Rounded-row Table: Top Rejection Reasons */}
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
              Top Rejection Reasons & Resolution Velocity
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted-text)' }}>
              Analysis of audit defects to guide representative training and photo intake guidelines.
            </p>
          </div>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--rose-text)' }}>
            4.2% overall rejection rate
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px', fontSize: '13px' }}>
            <thead>
              <tr style={{ color: 'var(--muted-text)', textAlign: 'left', fontSize: '11px', textTransform: 'uppercase' }}>
                <th style={{ padding: '8px 12px' }}>Audit Defect / Issue</th>
                <th style={{ padding: '8px 12px', textAlign: 'right' }}>Occurrences</th>
                <th style={{ padding: '8px 12px', textAlign: 'right' }}>Share of Rejections</th>
                <th style={{ padding: '8px 12px' }}>Average Turnaround</th>
                <th style={{ padding: '8px 12px' }}>Frequent Accounts / Reps</th>
              </tr>
            </thead>
            <tbody>
              {reasons.map((r) => (
                <tr
                  key={r.id}
                  style={{
                    background: 'var(--input-bg)',
                    borderRadius: '14px',
                  }}
                >
                  <td style={{ padding: '12px 14px', borderTopLeftRadius: '14px', borderBottomLeftRadius: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <XCircle style={{ width: '16px', height: '16px', color: 'var(--rose-text)' }} />
                      <span style={{ fontWeight: 600, color: 'var(--heading-text)' }}>{r.reason}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                    {r.count} claims
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: 'var(--rose-text)', fontVariantNumeric: 'tabular-nums' }}>
                    {r.pct}%
                  </td>
                  <td style={{ padding: '12px', color: 'var(--muted-text)' }}>{r.avgResolutionTime}</td>
                  <td
                    style={{
                      padding: '12px 14px',
                      color: 'var(--heading-text)',
                      borderTopRightRadius: '14px',
                      borderBottomRightRadius: '14px',
                    }}
                  >
                    {r.affectedReps}
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
