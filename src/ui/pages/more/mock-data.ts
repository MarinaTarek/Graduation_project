import { Activity, ArrowUpRight, Settings2, SlidersHorizontal, Stethoscope, Target } from 'lucide-react'
import type { ElementType } from 'react'

export interface MoreLinkItem {
  name: string
  icon: ElementType
  targetPage?: string
}

export const moreLinksMockData: MoreLinkItem[] = [
  { name: 'Visits', icon: Stethoscope, targetPage: 'Visits' },
  { name: 'Sell-in', icon: ArrowUpRight, targetPage: 'Sell-in' },
  { name: 'Sell-out', icon: Activity, targetPage: 'Sell-out' },
  { name: 'Targets', icon: Target, targetPage: 'Targets' },
  { name: 'Admin panel', icon: Settings2, targetPage: 'Admin' },
  { name: 'Settings', icon: SlidersHorizontal, targetPage: 'Settings' },
]
