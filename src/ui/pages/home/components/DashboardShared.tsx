'use client'

import React from 'react'
import {
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  ChevronRight,
  Calendar,
  Sparkles,
  AlertCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Activity,
  ArrowRight,
} from 'lucide-react'
import { formatCurrencyCompact } from '@/lib/format'

// ── Color System & Variants ──────────────────────────────────────────────────
export type KpiColorVariant = 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'teal' | 'navy'

interface ColorConfig {
  bgGradient: string
  borderColor: string
  textColor: string
  subtextColor: string
  valueColor: string
  iconBg: string
  iconColor: string
  trendBg: string
  trendColor: string
  badgeBg: string
  badgeText: string
  sparklineColor: string
}

export const KPI_COLORS: Record<KpiColorVariant, ColorConfig> = {
  blue: {
    bgGradient: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
    borderColor: 'rgba(59, 130, 246, 0.28)',
    textColor: '#1E40AF',
    subtextColor: '#475569',
    valueColor: '#1E3A8A',
    iconBg: 'rgba(37, 99, 235, 0.15)',
    iconColor: '#2563EB',
    trendBg: 'rgba(37, 99, 235, 0.12)',
    trendColor: '#1D4ED8',
    badgeBg: '#BFDBFE',
    badgeText: '#1E40AF',
    sparklineColor: '#2563EB',
  },
  green: {
    bgGradient: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
    borderColor: 'rgba(16, 185, 129, 0.28)',
    textColor: '#065F46',
    subtextColor: '#475569',
    valueColor: '#064E3B',
    iconBg: 'rgba(16, 185, 129, 0.15)',
    iconColor: '#059669',
    trendBg: 'rgba(16, 185, 129, 0.15)',
    trendColor: '#047857',
    badgeBg: '#A7F3D0',
    badgeText: '#065F46',
    sparklineColor: '#059669',
  },
  orange: {
    bgGradient: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
    borderColor: 'rgba(245, 158, 11, 0.28)',
    textColor: '#92400E',
    subtextColor: '#475569',
    valueColor: '#78350F',
    iconBg: 'rgba(245, 158, 11, 0.16)',
    iconColor: '#D97706',
    trendBg: 'rgba(245, 158, 11, 0.15)',
    trendColor: '#B45309',
    badgeBg: '#FDE68A',
    badgeText: '#92400E',
    sparklineColor: '#D97706',
  },
  red: {
    bgGradient: 'linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)',
    borderColor: 'rgba(239, 68, 68, 0.28)',
    textColor: '#991B1B',
    subtextColor: '#475569',
    valueColor: '#7F1D1D',
    iconBg: 'rgba(239, 68, 68, 0.15)',
    iconColor: '#DC2626',
    trendBg: 'rgba(239, 68, 68, 0.12)',
    trendColor: '#B91C1C',
    badgeBg: '#FECACA',
    badgeText: '#991B1B',
    sparklineColor: '#DC2626',
  },
  purple: {
    bgGradient: 'linear-gradient(135deg, #FAF5FF 0%, #F3E8FF 100%)',
    borderColor: 'rgba(168, 85, 247, 0.28)',
    textColor: '#6B21A8',
    subtextColor: '#475569',
    valueColor: '#581C87',
    iconBg: 'rgba(168, 85, 247, 0.15)',
    iconColor: '#9333EA',
    trendBg: 'rgba(168, 85, 247, 0.12)',
    trendColor: '#7E22CE',
    badgeBg: '#E9D5FF',
    badgeText: '#6B21A8',
    sparklineColor: '#9333EA',
  },
  teal: {
    bgGradient: 'linear-gradient(135deg, #F0FDFA 0%, #CCFBF1 100%)',
    borderColor: 'rgba(20, 184, 166, 0.28)',
    textColor: '#115E59',
    subtextColor: '#475569',
    valueColor: '#134E4A',
    iconBg: 'rgba(20, 184, 166, 0.15)',
    iconColor: '#0D9488',
    trendBg: 'rgba(20, 184, 166, 0.12)',
    trendColor: '#0F766E',
    badgeBg: '#99F6E4',
    badgeText: '#115E59',
    sparklineColor: '#0D9488',
  },
  navy: {
    bgGradient: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
    borderColor: 'rgba(148, 163, 184, 0.2)',
    textColor: '#94A3B8',
    subtextColor: '#94A3B8',
    valueColor: '#FFFFFF',
    iconBg: 'rgba(255, 255, 255, 0.12)',
    iconColor: '#38BDF8',
    trendBg: 'rgba(56, 189, 248, 0.15)',
    trendColor: '#38BDF8',
    badgeBg: 'rgba(255, 255, 255, 0.12)',
    badgeText: '#F1F5F9',
    sparklineColor: '#38BDF8',
  },
}

