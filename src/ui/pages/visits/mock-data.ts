export interface VisitRecord {
  id: string
  clientName: string
  repName: string
  date: string
  detail: string
  status: string
}

export const visitsMockData: VisitRecord[] = [
  { id: 'V-102', clientName: 'Dr. Sarah Kim', repName: 'Olivia Martin', date: 'Oct 18, 2026', detail: 'Cardiwell 20mg clinical presentation', status: 'Completed' },
  { id: 'V-101', clientName: 'Green Cross Pharmacy', repName: 'Maya Patel', date: 'Oct 15, 2026', detail: 'Stock verification & sample delivery', status: 'Completed' },
  { id: 'V-100', clientName: 'Wellness First', repName: 'James Wilson', date: 'Oct 12, 2026', detail: 'Introductory discussion on Neurofen Plus', status: 'Completed' },
]
