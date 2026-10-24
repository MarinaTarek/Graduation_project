export interface SkeletonProps {
  width?: string | number
  height?: string | number
  radius?: string
  className?: string
}

export function Skeleton({
  width = '100%',
  height = '20px',
  radius = '8px',
  className = '',
}: SkeletonProps) {
  return (
    <div
      className={`skeleton-loader ${className}`}
      style={{
        width,
        height,
        borderRadius: radius,
        background: 'var(--input-bg, #F4FAFF)',
        opacity: 0.7,
      }}
    />
  )
}
