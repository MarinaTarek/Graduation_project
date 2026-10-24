import { FileText, Plus } from 'lucide-react'
import { Button } from '@/ui/design-system/components/Button'
import { Chip } from '@/ui/design-system/components/Chip'
import { EmptyState } from '@/ui/design-system/components/EmptyState'
import { InvoiceToolbar } from './components/InvoiceToolbar'
import { InvoiceListItem } from './components/InvoiceListItem'
import { invoicesMockData } from './mock-data'

export interface InvoicesPageProps {
  onAdd: () => void
  onItem: () => void
  filter?: string | null
  onClearFilter?: () => void
}

export default function InvoicesPage({
  onAdd,
  onItem,
  filter,
  onClearFilter,
}: InvoicesPageProps) {
  const displayedInvoices = filter
    ? invoicesMockData.filter((inv) => inv.status.toLowerCase() === filter.toLowerCase())
    : invoicesMockData

  return (
    <section className="content">
      <div className="page-intro">
        <div>
          <span className="eyebrow">
            <FileText /> REVIEW QUEUE
          </span>
          <h1>Invoices</h1>
          <p className="story">Review, approve, and keep the field team moving.</p>
        </div>
        <Button variant="primary" onClick={onAdd}>
          <Plus data-icon="inline-start" /> Add new
        </Button>
      </div>

      <InvoiceToolbar />

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
        {displayedInvoices.map((invoice) => (
          <InvoiceListItem key={invoice.name} item={invoice} onClick={onItem} />
        ))}
      </div>

      <EmptyState />
    </section>
  )
}
