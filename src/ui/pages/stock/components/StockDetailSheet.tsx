import { ClipboardCheck } from 'lucide-react'
import { Button } from '@/ui/design-system/components/Button'
import { Drawer } from '@/ui/design-system/components/Drawer'
import { cardiwellBatches } from '../mock-data'

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
  if (!isOpen) return null

  return (
    <Drawer title="Cardiwell 20mg" kicker="PRODUCT DETAILS" onClose={onClose}>
      <div className="stock-tabs">
        <button className="active">Warehouse</button>
        <button>With reps</button>
        <button>In pharmacies</button>
      </div>
      <div className="batch-list">
        {cardiwellBatches.map((b) => (
          <div key={b[0]}>
            <strong>{b[0]}</strong>
            <span>{b[1]}</span>
            <em className={b[3]}>{b[2]}</em>
          </div>
        ))}
      </div>
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
