'use client'

import { useState } from 'react'
import { Toast } from '@/ui/design-system/components/Toast'
import { RecordFormDrawer } from '@/ui/design-system/components/RecordFormDrawer'
import { Header } from '@/ui/layout/Header'
import { Sidebar } from '@/ui/layout/Sidebar'
import { BottomDock } from '@/ui/layout/BottomDock'
import { MenuSheet } from '@/ui/layout/MenuSheet'
import { CommandPalette } from '@/ui/layout/CommandPalette'
import { NotificationsDrawer } from '@/ui/layout/NotificationsDrawer'

// Self-contained page imports
import HomePage from '@/ui/pages/home'
import ClientsPage from '@/ui/pages/clients'
import DoctorProfilePage from '@/ui/pages/doctor-profile'
import InvoicesPage from '@/ui/pages/invoices'
import InvoiceReviewPage from '@/ui/pages/invoice-review'
import StockPage from '@/ui/pages/stock'
import { StockDetailSheet } from '@/ui/pages/stock/components/StockDetailSheet'
import SellInPage from '@/ui/pages/sell-in'
import SellOutPage from '@/ui/pages/sell-out'
import TargetsPage from '@/ui/pages/targets'
import VisitsPage from '@/ui/pages/visits'
import { NewVisitWizard } from '@/ui/pages/visits/components/NewVisitWizard'
import VisitPlanPage from '@/ui/pages/visit-plan'
import AdminPage from '@/ui/pages/admin'
import LoginPage from '@/ui/pages/login'
import { LogoutConfirmDialog } from '@/ui/pages/login/components/LogoutConfirmDialog'
import { UploadInvoiceModal } from '@/ui/pages/invoices/components/UploadInvoiceModal'
import MorePage from '@/ui/pages/more'

export default function App() {
  const [active, setActive] = useState('Home')
  const [range, setRange] = useState('Month')
  const [overlay, setOverlay] = useState<string | null>(null)
  const [notice, setNotice] = useState('')
  const [dark, setDark] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [role, setRole] = useState<'admin' | 'rep'>('admin')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const action = (message: string) => {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 2600)
  }

  const open = (name: string) => setOverlay(name)

  const save = () => {
    setOverlay(null)
    action('Saved successfully')
  }

  const selectNav = (label: string) => {
    setActive(label)
    setOverlay(null)
    setProfileOpen(false)
  }

  const toggleRole = () => {
    const nextRole = role === 'admin' ? 'rep' : 'admin'
    setRole(nextRole)
    action(`Switched to ${nextRole === 'admin' ? 'Admin' : 'Medical Rep'} view`)
  }

  return (
    <div className={`app-shell ${dark ? 'dark-mode' : ''} ${sidebarCollapsed ? 'sidebar-collapsed' : 'sidebar-expanded'}`}>
      {/* Redesigned Attached Left Sidebar */}
      <Sidebar
        active={active}
        onSelect={selectNav}
        role={role}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        onOpenLogout={() => open('logout')}
        userName="Alex Morgan"
        userEmail="alex.morgan@medora.health"
      />

      {/* Main Content Area starting right after sidebar */}
      <div className="app-main-viewport">
        {/* Redesigned Top Header */}
        <Header
          onOpenSearch={() => open('search')}
          onOpenNotifications={() => open('notifications')}
          onToggleDark={() => setDark(!dark)}
          dark={dark}
          role={role}
          onToggleRole={toggleRole}
          greetingName="Alex"
        />

        {/* Primary Page Views */}
        <div className="page-content-wrapper">
          {active === 'Home' && (
            <HomePage
              onAction={action}
              onOpen={open}
              range={range}
              setRange={setRange}
              setActive={setActive}
            />
          )}
          {active === 'Clients' && (
            <ClientsPage
              onAdd={() => open('add doctor')}
              onItem={() => open('doctor profile')}
            />
          )}
          {active === 'Invoices' && (
            <InvoicesPage
              onAdd={() => open('upload invoice')}
              onItem={() => open('invoice detail')}
            />
          )}
          {active === 'Stock' && (
            <StockPage
              onAdd={() => open('add product')}
              onItem={() => open('stock detail')}
            />
          )}
          {active === 'Sell-in' && <SellInPage />}
          {active === 'Sell-out' && <SellOutPage />}
          {active === 'Targets' && <TargetsPage />}
          {active === 'Visits' && <VisitsPage onNewVisit={() => open('new visit')} />}
          {active === 'Visit plan' && <VisitPlanPage />}
          {active === 'Reports' && <SellInPage />}
          {active === 'Admin' && <AdminPage />}
          {active === 'Users' && <AdminPage initialSubpage="users" />}
          {active === 'Products & Batches' && <AdminPage initialSubpage="products" />}
          {active === 'Territories' && <AdminPage initialSubpage="territories" />}
          {active === 'Audit log' && <AdminPage initialSubpage="audit-log" />}
          {active === 'Settings' && <AdminPage initialSubpage="settings" />}
          {active === 'Login' && <LoginPage onLogin={() => selectNav('Home')} />}
          {active === 'More' && (
            <MorePage
              onSelectPage={(page) => selectNav(page)}
              onAction={action}
            />
          )}
        </div>
      </div>

      {/* Profile Sheet (Mobile / Action Menu) */}
      <MenuSheet
        isOpen={profileOpen}
        dark={dark}
        onToggleDark={() => setDark(!dark)}
        onOpenLogout={() => open('logout')}
      />

      {/* Mobile Bottom Navigation (<768px) */}
      <BottomDock active={active} onSelect={selectNav} />

      {/* Floating Feedback Toast */}
      {notice && <Toast message={notice} />}

      {/* Command Palette Modal */}
      <CommandPalette
        isOpen={overlay === 'search'}
        onClose={() => setOverlay(null)}
        onAction={action}
      />

      {/* Notifications Drawer */}
      <NotificationsDrawer
        isOpen={overlay === 'notifications'}
        onClose={() => setOverlay(null)}
        onAction={action}
      />

      {/* Log out Confirmation */}
      <LogoutConfirmDialog
        isOpen={overlay === 'logout'}
        onClose={() => setOverlay(null)}
        onConfirmLogout={() => {
          setOverlay(null)
          action('You have been logged out')
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
          onClose={() => setOverlay(null)}
          onSave={save}
        />
      )}

      {/* Upload Invoice */}
      <UploadInvoiceModal
        isOpen={overlay === 'upload invoice'}
        onClose={() => setOverlay(null)}
        onSave={save}
      />

      {/* Invoice Review Detail */}
      {overlay === 'invoice detail' && (
        <InvoiceReviewPage
          onClose={() => setOverlay(null)}
          onAction={action}
        />
      )}

      {/* Doctor Profile Detail */}
      {overlay === 'doctor profile' && (
        <DoctorProfilePage
          onClose={() => setOverlay(null)}
          onNewVisit={() => open('new visit')}
          onSave={save}
        />
      )}

      {/* Stock Detail */}
      <StockDetailSheet
        isOpen={overlay === 'stock detail'}
        onClose={() => setOverlay(null)}
        onOpenStockCount={() => open('stock count')}
      />

      {/* New Visit Wizard */}
      <NewVisitWizard
        isOpen={overlay === 'new visit'}
        onClose={() => setOverlay(null)}
        onSave={() => action('Visit saved')}
      />
    </div>
  )
}