// ── 1. Colorful Premium KPI Card ─────────────────────────────────────────────
export interface MetricCardProps {
  title: string
  value: string | number
  subtext?: string
  trend?: string
  isPositive?: boolean
  icon: React.ElementType
  variant?: KpiColorVariant
  sparkline?: number[]
  onClick?: () => void
  highlight?: boolean
  badge?: string
}

export function MetricCard({
  title,
  value,
  subtext,
  trend,
  isPositive = true,
  icon: Icon,
  variant = 'blue',
  sparkline,
  onClick,
  highlight = false,
  badge,
}: MetricCardProps) {
  const theme = KPI_COLORS[variant] || KPI_COLORS.blue

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onClick()
        }
      }}
      style={{
        background: theme.bgGradient,
        border: `1.5px solid ${highlight ? 'var(--ocean, #3F6593)' : theme.borderColor}`,
        boxShadow: '0 2px 10px rgba(15, 23, 42, 0.04), 0 1px 3px rgba(15, 23, 42, 0.02)',
        borderRadius: '18px',
        padding: '20px',
        cursor: onClick ? 'pointer' : 'default',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: '14px',
        position: 'relative',
        overflow: 'hidden',
        transition: 'transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease',
      }}
      className="metric-kpi-card"
    >
      {/* Subtle top ambient glow */}
      <div
        style={{
          position: 'absolute',
          top: '-40px',
          right: '-40px',
          width: '100px',
          height: '100px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.4)',
          filter: 'blur(20px)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: theme.iconBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: theme.iconColor,
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
              flexShrink: 0,
            }}
          >
            <Icon style={{ width: '20px', height: '20px' }} />
          </div>
          <span
            style={{
              fontSize: '0.78rem',
              fontWeight: 700,
              color: theme.textColor,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              lineHeight: 1.25,
            }}
          >
            {title}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {badge && (
            <span
              style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '99px',
                background: theme.badgeBg,
                color: theme.badgeText,
              }}
            >
              {badge}
            </span>
          )}

          {trend && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '2px',
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '99px',
                background: isPositive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: isPositive ? '#065F46' : '#991B1B',
                whiteSpace: 'nowrap',
              }}
            >
              {isPositive ? <ArrowUpRight style={{ width: '12px', height: '12px' }} /> : <ArrowDownRight style={{ width: '12px', height: '12px' }} />}
              {trend}
            </span>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '12px' }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontSize: '1.85rem',
              fontWeight: 800,
              color: theme.valueColor,
              letterSpacing: '-0.025em',
              lineHeight: 1.1,
              wordBreak: 'break-word',
            }}
          >
            {value}
          </div>
          {subtext && (
            <div
              style={{
                fontSize: '0.78rem',
                color: theme.subtextColor,
                marginTop: '5px',
                fontWeight: 600,
                lineHeight: 1.3,
              }}
            >
              {subtext}
            </div>
          )}
        </div>

        {sparkline && sparkline.length > 1 && (
          <div style={{ width: '70px', height: '30px', flexShrink: 0 }}>
            <MiniSparkline points={sparkline} strokeColor={theme.sparklineColor} />
          </div>
        )}
      </div>
    </div>
  )
}

