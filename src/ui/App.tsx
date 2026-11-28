'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Toast } from '@/ui/design-system/components/Toast'
import { RecordFormDrawer } from '@/ui/design-system/components/RecordFormDrawer'
import { Header } from '@/ui/layout/Header'
import { Sidebar } from '@/ui/layout/Sidebar'
import { BottomDock } from '@/ui/layout/BottomDock'
import { MenuSheet } from '@/ui/layout/MenuSheet'
import { CommandPalette } from '@/ui/layout/CommandPalette'
import { NotificationsDrawer } from '@/ui/layout/NotificationsDrawer'
import { TabletNavigationDrawer } from '@/ui/layout/TabletNavigationDrawer'
import { runBackHandlers } from '@/lib/useBackHandler'

// Self-contained page imports
import HomePage from '@/ui/pages/home'
import ClientsPage from '@/ui/pages/clients'
import DoctorProfilePage from '@/ui/pages/doctor-profile'
import InvoicesPage from '@/ui/pages/invoices'
import InvoicesSellInPage from '@/ui/pages/invoices-sell-in'
import DistributionOverviewPage from '@/ui/pages/distribution-overview'
import InvoiceReviewPage from '@/ui/pages/invoice-review'
import WarehousesPage from '@/ui/pages/warehouses'
import StockPage from '@/ui/pages/stock'
import { StockDetailSheet } from '@/ui/pages/stock/components/StockDetailSheet'
import SellInPage from '@/ui/pages/sell-in'
import SellOutPage from '@/ui/pages/sell-out'
import ReturnsPage from '@/ui/pages/returns'
import TargetsPage from '@/ui/pages/targets'
import VisitsPage from '@/ui/pages/visits'
import { NewVisitWizard } from '@/ui/pages/visits/components/NewVisitWizard'
import VisitPlanPage from '@/ui/pages/visit-plan'
import BudgetsPage from '@/ui/pages/budgets'
import AdminPage from '@/ui/pages/admin'
import LoginPage from '@/ui/pages/login'
import { LogoutConfirmDialog } from '@/ui/pages/login/components/LogoutConfirmDialog'
import { UploadInvoiceModal } from '@/ui/pages/invoices/components/UploadInvoiceModal'
import MorePage from '@/ui/pages/more'
import PerformanceAnalyticsPage from '@/ui/pages/performance-analytics'
import CashInPage from '@/ui/pages/cash-in'
import ReportsPage from '@/ui/pages/reports'
import ProfilePage from '@/ui/pages/profile'
import { AuthProvider, useAuth, canAccessPage } from '@/lib/auth'
import { LanguageProvider, useT } from '@/lib/i18n'
import { VisitAlarmModal } from '@/ui/design-system/components/VisitAlarmModal'
import {
  visitAlarmsStore,
  dismissVisitAlarm,
  snoozeVisitAlarm,
  checkAndTriggerImportantVisitAlarms,
} from '@/data/mock/visitAlarm'
import { useStore } from '@/data/mock/store'

