export interface ClientRecord {
  name: string
  meta: string
  status: string
  specialty?: string
  region?: string
}

export const clientsMockData: ClientRecord[] = [
  { name: 'Dr. Sarah Kim', meta: 'Cardiology · North region', status: 'Active' },
  { name: 'Green Cross Pharmacy', meta: 'Pharmacy · West region', status: 'Active' },
  { name: 'Dr. Marcus Lee', meta: 'Cardiology · North region', status: 'Overdue' },
  { name: 'Wellness First', meta: 'Pharmacy · West region', status: 'Active' },
]
