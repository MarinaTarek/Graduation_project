export interface ReportCardMeta {
  id: string
  title: string
  description: string
  iconName: 'sales' | 'sellinout' | 'coverage' | 'stock' | 'invoices' | 'scorecard'
  sparkline: number[]
  sparklineColor: string
}

export const REPORT_CARDS_META: ReportCardMeta[] = [
  {
    id: 'sales-performance',
    title: 'Sales Performance',
    description: 'Revenue vs quota benchmarks by territory, representative, and product line.',
    iconName: 'sales',
    sparkline: [42, 58, 65, 78, 72, 88, 94, 104],
    sparklineColor: 'var(--ocean)',
  },
  {
    id: 'sell-in-vs-sell-out',
    title: 'Sell-in vs Sell-out',
    description: 'Wholesale distributor intake compared to pharmacy dispense velocity and inventory runout.',
    iconName: 'sellinout',
    sparkline: [60, 64, 70, 75, 71, 79, 82, 85],
    sparklineColor: 'var(--story-em, #3e9a78)',
  },
  {
    id: 'visit-coverage',
    title: 'Visit Coverage',
    description: 'Target medical practitioner visit frequency, territory gaps, and overdue doctor accounts.',
    iconName: 'coverage',
    sparkline: [82, 85, 80, 88, 86, 91, 89, 93],
    sparklineColor: 'var(--sky)',
  },
  {
    id: 'stock-expiry',
    title: 'Stock & Expiry',
    description: 'Warehouse balance, consignment shelf life, and critical expiry risk categorizations.',
    iconName: 'stock',
    sparkline: [95, 92, 90, 88, 85, 82, 84, 81],
    sparklineColor: 'var(--amber)',
  },
  {
    id: 'invoices-approvals',
    title: 'Invoices & Approvals',
    description: 'Claim validation velocity, telegram intake volumes, rejection reasons, and turnaround times.',
    iconName: 'invoices',
    sparkline: [30, 45, 60, 72, 85, 90, 94, 98],
    sparklineColor: 'var(--ocean)',
  },
  {
    id: 'rep-scorecard',
    title: 'Rep Scorecard',
    description: 'Individual KPI attainment, physician coverage, sample distribution, and commission pacing.',
    iconName: 'scorecard',
    sparkline: [70, 75, 82, 89, 92, 98, 102, 108],
    sparklineColor: 'var(--navy)',
  },
]

// 1. Sales Performance Mock Data
export interface SalesRepBreakdown {
  id: string
  rep: string
  territory: string
  target: number
  actual: number
  achievementRate: number
  topProduct: string
  growthPct: number
  productBars: { product: string; amount: number; color: string }[]
}

export const SALES_PERFORMANCE_MOCK = {
  summary: [
    { label: 'Total Revenue', value: 'EGP 842,500', change: '+14.2% vs target', isPositive: true },
    { label: 'Quota Achievement', value: '104.8%', change: 'Goal: EGP 804,000', isPositive: true },
    { label: 'Average Rep Velocity', value: 'EGP 168,500', change: '5 active field reps', isPositive: true },
  ],
  byRep: [
    {
      id: 'r1',
      rep: 'Alex Morgan',
      territory: 'Central District',
      target: 200000,
      actual: 216400,
      achievementRate: 108.2,
      topProduct: 'Bevato',
      growthPct: 12.5,
      productBars: [
        { product: 'Bevato', amount: 96400, color: '#3F6593' },
        { product: 'Naviro D3 50,000 IU', amount: 62000, color: '#80AAD3' },
        { product: 'Naviro D3 10,000 IU', amount: 58000, color: '#7FC8A9' },
      ],
    },
    {
      id: 'r2',
      rep: 'Maya Patel',
      territory: 'North District',
      target: 180000,
      actual: 192600,
      achievementRate: 107.0,
      topProduct: 'Naviro D3 10,000 IU',
      growthPct: 15.2,
      productBars: [
        { product: 'Bevato', amount: 72000, color: '#3F6593' },
        { product: 'Naviro D3 50,000 IU', amount: 48600, color: '#80AAD3' },
        { product: 'Naviro D3 10,000 IU', amount: 72000, color: '#7FC8A9' },
      ],
    },
    {
      id: 'r3',
      rep: 'Olivia Martin',
      territory: 'West District',
      target: 170000,
      actual: 174500,
      achievementRate: 102.6,
      topProduct: 'Naviro D3 50,000 IU',
      growthPct: 8.4,
      productBars: [
        { product: 'Bevato', amount: 65000, color: '#3F6593' },
        { product: 'Naviro D3 50,000 IU', amount: 74500, color: '#80AAD3' },
        { product: 'Navigen Product 5', amount: 35000, color: '#E8B86D' },
      ],
    },
    {
      id: 'r4',
      rep: 'James Wilson',
      territory: 'East District',
      target: 150000,
      actual: 148200,
      achievementRate: 98.8,
      topProduct: 'Bevato',
      growthPct: 3.1,
      productBars: [
        { product: 'Bevato', amount: 68200, color: '#3F6593' },
        { product: 'Naviro D3 Drops', amount: 52000, color: '#80AAD3' },
        { product: 'Navigen Product 5', amount: 28000, color: '#E8B86D' },
      ],
    },
    {
      id: 'r5',
      rep: 'Sofia Chen',
      territory: 'South District',
      target: 104000,
      actual: 110800,
      achievementRate: 106.5,
      topProduct: 'Navigen Product 5',
      growthPct: 9.8,
      productBars: [
        { product: 'Bevato', amount: 42000, color: '#3F6593' },
        { product: 'Navigen Product 5', amount: 48800, color: '#E8B86D' },
        { product: 'Naviro D3 Drops', amount: 20000, color: '#80AAD3' },
      ],
    },
  ] as SalesRepBreakdown[],
}

