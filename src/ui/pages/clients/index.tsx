import { useState, useRef, useMemo } from 'react'
import { Plus, Users, Edit3, Building2, Stethoscope, CheckCircle2 } from 'lucide-react'
import { Button } from '@/ui/design-system/components/Button'
import { Chip } from '@/ui/design-system/components/Chip'
import { EmptyState } from '@/ui/design-system/components/EmptyState'
import { Toast } from '@/ui/design-system/components/Toast'
import { StatusPill } from '@/ui/design-system/components/StatusPill'
import { ClientToolbar, type ClientFiltersState, ENTITY_TYPE_AR, STATUS_AR } from './components/ClientToolbar'
import { ClientListItem } from './components/ClientListItem'
import { EditCustomerDrawer } from './components/EditCustomerDrawer'
import { customersStore, updateCustomer, type Customer } from '@/data/mock/customers'
import { filterCustomersByScope } from '@/data/mock/dataScope'
import type { UserRole } from '@/lib/auth/types'
import { useStore } from '@/data/mock/store'
import { useT } from '@/lib/i18n'
import { SPECIALTY_AR, CLASSIFICATION_AR, CLIENT_REGION_AR } from './mock-data'

export interface ClientsPageProps {
  onAdd: () => void
  onAddPharmacy?: () => void
  onItem: (client?: Customer) => void
  filter?: string | null
  onClearFilter?: () => void
  role?: UserRole | string
  currentUserName?: string
  currentUserId?: string
  businessUnit?: string
}

