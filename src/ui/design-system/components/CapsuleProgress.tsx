export interface CapsuleProgressProps {
  name: string
  sold: string
  qty: string
  left: string
  color: 'ocean' | 'sky' | 'rose'
  height: string
  received?: string
  sellIn?: string
  sellOut?: string
  inWarehouse?: string
  inMarket?: string
  sellThrough?: string
  pctSold?: number
  pctMarket?: number
  pctWarehouse?: number
  onClick?: () => void
  className?: string
}

export function CapsuleProgress({
  name,
  sold,
  qty,
  left,
  color,
  height,
  received,
  sellIn,
  sellOut,
  inWarehouse,
  inMarket,
  sellThrough,
  pctSold = 50,
  pctMarket = 20,
  pctWarehouse = 30,
  onClick,
  className = '',
}: CapsuleProgressProps) {
  return (
    <button
      className={`product-capsule ${className}`}
      onClick={onClick}
      aria-label={`Open ${name} details`}
      style={{ minWidth: '150px', height: 'auto', padding: '12px 10px' }}
    >
      <div className="capsule-visual">
        <div className={`capsule-fill ${color}`} style={{ height }} />
        <div className="capsule-shine" />
        <span className="capsule-badge">{sellThrough || sold}</span>
      </div>
      <strong style={{ fontSize: '13px', margin: '6px 0 4px', display: 'block' }}>{name}</strong>

      {/* Mini Bar */}
      <div
        style={{
          display: 'flex',
          height: '6px',
          borderRadius: '99px',
          overflow: 'hidden',
          background: 'var(--surface-raised, rgba(0,0,0,0.08))',
          width: '100%',
          margin: '4px 0 6px',
        }}
      >
        <div style={{ width: `${pctSold}%`, background: 'var(--green-text, #16a34a)' }} title={`Sold: ${sellOut || sold}`} />
        <div style={{ width: `${pctMarket}%`, background: 'var(--ocean, #0284c7)' }} title={`In market: ${inMarket}`} />
        <div style={{ width: `${pctWarehouse}%`, background: 'var(--amber-text, #d97706)' }} title={`Warehouse: ${inWarehouse || left}`} />
      </div>

      <div
        className="capsule-stats"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
          fontSize: '10px',
          textAlign: 'left',
          width: '100%',
          color: 'var(--muted-text)',
          lineHeight: 1.3,
        }}
      >
        <div>Received: <b style={{ color: 'var(--heading-text)' }}>{received || qty}</b></div>
        <div>Sold to customers (Sell-in): <b style={{ color: 'var(--ocean)' }}>{sellIn || qty}</b></div>
        <div>Sold by customers (Sell-out): <b style={{ color: 'var(--green-text, #16a34a)' }}>{sellOut || sold}</b></div>
        <div>In warehouse now: <b style={{ color: '#d97706' }}>{inWarehouse || left}</b></div>
        {inMarket && <div>Still in market: <b style={{ color: 'var(--heading-text)' }}>{inMarket}</b></div>}
      </div>
    </button>
  )
}
