export type UserRole =
  | 'admin'
  | 'rep'
  | 'first_line_manager'
  | 'business_unit_manager'
  | 'marketing_manager'

export type UserStatus = 'pending' | 'active' | 'rejected' | 'disabled'

export interface UserPermissions {
  pages: string[]
  canEditPrices: boolean
  canApproveInvoices: boolean
  canExport: boolean
  canDeleteData: boolean
}

export interface User {
  id: string
  name: string
  name_ar?: string
  email: string
  phone?: string
  requestedDate?: string
  role: UserRole
  region?: string
  businessUnit?: string
  status?: UserStatus
  emailVerified?: boolean
  permissions?: UserPermissions
  managerId?: string
  isTestUser?: boolean
}

export interface AuthSession {
  user: User
  token: string
}
