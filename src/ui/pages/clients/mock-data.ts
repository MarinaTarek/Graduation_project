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
  phone?: string
  address?: string
  notes?: string
  active?: boolean
  last_visit_date?: string
  type?: 'doctor' | 'pharmacy'
}

export const clientsMockData: ClientRecord[] = [
  { id: 'c-1', name: 'Dr. Sarah Kim', name_ar: 'د. سارة كيم', meta: 'Cardiology · North region · Class A', status: 'Active', specialty: 'Cardiology', classification: 'Class A', region: 'North region', repName: 'Alex Morgan', rep_id: 'u-admin-1', phone: '01012345678', address: '12 Medical Plaza, North District', notes: 'Key opinion leader in hypertension.', active: true, last_visit_date: '2026-10-18', type: 'doctor' },
  { id: 'c-2', name: 'Green Cross Pharmacy', name_ar: 'صيدلية جرين كروس', meta: 'Pharmacy · West region · Class A', status: 'Active', specialty: 'Pharmacy', classification: 'Class A', region: 'West region', repName: 'Maya Patel', rep_id: 'rep-maya', phone: '01123456789', address: '44 El Tahrir St, West District', notes: 'High volume prescription fulfillment.', active: true, last_visit_date: '2026-10-15', type: 'pharmacy' },
  { id: 'c-3', name: 'Dr. Marcus Lee', name_ar: 'د. ماركوس لي', meta: 'Cardiology · North region · Class B', status: 'Overdue', specialty: 'Cardiology', classification: 'Class B', region: 'North region', repName: 'Alex Morgan', rep_id: 'u-admin-1', phone: '01234567890', address: '88 Nile Hospital, North District', notes: 'Interested in cardiology clinical trials.', active: true, last_visit_date: '2026-09-20', type: 'doctor' },
  { id: 'c-4', name: 'Wellness First', name_ar: 'ويلنس فيرست', meta: 'Pharmacy · West region · Class B', status: 'Active', specialty: 'Pharmacy', classification: 'Class B', region: 'West region', repName: 'Maya Patel', rep_id: 'rep-maya', phone: '01512345678', address: '20 Corniche Road, West District', notes: 'Consignment stock partner.', active: true, last_visit_date: '2026-10-12', type: 'pharmacy' },
  { id: 'c-5', name: 'Dr. Emily Watson', name_ar: 'د. إيميلي واتسون', meta: 'Pediatrics · Central region · Class A', status: 'Active', specialty: 'Pediatrics', classification: 'Class A', region: 'Central region', repName: 'Alex Morgan', rep_id: 'u-admin-1', phone: '01098765432', address: '15 Nasr City Blvd, Central District', notes: 'Pediatric vitamins and wellness advocate.', active: true, last_visit_date: '2026-10-22', type: 'doctor' },
  { id: 'c-6', name: 'Metro Health Center', name_ar: 'مركز مترو الصحي', meta: 'General Medicine · East region · Class C', status: 'Overdue', specialty: 'General Medicine', classification: 'Class C', region: 'East region', repName: 'Olivia Martin', rep_id: 'rep-olivia', phone: '01198765432', address: '50 Heliopolis Ave, East District', notes: 'Community polyclinic with weekly clinics.', active: true, last_visit_date: '2026-08-10', type: 'doctor' },
]
