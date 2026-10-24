import { Plus, Users } from 'lucide-react'
import { Button } from '@/ui/design-system/components/Button'
import { Chip } from '@/ui/design-system/components/Chip'
import { EmptyState } from '@/ui/design-system/components/EmptyState'
import { ClientToolbar } from './components/ClientToolbar'
import { ClientListItem } from './components/ClientListItem'
import { clientsMockData } from './mock-data'

export interface ClientsPageProps {
  onAdd: () => void
  onItem: () => void
  filter?: string | null
  onClearFilter?: () => void
}

export default function ClientsPage({
  onAdd,
  onItem,
  filter,
  onClearFilter,
}: ClientsPageProps) {
  const displayedClients = filter
    ? clientsMockData.filter((client) => {
        if (filter === 'Overdue only' || filter.toLowerCase() === 'overdue') {
          return client.status.toLowerCase() === 'overdue'
        }
        return client.status.toLowerCase() === filter.toLowerCase()
      })
    : clientsMockData

  return (
    <section className="content">
      <div className="page-intro">
        <div>
          <span className="eyebrow">
            <Users /> RELATIONSHIPS
          </span>
          <h1>Clients</h1>
          <p className="story">Every relationship, remembered.</p>
        </div>
        <Button variant="primary" onClick={onAdd}>
          <Plus data-icon="inline-start" /> Add new
        </Button>
      </div>

      <ClientToolbar />

      {/* Removable filter chip when filter prop is active */}
      {filter && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '16px 0 8px' }}>
          <span style={{ fontSize: '12px', color: 'var(--muted-text)' }}>Active filter:</span>
          <Chip active onClick={onClearFilter} title="Click to clear filter">
            {filter} &times;
          </Chip>
        </div>
      )}

      <div className="collection-list">
        {displayedClients.map((client) => (
          <ClientListItem key={client.name} item={client} onClick={onItem} />
        ))}
      </div>

      <EmptyState />
    </section>
  )
}
