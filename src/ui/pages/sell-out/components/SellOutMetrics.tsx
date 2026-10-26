import { Activity } from 'lucide-react'
import { useT } from '@/lib/i18n'
import { sellOutMockData } from '../mock-data'

export function SellOutMetrics() {
  const { t, lang } = useT()
  const dispensedStr = lang === 'ar' ? sellOutMockData.dispensedValue_ar : sellOutMockData.dispensedValue

  return (
    <div className="panel">
      <div className="panel-head">
        <div>
          <span className="eyebrow">{t('sellOut.metrics.eyebrow')}</span>
          <h3>{t('sellOut.metrics.title')}</h3>
        </div>
        <Activity />
      </div>
      <div className="chart-total">
        <strong>{dispensedStr}</strong>
        <span>{t('sellOut.metrics.acrossPharmacies', { count: sellOutMockData.pharmacyCount })}</span>
      </div>
    </div>
  )
}