export default function ClientsPage({
  onAdd,
  onAddPharmacy,
  onItem,
  filter,
  onClearFilter,
  role = 'admin',
  currentUserName = 'Alex Morgan',
  currentUserId,
  businessUnit,
}: ClientsPageProps) {
  const { t, lang } = useT()
  const customers = useStore(customersStore).filter((c) => !c.deleted_at)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('list')
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [toastUndo, setToastUndo] = useState<(() => void) | null>(null)
  const toastTimeoutRef = useRef<number | null>(null)

  const showUndoToast = (msg: string, undoCb: () => void) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
    setToastMessage(msg)
    setToastUndo(() => undoCb)
    toastTimeoutRef.current = window.setTimeout(() => {
      setToastMessage(null)
      setToastUndo(null)
    }, 8000)
  }

  const isCustomerEditable = (c: Customer): boolean => {
    if (role === 'admin') return true
    return Boolean(
      (c.repName && c.repName.toLowerCase() === currentUserName.toLowerCase()) ||
      (c.rep_id && currentUserName && c.rep_id.toLowerCase().includes(currentUserName.toLowerCase().split(' ')[0]))
    )
  }

  const [activeFilters, setActiveFilters] = useState<ClientFiltersState>({
    entityType: 'All types',
    specialty: 'All specialties',
    classification: 'All classes',
    region: 'All regions',
    assignedRep: 'All representatives',
    status: 'All statuses',
    overdueOnly: filter === 'Overdue only' || filter?.toLowerCase() === 'overdue',
  })

  // Derive all unique reps for the filter dropdown
  const allRepsList = useMemo(() => {
    return Array.from(new Set(customers.map((c) => c.repName).filter(Boolean)))
  }, [customers])

  // Role scoping: Reps see own clients; Managers see team/BU clients; Admin sees all
  const roleScopedClients = useMemo(() => {
    return filterCustomersByScope(customers, { id: currentUserId, name: currentUserName, role, businessUnit })
  }, [customers, currentUserId, currentUserName, role, businessUnit])

  // Helper to distinguish HCO (Organizations/Pharmacies) from HCP (Professionals/Doctors)
  const isHcoClient = (client: Customer): boolean =>
    client.clientCategory ? client.clientCategory === 'hco' : client.type === 'pharmacy'

  const isHcpClient = (client: Customer): boolean => !isHcoClient(client)

  // Base filtered clients matching search & all filters EXCLUDING entityType tab
  const clientsMatchingBaseFilters = useMemo(() => {
    return roleScopedClients.filter((client) => {
      // 1. Search text
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const matchName = client.name.toLowerCase().includes(q)
        const matchNameAr = client.name_ar?.toLowerCase().includes(q)
        const matchMeta = client.meta.toLowerCase().includes(q)
        const matchRep = client.repName.toLowerCase().includes(q)
        const matchHco = client.associatedHcoNames?.some((h) => h.toLowerCase().includes(q))
        const matchHcp = client.associatedHcpNames?.some((h) => h.toLowerCase().includes(q))
        if (!matchName && !matchNameAr && !matchMeta && !matchRep && !matchHco && !matchHcp) return false
      }

      // 2. Navigation filter or popover overdue filter
      const isOverdueFiltered = activeFilters.overdueOnly || filter === 'Overdue only'
      if (isOverdueFiltered && client.status.toLowerCase() !== 'overdue') {
        return false
      }

      // 4. Status
      if (activeFilters.status && activeFilters.status !== 'All statuses') {
        if (client.status.toLowerCase() !== activeFilters.status.toLowerCase()) {
          return false
        }
      }

      // 5. Assigned Representative
      if (activeFilters.assignedRep && activeFilters.assignedRep !== 'All representatives') {
        if (client.repName.toLowerCase() !== activeFilters.assignedRep.toLowerCase()) {
          return false
        }
      }

      // 6. Specialty
      if (activeFilters.specialty !== 'All specialties' && client.specialty !== activeFilters.specialty) {
        return false
      }

      // 7. Classification
      if (activeFilters.classification !== 'All classes' && client.classification !== activeFilters.classification) {
        return false
      }

      // 8. Region / Territory
      if (activeFilters.region !== 'All regions' && client.region !== activeFilters.region) {
        return false
      }

      return true
    })
  }, [
    roleScopedClients,
    searchQuery,
    filter,
    activeFilters.overdueOnly,
    activeFilters.status,
    activeFilters.assignedRep,
    activeFilters.specialty,
    activeFilters.classification,
    activeFilters.region,
  ])

  // Dynamic tab counts (All = HCP + HCO)
  const hcpTabCount = useMemo(() => {
    return clientsMatchingBaseFilters.filter(isHcpClient).length
  }, [clientsMatchingBaseFilters])

  const hcoTabCount = useMemo(() => {
    return clientsMatchingBaseFilters.filter(isHcoClient).length
  }, [clientsMatchingBaseFilters])

  const allClientsTabCount = useMemo(() => {
    return hcpTabCount + hcoTabCount
  }, [hcpTabCount, hcoTabCount])

  // Summary card analytics
  const clientStats = useMemo(() => {
    let activeClients = 0
    let classACount = 0
    let classBCount = 0
    let doctorCount = 0
    let pharmacistCount = 0
    let hospitalCount = 0
    let pharmacyCount = 0

    clientsMatchingBaseFilters.forEach((c) => {
      const isHco = isHcoClient(c)
      if (isHco) {
        if (c.hcoType === 'hospital') hospitalCount++
        else if (c.hcoType === 'pharmacy' || c.type === 'pharmacy') pharmacyCount++
      } else {
        if (c.hcpType === 'pharmacist') pharmacistCount++
        else doctorCount++
      }

      const isActive = c.active !== false && c.status?.toLowerCase() !== 'inactive'
      if (isActive) activeClients++

      if (c.classification === 'Class A') classACount++
      else if (c.classification === 'Class B') classBCount++
    })

    const total = allClientsTabCount
    const activePct = total > 0 ? Math.round((activeClients / total) * 100) : 0
    const inactiveClients = total - activeClients

    return {
      totalHcp: hcpTabCount,
      totalHco: hcoTabCount,
      activeClients,
      inactiveClients,
      activePct,
      totalClients: total,
      classACount,
      classBCount,
      doctorCount,
      pharmacistCount,
      hospitalCount,
      pharmacyCount,
    }
  }, [clientsMatchingBaseFilters, allClientsTabCount, hcpTabCount, hcoTabCount])

  // Final displayed clients after applying entityType tab/filter
  const displayedClients = useMemo(() => {
    return clientsMatchingBaseFilters.filter((client) => {
      if (activeFilters.entityType && activeFilters.entityType !== 'All types') {
        const isHco = isHcoClient(client)
        if (activeFilters.entityType === 'All HCPs' && isHco) return false
        if (activeFilters.entityType === 'All HCOs' && !isHco) return false
        if (activeFilters.entityType === 'Doctor (HCP)' && (isHco || client.hcpType === 'pharmacist' || client.hcpType === 'other')) return false
        if (activeFilters.entityType === 'Pharmacist (HCP)' && (isHco || client.hcpType !== 'pharmacist')) return false
        if (activeFilters.entityType === 'Other Specialist (HCP)' && (isHco || client.hcpType !== 'other')) return false
        if (activeFilters.entityType === 'Hospital (HCO)' && (!isHco || client.hcoType !== 'hospital')) return false
        if (activeFilters.entityType === 'Clinic (HCO)' && (!isHco || client.hcoType !== 'clinic')) return false
        if (activeFilters.entityType === 'Medical Center (HCO)' && (!isHco || client.hcoType !== 'medical_center')) return false
        if (activeFilters.entityType === 'Pharmacy (HCO)' && (!isHco || (client.hcoType !== 'pharmacy' && client.type !== 'pharmacy'))) return false
      }
      return true
    })
  }, [clientsMatchingBaseFilters, activeFilters.entityType])

  // Default sorting: clients by priority (Overdue first, then Class A)
  const sortedClients = useMemo(() => {
    return [...displayedClients].sort((a, b) => {
      if (a.status === 'Overdue' && b.status !== 'Overdue') return -1
      if (b.status === 'Overdue' && a.status !== 'Overdue') return 1
      if (a.classification === 'Class A' && b.classification !== 'Class A') return -1
      if (b.classification === 'Class A' && a.classification !== 'Class A') return 1
      return 0
    })
  }, [displayedClients])

  const removeEntityType = () => setActiveFilters((prev) => ({ ...prev, entityType: 'All types' }))
  const removeStatus = () => setActiveFilters((prev) => ({ ...prev, status: 'All statuses' }))
  const removeAssignedRep = () => setActiveFilters((prev) => ({ ...prev, assignedRep: 'All representatives' }))
  const removeSpecialty = () => setActiveFilters((prev) => ({ ...prev, specialty: 'All specialties' }))
  const removeClassification = () => setActiveFilters((prev) => ({ ...prev, classification: 'All classes' }))
  const removeRegion = () => setActiveFilters((prev) => ({ ...prev, region: 'All regions' }))
  const removeOverdue = () => {
    setActiveFilters((prev) => ({ ...prev, overdueOnly: false }))
    if (onClearFilter) onClearFilter()
  }

  const hasAnyFilter =
    (activeFilters.entityType && activeFilters.entityType !== 'All types') ||
    (activeFilters.status && activeFilters.status !== 'All statuses') ||
    (activeFilters.assignedRep && activeFilters.assignedRep !== 'All representatives') ||
    activeFilters.specialty !== 'All specialties' ||
    activeFilters.classification !== 'All classes' ||
    activeFilters.region !== 'All regions' ||
    activeFilters.overdueOnly ||
    Boolean(filter)

  return (
    <section className="content">
      <div className="page-intro">
        <div>
          <span className="eyebrow">
            <Users /> {t('clients.eyebrow')}
          </span>
          <h1>{t('clients.title')}</h1>
          <p className="story">{t('clients.subtitle')}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Button variant="secondary" onClick={onAddPharmacy || onAdd}>
            <Building2 size={15} /> {lang === 'ar' ? 'إضافة صيدلية' : 'Add Pharmacy'}
          </Button>
          <Button variant="primary" onClick={onAdd}>
            <Plus data-icon="inline-start" /> {lang === 'ar' ? 'إضافة طبيب' : 'Add Doctor'}
          </Button>
        </div>
      </div>

      {/* Quick Category Segmented Buttons */}
      <div style={{ display: 'flex', gap: '8px', margin: '20px 0 16px', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setActiveFilters((prev) => ({ ...prev, entityType: 'All types' }))}
          style={{
            padding: '6px 14px',
            borderRadius: '20px',
            border: activeFilters.entityType === 'All types' ? '1px solid var(--accent-primary, #2563eb)' : '1px solid var(--border-soft)',
            background: activeFilters.entityType === 'All types' ? 'rgba(37, 99, 235, 0.1)' : 'var(--surface)',
            color: activeFilters.entityType === 'All types' ? 'var(--accent-primary, #2563eb)' : 'var(--muted-text)',
            fontWeight: 600,
            fontSize: '13px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Users size={14} />
          {lang === 'ar' ? 'الكل' : 'All Clients'} ({allClientsTabCount})
        </button>
        <button
          type="button"
          onClick={() => setActiveFilters((prev) => ({ ...prev, entityType: 'All HCPs' }))}
          style={{
            padding: '6px 14px',
            borderRadius: '20px',
            border: activeFilters.entityType === 'All HCPs' ? '1px solid #059669' : '1px solid var(--border-soft)',
            background: activeFilters.entityType === 'All HCPs' ? 'rgba(16, 185, 129, 0.1)' : 'var(--surface)',
            color: activeFilters.entityType === 'All HCPs' ? '#059669' : 'var(--muted-text)',
            fontWeight: 600,
            fontSize: '13px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Stethoscope size={14} />
          {lang === 'ar' ? 'المهنيون الصحيون (HCP)' : 'Healthcare Professionals (HCP)'} ({hcpTabCount})
        </button>
        <button
          type="button"
          onClick={() => setActiveFilters((prev) => ({ ...prev, entityType: 'All HCOs' }))}
          style={{
            padding: '6px 14px',
            borderRadius: '20px',
            border: activeFilters.entityType === 'All HCOs' ? '1px solid #2563eb' : '1px solid var(--border-soft)',
            background: activeFilters.entityType === 'All HCOs' ? 'rgba(37, 99, 235, 0.1)' : 'var(--surface)',
            color: activeFilters.entityType === 'All HCOs' ? '#2563eb' : 'var(--muted-text)',
            fontWeight: 600,
            fontSize: '13px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Building2 size={14} />
          {lang === 'ar' ? 'المؤسسات الصحية (HCO)' : 'Healthcare Organizations (HCO)'} ({hcoTabCount})
        </button>
      </div>

      {/* Summary KPI Cards Strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '20px',
        }}
      >
        {/* Card 1: Total HCPs */}
        <div className="panel" style={{ padding: '20px' }}>
          <div className="panel-head" style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span className="eyebrow" style={{ fontSize: '11px' }}>
                {lang === 'ar' ? 'المهنيون الصحيون' : 'Total HCPs'}
              </span>
              <h3 style={{ fontSize: '24px', margin: '4px 0 0', fontWeight: 700 }}>
                {clientStats.totalHcp.toLocaleString()}
              </h3>
            </div>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(5, 150, 105, 0.12)',
                color: '#059669',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
              }}
            >
              <Stethoscope size={20} />
            </div>
          </div>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--muted-text)' }}>
            {lang === 'ar'
              ? `${clientStats.doctorCount} أطباء · ${clientStats.pharmacistCount} صيادلة`
              : `${clientStats.doctorCount} Doctors · ${clientStats.pharmacistCount} Pharmacists`}
          </p>
        </div>

        {/* Card 2: Total HCOs */}
        <div className="panel" style={{ padding: '20px' }}>
          <div className="panel-head" style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span className="eyebrow" style={{ fontSize: '11px' }}>
                {lang === 'ar' ? 'المؤسسات الصحية' : 'Total HCOs'}
              </span>
              <h3 style={{ fontSize: '24px', margin: '4px 0 0', fontWeight: 700 }}>
                {clientStats.totalHco.toLocaleString()}
              </h3>
            </div>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(37, 99, 235, 0.12)',
                color: '#2563eb',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
              }}
            >
              <Building2 size={20} />
            </div>
          </div>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--muted-text)' }}>
            {lang === 'ar'
              ? `${clientStats.hospitalCount} مستشفيات · ${clientStats.pharmacyCount} صيدليات`
              : `${clientStats.hospitalCount} Hospitals · ${clientStats.pharmacyCount} Pharmacies`}
          </p>
        </div>

        {/* Card 3: Active Clients */}
        <div className="panel" style={{ padding: '20px' }}>
          <div className="panel-head" style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span className="eyebrow" style={{ fontSize: '11px' }}>
                {lang === 'ar' ? 'العملاء النشطون' : 'Active Clients'}
              </span>
              <h3 style={{ fontSize: '24px', margin: '4px 0 0', fontWeight: 700 }}>
                {clientStats.activeClients.toLocaleString()}
              </h3>
            </div>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(16, 185, 129, 0.12)',
                color: '#10b981',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
              }}
            >
              <CheckCircle2 size={20} />
            </div>
          </div>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--muted-text)' }}>
            {lang === 'ar'
              ? `نسبة النشاط ${clientStats.activePct}% · ${clientStats.inactiveClients} غير نشط`
              : `${clientStats.activePct}% active rate · ${clientStats.inactiveClients} inactive`}
          </p>
        </div>

        {/* Card 4: Total Clients */}
        <div className="panel" style={{ padding: '20px' }}>
          <div className="panel-head" style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span className="eyebrow" style={{ fontSize: '11px' }}>
                {lang === 'ar' ? 'إجمالي العملاء' : 'Total Clients'}
              </span>
              <h3 style={{ fontSize: '24px', margin: '4px 0 0', fontWeight: 700 }}>
                {clientStats.totalClients.toLocaleString()}
              </h3>
            </div>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(27, 53, 84, 0.10)',
                color: 'var(--navy, #1B3554)',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
              }}
            >
              <Users size={20} />
            </div>
          </div>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--muted-text)' }}>
            {lang === 'ar'
              ? `${clientStats.classACount} فئة A · ${clientStats.classBCount} فئة B`
              : `${clientStats.classACount} Class A · ${clientStats.classBCount} Class B`}
          </p>
        </div>
      </div>

      <ClientToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        viewMode={viewMode}
        onToggleView={() => setViewMode(viewMode === 'list' ? 'cards' : 'list')}
        activeFilters={activeFilters}
        onApplyFilters={setActiveFilters}
        onClearFilters={() => {
          setActiveFilters({
            entityType: 'All types',
            specialty: 'All specialties',
            classification: 'All classes',
            region: 'All regions',
            assignedRep: 'All representatives',
            status: 'All statuses',
            overdueOnly: false,
          })
          if (onClearFilter) onClearFilter()
        }}
        repsList={allRepsList}
      />

      {/* Applied Removable Filter Chips */}
      {hasAnyFilter && (
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', margin: '0 0 16px' }}>
          <span style={{ fontSize: '12px', color: 'var(--muted-text)' }}>{t('clients.activeFilters')}</span>
          {activeFilters.entityType && activeFilters.entityType !== 'All types' && (
            <Chip active onClick={removeEntityType}>
              {lang === 'ar' ? (ENTITY_TYPE_AR[activeFilters.entityType] || activeFilters.entityType) : activeFilters.entityType} &times;
            </Chip>
          )}
          {activeFilters.status && activeFilters.status !== 'All statuses' && (
            <Chip active onClick={removeStatus}>
              {lang === 'ar' ? (STATUS_AR[activeFilters.status] || activeFilters.status) : activeFilters.status} &times;
            </Chip>
          )}
          {activeFilters.assignedRep && activeFilters.assignedRep !== 'All representatives' && (
            <Chip active onClick={removeAssignedRep}>
              {activeFilters.assignedRep} &times;
            </Chip>
          )}
          {(activeFilters.overdueOnly || filter === 'Overdue only') && (
            <Chip active onClick={removeOverdue} title={t('clients.clearOverdue')}>
              {t('clients.overdueOnly')} &times;
            </Chip>
          )}
          {activeFilters.specialty !== 'All specialties' && (
            <Chip active onClick={removeSpecialty} title={t('clients.clearSpecialty')}>
              {lang === 'ar' ? (SPECIALTY_AR[activeFilters.specialty] || activeFilters.specialty) : activeFilters.specialty} &times;
            </Chip>
          )}
          {activeFilters.classification !== 'All classes' && (
            <Chip active onClick={removeClassification} title={t('clients.clearClassification')}>
              {lang === 'ar' ? (CLASSIFICATION_AR[activeFilters.classification] || activeFilters.classification) : activeFilters.classification} &times;
            </Chip>
          )}
          {activeFilters.region !== 'All regions' && (
            <Chip active onClick={removeRegion} title={t('clients.clearRegion')}>
              {lang === 'ar' ? (CLIENT_REGION_AR[activeFilters.region] || activeFilters.region) : activeFilters.region} &times;
            </Chip>
          )}
        </div>
      )}

      {/* Collection items in List or Cards layout */}
      <div
        className="collection-list"
        style={
          viewMode === 'cards'
            ? { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '14px' }
            : undefined
        }
      >
        {sortedClients.length > 0 ? (
          sortedClients.map((client) => {
            const canEdit = isCustomerEditable(client)
            const isHco = client.clientCategory === 'hco' || client.type === 'pharmacy'

            if (viewMode === 'cards') {
              return (
                <div
                  key={client.id || client.name}
                  className="collection-card"
                  onClick={() => onItem(client)}
                  role="button"
                  tabIndex={0}
                  style={{
                    padding: '16px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-soft)',
                    background: 'var(--surface)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    gap: '12px',
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onItem(client)
                    }
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span
                        style={{
                          display: 'inline-block',
                          fontSize: '10px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          marginBottom: '4px',
                          background: isHco ? 'rgba(59, 130, 246, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                          color: isHco ? '#2563eb' : '#059669',
                        }}
                      >
                        {isHco ? 'HCO' : 'HCP'} · {client.specialty || client.classification}
                      </span>
                      <strong style={{ fontSize: '15px', display: 'block' }}>{client.name}</strong>
                      {client.name_ar && (
                        <span style={{ fontSize: '12px', color: 'var(--muted-text)', display: 'block' }}>
                          {client.name_ar}
                        </span>
                      )}
                    </div>
                    {/* Consistent readable StatusPill indicator */}
                    <StatusPill status={client.status} />
                  </div>

                  <div style={{ fontSize: '12px', color: 'var(--muted-text)', lineHeight: 1.5 }}>
                    <div>{client.meta}</div>
                    <div>{t('clients.rep', { name: client.repName })}</div>
                    {client.associatedHcoNames && client.associatedHcoNames.length > 0 && (
                      <div style={{ color: 'var(--heading-text)', fontWeight: 500, marginTop: '4px' }}>
                        🏢 {client.associatedHcoNames.join(', ')}
                      </div>
                    )}
                    {client.associatedHcpNames && client.associatedHcpNames.length > 0 && (
                      <div style={{ color: 'var(--heading-text)', fontWeight: 500, marginTop: '4px' }}>
                        👨‍⚕️ {client.associatedHcpNames.join(', ')}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
                    {canEdit && (
                      <Button
                        variant="secondary"
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingCustomer(client)
                        }}
                        style={{
                          height: '30px',
                          padding: '0 10px',
                          fontSize: '12px',
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Edit3 size={13} />
                        {t('common.edit')}
                      </Button>
                    )}
                  </div>
                </div>
              )
            }

            return (
              <ClientListItem
                key={client.id || client.name}
                item={client}
                onClick={() => onItem(client)}
                onEdit={setEditingCustomer}
                canEdit={canEdit}
              />
            )
          })
        ) : (
          <EmptyState message={t('clients.noMatch')} />
        )}
      </div>

      {/* Edit Customer Drawer */}
      <EditCustomerDrawer
        customer={editingCustomer}
        isOpen={Boolean(editingCustomer)}
        onClose={() => setEditingCustomer(null)}
        role={role === 'rep' ? 'rep' : 'admin'}
        currentUserName={currentUserName}
        onSave={(updated, previous) => {
          showUndoToast(t('clients.savedChanges', { name: updated.name }), () => {
            if (previous.id) {
              updateCustomer(previous.id, previous)
            }
          })
        }}
        onDelete={(deleted) => {
          showUndoToast(t('clients.deleted', { name: deleted.name }), () => {
            if (deleted.id) {
              updateCustomer(deleted.id, { deleted_at: null })
            }
          })
        }}
      />

      {/* Floating Feedback Toast with Undo */}
      {toastMessage && (
        <Toast message={toastMessage} onUndo={toastUndo ?? undefined} />
      )}
    </section>
  )
}