// ── 2. Dark Navy Contrast Hero Card ──────────────────────────────────────────
export interface DarkHeroCardProps {
  badge: string
  title: string
  amount: string
  subtitle: string
  progressPct?: number
  footerLeft?: string
  footerRight?: string
  icon?: React.ElementType
  onClick?: () => void
}

export function DarkHeroCard({
  badge,
  title,
  amount,
  subtitle,
  progressPct,
  footerLeft,
  footerRight,
  icon: Icon = TrendingUp,
  onClick,
}: DarkHeroCardProps) {
  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onClick()
        }
      }}
      style={{
        background: 'linear-gradient(135deg, #1A2E46 0%, #0E1B2D 100%)',
        border: '1.5px solid rgba(128, 170, 211, 0.25)',
        borderRadius: '18px',
        padding: '22px',
        color: '#FFFFFF',
        boxShadow: '0 8px 24px rgba(14, 27, 45, 0.35)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: '16px',
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative top-right radiant halo */}
      <div
        style={{
          position: 'absolute',
          top: '-35px',
          right: '-35px',
          width: '130px',
          height: '130px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(56, 189, 248, 0.3) 0%, rgba(26, 46, 70, 0) 70%)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span
          style={{
            fontSize: '0.72rem',
            fontWeight: 700,
            padding: '3px 10px',
            borderRadius: '99px',
            background: 'rgba(56, 189, 248, 0.18)',
            color: '#7DD3FC',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            border: '1px solid rgba(56, 189, 248, 0.3)',
          }}
        >
          {badge}
        </span>
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#38BDF8',
          }}
        >
          <Icon style={{ width: '18px', height: '18px' }} />
        </div>
      </div>

      <div>
        <div style={{ fontSize: '0.84rem', color: '#94A3B8', fontWeight: 600 }}>{title}</div>
        <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.025em', margin: '4px 0 3px 0' }}>
          {amount}
        </div>
        <div style={{ fontSize: '0.8rem', color: '#CBD5E1' }}>{subtitle}</div>
      </div>

      {typeof progressPct === 'number' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94A3B8', marginBottom: '6px' }}>
            <span>Target Progress</span>
            <span style={{ fontWeight: 700, color: progressPct >= 100 ? '#34D399' : '#38BDF8' }}>{progressPct}%</span>
          </div>
          <div style={{ width: '100%', height: '7px', background: 'rgba(255, 255, 255, 0.12)', borderRadius: '4px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${Math.min(100, progressPct)}%`,
                height: '100%',
                background: progressPct >= 100 ? '#10B981' : 'linear-gradient(90deg, #38BDF8, #818CF8)',
                borderRadius: '4px',
              }}
            />
          </div>
        </div>
      )}

      {(footerLeft || footerRight) && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.76rem',
            color: '#94A3B8',
            paddingTop: '12px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <span>{footerLeft}</span>
          <span style={{ color: '#E2E8F0', fontWeight: 700 }}>{footerRight}</span>
        </div>
      )}
    </div>
  )
}

// ── 3. Mini SVG Sparkline ───────────────────────────────────────────────────
export function MiniSparkline({ points, strokeColor = '#2563EB' }: { points: number[]; strokeColor?: string }) {
  if (!points || points.length < 2) return null
  const min = Math.min(...points)
  const max = Math.max(...points)
  const range = max - min || 1
  const width = 70
  const height = 30
  const pad = 2

  const coords = points.map((val, idx) => {
    const x = pad + (idx / (points.length - 1)) * (width - pad * 2)
    const y = height - pad - ((val - min) / range) * (height - pad * 2)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })

  const pathD = `M ${coords.join(' L ')}`

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
      <path d={pathD} fill="none" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle
        cx={coords[coords.length - 1].split(',')[0]}
        cy={coords[coords.length - 1].split(',')[1]}
        r="3"
        fill={strokeColor}
      />
    </svg>
  )
}

// ── 4. Unified Dashboard Header Component ────────────────────────────────────
export interface DashboardHeaderProps {
  badgeLabel: string
  badgeIcon: React.ElementType
  badgeTone?: 'blue' | 'purple' | 'green' | 'teal'
  contextLabel: string
  welcomeName: string
  description: string
  actions?: React.ReactNode
  currentDateStr?: string
  dateRange: string
  onDateRangeChange: (r: string) => void
  lang?: 'en' | 'ar'
}

