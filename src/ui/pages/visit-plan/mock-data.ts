export interface RouteStop {
  time: string
  client: string
  address: string
  priority: string
  purpose: string
}

export const planStopsMockData: RouteStop[] = [
  { time: '09:00 AM', client: 'Dr. Sarah Kim', address: 'North Medical Center, Suite 402', priority: 'Class A', purpose: 'Cardiwell clinical review' },
  { time: '11:30 AM', client: 'Green Cross Pharmacy', address: '742 Highland Blvd', priority: 'Class A', purpose: 'Restock validation' },
  { time: '02:00 PM', client: 'Dr. Marcus Lee', address: 'City Cardiology Associates', priority: 'Class B', purpose: 'Follow up on reconnect notice' },
]
