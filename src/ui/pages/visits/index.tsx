'use client'

import { useState, useMemo } from 'react'
import {
  Plus,
  Stethoscope,
  Search,
  LayoutList,
  LayoutGrid,
  MapPin,
  Calendar,
  Clock,
  Sparkles,
  Package,
} from 'lucide-react'
import { Button } from '@/ui/design-system/components/Button'
import { Chip } from '@/ui/design-system/components/Chip'
import { EmptyState } from '@/ui/design-system/components/EmptyState'
import { StatusPill } from '@/ui/design-system/components/StatusPill'
import { VisitListItem } from './components/VisitListItem'
import { VisitDetailDrawer } from './components/VisitDetailDrawer'
import { visitsStore } from '@/data/mock/visits'
import { useStore } from '@/data/mock/store'
import { useT } from '@/lib/i18n'
import { formatRepName, formatDate } from '@/lib/format'
import { type VisitRecord } from './mock-data'

export interface VisitsPageProps {
  onNewVisit: () => void
  filterRep?: string | null
  onClearFilter?: () => void
  role?: 'admin' | 'rep'
  currentUserName?: string
}

export default function VisitsPage({
  onNewVisit,
  filterRep,
  onClearFilter,
  role = 'admin',
  currentUserName = 'Alex Morgan',
}: VisitsPageProps) {
  const { t, lang } = useT()
  const visitsMockData = useStore(visitsStore)
  const [selectedVisit, setSelectedVisit] = useState<VisitRecord | null>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('list')
  const [statusFilter, setStatusFilter] = useState<'all' | 'Completed' | 'Scheduled'>('all')

  // 1. Role-based scoping: reps only see their own visits
  const roleScopedVisits = useMemo(() => {
    return role === 'rep'
      ? visitsMockData.filter((v) => v.repName.toLowerCase() === currentUserName.toLowerCase())
      : visitsMockData
  }, [visitsMockData, role, currentUserName])

  // 2. Search, Status, and Rep filters
  const displayedVisits = useMemo(() => {
    return roleScopedVisits.filter((visit) => {
      // Rep navigation filter (from TopRepsPanel or elsewhere)
      if (filterRep && visit.repName.toLowerCase() !== filterRep.toLowerCase()) {
        return false
      }

      // Status filter
      if (statusFilter !== 'all' && visit.status.toLowerCase() !== statusFilter.toLowerCase()) {
        return false
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchClient =
          visit.clientName.toLowerCase().includes(q) ||
          (visit.clientName_ar && visit.clientName_ar.toLowerCase().includes(q))
        const matchRep =
          visit.repName.toLowerCase().includes(q) ||
          (visit.repName_ar && visit.repName_ar.toLowerCase().includes(q))
        const matchDetail =
          visit.detail.toLowerCase().includes(q) ||
          (visit.detail_ar && visit.detail_ar.toLowerCase().includes(q))
        const matchNotes = visit.notes && visit.notes.toLowerCase().includes(q)
        const matchProduct = visit.productsPresented?.some((p) => p.toLowerCase().includes(q))

        if (!matchClient && !matchRep && !matchDetail && !matchNotes && !matchProduct) {
          return false
        }
      }

      return true
    })
  }, [roleScopedVisits, filterRep, statusFilter, searchQuery])

  return (
    <section className="content">
      {/* Page Header */}
      <div className="page-intro">
        <div>
          <span className="eyebrow">
            <Stethoscope /> {t('visits.eyebrow')}
          </span>
          <h1>{t('visits.title')}</h1>
          <p className="story">{t('visits.subtitle')}</p>
        </div>
        <Button variant="primary" onClick={onNewVisit}>
          <Plus data-icon="inline-start" /> {t('visits.newVisit')}
        </Button>
      </div>

      {/* Toolbar: Search, Filters, and View Toggle */}
      <div
        className="collection-toolbar"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          marginTop: '24px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '240px' }}>
          <div
            className="search-input-wrap"
            style={{
              position: 'relative',
              flex: 1,
              maxWidth: '380px',
            }}
          >
            <Search
              size={16}
              style={{
                position: 'absolute',
                insetInlineStart: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--muted-text)',
                pointerEvents: 'none',
              }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === 'ar' ? 'بحث عن طبيب، صيدلية، مندوب أو منتج...' : 'Search doctor, client, rep, or product...'}
              style={{
                width: '100%',
                padding: '8px 12px',
                paddingInlineStart: '36px',
                borderRadius: '8px',
                border: '1px solid var(--border-soft)',
                background: 'var(--surface)',
                color: 'var(--heading-text)',
                fontSize: '13px',
              }}
            />
          </div>

          {/* Quick Status Buttons */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              style={{
                padding: '6px 12px',
                borderRadius: '999px',
                border: statusFilter === 'all' ? '1px solid var(--accent-primary, #2563eb)' : '1px solid var(--border-soft)',
                background: statusFilter === 'all' ? 'rgba(37, 99, 235, 0.1)' : 'var(--surface)',
                color: statusFilter === 'all' ? 'var(--accent-primary, #2563eb)' : 'var(--muted-text)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {lang === 'ar' ? 'الكل' : 'All'} ({roleScopedVisits.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('Completed')}
              style={{
                padding: '6px 12px',
                borderRadius: '999px',
                border: statusFilter === 'Completed' ? '1px solid #059669' : '1px solid var(--border-soft)',
                background: statusFilter === 'Completed' ? 'rgba(16, 185, 129, 0.1)' : 'var(--surface)',
                color: statusFilter === 'Completed' ? '#059669' : 'var(--muted-text)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {lang === 'ar' ? 'مكتملة' : 'Completed'}
            </button>
          </div>
        </div>

        {/* View Toggle (List vs Cards) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Button
            variant={viewMode === 'list' ? 'primary' : 'secondary'}
            onClick={() => setViewMode('list')}
            aria-label="List view"
            style={{ height: '34px', padding: '0 10px' }}
          >
            <LayoutList size={15} />
          </Button>
          <Button
            variant={viewMode === 'cards' ? 'primary' : 'secondary'}
            onClick={() => setViewMode('cards')}
            aria-label="Card grid view"
            style={{ height: '34px', padding: '0 10px' }}
          >
            <LayoutGrid size={15} />
          </Button>
        </div>
      </div>

      {/* Removable filter chip when filtered by rep from TopRepsPanel */}
      {filterRep && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px' }}>
          <span style={{ fontSize: '12px', color: 'var(--muted-text)' }}>{t('visits.filteredByRep')}</span>
          <Chip active onClick={onClearFilter} title={t('visits.clearFilter')}>
            {formatRepName(filterRep, lang)} &times;
          </Chip>
        </div>
      )}

      {/* Visits List or Cards Grid */}
      <div
        style={{ marginTop: '20px' }}
        className="collection-list"
      >
        {displayedVisits.length > 0 ? (
          viewMode === 'list' ? (
            displayedVisits.map((visit) => (
              <VisitListItem
                key={visit.id}
                item={visit}
                onClick={() => setSelectedVisit(visit)}
              />
            ))
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '14px',
              }}
            >
              {displayedVisits.map((visit) => {
                const clientName = lang === 'ar' && visit.clientName_ar ? visit.clientName_ar : visit.clientName
                const repName = lang === 'ar' && visit.repName_ar ? visit.repName_ar : visit.repName
                const detail = lang === 'ar' && visit.detail_ar ? visit.detail_ar : visit.detail

                return (
                  <div
                    key={visit.id}
                    className="collection-card"
                    onClick={() => setSelectedVisit(visit)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setSelectedVisit(visit)
                      }
                    }}
                    style={{
                      padding: '16px',
                      borderRadius: '14px',
                      border: '1px solid var(--border-soft)',
                      background: 'var(--surface)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      gap: '12px',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                        <div>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              color: 'var(--ocean)',
                              display: 'block',
                              marginBottom: '2px',
                            }}
                          >
                            {visit.id}
                          </span>
                          <strong style={{ fontSize: '15px', color: 'var(--heading-text)', display: 'block' }}>
                            {clientName}
                          </strong>
                        </div>
                        <StatusPill status={visit.status} />
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--muted-text)', flexWrap: 'wrap' }}>
                        <span>👤 {repName}</span>
                        <span>·</span>
                        <span>📅 {formatDate(visit.date, lang)} {visit.time && `(${visit.time})`}</span>
                        {visit.gpsVerified && (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              background: 'rgba(16, 185, 129, 0.12)',
                              color: '#059669',
                              fontSize: '10px',
                              fontWeight: 700,
                            }}
                          >
                            <MapPin size={10} /> GPS Verified
                          </span>
                        )}
                      </div>

                      <p style={{ fontSize: '12.5px', color: 'var(--body-text)', margin: '8px 0 0', lineHeight: 1.4 }}>
                        {detail}
                      </p>
                    </div>

                    <div style={{ borderTop: '1px solid var(--border-soft)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {visit.productsPresented && visit.productsPresented.map((p) => (
                          <span
                            key={p}
                            style={{
                              fontSize: '11px',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              background: 'var(--surface-raised)',
                              color: 'var(--muted-text)',
                              fontWeight: 500,
                            }}
                          >
                            {p}
                          </span>
                        ))}
                      </div>

                      {visit.samplesQuantity > 0 && (
                        <span
                          style={{
                            fontSize: '11.5px',
                            fontWeight: 700,
                            color: 'var(--ocean)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                          }}
                        >
                          <Package size={12} /> {visit.samplesQuantity} samples
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        ) : (
          <EmptyState message={t('visits.noMatch')} />
        )}
      </div>

      {/* Visit detail drawer */}
      <VisitDetailDrawer
        isOpen={Boolean(selectedVisit)}
        onClose={() => setSelectedVisit(null)}
        visit={selectedVisit}
      />
    </section>
  )
}
