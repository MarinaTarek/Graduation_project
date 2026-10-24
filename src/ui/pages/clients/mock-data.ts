export interface ClientRecord {
  id?: string
  name: string
  name_ar?: string
  meta: string
  status: string
  specialty: string
  classification: string
  region: string
  repName: string
  rep_id?: string
}

export const clientsMockData: ClientRecord[] = [
  { id: 'c-1', name: 'Dr. Sarah Kim', name_ar: 'د. سارة كيم', meta: 'Cardiology · North region · Class A', status: 'Active', specialty: 'Cardiology', classification: 'Class A', region: 'North region', repName: 'Alex Morgan', rep_id: 'u-admin-1' },
  { id: 'c-2', name: 'Green Cross Pharmacy', name_ar: 'صيدلية جرين كروس', meta: 'Pharmacy · West region · Class A', status: 'Active', specialty: 'Pharmacy', classification: 'Class A', region: 'West region', repName: 'Maya Patel', rep_id: 'rep-maya' },
  { id: 'c-3', name: 'Dr. Marcus Lee', name_ar: 'د. ماركوس لي', meta: 'Cardiology · North region · Class B', status: 'Overdue', specialty: 'Cardiology', classification: 'Class B', region: 'North region', repName: 'Alex Morgan', rep_id: 'u-admin-1' },
  { id: 'c-4', name: 'Wellness First', name_ar: 'ويلنس فيرست', meta: 'Pharmacy · West region · Class B', status: 'Active', specialty: 'Pharmacy', classification: 'Class B', region: 'West region', repName: 'Maya Patel', rep_id: 'rep-maya' },
  { id: 'c-5', name: 'Dr. Emily Watson', name_ar: 'د. إيميلي واتسون', meta: 'Pediatrics · Central region · Class A', status: 'Active', specialty: 'Pediatrics', classification: 'Class A', region: 'Central region', repName: 'Alex Morgan', rep_id: 'u-admin-1' },
  { id: 'c-6', name: 'Metro Health Center', name_ar: 'مركز مترو الصحي', meta: 'General Medicine · East region · Class C', status: 'Overdue', specialty: 'General Medicine', classification: 'Class C', region: 'East region', repName: 'Olivia Martin', rep_id: 'rep-olivia' },
]
