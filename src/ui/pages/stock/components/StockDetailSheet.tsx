import { useState } from 'react'
import { ClipboardCheck } from 'lucide-react'
import { Button } from '@/ui/design-system/components/Button'
import { Drawer } from '@/ui/design-system/components/Drawer'
import { cardiwellBatches, cardiwellRepsStock, cardiwellPharmaciesStock } from '../mock-data'

export interface StockDetailSheetProps {
  isOpen?: boolean
  onClose: () => void
  onOpenStockCount: () => void
}

export function StockDetailSheet({
  isOpen = true,
  onClose,
  onOpenStockCount,
}: StockDetailSheetProps) {
  const [tab, setTab] = useState<'warehouse' | 'reps' | 'pharmacies'>('warehouse')

  if (!isOpen) return null

  return (
    <Drawer title="Cardiwell 20mg" kicker="PRODUCT DETAILS" onClose={onClose}>
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
