import { ArrowUpRight, ChevronRight } from 'lucide-react'
import { Button } from '@/ui/design-system/components/Button'
import { useT } from '@/lib/i18n'
import type { HomeAttentionItem } from '../mock-data'

export interface AttentionSectionProps {
  items: HomeAttentionItem[]
  onAction: (s: string) => void
  onOpenNotifications?: () => void
  onNavigateWithFilter?: (page: string, options?: { filter?: string; overlay?: string }) => void
}

export function AttentionSection({
  items,
  onAction,
  onOpenNotifications,
  onNavigateWithFilter,
}: AttentionSectionProps) {
  const { t } = useT()

  const handleCardClick = (label: string) => {
    const normalized = label.toLowerCase()
    if (normalized.includes('invoice')) {
      if (onNavigateWithFilter) {
        onNavigateWithFilter('Invoices', { filter: 'Pending' })
      } else {
        onAction(t('home.attention.actionOpeningPendingInvoices'))
      }
    } else if (normalized.includes('client') || normalized.includes('doctor') || normalized.includes('visit')) {
      if (onNavigateWithFilter) {
        onNavigateWithFilter('Clients', { filter: 'Overdue only' })
      } else {
        onAction(t('home.attention.actionOpeningOverdueClients'))
      }
    } else if (normalized.includes('batch') || normalized.includes('expir')) {
      if (onNavigateWithFilter) {
        onNavigateWithFilter('Stock', { overlay: 'stock detail' })
      } else {
        onAction(t('home.attention.actionOpeningExpiringBatch'))
      }
    } else if (normalized.includes('account') || normalized.includes('request')) {
      if (onNavigateWithFilter) {
        onNavigateWithFilter('Users', { filter: 'pending' })
      } else {
        onAction(t('home.attention.actionOpeningPendingRequests'))
      }
    } else {
      onAction(t('home.attention.actionOpening', { label: label.toLowerCase() }))
    }
  }

  return (
    <section className="attention-section">
      <div className="section-heading">
        <div>
          <span className="eyebrow">{t('home.attention.eyebrow')}</span>
          <h2>{t('home.attention.title')}</h2>
        </div>
        <Button
          variant="text"
          onClick={onOpenNotifications || (() => onAction(t('home.attention.actionOpeningNotifications')))}
        >
          {t('home.attention.viewAll')} <ArrowUpRight />
        </Button>
      </div>
      <div className="attention-row">
        {items.map(({ icon: Icon, label, count, tone, detail }) => (
          <button
            key={label}
            className={`attention-card ${tone}`}
            onClick={() => handleCardClick(label)}
          >
            <div className="attention-icon">
              <Icon />
            </div>
            <div>
              <span>{label}</span>
              <strong>{count}</strong>
              <small>{detail}</small>
            </div>
            <ChevronRight />
          </button>
        ))}
      </div>
    </section>
  )
}
