import { ChevronRight } from 'lucide-react'
import { useT } from '@/lib/i18n'
import type { TranslationKey } from '@/lib/i18n/en'
import { adminSections } from '../mock-data'

export interface AdminNavCardsProps {
  onSelect: (key: string) => void
}

const SECTION_I18N: Record<string, { label: TranslationKey; desc: TranslationKey }> = {
  users: { label: 'admin.sections.usersLabel', desc: 'admin.sections.usersDesc' },
  products: { label: 'admin.sections.productsLabel', desc: 'admin.sections.productsDesc' },
  territories: { label: 'admin.sections.territoriesLabel', desc: 'admin.sections.territoriesDesc' },
  'audit-log': { label: 'admin.sections.auditLabel', desc: 'admin.sections.auditDesc' },
  settings: { label: 'admin.sections.settingsLabel', desc: 'admin.sections.settingsDesc' },
}

export function AdminNavCards({ onSelect }: AdminNavCardsProps) {
  const { t } = useT()

  return (
    <div className="admin-hub-grid">
      {adminSections.map((sec) => {
        const Icon = sec.icon
        const i18nKeys = SECTION_I18N[sec.key]
        return (
          <button
            key={sec.key}
            onClick={() => onSelect(sec.key)}
            className="admin-hub-card"
          >
            <div className="admin-hub-icon">
              <Icon style={{ width: '22px', height: '22px' }} />
            </div>
            <div className="admin-hub-text">
              <strong>{i18nKeys ? t(i18nKeys.label) : sec.label}</strong>
              <small>{i18nKeys ? t(i18nKeys.desc) : sec.description}</small>
            </div>
            <ChevronRight className="admin-hub-arrow" />
          </button>
        )
      })}
    </div>
  )
}
