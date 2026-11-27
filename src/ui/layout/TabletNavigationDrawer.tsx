'use client'

import React from 'react'
import {
  Boxes, FileText, Warehouse, Activity, TrendingUp,
  BadgeDollarSign, LayoutGrid, Users, Package, RotateCcw,
  Target, Stethoscope, CalendarDays, Wallet, BarChart2, Shield,
  Settings2, X, ChevronRight, LogOut, Moon, Sun, Languages,
} from 'lucide-react'
import { canAccessPage, type User, type UserRole } from '@/lib/auth'
import { useT, type TranslationKey } from '@/lib/i18n'
import { Logo } from './Logo'

const NAV_LABEL_MAP: Record<string, TranslationKey> = {
  'Dashboard': 'nav.dashboard',
  'Clients': 'nav.clients',
  'Invoices': 'nav.invoices',
  'Stock': 'nav.stock',
  'Returns': 'nav.returns',
  'Targets': 'nav.targets',
  'Visits': 'nav.visits',
  'Visit plan': 'nav.visitPlan',
  'Budgets': 'nav.budgets',
  'Distribution Overview': 'nav.distributionOverview',
  'Invoices & Sell-in': 'nav.invoicesSellIn',
  'Warehouses': 'nav.warehouses',
  'Sell-out': 'nav.sellOut',
  'Performance Analytics': 'nav.performanceAnalytics',
  'Cash In': 'nav.cashIn',
  'Reports': 'nav.reports',
  'Admin': 'nav.admin',
  'Users': 'nav.users',
  'Products & Batches': 'nav.catalog',
  'Territories': 'nav.territories',
  'Audit log': 'nav.audit',
  'Settings': 'nav.settings',
  'My scorecard': 'nav.scorecard',
  'My profile': 'nav.profile',
}

export interface TabletNavigationDrawerProps {
  isOpen: boolean
  onClose: () => void
  active: string
  onSelect: (page: string) => void
  user?: User | null
  role?: UserRole
  dark: boolean
  onToggleDark: () => void
  onOpenLogout: () => void
}