// 2. Sell-in vs Sell-out Mock Data
export interface ProductSellThrough {
  id: string
  product: string
  sellInUnits: number
  sellOutUnits: number
  sellThroughRate: number
  monthsOnHand: number
  isLowSellThrough: boolean
  statusNotice?: string
}

export const SELL_IN_OUT_MOCK = {
  summary: [
    { label: 'Total Sell-In', value: 'EGP 940,200', change: '8,420 packs ordered', isPositive: true },
    { label: 'Total Sell-Out', value: 'EGP 785,600', change: '7,150 packs dispensed', isPositive: true },
    { label: 'Sell-Through Ratio', value: '83.5%', change: 'Optimal threshold: 75%+', isPositive: true },
  ],
  monthlyTrend: [
    { month: 'May', sellIn: 640000, sellOut: 580000 },
    { month: 'Jun', sellIn: 710000, sellOut: 650000 },
    { month: 'Jul', sellIn: 790000, sellOut: 720000 },
    { month: 'Aug', sellIn: 830000, sellOut: 760000 },
    { month: 'Sep', sellIn: 890000, sellOut: 750000 },
    { month: 'Oct', sellIn: 940200, sellOut: 785600 },
  ],
  products: [
    {
      id: 'p1',
      product: 'Bevato',
      sellInUnits: 3200,
      sellOutUnits: 2940,
      sellThroughRate: 91.8,
      monthsOnHand: 1.2,
      isLowSellThrough: false,
    },
    {
      id: 'p2',
      product: 'Naviro D3 50,000 IU',
      sellInUnits: 2100,
      sellOutUnits: 1890,
      sellThroughRate: 90.0,
      monthsOnHand: 1.4,
      isLowSellThrough: false,
    },
    {
      id: 'p3',
      product: 'Naviro D3 10,000 IU',
      sellInUnits: 1650,
      sellOutUnits: 1380,
      sellThroughRate: 83.6,
      monthsOnHand: 1.8,
      isLowSellThrough: false,
    },
    {
      id: 'p4',
      product: 'Naviro D3 Drops',
      sellInUnits: 1400,
      sellOutUnits: 680,
      sellThroughRate: 48.5,
      monthsOnHand: 4.6,
      isLowSellThrough: true,
      statusNotice: 'Low sell-through: excess pharmacy inventory',
    },
    {
      id: 'p5',
      product: 'Navigen Product 5',
      sellInUnits: 980,
      sellOutUnits: 460,
      sellThroughRate: 46.9,
      monthsOnHand: 5.1,
      isLowSellThrough: true,
      statusNotice: 'Sluggish dispensing in East & South regions',
    },
  ] as ProductSellThrough[],
}

