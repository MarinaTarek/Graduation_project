import { Clock3, FileText, Stethoscope } from 'lucide-react'
import type { ElementType } from 'react'

export interface HomeAttentionItem {
  icon: ElementType
  label: string
  count: string
  tone: 'amber' | 'rose' | 'blue'
  detail: string
}

export const homeAttentionItems: HomeAttentionItem[] = [
  { icon: FileText, label: 'Invoices to review', count: '5', tone: 'amber', detail: 'A few are waiting on you' },
  { icon: Stethoscope, label: 'Doctors to reconnect', count: '3', tone: 'rose', detail: 'No visit in 30+ days' },
  { icon: Clock3, label: 'Batch nearing expiry', count: '1', tone: 'blue', detail: 'Cardiwell 20mg · 12 days' },
]

export const homeProducts = [
  { name: 'Cardiwell 20mg', sold: '86%', qty: '12,840', left: '1,920', color: 'ocean' as const, height: '86%' },
  { name: 'Neurofen Plus', sold: '72%', qty: '8,620', left: '2,140', color: 'sky' as const, height: '72%' },
  { name: 'Immunex Kids', sold: '64%', qty: '7,290', left: '2,840', color: 'sky' as const, height: '64%' },
  { name: 'Gastrocalm', sold: '48%', qty: '5,410', left: '4,980', color: 'rose' as const, height: '48%' },
  { name: 'Respira 10mg', sold: '39%', qty: '4,110', left: '5,920', color: 'rose' as const, height: '39%' },
]

export const homeReps = [
  ['Olivia Martin', 'North region', '$42.8k', '98%'],
  ['Maya Patel', 'West region', '$39.4k', '91%'],
  ['James Wilson', 'Central region', '$35.9k', '84%'],
  ['Sofia Chen', 'East region', '$32.6k', '79%'],
] as const

export const homeQuote = {
  quote: "The best territory is not the one with the most doctors. It's the one where every relationship is remembered.",
  attribution: '— Your field team, this morning',
}
