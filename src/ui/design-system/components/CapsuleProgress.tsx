export interface CapsuleProgressProps {
  name: string
  sold: string
  qty: string
  left: string
  color: 'ocean' | 'sky' | 'rose'
  height: string
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
  onClick,
  className = '',
}: CapsuleProgressProps) {
  return (
    <button
      className={`product-capsule ${className}`}
      onClick={onClick}
      aria-label={`Open ${name} details`}
    >
      <div className="capsule-visual">
        <div className={`capsule-fill ${color}`} style={{ height }} />
        <div className="capsule-shine" />
        <span>{sold}</span>
      </div>
      <strong>{name}</strong>
      <div className="capsule-stats">
        <span>Sold <b>{qty}</b></span>
        <span>Left <b>{left}</b></span>
      </div>
    </button>
  )
}
