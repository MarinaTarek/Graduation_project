import { Plus, Users } from 'lucide-react'
import { Button } from '@/ui/design-system/components/Button'
import { EmptyState } from '@/ui/design-system/components/EmptyState'
import { ClientToolbar } from './components/ClientToolbar'
import { ClientListItem } from './components/ClientListItem'
import { clientsMockData } from './mock-data'

export interface ClientsPageProps {
  onAdd: () => void
  onItem: () => void
}

export default function ClientsPage({ onAdd, onItem }: ClientsPageProps) {
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

      <div className="collection-list">
        {clientsMockData.map((client) => (
          <ClientListItem key={client.name} item={client} onClick={onItem} />
        ))}
      </div>

      <EmptyState />
    </section>
  )
}
