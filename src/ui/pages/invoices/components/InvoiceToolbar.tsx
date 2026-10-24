import { Filter, LayoutGrid, Search } from 'lucide-react'
import { Button } from '@/ui/design-system/components/Button'

export function InvoiceToolbar() {
  return (
    <div className="collection-toolbar">
      <div className="search-inline">
        <Search />
        <input placeholder="Search invoices..." />
      </div>
      <Button variant="secondary">
        <Filter data-icon="inline-start" /> Filters
      </Button>
      <Button variant="secondary">
        <LayoutGrid data-icon="inline-start" /> View
      </Button>
    </div>
  )
}