export function TabletNavigationDrawer({
  isOpen,
  onClose,
  active,
  onSelect,
  user,
  role = 'admin',
  dark,
  onToggleDark,
  onOpenLogout,
}: TabletNavigationDrawerProps) {
  const { t, lang, setLang } = useT()

  if (!isOpen) return null

  const generalItems = [
    { label: 'Dashboard', activeKey: 'Home', icon: LayoutGrid },
    { label: 'Clients', activeKey: 'Clients', icon: Users },
    { label: 'Stock', activeKey: 'Stock', icon: Package },
    { label: 'Returns', activeKey: 'Returns', icon: RotateCcw },
    { label: 'Targets', activeKey: 'Targets', icon: Target },
    { label: 'Visits', activeKey: 'Visits', icon: Stethoscope },
    { label: 'Visit plan', activeKey: 'Visit plan', icon: CalendarDays },
    { label: 'Budgets', activeKey: 'Budgets', icon: Wallet },
  ].filter((item) => canAccessPage(item.activeKey, role, user))

  const distributionItems = [
    { label: 'Distribution Overview', activeKey: 'Distribution Overview', icon: Boxes },
    { label: 'Invoices & Sell-in', activeKey: 'Invoices & Sell-in', icon: FileText },
    { label: 'Warehouses', activeKey: 'Warehouses', icon: Warehouse },
    { label: 'Sell-out', activeKey: 'Sell-out', icon: Activity },
    { label: 'Performance Analytics', activeKey: 'Performance Analytics', icon: TrendingUp },
    { label: 'Cash In', activeKey: 'Cash In', icon: BadgeDollarSign },
  ].filter((item) => canAccessPage(item.activeKey, role, user))

  const adminItems = [
    { label: 'Reports', activeKey: 'Reports', icon: BarChart2 },
    { label: 'Admin', activeKey: 'Admin', icon: Shield },
    { label: 'Users', activeKey: 'Users', icon: Users },
    { label: 'Products & Batches', activeKey: 'Products & Batches', icon: Package },
    { label: 'Territories', activeKey: 'Territories', icon: Target },
    { label: 'Audit log', activeKey: 'Audit log', icon: FileText },
    { label: 'Settings', activeKey: 'Settings', icon: Settings2 },
  ].filter((item) => canAccessPage(item.activeKey, role, user))

  const handleItemClick = (page: string) => {
    onSelect(page)
    onClose()
  }

  return (
    <div
      className="modal-backdrop"
      style={{
        zIndex: 50,
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 15, 34, 0.5)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        justifyContent: 'flex-start',
      }}
    >
      <div
        className="tablet-nav-sheet"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(320px, 85vw)',
          height: '100%',
          background: '#1B3554',
          color: '#DAD9D6',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          overflowY: 'auto',
          padding: '20px 16px',
        }}
      >
        {/* Header with Logo and Close */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <Logo showText={true} textColor="#FFFFFF" />
          <button
            onClick={onClose}
            aria-label="Close navigation"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'grid',
              placeItems: 'center',
              color: '#FFFFFF',
              cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: '1 1 auto' }}>
          {/* General Section */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#9AB2CC', marginBottom: '8px', padding: '0 8px' }}>
              {t('nav.dashboard')}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {generalItems.map((item) => {
                const Icon = item.icon
                const isItemActive = active === item.activeKey || (item.activeKey === 'Home' && active === 'Dashboard')
                const label = NAV_LABEL_MAP[item.label] ? t(NAV_LABEL_MAP[item.label]) : item.label
                return (
                  <button
                    key={item.label}
                    onClick={() => handleItemClick(item.activeKey)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 12px',
                      borderRadius: '12px',
                      border: 'none',
                      background: isItemActive ? 'var(--ocean, #3F6593)' : 'transparent',
                      color: isItemActive ? '#FFFFFF' : '#DAD9D6',
                      fontWeight: isItemActive ? 700 : 500,
                      fontSize: '13.5px',
                      textAlign: 'start',
                      cursor: 'pointer',
                      width: '100%',
                    }}
                  >
                    <Icon size={18} />
                    <span style={{ flex: 1 }}>{label}</span>
                    <ChevronRight size={15} style={{ opacity: 0.5 }} />
                  </button>
                )
              })}
            </div>
          </div>

          {/* Distribution Management */}
          {distributionItems.length > 0 && (
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#9AB2CC', marginBottom: '8px', padding: '0 8px' }}>
                {t('nav.distributionManagement')}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {distributionItems.map((item) => {
                  const Icon = item.icon
                  const isItemActive = active === item.activeKey || (item.activeKey === 'Invoices & Sell-in' && (active === 'Invoices' || active === 'Sell-in'))
                  const label = NAV_LABEL_MAP[item.label] ? t(NAV_LABEL_MAP[item.label]) : item.label
                  return (
                    <button
                      key={item.label}
                      onClick={() => handleItemClick(item.activeKey)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '10px 12px',
                        borderRadius: '12px',
                        border: 'none',
                        background: isItemActive ? 'var(--ocean, #3F6593)' : 'transparent',
                        color: isItemActive ? '#FFFFFF' : '#DAD9D6',
                        fontWeight: isItemActive ? 700 : 500,
                        fontSize: '13.5px',
                        textAlign: 'start',
                        cursor: 'pointer',
                        width: '100%',
                      }}
                    >
                      <Icon size={18} />
                      <span style={{ flex: 1 }}>{label}</span>
                      <ChevronRight size={15} style={{ opacity: 0.5 }} />
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Admin / Reports */}
          {adminItems.length > 0 && (
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#9AB2CC', marginBottom: '8px', padding: '0 8px' }}>
                {canAccessPage('Admin', role, user) ? t('nav.admin') : t('nav.reports')}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {adminItems.map((item) => {
                  const Icon = item.icon
                  const isItemActive = active === item.activeKey
                  const label = NAV_LABEL_MAP[item.label] ? t(NAV_LABEL_MAP[item.label]) : item.label
                  return (
                    <button
                      key={item.label}
                      onClick={() => handleItemClick(item.activeKey)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '10px 12px',
                        borderRadius: '12px',
                        border: 'none',
                        background: isItemActive ? 'var(--ocean, #3F6593)' : 'transparent',
                        color: isItemActive ? '#FFFFFF' : '#DAD9D6',
                        fontWeight: isItemActive ? 700 : 500,
                        fontSize: '13.5px',
                        textAlign: 'start',
                        cursor: 'pointer',
                        width: '100%',
                      }}
                    >
                      <Icon size={18} />
                      <span style={{ flex: 1 }}>{label}</span>
                      <ChevronRight size={15} style={{ opacity: 0.5 }} />
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer with Dark Mode, Language & Logout */}
        <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid rgba(192, 230, 253, 0.12)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            onClick={onToggleDark}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 12px',
              borderRadius: '12px',
              border: 'none',
              background: 'transparent',
              color: '#DAD9D6',
              fontSize: '13px',
              cursor: 'pointer',
              textAlign: 'start',
            }}
          >
            {dark ? <Sun size={17} /> : <Moon size={17} />}
            <span>{dark ? (lang === 'ar' ? 'الوضع الفاتح' : 'Light mode') : (lang === 'ar' ? 'الوضع الداكن' : 'Dark mode')}</span>
          </button>

          <button
            onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 12px',
              borderRadius: '12px',
              border: 'none',
              background: 'transparent',
              color: '#DAD9D6',
              fontSize: '13px',
              cursor: 'pointer',
              textAlign: 'start',
            }}
          >
            <Languages size={17} />
            <span>{lang === 'ar' ? 'English' : 'العربية'}</span>
          </button>

          <button
            onClick={() => {
              onClose()
              onOpenLogout()
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 12px',
              borderRadius: '12px',
              border: 'none',
              background: 'rgba(217, 121, 139, 0.15)',
              color: 'var(--rose, #D9798B)',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
              textAlign: 'start',
            }}
          >
            <LogOut size={17} />
            <span>{t('nav.logout')}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