export function DashboardHeader({
  badgeLabel,
  badgeIcon: BadgeIcon,
  badgeTone = 'blue',
  contextLabel,
  welcomeName,
  description,
  actions,
  currentDateStr,
  dateRange,
  onDateRangeChange,
  lang = 'en',
}: DashboardHeaderProps) {
  const isAr = lang === 'ar'
  const today = currentDateStr || new Date().toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  const toneStyles = {
    blue: { bg: 'rgba(37, 99, 235, 0.1)', color: '#1D4ED8', border: 'rgba(37, 99, 235, 0.2)' },
    purple: { bg: 'rgba(147, 51, 234, 0.1)', color: '#7E22CE', border: 'rgba(147, 51, 234, 0.2)' },
    green: { bg: 'rgba(16, 185, 129, 0.1)', color: '#047857', border: 'rgba(16, 185, 129, 0.2)' },
    teal: { bg: 'rgba(13, 148, 136, 0.1)', color: '#0F766E', border: 'rgba(13, 148, 136, 0.2)' },
  }[badgeTone]

  const dateOptions = [
    { id: 'month', labelEn: 'This Month', labelAr: 'هذا الشهر' },
    { id: 'quarter', labelEn: 'Quarter', labelAr: 'الربع الحالي' },
    { id: 'year', labelEn: 'Full Year', labelAr: 'كامل السنة' },
  ]

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
        borderRadius: '20px',
        border: '1.5px solid #E2E8F0',
        padding: '24px 28px',
        boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px',
      }}
    >
      <div style={{ flex: '1 1 340px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.74rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: toneStyles.color,
              background: toneStyles.bg,
              border: `1px solid ${toneStyles.border}`,
              padding: '3px 11px',
              borderRadius: '99px',
            }}
          >
            <BadgeIcon style={{ width: '13px', height: '13px' }} />
            {badgeLabel}
          </span>
          <span style={{ fontSize: '0.78rem', color: '#94A3B8' }}>•</span>
          <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>{contextLabel}</span>
          <span style={{ fontSize: '0.78rem', color: '#94A3B8' }}>•</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', color: '#0F172A', fontWeight: 600 }}>
            <Calendar style={{ width: '13px', height: '13px', color: '#64748B' }} />
            {today}
          </span>
        </div>

        <h2 style={{ margin: '4px 0 2px 0', fontSize: '1.65rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.025em' }}>
          {isAr ? `مرحباً، ${welcomeName}` : `Welcome, ${welcomeName}`}
        </h2>
        <p style={{ margin: 0, fontSize: '0.86rem', color: '#64748B', lineHeight: 1.4 }}>
          {description}
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        {/* Date range segmented pills */}
        <div
          style={{
            display: 'inline-flex',
            background: '#F1F5F9',
            padding: '3px',
            borderRadius: '12px',
            border: '1px solid #E2E8F0',
          }}
        >
          {dateOptions.map((opt) => {
            const active = dateRange.toLowerCase() === opt.id
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onDateRangeChange(opt.id)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '9px',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  background: active ? '#FFFFFF' : 'transparent',
                  color: active ? '#0F172A' : '#64748B',
                  boxShadow: active ? '0 1px 3px rgba(15, 23, 42, 0.08)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                {isAr ? opt.labelAr : opt.labelEn}
              </button>
            )
          })}
        </div>

        {actions}
      </div>
    </div>
  )
}

// ── 5. Action Center Section ────────────────────────────────────────────────
export interface ActionCenterItem {
  id: string
  title: string
  count: number | string
  description: string
  severity?: 'critical' | 'warning' | 'info' | 'success'
  icon: React.ElementType
  actionLabel: string
  onClick: () => void
}

