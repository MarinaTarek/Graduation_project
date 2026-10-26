'use client'

import { useState } from 'react'
import {
  ArrowDownRight,
  ArrowUpRight,
  Award,
  CheckCircle2,
  ChevronRight,
  Minus,
  Sparkles,
  Stethoscope,
  Target,
  TrendingUp,
} from 'lucide-react'
import { REP_SCORECARD_MOCK, type RepScorecardProfile } from '../mock-data'
import { Avatar } from '@/ui/design-system/components/Avatar'
import { StatusPill } from '@/ui/design-system/components/StatusPill'
import { useT } from '@/lib/i18n'
import { formatCurrency } from '@/lib/format'
import type { ReportFiltersState } from './ReportFilters'

export interface RepScorecardReportProps {
  filters: ReportFiltersState
  role?: 'admin' | 'rep'
  currentUserName?: string
}

export function RepScorecardReport({
  filters,
  role = 'admin',
  currentUserName = 'Alex Morgan',
}: RepScorecardReportProps) {
  const { t, lang } = useT()
  const [selectedRepName, setSelectedRepName] = useState<string>(
    role === 'rep' ? currentUserName : filters.reps[0] || 'Alex Morgan'
  )

  // Current active rep profile
  const repList = Object.values(REP_SCORECARD_MOCK).filter((r) => {
    if (role === 'rep') return r.name === currentUserName
    if (filters.reps.length > 0 && !filters.reps.includes(r.name)) return false
    return true
  })

  const currentRep = REP_SCORECARD_MOCK[selectedRepName] || repList[0] || REP_SCORECARD_MOCK['Alex Morgan']

  const renderTrendIcon = (trend: RepScorecardProfile['trend'], pct: number) => {
    if (trend === 'up') {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            color: 'var(--story-em, #3e9a78)',
            fontWeight: 600,
            fontSize: '12px',
          }}
        >
          <ArrowUpRight style={{ width: '15px', height: '15px' }} />
          {t('reports.scorecard.pacingPositive', { pct })}
        </span>
      )
    }
    if (trend === 'down') {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            color: 'var(--rose-text)',
            fontWeight: 600,
            fontSize: '12px',
          }}
        >
          <ArrowDownRight style={{ width: '15px', height: '15px' }} />
          {t('reports.scorecard.pacingNegative', { pct })}
        </span>
      )
    }
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          color: 'var(--amber-text)',
          fontWeight: 600,
          fontSize: '12px',
        }}
      >
        <Minus style={{ width: '15px', height: '15px' }} />
        {t('reports.scorecard.pacingSteady', { pct })}
      </span>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 3 Summary Capsules for the selected representative */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
        }}
      >
        <div
          className="panel"
          style={{
            padding: '20px 24px',
            borderRadius: '20px',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--muted-text)' }}>
            {t('reports.scorecard.totalSales')}
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
            {formatCurrency(currentRep.sales, 'EGP', lang)}
          </div>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--story-em, #3e9a78)' }}>
            {t('reports.scorecard.quotaTarget', { target: currentRep.salesTarget.toLocaleString(), pct: currentRep.targetPct })}
          </div>
        </div>

        <div
          className="panel"
          style={{
            padding: '20px 24px',
            borderRadius: '20px',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--muted-text)' }}>
            {t('reports.scorecard.detailingVisits')}
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
            {t('reports.scorecard.callsUnit', { calls: currentRep.visitsLogged })}
          </div>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ocean)' }}>
            {t('reports.scorecard.cycleTarget', { target: currentRep.visitsTarget })}
          </div>
        </div>

        <div
          className="panel"
          style={{
            padding: '20px 24px',
            borderRadius: '20px',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--muted-text)' }}>
            {t('reports.scorecard.samplesConversion')}
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
            {t('reports.scorecard.packsUnit', { packs: currentRep.samplesDelivered })}
          </div>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--story-em, #3e9a78)' }}>
            {t('reports.scorecard.rxRate', { rate: currentRep.conversionRate })}
          </div>
        </div>
      </div>

      {/* Main Chart: Rep Performance Trajectory & Target Curve */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <Avatar initials={currentRep.avatarInitials} size="md" />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: 'var(--heading-text)' }}>
                  {currentRep.name}
                </h3>
                {renderTrendIcon(currentRep.trend, currentRep.trendPct)}
              </div>
              <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--muted-text)' }}>
                {currentRep.territory}
              </p>
            </div>
          </div>

          {/* Admin Rep switcher buttons if multiple reps available */}
          {role === 'admin' && repList.length > 1 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {repList.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelectedRepName(r.name)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '99px',
                    border: '1px solid var(--border-subtle)',
                    background: selectedRepName === r.name ? 'var(--ocean)' : 'var(--input-bg)',
                    color: selectedRepName === r.name ? 'var(--text-on-primary)' : 'var(--heading-text)',
                    fontSize: '12px',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  {r.name.split(' ')[0]}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* SVG Performance Pacing Chart */}
        <div style={{ width: '100%', overflowX: 'auto' }}>
          <div style={{ minWidth: '550px' }}>
            <svg viewBox="0 0 650 200" style={{ width: '100%', height: 'auto', display: 'block' }}>
              {/* Target 100% line */}
              <line x1="50" y1="80" x2="620" y2="80" stroke="var(--rose)" strokeWidth="1.5" strokeDasharray="4 4" />
              <text x="44" y="84" textAnchor="end" fontSize="10" fill="var(--rose-text)">
                {t('reports.scorecard.target100')}
              </text>

              {/* 50% line */}
              <line x1="50" y1="135" x2="620" y2="135" stroke="var(--border-subtle)" strokeDasharray="2 2" />
              <text x="44" y="139" textAnchor="end" fontSize="10" fill="var(--muted-text)">
                50%
              </text>

              {/* Monthly curve */}
              {(() => {
                const months = ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct']
                const coords = currentRep.monthlyPerformance.map((val, idx) => {
                  const x = 70 + (idx / (months.length - 1)) * 520
                  const y = 190 - (val / 120) * 140
                  return { x, y, val, month: months[idx] }
                })

                const d = `M ${coords.map((c) => `${c.x},${c.y}`).join(' L ')}`

                return (
                  <g>
                    <path d={d} fill="none" stroke="var(--ocean)" strokeWidth="3" strokeLinecap="round" />
                    {coords.map((c) => (
                      <g key={c.month}>
                        <circle cx={c.x} cy={c.y} r="5" fill="var(--navy)" stroke="var(--card-bg)" strokeWidth="2" />
                        <text
                          x={c.x}
                          y={c.y - 10}
                          textAnchor="middle"
                          fontSize="10"
                          fontWeight="600"
                          fill="var(--heading-text)"
                        >
                          {c.val}%
                        </text>
                        <text x={c.x} y="195" textAnchor="middle" fontSize="11" fill="var(--muted-text)">
                          {c.month}
                        </text>
                      </g>
                    ))}
                  </g>
                )
              })()}
            </svg>
          </div>
        </div>
      </div>

      {/* Rounded-row Table: All Reps Scorecard Comparison (or Personal accounts for Rep) */}
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
              {role === 'rep' ? t('reports.scorecard.myTableTitle') : t('reports.scorecard.allTableTitle')}
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted-text)' }}>
              {t('reports.scorecard.tableSubtitle')}
            </p>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px', fontSize: '13px' }}>
            <thead>
              <tr style={{ color: 'var(--muted-text)', textAlign: 'left', fontSize: '11px', textTransform: 'uppercase' }}>
                <th style={{ padding: '8px 12px' }}>{t('reports.scorecard.thRep')}</th>
                <th style={{ padding: '8px 12px', textAlign: 'right' }}>{t('reports.scorecard.thRevenue')}</th>
                <th style={{ padding: '8px 12px', textAlign: 'right' }}>{t('reports.scorecard.thVisits')}</th>
                <th style={{ padding: '8px 12px', textAlign: 'right' }}>{t('reports.scorecard.thSamples')}</th>
                <th style={{ padding: '8px 12px', textAlign: 'right' }}>{t('reports.scorecard.thTargetPct')}</th>
                <th style={{ padding: '8px 12px' }}>{t('reports.scorecard.thMomentum')}</th>
                <th style={{ padding: '8px 12px', textAlign: 'center' }}>{t('reports.scorecard.thStanding')}</th>
              </tr>
            </thead>
            <tbody>
              {repList.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => role === 'admin' && setSelectedRepName(r.name)}
                  style={{
                    background: selectedRepName === r.name ? 'var(--mist-100, var(--input-bg))' : 'var(--input-bg)',
                    borderRadius: '14px',
                    cursor: role === 'admin' ? 'pointer' : 'default',
                    outline: selectedRepName === r.name ? '2px solid var(--ocean)' : 'none',
                  }}
                >
                  <td style={{ padding: '12px 14px', borderTopLeftRadius: '14px', borderBottomLeftRadius: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Avatar initials={r.avatarInitials} size="sm" />
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--heading-text)' }}>{r.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--muted-text)' }}>{r.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                    {formatCurrency(r.sales, 'EGP', lang)}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                    {r.visitsLogged} / {r.visitsTarget}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                    {r.samplesDelivered}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                    <span style={{ color: r.targetPct >= 100 ? 'var(--story-em)' : 'var(--amber-text)' }}>
                      {r.targetPct}%
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>{renderTrendIcon(r.trend, r.trendPct)}</td>
                  <td style={{ padding: '12px 14px', textAlign: 'center', borderTopRightRadius: '14px', borderBottomRightRadius: '14px' }}>
                    <StatusPill status={r.targetPct >= 100 ? 'Achieved' : 'Pending'} />
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
