import type { UserPermissions, UserRole } from '@/lib/auth'
import { getDefaultPermissions } from '@/lib/auth/permissions'
import { DEVELOPMENT_TEST_USERS } from '@/lib/auth/mock-users'

export interface AdminUserRecord {
  id: string
  name: string
  name_ar?: string
  email: string
  role: string
  roleType: UserRole
  region: string
  businessUnit?: string
  status: string
  permissions?: UserPermissions
  managerId?: string
}

export const adminUsersMockData: AdminUserRecord[] = [
  {
    id: 'u-admin-1',
    name: 'Alex Morgan',
    name_ar: 'أليكس مورجان',
    email: 'admin@navigenpharma.net',
    role: 'Admin',
    roleType: 'admin',
    region: 'HQ - Global',
    status: 'Active',
    permissions: getDefaultPermissions('admin'),
  },
  {
    id: 'u-bum-1',
    name: 'Dr. Khaled Fawzy',
    name_ar: 'د. خالد فوزي',
    email: 'khaled.fawzy@navigenpharma.net',
    role: 'Business Unit Manager',
    roleType: 'business_unit_manager',
    region: 'North region',
    businessUnit: 'Cardio-Metabolic',
    status: 'Active',
    permissions: getDefaultPermissions('business_unit_manager'),
    managerId: 'u-admin-1',
  },
  {
    id: 'u-flm-1',
    name: 'Mona Mansour',
    name_ar: 'منى منصور',
    email: 'mona.mansour@navigenpharma.net',
    role: 'First Line Manager',
    roleType: 'first_line_manager',
    region: 'North region',
    businessUnit: 'Cardio-Metabolic',
    status: 'Active',
    permissions: getDefaultPermissions('first_line_manager'),
    managerId: 'u-bum-1',
  },
  {
    id: 'u-mkt-1',
    name: 'Laila Mostafa',
    name_ar: 'ليلى مصطفى',
    email: 'laila.mostafa@navigenpharma.net',
    role: 'Marketing Manager',
    roleType: 'marketing_manager',
    region: 'HQ - Global',
    businessUnit: 'Cardio-Metabolic',
    status: 'Active',
    permissions: getDefaultPermissions('marketing_manager'),
    managerId: 'u-admin-1',
  },
  {
    id: 'u-rep-1',
    name: 'Ahmed Samir',
    name_ar: 'أحمد سمير',
    email: 'ahmed@navigenpharma.net',
    role: 'Medical Representative',
    roleType: 'rep',
    region: 'North region',
    businessUnit: 'Cardio-Metabolic',
    status: 'Active',
    permissions: getDefaultPermissions('rep'),
    managerId: 'u-admin-1',
  },
  {
    id: 'u-rep-2',
    name: 'Sara Ali',
    name_ar: 'سارة علي',
    email: 'sara@navigenpharma.net',
    role: 'Medical Representative',
    roleType: 'rep',
    region: 'West region',
    businessUnit: 'Cardio-Metabolic',
    status: 'Active',
    permissions: getDefaultPermissions('rep'),
    managerId: 'u-flm-1',
  },
  {
    id: 'u-rep-olivia',
    name: 'Olivia Martin',
    name_ar: 'أوليفيا مارتن',
    email: 'olivia.martin@navigenpharma.net',
    role: 'Medical Representative',
    roleType: 'rep',
    region: 'North region',
    businessUnit: 'Cardio-Metabolic',
    status: 'Active',
    permissions: getDefaultPermissions('rep'),
    managerId: 'u-flm-1',
  },
  {
    id: 'u-rep-maya',
    name: 'Maya Patel',
    name_ar: 'مايا باتيل',
    email: 'maya.patel@navigenpharma.net',
    role: 'Medical Representative',
    roleType: 'rep',
    region: 'West region',
    businessUnit: 'Respiratory',
    status: 'Active',
    permissions: getDefaultPermissions('rep'),
    managerId: 'u-admin-1',
  },
  {
    id: 'u-rep-james',
    name: 'James Wilson',
    name_ar: 'جيمس ويلسون',
    email: 'james.wilson@navigenpharma.net',
    role: 'Medical Representative',
    roleType: 'rep',
    region: 'Central region',
    businessUnit: 'Respiratory',
    status: 'Active',
    permissions: getDefaultPermissions('rep'),
  },
  {
    id: 'u-rep-sofia',
    name: 'Sofia Chen',
    name_ar: 'صوفيا تشين',
    email: 'sofia.chen@navigenpharma.net',
    role: 'Medical Representative',
    roleType: 'rep',
    region: 'East region',
    businessUnit: 'Specialty Care',
    status: 'Active',
    permissions: getDefaultPermissions('rep'),
  },
  ...DEVELOPMENT_TEST_USERS.map((u) => ({
    id: u.id,
    name: u.name,
    name_ar: u.name_ar,
    email: u.email,
    role:
      u.role === 'admin'
        ? 'Admin'
        : u.role === 'business_unit_manager'
        ? 'Business Unit Manager'
        : u.role === 'first_line_manager'
        ? 'First Line Manager'
        : u.role === 'marketing_manager'
        ? 'Marketing Manager'
        : 'Medical Representative',
    roleType: u.role,
    region: u.region || 'North',
    businessUnit: u.businessUnit,
    status: 'Active',
    permissions: u.permissions || getDefaultPermissions(u.role),
    managerId: u.managerId,
  })),
]