export function ActionCenter({
  title,
  subtitle,
  items,
  lang = 'en',
}: {
  title?: string
  subtitle?: string
  items: ActionCenterItem[]
  lang?: 'en' | 'ar'
}) {
  const isAr = lang === 'ar'
  const displayTitle = title || (isAr ? 'مركز الإجراءات الميدانية والتشغيلية' : 'Action Center & Priority Queue')
  const displaySubtitle = subtitle || (isAr ? 'بنود تتطلب متابعتك واعتمادك الفوري' : 'Critical operational items awaiting your immediate review or decision')

  const severityColors = {
    critical: { border: '#EF4444', bg: '#FEF2F2', badgeBg: '#FEE2E2', text: '#991B1B', iconColor: '#DC2626' },
    warning: { border: '#F59E0B', bg: '#FFFBEB', badgeBg: '#FEF3C7', text: '#92400E', iconColor: '#D97706' },
    info: { border: '#3B82F6', bg: '#EFF6FF', badgeBg: '#DBEAFE', text: '#1E40AF', iconColor: '#2563EB' },
    success: { border: '#10B981', bg: '#ECFDF5', badgeBg: '#D1FAE5', text: '#065F46', iconColor: '#059669' },
  }

  return (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: '20px',
        border: '1.5px solid #E2E8F0',
        padding: '24px',
        boxShadow: '0 2px 12px rgba(15, 23, 42, 0.03)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: '#EF4444',
                boxShadow: '0 0 0 4px rgba(239, 68, 68, 0.2)',
                display: 'inline-block',
              }}
            />
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0F172A' }}>
              {displayTitle}
            </h3>
          </div>
          <p style={{ margin: '3px 0 0 0', fontSize: '0.8rem', color: '#64748B' }}>
            {displaySubtitle}
          </p>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '14px',
        }}
      >
        {items.map((item) => {
          const sev = severityColors[item.severity || 'info']
          const Icon = item.icon

          return (
            <div
              key={item.id}
              onClick={item.onClick}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  item.onClick()
                }
              }}
              style={{
                background: sev.bg,
                border: `1.5px solid ${sev.border}40`,
                borderInlineStart: `5px solid ${sev.border}`,
                borderRadius: '14px',
                padding: '16px 18px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '12px',
                cursor: 'pointer',
                transition: 'all 0.18s ease',
              }}
              className="action-center-card"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background: sev.badgeBg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: sev.iconColor,
                      flexShrink: 0,
                    }}
                  >
                    <Icon style={{ width: '18px', height: '18px' }} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, color: '#0F172A' }}>
                      {item.title}
                    </h4>
                    <span style={{ fontSize: '0.74rem', color: '#64748B' }}>
                      {item.description}
                    </span>
                  </div>
                </div>

                <span
                  style={{
                    fontSize: '1rem',
                    fontWeight: 800,
                    color: sev.text,
                    background: sev.badgeBg,
                    padding: '2px 9px',
                    borderRadius: '8px',
                    flexShrink: 0,
                  }}
                >
                  {item.count}
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  color: sev.iconColor,
                  borderTop: '1px solid rgba(0, 0, 0, 0.05)',
                  paddingTop: '8px',
                }}
              >
                <span>{item.actionLabel}</span>
                <ArrowRight style={{ width: '14px', height: '14px' }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── 6. Recent Activity Feed Section ─────────────────────────────────────────
export interface ActivityFeedItem {
  id: string
  title: string
  timestamp: string
  actor?: string
  badgeText?: string
  badgeVariant?: 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'teal'
  icon?: React.ElementType
  detail?: string
  onClick?: () => void
}

export function RecentActivityFeed({
  title,
  subtitle,
  items,
  lang = 'en',
}: {
  title?: string
  subtitle?: string
  items: ActivityFeedItem[]
  lang?: 'en' | 'ar'
}) {
  const isAr = lang === 'ar'
  const displayTitle = title || (isAr ? 'سجل الأنشطة والعمليات الأخيرة' : 'Recent System Activity & Timeline')
  const displaySubtitle = subtitle || (isAr ? 'آخر المعاملات والزيارات والاعتمادات المسجلة بالمنظومة' : 'Real-time chronological events across visits, invoices, and plans')

  const badgeColors: Record<string, { bg: string; text: string }> = {
    blue: { bg: '#DBEAFE', text: '#1E40AF' },
    green: { bg: '#D1FAE5', text: '#065F46' },
    orange: { bg: '#FEF3C7', text: '#92400E' },
    purple: { bg: '#F3E8FF', text: '#6B21A8' },
    red: { bg: '#FEE2E2', text: '#991B1B' },
    teal: { bg: '#CCFBF1', text: '#0F766E' },
  }

  return (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: '20px',
        border: '1.5px solid #E2E8F0',
        padding: '24px',
        boxShadow: '0 2px 12px rgba(15, 23, 42, 0.03)',
      }}
    >
      <div style={{ marginBottom: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity style={{ width: '17px', height: '17px', color: 'var(--ocean, #3F6593)' }} />
          <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0F172A' }}>
            {displayTitle}
          </h3>
        </div>
        <p style={{ margin: '3px 0 0 0', fontSize: '0.8rem', color: '#64748B' }}>
          {displaySubtitle}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {items.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#94A3B8', fontSize: '0.85rem' }}>
            {isAr ? 'لا توجد أنشطة مسجلة حديثاً' : 'No recent activities found for this scope'}
          </div>
        ) : (
          items.map((item) => {
            const bColor = badgeColors[item.badgeVariant || 'blue'] || badgeColors.blue
            const Icon = item.icon || CheckCircle2

            return (
              <div
                key={item.id}
                onClick={item.onClick}
                role={item.onClick ? 'button' : undefined}
                tabIndex={item.onClick ? 0 : undefined}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  gap: '12px',
                  cursor: item.onClick ? 'pointer' : 'default',
                  transition: 'background 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: '#FFFFFF',
                      border: '1px solid #CBD5E1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--ocean, #3F6593)',
                      flexShrink: 0,
                    }}
                  >
                    <Icon style={{ width: '16px', height: '16px' }} />
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#0F172A' }}>
                        {item.title}
                      </span>
                      {item.badgeText && (
                        <span
                          style={{
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            padding: '1px 7px',
                            borderRadius: '99px',
                            background: bColor.bg,
                            color: bColor.text,
                          }}
                        >
                          {item.badgeText}
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: '2px' }}>
                      {item.actor && <span style={{ fontWeight: 600, color: '#475569' }}>{item.actor} • </span>}
                      {item.detail || item.timestamp}
                    </div>
                  </div>
                </div>

                <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, whiteSpace: 'nowrap' }}>
                  {item.timestamp}
                </span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

// ── 7. Donut Progress Gauge Card ────────────────────────────────────────────
export interface DonutGaugeCardProps {
  title: string
  subtitle?: string
  percent: number
  primaryLabel: string
  secondaryLabel?: string
  accentColor?: string
  segments?: Array<{ label: string; value: number | string; color: string }>
}

export function DonutGaugeCard({
  title,
  subtitle,
  percent,
  primaryLabel,
  secondaryLabel,
  accentColor = '#2563EB',
  segments = [],
}: DonutGaugeCardProps) {
  const size = 118
  const strokeWidth = 10
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const clampedPercent = Math.min(100, Math.max(0, percent))
  const offset = circumference - (clampedPercent / 100) * circumference

  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1.5px solid #E2E8F0',
        boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)',
        borderRadius: '20px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: '12px',
      }}
    >
      <div>
        <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: '#0F172A' }}>{title}</h4>
        {subtitle && <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: '#64748B' }}>{subtitle}</p>}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', flexWrap: 'wrap', padding: '4px 0' }}>
        <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
          <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke="#F1F5F9"
              strokeWidth={strokeWidth}
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke={clampedPercent >= 100 ? '#10B981' : accentColor}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.6s ease' }}
            />
          </svg>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>{percent}%</span>
            <span style={{ fontSize: '0.64rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginTop: '3px' }}>
              {primaryLabel}
            </span>
          </div>
        </div>

        {segments.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '110px' }}>
            {segments.map((s) => (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                  <span style={{ fontSize: '0.76rem', color: '#475569', fontWeight: 600 }}>{s.label}</span>
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0F172A' }}>{s.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {secondaryLabel && (
        <div style={{ fontSize: '0.75rem', color: '#64748B', textAlign: 'center', borderTop: '1px solid #F1F5F9', paddingTop: '8px', fontWeight: 500 }}>
          {secondaryLabel}
        </div>
      )}
    </div>
  )
}

