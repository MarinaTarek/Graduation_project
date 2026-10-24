export interface VisitRecord {
  id: string
  clientName: string
  clientName_ar?: string
  repName: string
  repName_ar?: string
  date: string
  time: string
  detail: string
  status: string
  productsPresented: string[]
  samplesQuantity: number
  reactionEmoji: string
  reactionLabel: string
  notes: string
  nextVisitDate: string
  gpsVerified: boolean
}

export const visitsMockData: VisitRecord[] = [
  {
    id: 'V-104',
    clientName: 'Dr. Sarah Kim',
    clientName_ar: 'د. سارة كيم',
    repName: 'Alex Morgan',
    repName_ar: 'أليكس مورجان',
    date: 'Oct 24, 2026',
    time: '10:30 AM',
    detail: 'Bevato clinical presentation',
    status: 'Completed',
    productsPresented: ['Bevato', 'Naviro D3 50,000 IU'],
    samplesQuantity: 15,
    reactionEmoji: '👍',
    reactionLabel: 'Very positive & receptive to dosage increase',
    notes: 'Dr. Kim agreed to prescribe Bevato for hypertensive patients with comorbid heart disease. Requested 10 additional starter packs next week.',
    nextVisitDate: 'Nov 07, 2026',
    gpsVerified: true,
  },
  {
    id: 'V-103',
    clientName: 'St. Jude Medical Clinic',
    clientName_ar: 'عيادة سانت جود',
    repName: 'Alex Morgan',
    repName_ar: 'أليكس مورجان',
    date: 'Oct 21, 2026',
    time: '02:15 PM',
    detail: 'Quarterly review & sample restock',
    status: 'Completed',
    productsPresented: ['Naviro D3 50,000 IU', 'Naviro D3 10,000 IU'],
    samplesQuantity: 20,
    reactionEmoji: '⭐',
    reactionLabel: 'Highly satisfied with patient recovery rates',
    notes: 'Reviewed patient outcomes on Naviro D3. Clinic director expressed strong satisfaction and requested formulary inclusion details.',
    nextVisitDate: 'Nov 12, 2026',
    gpsVerified: true,
  },
  {
    id: 'V-102',
    clientName: 'Dr. Sarah Kim',
    clientName_ar: 'د. سارة كيم',
    repName: 'Olivia Martin',
    repName_ar: 'أوليفيا مارتن',
    date: 'Oct 18, 2026',
    time: '11:00 AM',
    detail: 'Bevato clinical presentation',
    status: 'Completed',
    productsPresented: ['Bevato'],
    samplesQuantity: 10,
    reactionEmoji: '👍',
    reactionLabel: 'Positive clinical discussion',
    notes: 'Dr. Kim requested full clinical study references comparing Bevato against standard of care.',
    nextVisitDate: 'Nov 02, 2026',
    gpsVerified: true,
  },
  {
    id: 'V-101',
    clientName: 'Green Cross Pharmacy',
    clientName_ar: 'صيدلية جرين كروس',
    repName: 'Maya Patel',
    repName_ar: 'مايا باتيل',
    date: 'Oct 15, 2026',
    time: '09:45 AM',
    detail: 'Stock verification & sample delivery',
    status: 'Completed',
    productsPresented: ['Naviro D3 Drops', 'Bevato'],
    samplesQuantity: 25,
    reactionEmoji: '🤝',
    reactionLabel: 'Stock reorder confirmed',
    notes: 'Verified stock levels of expiring lots. Pharmacist agreed to clear aging batches first with front-shelf placement.',
    nextVisitDate: 'Nov 05, 2026',
    gpsVerified: true,
  },
  {
    id: 'V-100',
    clientName: 'Wellness First Center',
    clientName_ar: 'ويلنس فيرست',
    repName: 'James Wilson',
    repName_ar: 'جيمس ويلسون',
    date: 'Oct 12, 2026',
    time: '03:30 PM',
    detail: 'Introductory discussion on Naviro D3 50,000 IU',
    status: 'Completed',
    productsPresented: ['Naviro D3 50,000 IU'],
    samplesQuantity: 8,
    reactionEmoji: '🤔',
    reactionLabel: 'Cautious interest',
    notes: 'Initial meeting with new practice partners. Left product dossiers and 8 trial samples for evaluation.',
    nextVisitDate: 'Oct 30, 2026',
    gpsVerified: true,
  },
]
