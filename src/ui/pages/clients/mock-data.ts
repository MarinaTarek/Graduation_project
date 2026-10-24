export interface ClientRecord {
  name: string
  meta: string
  status: string
  specialty: string
  classification: string
  region: string
  repName: string
}

export const clientsMockData: ClientRecord[] = [
  { name: 'Dr. Sarah Kim', meta: 'Cardiology · North region · Class A', status: 'Active', specialty: 'Cardiology', classification: 'Class A', region: 'North region', repName: 'Alex Morgan' },
  { name: 'Green Cross Pharmacy', meta: 'Pharmacy · West region · Class A', status: 'Active', specialty: 'Pharmacy', classification: 'Class A', region: 'West region', repName: 'Maya Patel' },
  { name: 'Dr. Marcus Lee', meta: 'Cardiology · North region · Class B', status: 'Overdue', specialty: 'Cardiology', classification: 'Class B', region: 'North region', repName: 'Alex Morgan' },
  { name: 'Wellness First', meta: 'Pharmacy · West region · Class B', status: 'Active', specialty: 'Pharmacy', classification: 'Class B', region: 'West region', repName: 'Maya Patel' },
  { name: 'Dr. Emily Watson', meta: 'Pediatrics · Central region · Class A', status: 'Active', specialty: 'Pediatrics', classification: 'Class A', region: 'Central region', repName: 'Alex Morgan' },
  { name: 'Metro Health Center', meta: 'General Medicine · East region · Class C', status: 'Overdue', specialty: 'General Medicine', classification: 'Class C', region: 'East region', repName: 'Olivia Martin' },
]
