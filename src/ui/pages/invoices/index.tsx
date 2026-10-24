import { FileText, Plus } from 'lucide-react'
import { Button } from '@/ui/design-system/components/Button'
import { EmptyState } from '@/ui/design-system/components/EmptyState'
import { InvoiceToolbar } from './components/InvoiceToolbar'
import { InvoiceListItem } from './components/InvoiceListItem'
import { invoicesMockData } from './mock-data'

export interface InvoicesPageProps {
  onAdd: () => void
  onItem: () => void
}

export default function InvoicesPage({ onAdd, onItem }: InvoicesPageProps) {
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

      <div className="collection-list">
        {invoicesMockData.map((invoice) => (
          <InvoiceListItem key={invoice.name} item={invoice} onClick={onItem} />
        ))}
      </div>

      <EmptyState />
    </section>
  )
}
