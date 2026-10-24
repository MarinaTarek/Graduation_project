import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'text' | 'icon' | 'round-arrow' | 'view-toggle'
  children?: ReactNode
  className?: string
  loading?: boolean
}

export function Button({
  variant = 'primary',
  children,
  className = '',
  loading = false,
  disabled,
  ...props
}: ButtonProps) {
  let baseClass = ''

  switch (variant) {
    case 'primary':
      baseClass = 'primary-button'
      break
    case 'secondary':
      baseClass = 'secondary-button'
      break
    case 'text':
      baseClass = 'text-button'
      break
    case 'icon':
      baseClass = 'icon-button'
      break
    case 'round-arrow':
      baseClass = 'round-arrow'
      break
    case 'view-toggle':
      baseClass = 'view-toggle'
      break
    default:
      baseClass = ''
  }

  const combinedClass = [baseClass, className].filter(Boolean).join(' ')

  return (
    <button className={combinedClass} disabled={disabled || loading} {...props}>
      {loading && <Loader2 style={{ width: '15px', height: '15px', marginRight: '6px', animation: 'spin 1s linear infinite' }} />}
      {children}
    </button>
  )
}
