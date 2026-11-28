'use client'

import React, { useState, useMemo } from 'react'
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
  Layers,
  Filter,
} from 'lucide-react'
import { Button } from '@/ui/design-system/components/Button'
import { useT } from '@/lib/i18n'
import { getAuthorizedReportsForRole, type ReportMeta, type ReportCategory } from '../reportCatalog'
import type { UserRole } from '@/lib/auth/types'

export interface ReportHubGridProps {
  onOpenReport: (reportId: string) => void
  role?: UserRole | string
}

export function ReportHubGrid({ onOpenReport, role = 'admin' }: ReportHubGridProps) {
  const { t, lang } = useT()

  const reports = useMemo(() => getAuthorizedReportsForRole(role), [role])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // Extract available categories present in the authorized reports
  const categories = useMemo(() => {
    const cats = Array.from(new Set(reports.map((r) => r.category)))
    return cats
  }, [reports])

  // Filtered reports based on selected category tab
  const filteredReports = useMemo(() => {
    if (selectedCategory === 'all') return reports
    return reports.filter((r) => r.category === selectedCategory)
  }, [reports, selectedCategory])

  const getIcon = (iconName: ReportMeta['iconName']) => {
    switch (iconName) {
      case 'sales':
        return <TrendingUp style={{ width: '22px', height: '22px', color: '#0284C7' }} />
      case 'sellinout':
        return <Activity style={{ width: '22px', height: '22px', color: '#059669' }} />
      case 'coverage':
        return <CalendarCheck style={{ width: '22px', height: '22px', color: '#3F6593' }} />
      case 'stock':
        return <Package style={{ width: '22px', height: '22px', color: '#D97706' }} />
      case 'invoices':
        return <FileCheck style={{ width: '22px', height: '22px', color: '#8B5CF6' }} />
      case 'scorecard':
        return <Award style={{ width: '22px', height: '22px', color: '#10B981' }} />
      default:
        return <BarChart2 style={{ width: '22px', height: '22px', color: '#3F6593' }} />
    }
  }

  const getIconBg = (iconName: ReportMeta['iconName']) => {
    switch (iconName) {
      case 'sales':
        return 'rgba(2, 132, 199, 0.08)'
      case 'sellinout':
        return 'rgba(5, 150, 105, 0.08)'
      case 'coverage':
        return 'rgba(63, 101, 147, 0.08)'
      case 'stock':
        return 'rgba(217, 119, 6, 0.08)'
      case 'invoices':
        return 'rgba(139, 92, 246, 0.08)'
      case 'scorecard':
        return 'rgba(16, 185, 129, 0.08)'
      default:
        return 'rgba(63, 101, 147, 0.08)'
    }
  }

  const getCategoryLabel = (cat: string) => {
    if (cat === 'all') {
      return lang === 'ar' ? 'جميع التقارير' : 'All Reports'
    }
    if (cat === 'Commercial') {
      return lang === 'ar' ? 'المبيعات والتجارة' : 'Commercial'
    }
    if (cat === 'Field & Visits') {
      return lang === 'ar' ? 'الزيارات والميدان' : 'Field & Visits'
    }
    if (cat === 'Inventory') {
      return lang === 'ar' ? 'المخزون والصلاحية' : 'Inventory'
    }
    if (cat === 'Operations') {
      return lang === 'ar' ? 'العمليات والمالية' : 'Operations'
    }
    return cat
  }

  // Render a mini SVG sparkline
  const renderSparkline = (points: number[], strokeColor: string) => {
    if (!points || points.length < 2) return null
    const min = Math.min(...points)
    const max = Math.max(...points)
    const range = max - min || 1
    const width = 100
    const height = 32
    const pad = 3

    const coords = points.map((val, idx) => {
      const x = pad + (idx / (points.length - 1)) * (width - pad * 2)
      const y = height - pad - ((val - min) / range) * (height - pad * 2)
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })

    const pathD = `M ${coords.join(' L ')}`

    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
        <path
          d={pathD}
          fill="none"
          stroke={strokeColor || '#3F6593'}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {points.length > 0 && (
          <circle
            cx={coords[coords.length - 1].split(',')[0]}
            cy={coords[coords.length - 1].split(',')[1]}
            r="3"
            fill={strokeColor || '#3F6593'}
          />
        )}
      </svg>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* ── Category Filter Tabs (if more than 1 category exists) ───────── */}
      {categories.length > 1 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap',
            padding: '6px',
            background: '#FFFFFF',
            borderRadius: '14px',
            border: '1px solid rgba(226, 232, 240, 0.85)',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.02)',
            width: 'fit-content',
          }}
        >
          {/* All tab */}
          <button
            onClick={() => setSelectedCategory('all')}
            style={{
              padding: '6px 14px',
              borderRadius: '10px',
              border: 'none',
              background: selectedCategory === 'all' ? 'var(--ocean, #3F6593)' : 'transparent',
              color: selectedCategory === 'all' ? '#FFFFFF' : '#64748B',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'background 0.15s ease, color 0.15s ease',
            }}
          >
            <span>{getCategoryLabel('all')}</span>
            <span
              style={{
                fontSize: '0.72rem',
                padding: '1px 6px',
                borderRadius: '99px',
                background: selectedCategory === 'all' ? 'rgba(255, 255, 255, 0.25)' : '#F1F5F9',
                color: selectedCategory === 'all' ? '#FFFFFF' : '#475569',
              }}
            >
              {reports.length}
            </span>
          </button>

          {/* Category specific tabs */}
          {categories.map((cat) => {
            const count = reports.filter((r) => r.category === cat).length
            const isSelected = selectedCategory === cat
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '10px',
                  border: 'none',
                  background: isSelected ? 'var(--ocean, #3F6593)' : 'transparent',
                  color: isSelected ? '#FFFFFF' : '#64748B',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'background 0.15s ease, color 0.15s ease',
                }}
              >
                <span>{getCategoryLabel(cat)}</span>
                <span
                  style={{
                    fontSize: '0.72rem',
                    padding: '1px 6px',
                    borderRadius: '99px',
                    background: isSelected ? 'rgba(255, 255, 255, 0.25)' : '#F1F5F9',
                    color: isSelected ? '#FFFFFF' : '#475569',
                  }}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* ── Reports Cards Bento Grid ───────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            role === 'rep'
              ? 'minmax(320px, 560px)'
              : 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: '20px',
        }}
      >
        {filteredReports.map((card) => {
          const title =
            role === 'rep' && card.id === 'rep-scorecard'
              ? lang === 'ar'
                ? 'بطاقة أدائي الفردية'
                : 'My Performance Scorecard'
              : lang === 'ar'
              ? card.title_ar
              : card.title

          const description =
            role === 'rep' && card.id === 'rep-scorecard'
              ? lang === 'ar'
                ? 'متابعة تحقيق الهدف البيعي الفردي، تغطية الأطباء، وتوزيع العينات'
                : 'Your personal quota attainment, physician visit coverage, and sample distribution.'
              : lang === 'ar'
              ? card.description_ar
              : card.description

          return (
            <div
              key={card.id}
              className="report-hub-card"
              style={{
                background: 'var(--card-bg, #FFFFFF)',
                borderRadius: '16px',
                border: '1px solid var(--border-card, rgba(226, 232, 240, 0.85))',
                boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03), 0 4px 12px rgba(15, 23, 42, 0.02)',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '20px',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
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
                  {/* Tinted icon container */}
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '12px',
                      background: getIconBg(card.iconName),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {getIcon(card.iconName)}
                  </div>

                  {/* Sparkline preview with subtle border */}
                  <div
                    style={{
                      padding: '4px 10px',
                      borderRadius: '10px',
                      background: 'var(--surface-raised, #F8FAFC)',
                      border: '1px solid var(--border-subtle, #F1F5F9)',
                    }}
                  >
                    {renderSparkline(card.sparkline, card.sparklineColor)}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '6px',
                      background: 'var(--surface-raised, #F1F5F9)',
                      color: 'var(--muted-text, #475569)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {lang === 'ar' ? card.category_ar : card.category}
                  </span>
                </div>

                <h3
                  style={{
                    margin: '0 0 6px',
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    color: 'var(--heading-text, #0F172A)',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {title}
                </h3>
                <p
                  style={{
                    margin: 0,
                    fontSize: '0.82rem',
                    lineHeight: 1.5,
                    color: 'var(--muted-text, #64748B)',
                  }}
                >
                  {description}
                </p>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '16px',
                  borderTop: '1px solid var(--border-subtle, #F1F5F9)',
                }}
              >
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94A3B8' }}>
                  {card.availableFilters.length} {lang === 'ar' ? 'فلاتر تحليلية' : 'filter dimensions'}
                </span>
                <Button
                  variant="primary"
                  onClick={() => onOpenReport(card.id)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    fontSize: '0.82rem',
                    borderRadius: '10px',
                    fontWeight: 600,
                  }}
                >
                  {t('reports.hub.open')} <ArrowUpRight style={{ width: '14px', height: '14px' }} />
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