// 3. Visit Coverage Mock Data
export interface OverdueDoctor {
  id: string
  name: string
  specialty: string
  clinic: string
  territory: string
  assignedRep: string
  lastVisit: string
  daysOverdue: number
  targetFrequency: string
}

export const VISIT_COVERAGE_MOCK = {
  summary: [
    { label: 'Target Coverage', value: '88.4%', change: '244 of 276 doctors reached', isPositive: true },
    { label: 'Overdue Doctors', value: '14 accounts', change: 'Exceeding cycle interval', isPositive: false },
    { label: 'Total Visits Logged', value: '342 visits', change: '+18% vs prior month', isPositive: true },
  ],
  repCoverage: [
    { rep: 'Alex Morgan', planned: 96, completed: 94, missed: 2, coveragePct: 97.9 },
    { rep: 'Maya Patel', planned: 84, completed: 81, missed: 3, coveragePct: 96.4 },
    { rep: 'Olivia Martin', planned: 78, completed: 72, missed: 6, coveragePct: 92.3 },
    { rep: 'Sofia Chen', planned: 54, completed: 48, missed: 6, coveragePct: 88.8 },
    { rep: 'James Wilson', planned: 72, completed: 47, missed: 25, coveragePct: 65.2 },
  ],
  overdueDoctors: [
    {
      id: 'doc-1',
      name: 'Dr. Sarah Jenkins',
      specialty: 'Cardiologist',
      clinic: 'St. Jude Heart Institute',
      territory: 'Central District',
      assignedRep: 'Alex Morgan',
      lastVisit: '34 days ago',
      daysOverdue: 14,
      targetFrequency: 'Every 20 days',
    },
    {
      id: 'doc-2',
      name: 'Dr. Marcus Vance',
      specialty: 'Neurologist',
      clinic: 'City Neuroscience Care',
      territory: 'East District',
      assignedRep: 'James Wilson',
      lastVisit: '48 days ago',
      daysOverdue: 28,
      targetFrequency: 'Every 20 days',
    },
    {
      id: 'doc-3',
      name: 'Dr. Emily Watson',
      specialty: 'Pediatrician',
      clinic: 'Watson Children Clinic',
      territory: 'North District',
      assignedRep: 'Maya Patel',
      lastVisit: '26 days ago',
      daysOverdue: 6,
      targetFrequency: 'Every 20 days',
    },
    {
      id: 'doc-4',
      name: 'Dr. Arthur Pendelton',
      specialty: 'Pulmonologist',
      clinic: 'Metro Health Center',
      territory: 'East District',
      assignedRep: 'James Wilson',
      lastVisit: '52 days ago',
      daysOverdue: 32,
      targetFrequency: 'Every 20 days',
    },
  ] as OverdueDoctor[],
}

// 5. Invoices & Approvals Mock Data
export interface RejectionReasonStat {
  id: string
  reason: string
  count: number
  pct: number
  avgResolutionTime: string
  affectedReps: string
}

export const INVOICES_APPROVALS_MOCK = {
  summary: [
    { label: 'Invoices Processed', value: '328 claims', change: 'EGP 312,400 validated', isPositive: true },
    { label: 'Avg Approval Time', value: '3.4 hours', change: 'Reduced from 6.8h', isPositive: true },
    { label: 'Rejection Rate', value: '4.2%', change: '14 total rejected', isPositive: false },
  ],
  statusTimeline: [
    { week: 'W1', approved: 68, pending: 8, rejected: 2 },
    { week: 'W2', approved: 74, pending: 11, rejected: 3 },
    { week: 'W3', approved: 82, pending: 9, rejected: 4 },
    { week: 'W4', approved: 90, pending: 12, rejected: 5 },
  ],
  rejectionReasons: [
    {
      id: 'rr-1',
      reason: 'Missing doctor clinic stamp or signature',
      count: 7,
      pct: 50.0,
      avgResolutionTime: '24 hours',
      affectedReps: 'James Wilson, Sofia Chen',
    },
    {
      id: 'rr-2',
      reason: 'Batch number mismatch with warehouse manifest',
      count: 4,
      pct: 28.5,
      avgResolutionTime: '48 hours',
      affectedReps: 'James Wilson',
    },
    {
      id: 'rr-3',
      reason: 'Blurred telegram photo / unreadable barcode',
      count: 3,
      pct: 21.5,
      avgResolutionTime: '4 hours',
      affectedReps: 'Olivia Martin, Alex Morgan',
    },
  ] as RejectionReasonStat[],
}

