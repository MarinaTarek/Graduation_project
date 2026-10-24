import { useState } from 'react'
import { ClipboardCheck } from 'lucide-react'
import { Button } from '@/ui/design-system/components/Button'
import { Drawer } from '@/ui/design-system/components/Drawer'
import { formatCurrency } from '@/lib/format'
import { cardiwellBatches, cardiwellRepsStock, cardiwellPharmaciesStock, stockProductsMockData } from '../mock-data'

export interface StockDetailSheetProps {
  isOpen?: boolean
  onClose: () => void
  onOpenStockCount: () => void
  productName?: string
}

export function StockDetailSheet({
  isOpen = true,
  onClose,
  onOpenStockCount,
  productName = 'Cardiwell 20mg',
}: StockDetailSheetProps) {
  const [tab, setTab] = useState<'warehouse' | 'reps' | 'pharmacies'>('warehouse')

  if (!isOpen) return null

  const product = stockProductsMockData.find((p) => p.name.toLowerCase() === productName.toLowerCase())
  const price = product?.price ?? 240

  return (
    <Drawer title={productName} kicker="PRODUCT DETAILS" onClose={onClose}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          background: 'var(--surface-raised)',
          borderRadius: '12px',
          marginBottom: '16px',
          border: '1px solid var(--border-soft)',
        }}
      >
        <div>
          <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--muted-text)', display: 'block' }}>
            Unit Price
          </span>
          <strong style={{ fontSize: '18px', color: 'var(--heading-text)' }}>
            {formatCurrency(price)}
          </strong>
        </div>
        <span style={{ fontSize: '12px', color: 'var(--muted-text)' }}>
          Standard Pack: 30 tablets / box
        </span>
      </div>

      <div className="stock-tabs">
        <button
          className={tab === 'warehouse' ? 'active' : ''}
          onClick={() => setTab('warehouse')}
        >
          Warehouse
        </button>
        <button
          className={tab === 'reps' ? 'active' : ''}
          onClick={() => setTab('reps')}
        >
          With reps
        </button>
        <button
          className={tab === 'pharmacies' ? 'active' : ''}
          onClick={() => setTab('pharmacies')}
        >
          In pharmacies
        </button>
      </div>

      {tab === 'warehouse' && (
        <div className="batch-list">
          {cardiwellBatches.map((b) => (
            <div key={b[0]}>
              <strong>{b[0]}</strong>
              <span>{b[1]}</span>
              <em className={b[3]}>{b[2]}</em>
            </div>
          ))}
        </div>
      )}

      {tab === 'reps' && (
        <div className="batch-list">
          {cardiwellRepsStock.map((r) => (
            <div key={r.rep}>
              <strong>{r.rep}</strong>
              <span>{r.territory} · {r.qty}</span>
              <em className={r.status === 'Low buffer' ? 'rose' : 'green'}>{r.status}</em>
            </div>
          ))}
        </div>
      )}

      {tab === 'pharmacies' && (
        <div className="batch-list">
          {cardiwellPharmaciesStock.map((p) => (
            <div key={p.pharmacy}>
              <strong>{p.pharmacy}</strong>
              <span>{p.batch} · {p.qty}</span>
              <em className={p.status.includes('days') ? 'rose' : 'green'}>{p.status}</em>
            </div>
          ))}
        </div>
      )}

      <Button
        variant="primary"
        className="full-button"
        onClick={onOpenStockCount}
      >
        <ClipboardCheck data-icon="inline-start" /> Stock count
      </Button>
    </Drawer>
  )
}