function AppContent() {
  const { user, role, signOut, isLoading } = useAuth()
  const { t } = useT()
  const [active, setActive] = useState('Home')
  const [range, setRange] = useState('Month')
  const [overlay, setOverlay] = useState<string | null>(null)
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>('c-1')
  const [selectedStockProduct, setSelectedStockProduct] = useState<string>('Bevato')
  const [selectedInvoiceName, setSelectedInvoiceName] = useState<string | null>(null)
  const [notice, setNotice] = useState('')
  const [dark, setDark] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [tabletMenuOpen, setTabletMenuOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Tablet Landscape responsiveness: default to collapsed on screens < 1200px
  useEffect(() => {
    if (typeof window === 'undefined') return
    const handleInitialResponsive = () => {
      if (window.innerWidth >= 769 && window.innerWidth < 1200) {
        setSidebarCollapsed(true)
      }
    }
    handleInitialResponsive()
  }, [])

  // Synchronize dark-mode class on document.body for portals and global text inheritance
  useEffect(() => {
    if (typeof document === 'undefined') return
    if (dark) {
      document.body.classList.add('dark-mode')
    } else {
      document.body.classList.remove('dark-mode')
    }
    return () => {
      document.body.classList.remove('dark-mode')
    }
  }, [dark])

  // Visit Alarm state
  // alarmDismissedIds tracks locally-dismissed alarms (hides modal even before store update propagates)
  const visitAlarms = useStore(visitAlarmsStore)
  const [alarmDismissedIds, setAlarmDismissedIds] = useState<Set<string>>(new Set())
  const [snoozedUntilMap, setSnoozedUntilMap] = useState<Record<string, number>>({})

  const activeAlarm = useMemo(() => {
    const now = Date.now()
    return (
      visitAlarms.find(
        (a) =>
          !a.dismissed &&
          !alarmDismissedIds.has(a.id) &&
          (!snoozedUntilMap[a.id] || snoozedUntilMap[a.id] <= now),
      ) || null
    )
  }, [visitAlarms, alarmDismissedIds, snoozedUntilMap])

  // Re-check snoozed alarms periodically so they resurface after snooze expires
  useEffect(() => {
    if (Object.keys(snoozedUntilMap).length === 0) return
    const timer = window.setInterval(() => {
      setSnoozedUntilMap((prev) => {
        const now = Date.now()
        const updated = { ...prev }
        let changed = false
        for (const id of Object.keys(updated)) {
          if (updated[id] <= now) {
            delete updated[id]
            changed = true
          }
        }
        return changed ? updated : prev
      })
    }, 15000)
    return () => window.clearInterval(timer)
  }, [snoozedUntilMap])

  // Check and trigger important alarms on system open / user login
  useEffect(() => {
    if (!user) return
    checkAndTriggerImportantVisitAlarms(user)
  }, [user])

  // Navigation history stack
  type NavEntry = { page: string; filter: string | null; overlay: string | null }
  const [navStack, setNavStack] = useState<NavEntry[]>([])
  // Ref to overlay so popstate handler can read latest
  const overlayRef = useRef<string | null>(null)
  overlayRef.current = overlay

  // Push a browser history entry when active page changes
  useEffect(() => {
    if (typeof window === 'undefined') return
    window.history.pushState({ page: active }, '', window.location.pathname)
  }, [active])

  // Browser Back / Alt+Left: delegate to goBack
  useEffect(() => {
    const handler = () => {
      goBack()
      // Re-push so we always have an entry to pop next time
      window.history.pushState({ page: active }, '', window.location.pathname)
    }
    window.addEventListener('popstate', handler)
    return () => window.removeEventListener('popstate', handler)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, navStack])

  // Redirect to Home if the current page becomes unauthorized (e.g. after admin permission change)
  useEffect(() => {
    if (!user) return
    const unguardedPages = new Set(['Home', 'Profile', 'More', 'Login', 'Settings'])
    if (unguardedPages.has(active)) return
    if (!canAccessPage(active, role, user)) {
      setNotice(t('app.toastNoPageAccess'))
      window.setTimeout(() => setNotice(''), 2600)
      setActive('Home')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, user, role])

  const action = (message: string) => {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 2600)
  }

  const open = (name: string) => setOverlay(name)

  // Opens invoice review; without a name it falls back to the first
  // pending invoice in the store (Home hero entry point).
  const openInvoiceDetail = (invoiceName?: string | null) => {
    setSelectedInvoiceName(invoiceName ?? null)
    open('invoice detail')
  }

  const save = (msg?: string) => {
    setOverlay(null)
    action(typeof msg === 'string' && msg ? msg : t('app.toastSaved'))
  }

  // Shared navigation state with optional page filter and overlay intent.
  const [pageFilter, setPageFilter] = useState<{ [page: string]: string | null }>({})

  // goBack: a) close overlay; b) run sub-view handler; c) pop stack; d) Home
  const goBack = useCallback(() => {
    if (overlayRef.current) {
      setOverlay(null)
      return
    }
    if (runBackHandlers()) return
    setNavStack((prev) => {
      if (prev.length === 0) {
        setActive('Home')
        setPageFilter((pf) => ({ ...pf, Home: null }))
        return prev
      }
      const entry = prev[prev.length - 1]
      setActive(entry.page)
      setPageFilter((pf) => ({ ...pf, [entry.page]: entry.filter }))
      if (entry.overlay) setOverlay(entry.overlay)
      return prev.slice(0, -1)
    })
  }, [])

  const navigateTo = (page: string, options?: { filter?: string; overlay?: string }) => {
    if (!canAccessPage(page, role, user)) {
      action(t('app.toastNoPageAccess'))
      setActive('Home')
      return
    }
    // Push current state onto stack (skip if same page, max 30)
    if (page !== active) {
      setNavStack((prev) => {
        const entry: NavEntry = { page: active, filter: pageFilter[active] ?? null, overlay }
        const next = [...prev, entry]
        return next.length > 30 ? next.slice(-30) : next
      })
    }
    setActive(page)
    setPageFilter((prev) => ({
      ...prev,
      [page]: options?.filter || null,
    }))
    if (options?.overlay) {
      setOverlay(options.overlay)
    } else {
      setOverlay(null)
    }
    setProfileOpen(false)
  }

  const clearPageFilter = (page: string) => {
    setPageFilter((prev) => ({
      ...prev,
      [page]: null,
    }))
  }

  const selectNav = (label: string) => {
    if (label === 'More' || label === 'Menu') {
      setProfileOpen((prev) => !prev)
      return
    }
    // Clicking Dashboard clears the history stack
    if (label === 'Home' || label === 'Dashboard') {
      setNavStack([])
    }
    navigateTo(label)
  }

  if (isLoading) {
    return null
  }

  if (!user || active === 'Login') {
    return (
      <div className={`app-shell ${dark ? 'dark-mode' : ''}`}>
        <LoginPage onLogin={() => { setActive('Home'); action(t('app.toastSignedIn')); }} />
        {notice && <Toast message={notice} />}
      </div>
    )
  }

  const currentUserName = user.name
  const currentUserEmail = user.email
  const greetingName = user.name.split(' ')[0]
  const userInitials = user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
  const legacyRole: 'admin' | 'rep' = role === 'admin' ? 'admin' : 'rep'

  return (
    <div className={`app-shell ${dark ? 'dark-mode' : ''} ${sidebarCollapsed ? 'sidebar-collapsed' : 'sidebar-expanded'}`}>
      {/* Attached Left Sidebar */}
      <Sidebar
        active={active}
        onSelect={selectNav}
        role={role}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        onOpenLogout={() => open('logout')}
        userName={currentUserName}
        userEmail={currentUserEmail}
        user={user}
      />

      {/* Main Content Area */}
      <div className="app-main-viewport">
        {/* Top Header */}
        <Header
          onOpenSearch={() => open('search')}
          onOpenNotifications={() => open('notifications')}
          onToggleDark={() => setDark(!dark)}
          dark={dark}
          greetingName={greetingName}
          user={user}
          activePage={active}
          onBack={goBack}
          onOpenMenu={() => setTabletMenuOpen(true)}
        />

        {/* Primary Page Views */}
        <div className="page-content-wrapper">
          {active === 'Home' && (
            <HomePage
              onAction={action}
              onOpen={(name) => (name === 'invoice detail' ? openInvoiceDetail() : open(name))}
              range={range}
              setRange={setRange}
              setActive={setActive}
              onNavigateWithFilter={(page, options) => navigateTo(page, options)}
              onSelectRep={(repName) => navigateTo('Visits', { filter: repName })}
            />
          )}
          {active === 'Clients' && canAccessPage('Clients', role, user) && (
            <ClientsPage
              onAdd={() => open('add doctor')}
              onAddPharmacy={() => open('add pharmacy')}
              onItem={(client) => {
                if (client?.id) setSelectedCustomerId(client.id)
                open('doctor profile')
              }}
              filter={pageFilter['Clients']}
              onClearFilter={() => clearPageFilter('Clients')}
              role={role}
              currentUserName={currentUserName}
              currentUserId={user.id}
              businessUnit={user.businessUnit}
            />
          )}
          {active === 'Distribution Overview' && canAccessPage('Distribution Overview', role, user) && (
            <DistributionOverviewPage
              onNavigate={navigateTo}
              role={role}
              currentUserName={currentUserName}
            />
          )}
          {(active === 'Invoices & Sell-in' || active === 'Invoices' || active === 'Sell-in') &&
            canAccessPage(active, role, user) && (
              <InvoicesSellInPage
                initialTab={active === 'Sell-in' ? 'sell-in' : 'invoices'}
                onAddInvoice={() => open('upload invoice')}
                onItemInvoice={(invoice) => openInvoiceDetail(invoice.name)}
                invoiceFilter={pageFilter['Invoices']}
                onClearInvoiceFilter={() => clearPageFilter('Invoices')}
                role={role}
                currentUserName={currentUserName}
                onAction={action}
              />
            )}
          {active === 'Warehouses' && canAccessPage('Warehouses', role, user) && (
            <WarehousesPage
              role={role}
              currentUserName={currentUserName}
              onAction={action}
            />
          )}
          {active === 'Stock' && canAccessPage('Stock', role, user) && (
            <StockPage
              onAdd={() => open('add product')}
              onItem={() => open('stock detail')}
              onSelectProduct={setSelectedStockProduct}
              filter={pageFilter['Stock']}
              onClearFilter={() => clearPageFilter('Stock')}
              role={role}
              currentUserName={currentUserName}
            />
          )}
          {active === 'Sell-out' && canAccessPage('Sell-out', role, user) && (
            <SellOutPage
              role={role}
              currentUserName={currentUserName}
              currentUserId={user.id}
              businessUnit={user.businessUnit}
              onAction={action}
            />
          )}
          {active === 'Performance Analytics' && canAccessPage('Performance Analytics', role, user) && (
            <PerformanceAnalyticsPage
              role={role}
              currentUserName={currentUserName}
              onAction={action}
            />
          )}
          {active === 'Cash In' && canAccessPage('Cash In', role, user) && (
            <CashInPage
              role={role}
              currentUserName={currentUserName}
              onAction={action}
            />
          )}
          {active === 'Returns' && canAccessPage('Returns', role, user) && <ReturnsPage onAction={action} />}
          {active === 'Targets' && canAccessPage('Targets', role, user) && (
            <TargetsPage
              role={role}
              currentUserName={user.name}
              currentUserId={user.id}
              businessUnit={user.businessUnit}
              onAction={action}
            />
          )}
          {active === 'Visits' && canAccessPage('Visits', role, user) && (
            <VisitsPage
              onNewVisit={() => open('new visit')}
              filterRep={pageFilter['Visits']}
              onClearFilter={() => clearPageFilter('Visits')}
              role={role}
              currentUserName={currentUserName}
              currentUserId={user.id}
              businessUnit={user.businessUnit}
            />
          )}
          {active === 'Visit plan' && canAccessPage('Visit plan', role, user) && (
            <VisitPlanPage
              role={role}
              currentUserName={currentUserName}
              currentUserId={user.id}
              businessUnit={user.businessUnit}
              filter={pageFilter['Visit plan']}
            />
          )}
          {active === 'Budgets' && canAccessPage('Budgets', role, user) && (
            <BudgetsPage role={role} currentUserName={currentUserName} />
          )}
          {active === 'Reports' && canAccessPage('Reports', role, user) && (
            <ReportsPage
              role={role}
              currentUserName={currentUserName}
              currentUserId={user.id}
              businessUnit={user.businessUnit}
              initialReportId={pageFilter['Reports'] || undefined}
              onClearFilter={() => clearPageFilter('Reports')}
              onAction={action}
            />
          )}
          {active === 'Profile' && (
            <ProfilePage
              userName={currentUserName}
              userEmail={currentUserEmail}
              dark={dark}
              onToggleDark={() => setDark(!dark)}
              onAction={action}
            />
          )}
          {active === 'Admin' && canAccessPage('Admin', role, user) && <AdminPage />}
          {active === 'Users' && canAccessPage('Users', role, user) && (
            <AdminPage initialSubpage="users" filter={pageFilter['Users']} />
          )}
          {active === 'Products & Batches' && canAccessPage('Products & Batches', role, user) && <AdminPage initialSubpage="products" />}
          {active === 'Territories' && canAccessPage('Territories', role, user) && <AdminPage initialSubpage="territories" />}
          {active === 'Audit log' && canAccessPage('Audit log', role, user) && <AdminPage initialSubpage="audit-log" />}
          {active === 'Settings' && (canAccessPage('Settings', role, user) ? (
            <AdminPage
              initialSubpage="settings"
              currentUserName={currentUserName}
              currentUserEmail={currentUserEmail}
              role={role}
              dark={dark}
              onToggleDark={() => setDark(!dark)}
              onAction={action}
            />
          ) : (
            <ProfilePage
              userName={currentUserName}
              userEmail={currentUserEmail}
              dark={dark}
              onToggleDark={() => setDark(!dark)}
              onAction={action}
            />
          ))}
          {active === 'More' && (
            <MorePage
              onSelectPage={(page) => selectNav(page)}
              onAction={action}
              role={role}
            />
          )}
        </div>
      </div>

      {/* Profile Sheet (Mobile / Action Menu) */}
      {profileOpen && (
        <div
          className="profile-menu-backdrop"
          style={{ position: 'fixed', inset: 0, zIndex: 11 }}
        />
      )}
      <MenuSheet
        isOpen={profileOpen}
        onClose={() => setProfileOpen(false)}
        dark={dark}
        onToggleDark={() => setDark(!dark)}
        onOpenLogout={() => {
          setProfileOpen(false)
          open('logout')
        }}
        userName={currentUserName}
        accountType={role === 'admin' ? t('app.adminAccount') : t('app.repAccount')}
      />

      {/* Mobile Bottom Navigation (<768px) */}
      <BottomDock active={profileOpen ? 'More' : active} onSelect={selectNav} user={user} role={role} />

      {/* Tablet Slide-out Full Navigation Drawer */}
      <TabletNavigationDrawer
        isOpen={tabletMenuOpen}
        onClose={() => setTabletMenuOpen(false)}
        active={active}
        onSelect={selectNav}
        user={user}
        role={role}
        dark={dark}
        onToggleDark={() => setDark(!dark)}
        onOpenLogout={() => open('logout')}
      />

      {/* Floating Feedback Toast */}
      {notice && <Toast message={notice} />}

      {/* Command Palette Modal */}
      <CommandPalette
        isOpen={overlay === 'search'}
        onClose={() => setOverlay(null)}
        onAction={action}
        onNavigate={navigateTo}
      />

      {/* Notifications Drawer */}
      <NotificationsDrawer
        isOpen={overlay === 'notifications'}
        onClose={() => setOverlay(null)}
        onAction={action}
        onNavigate={navigateTo}
      />

      {/* Log out Confirmation */}
      <LogoutConfirmDialog
        isOpen={overlay === 'logout'}
        onClose={() => setOverlay(null)}
        onConfirmLogout={() => {
          setOverlay(null)
          signOut()
          setNavStack([])
          setActive('Login')
          action(t('app.toastLoggedOut'))
        }}
      />

      {/* Record Form Drawers */}
      {['add doctor', 'add product', 'stock count', 'add pharmacy'].includes(overlay || '') && (
        <RecordFormDrawer
          title={
            overlay === 'add doctor'
              ? 'Add doctor'
              : overlay === 'add product'
              ? 'Add product'
              : overlay === 'stock count'
              ? 'Stock count'
              : 'Add pharmacy'
          }
          role={role}
          currentUser={user}
          onClose={() => setOverlay(null)}
          onSave={save}
        />
      )}

      {/* Upload Invoice */}
      <UploadInvoiceModal
        isOpen={overlay === 'upload invoice'}
        onClose={() => setOverlay(null)}
        onSave={save}
        role={role}
        currentUserName={currentUserName}
        currentUserId={user?.id}
      />

      {/* Invoice Review Detail */}
      {overlay === 'invoice detail' && (
        <InvoiceReviewPage
          invoiceName={selectedInvoiceName}
          onClose={() => setOverlay(null)}
          onAction={action}
        />
      )}

      {/* Doctor Profile Detail */}
      {overlay === 'doctor profile' && (
        <DoctorProfilePage
          customerId={selectedCustomerId}
          role={role}
          currentUserName={currentUserName}
          onClose={() => setOverlay(null)}
          onNewVisit={() => open('new visit')}
          onSave={save}
        />
      )}

      {/* Stock Detail */}
      <StockDetailSheet
        isOpen={overlay === 'stock detail'}
        productName={selectedStockProduct}
        role={legacyRole}
        currentUserName={currentUserName}
        onClose={() => setOverlay(null)}
        onOpenStockCount={() => open('stock count')}
      />

      {/* New Visit Wizard */}
      <NewVisitWizard
        isOpen={overlay === 'new visit'}
        initialClientId={selectedCustomerId}
        role={role || legacyRole}
        currentUserName={currentUserName}
        onClose={() => setOverlay(null)}
        onSave={() => action(t('app.toastVisitSaved'))}
        onViewVisit={(_visitId) => {
          setOverlay(null)
          navigateTo('Visits')
        }}
      />

      {/* Visit Alarm Modal */}
      <VisitAlarmModal
        alarm={activeAlarm}
        isOpen={Boolean(activeAlarm)}
        onClose={() => {
          // X button / backdrop: locally dismiss so modal doesn't immediately reopen
          if (activeAlarm) {
            dismissVisitAlarm(activeAlarm.id)
            setAlarmDismissedIds((prev) => new Set([...prev, activeAlarm.id]))
          }
        }}
        onDismiss={(alarmId) => {
          dismissVisitAlarm(alarmId)
          setAlarmDismissedIds((prev) => new Set([...prev, alarmId]))
        }}
        onSnooze={(alarmId, minutes = 15) => {
          snoozeVisitAlarm(alarmId, minutes)
          setSnoozedUntilMap((prev) => ({
            ...prev,
            [alarmId]: Date.now() + minutes * 60 * 1000,
          }))
        }}
        onNavigateToCalendar={() => {
          setActive('Visit plan')
          if (activeAlarm) {
            setAlarmDismissedIds((prev) => new Set([...prev, activeAlarm.id]))
          }
        }}
        onNavigateToCustomer={(customerId) => {
          setSelectedCustomerId(customerId)
          open('doctor profile')
          if (activeAlarm) {
            setAlarmDismissedIds((prev) => new Set([...prev, activeAlarm.id]))
          }
        }}
      />
    </div>
  )
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </LanguageProvider>
  )
}
