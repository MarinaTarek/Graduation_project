import { Package } from 'lucide-react'
import { EmptyState } from '@/ui/design-system/components/EmptyState'
import { CatalogTable } from './components/CatalogTable'

export default function AdminProductsPage() {
  return (
    <section className="content">
      <div className="page-intro">
        <div>
          <span className="eyebrow">
            <Package /> PHARMACEUTICAL CATALOG
          </span>
          <h1>Products & Batches</h1>
          <p className="story">Formulation master records, SKU mapping, packaging sizes, and batch tracing.</p>
        </div>
      </div>
      <div style={{ marginTop: '36px' }}>
        <CatalogTable />
      </div>
      <EmptyState message="All registered pharmaceutical products validated" />
    </section>
  )
}