// ── 8. Rich Multi-Point SVG Area Trend Chart Card ───────────────────────────
export interface AreaTrendChartCardProps {
  title: string
  subtitle?: string
  totalText: string
  growthBadge?: string
  dataPoints: number[]
  labels: string[]
  maxAmountText?: string
  minAmountText?: string
  gradientId?: string
  strokeColor?: string
  onClick?: () => void
}

export function AreaTrendChartCard({
  title,
  subtitle,
  totalText,
  growthBadge = '+8.4% vs last period',
  dataPoints,
  labels,
  gradientId = 'trendGrad',
  strokeColor = '#2563EB',
  onClick,
}: AreaTrendChartCardProps) {
  const width = 600
  const height = 160
  const padTop = 20
  const padBottom = 28
  const padLeft = 14
  const padRight = 14

  const min = Math.min(...dataPoints)
  const max = Math.max(...dataPoints)
  const range = max - min || 1

  const coords = dataPoints.map((val, idx) => {
    const x = padLeft + (idx / (dataPoints.length - 1)) * (width - padLeft - padRight)
    const y = padTop + (1 - (val - min) / range) * (height - padTop - padBottom)
    return { x, y }
  })

  const linePath = `M ${coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' L ')}`
  const areaPath = `${linePath} L ${coords[coords.length - 1].x},${height - padBottom} L ${coords[0].x},${height - padBottom} Z`

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      style={{
        background: '#FFFFFF',
        border: '1.5px solid #E2E8F0',
        boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)',
        borderRadius: '20px',
        padding: '24px',
        cursor: onClick ? 'pointer' : 'default',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: '14px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>{title}</h4>
          {subtitle && <p style={{ margin: '3px 0 0 0', fontSize: '0.8rem', color: '#64748B' }}>{subtitle}</p>}
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A' }}>{totalText}</div>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '2px',
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '99px',
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#065F46',
            }}
          >
            <ArrowUpRight style={{ width: '12px', height: '12px' }} />
            {growthBadge}
          </span>
        </div>
      </div>

      <div style={{ width: '100%', position: 'relative' }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity="0.25" />
              <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Dotted Grid lines */}
          <line x1={padLeft} y1={padTop} x2={width - padRight} y2={padTop} stroke="#F1F5F9" strokeWidth="1" strokeDasharray="3 3" />
          <line x1={padLeft} y1={height / 2} x2={width - padRight} y2={height / 2} stroke="#F1F5F9" strokeWidth="1" strokeDasharray="3 3" />
          <line x1={padLeft} y1={height - padBottom} x2={width - padRight} y2={height - padBottom} stroke="#E2E8F0" strokeWidth="1.5" />

          {/* Shaded Area */}
          <path d={areaPath} fill={`url(#${gradientId})`} />

          {/* Trend Line */}
          <path d={linePath} fill="none" stroke={strokeColor} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />

          {/* Highlight Circles on data nodes */}
          {coords.map((c, i) => (
            <circle key={i} cx={c.x} cy={c.y} r="3.5" fill="#FFFFFF" stroke={strokeColor} strokeWidth="2.5" />
          ))}

          {/* X Axis Labels */}
          {labels.map((lbl, i) => {
            const x = padLeft + (i / (labels.length - 1)) * (width - padLeft - padRight)
            return (
              <text key={i} x={x} y={height - 7} textAnchor="middle" fontSize="10.5" fill="#64748B" fontWeight="600">
                {lbl}
              </text>
            )
          })}
        </svg>
      </div>
    </div>
  )
}
