'use client'

import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Award,
  BarChart2,
  CalendarCheck,
  CheckCircle2,
  FileCheck,
  Package,
  TrendingUp,
} from 'lucide-react'
import { Button } from '@/ui/design-system/components/Button'
import { useT } from '@/lib/i18n'
import { REPORT_CARDS_META, type ReportCardMeta } from '../mock-data'

export interface ReportHubGridProps {
  onOpenReport: (reportId: string) => void
  role?: 'admin' | 'rep'
}

export function ReportHubGrid({ onOpenReport, role = 'admin' }: ReportHubGridProps) {
  const { t } = useT()
  // If rep, only show the scorecard card
  const cards =
    role === 'rep'
      ? REPORT_CARDS_META.filter((c) => c.id === 'rep-scorecard').map((c) => ({
          ...c,
          title: t('reports.hub.myScorecardTitle'),
          description: t('reports.hub.myScorecardDesc'),
        }))
      : REPORT_CARDS_META

  const getIcon = (iconName: ReportCardMeta['iconName']) => {
    switch (iconName) {
      case 'sales':
        return <TrendingUp style={{ width: '24px', height: '24px', color: 'var(--ocean)' }} />
      case 'sellinout':
        return <Activity style={{ width: '24px', height: '24px', color: 'var(--ocean)' }} />
      case 'coverage':
        return <CalendarCheck style={{ width: '24px', height: '24px', color: 'var(--ocean)' }} />
      case 'stock':
        return <Package style={{ width: '24px', height: '24px', color: 'var(--ocean)' }} />
      case 'invoices':
        return <FileCheck style={{ width: '24px', height: '24px', color: 'var(--ocean)' }} />
      case 'scorecard':
        return <Award style={{ width: '24px', height: '24px', color: 'var(--ocean)' }} />
      default:
        return <BarChart2 style={{ width: '24px', height: '24px', color: 'var(--ocean)' }} />
    }
  }

  // Render a mini SVG sparkline
  const renderSparkline = (points: number[], strokeColor: string) => {
    const min = Math.min(...points)
    const max = Math.max(...points)
    const range = max - min || 1
    const width = 120
    const height = 36
    const pad = 4

    const coords = points.map((val, idx) => {
      const x = pad + (idx / (points.length - 1)) * (width - pad * 2)
      const y = height - pad - ((val - min) / range) * (height - pad * 2)
      return `${x},${y}`
    })

    const pathD = `M ${coords.join(' L ')}`

    return (
      <svg width={width} height={height} style={{ overflow: 'visible' }}>
        <path
          d={pathD}
          fill="none"
          stroke={strokeColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {points.length > 0 && (
          <circle
            cx={coords[coords.length - 1].split(',')[0]}
            cy={coords[coords.length - 1].split(',')[1]}
            r="3.5"
            fill={strokeColor}
          />
        )}
      </svg>
    )
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: role === 'rep' ? 'minmax(320px, 520px)' : 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '20px',
        marginTop: '24px',
      }}
    >
      {cards.map((card) => (
        <div
          key={card.id}
          className="panel"
          style={{
            borderRadius: '24px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '20px',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px',
              }}
            >
              {/* Mist circle with icon */}
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  background: 'var(--mist)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'inset 0 0 0 1px rgba(27, 53, 84, 0.08)',
                }}
              >
                {getIcon(card.iconName)}
              </div>

              {/* Sparkline preview */}
              <div
                style={{
                  padding: '4px 8px',
                  borderRadius: '12px',
                  background: 'var(--input-bg)',
                }}
              >
                {renderSparkline(card.sparkline, card.sparklineColor)}
              </div>
            </div>

            <h3
              style={{
                margin: '0 0 8px',
                fontSize: '18px',
                fontWeight: 600,
                color: 'var(--heading-text)',
              }}
            >
              {card.title}
            </h3>
            <p
              style={{
                margin: 0,
                fontSize: '13px',
                lineHeight: 1.5,
                color: 'var(--muted-text)',
              }}
            >
              {card.description}
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '16px',
              borderTop: '1px solid var(--border-subtle)',
            }}
          >
            <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--muted-text)' }}>
              {t('reports.hub.monthlyRollup')}
            </span>
            <Button
              variant="primary"
              onClick={() => onOpenReport(card.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                fontSize: '13px',
                borderRadius: '12px',
              }}
            >
              {t('reports.hub.open')} <ArrowUpRight style={{ width: '15px', height: '15px' }} />
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