// 6. Rep Scorecard Mock Data
export interface RepScorecardProfile {
  id: string
  name: string
  role: string
  email: string
  avatarInitials: string
  territory: string
  sales: number
  salesTarget: number
  targetPct: number
  visitsLogged: number
  visitsTarget: number
  samplesDelivered: number
  conversionRate: number
  trend: 'up' | 'down' | 'steady'
  trendPct: number
  monthlyPerformance: number[]
  topAccounts: string[]
}

export const REP_SCORECARD_MOCK: Record<string, RepScorecardProfile> = {
  'Alex Morgan': {
    id: 'rep-alex',
    name: 'Alex Morgan',
    role: 'Senior Medical Representative',
    email: 'alex.morgan@navigenpharma.net',
    avatarInitials: 'AM',
    territory: 'Central District (Cardio & Neuro Focus)',
    sales: 216400,
    salesTarget: 200000,
    targetPct: 108.2,
    visitsLogged: 94,
    visitsTarget: 96,
    samplesDelivered: 142,
    conversionRate: 74.2,
    trend: 'up',
    trendPct: 8.2,
    monthlyPerformance: [82, 88, 94, 98, 102, 108],
    topAccounts: ['St. Jude Heart Institute', 'City Neuroscience Care', 'Central University Clinic'],
  },
  'Maya Patel': {
    id: 'rep-maya',
    name: 'Maya Patel',
    role: 'Medical Representative',
    email: 'maya.patel@navigenpharma.net',
    avatarInitials: 'MP',
    territory: 'North District (Pediatrics Focus)',
    sales: 192600,
    salesTarget: 180000,
    targetPct: 107.0,
    visitsLogged: 81,
    visitsTarget: 84,
    samplesDelivered: 118,
    conversionRate: 71.0,
    trend: 'up',
    trendPct: 7.0,
    monthlyPerformance: [85, 90, 92, 95, 101, 107],
    topAccounts: ['Watson Children Clinic', 'North General Hospital', 'KinderCare Medical'],
  },
  'Olivia Martin': {
    id: 'rep-olivia',
    name: 'Olivia Martin',
    role: 'Medical Representative',
    email: 'olivia.martin@navigenpharma.net',
    avatarInitials: 'OM',
    territory: 'West District',
    sales: 174500,
    salesTarget: 170000,
    targetPct: 102.6,
    visitsLogged: 72,
    visitsTarget: 78,
    samplesDelivered: 95,
    conversionRate: 68.4,
    trend: 'steady',
    trendPct: 2.6,
    monthlyPerformance: [78, 84, 88, 92, 98, 102],
    topAccounts: ['Mercy General Care', 'Westside Specialty Clinic'],
  },
  'James Wilson': {
    id: 'rep-james',
    name: 'James Wilson',
    role: 'Junior Medical Representative',
    email: 'james.wilson@navigenpharma.net',
    avatarInitials: 'JW',
    territory: 'East District',
    sales: 148200,
    salesTarget: 150000,
    targetPct: 98.8,
    visitsLogged: 47,
    visitsTarget: 72,
    samplesDelivered: 64,
    conversionRate: 52.8,
    trend: 'down',
    trendPct: -1.2,
    monthlyPerformance: [95, 90, 88, 82, 79, 74],
    topAccounts: ['City Neuroscience Care', 'East End Health Clinic'],
  },
  'Sofia Chen': {
    id: 'rep-sofia',
    name: 'Sofia Chen',
    role: 'Medical Representative',
    email: 'sofia.chen@navigenpharma.net',
    avatarInitials: 'SC',
    territory: 'South District',
    sales: 110800,
    salesTarget: 104000,
    targetPct: 106.5,
    visitsLogged: 48,
    visitsTarget: 54,
    samplesDelivered: 76,
    conversionRate: 66.5,
    trend: 'up',
    trendPct: 6.5,
    monthlyPerformance: [80, 85, 88, 94, 98, 106],
    topAccounts: ['South Metropolitan Clinic', 'Bayview Medical Group'],
  },
}
