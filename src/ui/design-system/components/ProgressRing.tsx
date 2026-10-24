export interface ProgressRingProps {
  percent: number | string
  label?: string
  className?: string
}

export function ProgressRing({ percent = 78, label = 'of target', className = '' }: ProgressRingProps) {
  const displayPercent = typeof percent === 'number' ? `${percent}%` : percent

  return (
    <div className={`target-ring ${className}`}>
      <div>
        <strong>{displayPercent}</strong>
        <span>{label}</span>
      </div>
    </div>
  )
}
