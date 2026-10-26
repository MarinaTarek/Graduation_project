import { useT } from '@/lib/i18n'

export interface StatusPillProps {
  status: string
  className?: string
}

const STATUS_AR: Record<string, string> = {
  pending: 'قيد المراجعة',
  approved: 'تمت الموافقة',
  rejected: 'مرفوض',
  active: 'نشط',
  inactive: 'غير نشط',
  overdue: 'متأخر',
  achieved: 'مكتمل',
  completed: 'مكتمل',
  draft: 'مسودة',
  verified: 'تم التحقق',
  unverified: 'غير محقق',
  healthy: 'بحالة جيدة',
  expired: 'منتهي الصلاحية',
  expiring: 'قارب على الانتهاء',
}

export function StatusPill({ status, className = '' }: StatusPillProps) {
  const { lang } = useT()
  const normalized = status.toLowerCase().replace(/\s+/g, '-')
  const label = lang === 'ar' ? (STATUS_AR[normalized] || status) : status
  return (
    <span className={`status ${normalized} ${className}`}>
      {label}
    </span>
  )
}
