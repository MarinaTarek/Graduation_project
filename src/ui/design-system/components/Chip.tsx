import type { ButtonHTMLAttributes, ReactNode } from 'react'

export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean
  children?: ReactNode
  className?: string
}

export function Chip({ active = false, children, className = '', ...props }: ChipProps) {
  const activeClass = active ? 'filter-active' : ''
  const combined = [activeClass, className].filter(Boolean).join(' ')

  return (
    <button className={combined} {...props}>
      {children}
    </button>
  )
}
