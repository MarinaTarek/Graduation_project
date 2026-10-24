import { ClipboardCheck, MapPin, Package, Settings2, Users } from 'lucide-react'
import type { ElementType } from 'react'

export interface AdminSectionItem {
  key: string
  label: string
  description: string
  icon: ElementType
}

export const adminSections: AdminSectionItem[] = [
  { key: 'users', label: 'Users', description: 'User roles, permissions & rep assignments', icon: Users },
  { key: 'products', label: 'Products & Batches', description: 'Product catalog, formulations & expiry lots', icon: Package },
  { key: 'territories', label: 'Territories', description: 'Geographic regions, rep coverage & quotas', icon: MapPin },
  { key: 'audit-log', label: 'Audit log', description: 'Security ledger, activity & change tracking', icon: ClipboardCheck },
  { key: 'settings', label: 'Settings', description: 'Configuration, preferences & sync controls', icon: Settings2 },
]
