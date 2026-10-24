import { useState } from 'react'
import { Plus, Stethoscope } from 'lucide-react'
import { Button } from '@/ui/design-system/components/Button'
import { Chip } from '@/ui/design-system/components/Chip'
import { EmptyState } from '@/ui/design-system/components/EmptyState'
import { VisitListItem } from './components/VisitListItem'
import { VisitDetailDrawer } from './components/VisitDetailDrawer'
import { visitsStore } from '@/data/mock/visits'
import { useStore } from '@/data/mock/store'
import { useT } from '@/lib/i18n'
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
  const { t } = useT()
  const visitsMockData = useStore(visitsStore)
  const [selectedVisit, setSelectedVisit] = useState<VisitRecord | null>(null)

  // 1. Role-based scoping: reps only see their own visits
  let displayedVisits = role === 'rep'
    ? visitsMockData.filter((v) => v.repName.toLowerCase() === currentUserName.toLowerCase())
    : visitsMockData

  // 2. Navigation filter: filter by clicked rep if provided
  if (filterRep) {
    displayedVisits = displayedVisits.filter(
      (v) => v.repName.toLowerCase() === filterRep.toLowerCase()
    )
  }

  return (
    <section className="content">
      <div className="page-intro">
        <div>
          <span className="eyebrow">
            <Stethoscope /> {t('visits.eyebrow')}
          </span>
          <h1>{t('visits.title')}</h1>
          <p className="story">
            {t('visits.subtitle')}
          </p>
        </div>
        <Button variant="primary" onClick={onNewVisit}>
          <Plus data-icon="inline-start" /> {t('visits.newVisit')}
        </Button>
      </div>

      {/* Removable filter chip when filtered by rep from TopRepsPanel */}
      {filterRep && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '20px' }}>
          <span style={{ fontSize: '12px', color: 'var(--muted-text)' }}>{t('visits.filteredByRep')}</span>
          <Chip active onClick={onClearFilter} title={t('visits.clearFilter')}>
            {filterRep} &times;
          </Chip>
        </div>
      )}

      <div style={{ marginTop: filterRep ? '20px' : '36px' }} className="collection-list">
        {displayedVisits.length > 0 ? (
          displayedVisits.map((visit) => (
            <VisitListItem
              key={visit.id}
              item={visit}
              onClick={() => setSelectedVisit(visit)}
            />
          ))
        ) : (
          <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--muted-text)' }}>
            {t('visits.noMatch')}
          </div>
        )}
      </div>

      <EmptyState message={t('visits.emptyState')} />

      {/* Visit detail drawer */}
      <VisitDetailDrawer
        isOpen={Boolean(selectedVisit)}
        onClose={() => setSelectedVisit(null)}
        visit={selectedVisit}
      />
    </section>
  )
}
