import type { User, UserPermissions, UserRole } from './types'

export const ALL_STANDARD_PAGES = [
  'Dashboard',
  'Clients',
  'Invoices',
  'Stock',
  'Sell-in',
  'Sell-out',
  'Distribution Overview',
  'Invoices & Sell-in',
  'Warehouses',
  'Performance Analytics',
  'Cash In',
  'Returns',
  'Targets',
  'Visits',
  'Visit plan',
  'Budgets',
  'Reports',
]

export const ALL_ADMIN_PAGES = [
  'Admin',
  'Users',
  'Products & Batches',
  'Territories',
  'Audit log',
  'Settings',
]

export const ALL_PAGES = [...ALL_STANDARD_PAGES, ...ALL_ADMIN_PAGES]

export const ROLE_ALLOWED_PAGES: Record<UserRole, string[]> = {
  admin: [...ALL_PAGES, 'Home'],
  first_line_manager: [
    'Dashboard',
    'Home',
    'Clients',
    'Visits',
    'Visit plan',
    'Sell-out',
    'Performance Analytics',
    'Targets',
    'Reports',
  ],
  business_unit_manager: [
    'Dashboard',
    'Home',
    'Clients',
    'Visits',
    'Visit plan',
    'Sell-out',
    'Performance Analytics',
    'Targets',
    'Reports',
    'Territories',
  ],
  marketing_manager: [
    'Dashboard',
    'Home',
    'Reports',
    'Products & Batches',
    'Performance Analytics',
  ],
  rep: [
    'Dashboard',
    'Home',
    'Clients',
    'Visits',
    'Visit plan',
    'Sell-out',
    'Targets',
    'Performance Analytics',
    'Reports',
    'Stock',
    'Invoices',
    'Sell-in',
    'Distribution Overview',
    'Invoices & Sell-in',
    'Warehouses',
    'Cash In',
    'Returns',
    'Budgets',
  ],
}

export function getDefaultPermissions(role: UserRole): UserPermissions {
  if (role === 'admin') {
    return {
      pages: [...ALL_PAGES, 'Home'],
      canEditPrices: true,
      canApproveInvoices: true,
      canExport: true,
      canDeleteData: true,
    }
  }

  if (role === 'first_line_manager') {
    return {
      pages: [...ROLE_ALLOWED_PAGES.first_line_manager],
      canEditPrices: false,
      canApproveInvoices: false,
      canExport: true,
      canDeleteData: false,
    }
  }

  if (role === 'business_unit_manager') {
    return {
      pages: [...ROLE_ALLOWED_PAGES.business_unit_manager],
      canEditPrices: false,
      canApproveInvoices: false,
      canExport: true,
      canDeleteData: false,
    }
  }

  if (role === 'marketing_manager') {
    return {
      pages: [...ROLE_ALLOWED_PAGES.marketing_manager],
      canEditPrices: false,
      canApproveInvoices: false,
      canExport: true,
      canDeleteData: false,
    }
  }

  return {
    pages: [...ROLE_ALLOWED_PAGES.rep],
    canEditPrices: false,
    canApproveInvoices: false,
    canExport: false,
    canDeleteData: false,
  }
}

/**
 * Sanitizes existing permissions when switching roles to guarantee that
 * transitioning to a lower-privilege role never accidentally retains unauthorized privileges.
 */
export function sanitizeRolePermissions(
  newRole: UserRole,
  currentPermissions: UserPermissions
): UserPermissions {
  const allowedPages = new Set(ROLE_ALLOWED_PAGES[newRole])
  const filteredPages = currentPermissions.pages.filter((p) => allowedPages.has(p))

  // If filtered pages lost core pages, merge defaults
  const defaults = getDefaultPermissions(newRole)
  const combinedPages = Array.from(new Set([...filteredPages, ...defaults.pages]))

  return {
    pages: combinedPages,
    canEditPrices: newRole === 'admin' ? currentPermissions.canEditPrices : false,
    canApproveInvoices:
      newRole === 'admin' || newRole === 'business_unit_manager'
        ? currentPermissions.canApproveInvoices
        : false,
    canExport:
      newRole === 'rep'
        ? false
        : (currentPermissions.canExport ?? defaults.canExport),
    canDeleteData: newRole === 'admin' ? currentPermissions.canDeleteData : false,
  }
}

export function getUserPermissions(user?: User | null, fallbackRole: UserRole = 'rep'): UserPermissions {
  const role = user?.role || fallbackRole
  const defaults = getDefaultPermissions(role)
  if (!user?.permissions) return defaults

  return {
    pages: user.permissions.pages ?? defaults.pages,
    canEditPrices: user.permissions.canEditPrices ?? defaults.canEditPrices,
    canApproveInvoices: user.permissions.canApproveInvoices ?? defaults.canApproveInvoices,
    canExport: user.permissions.canExport ?? defaults.canExport,
    canDeleteData: user.permissions.canDeleteData ?? defaults.canDeleteData,
  }
}

export function canAccessPage(
  page: string,
  roleOrUser?: UserRole | User | null,
  maybeUser?: User | null
): boolean {
  let role: UserRole = 'rep'
  let user: User | null = null

  if (typeof roleOrUser === 'string') {
    role = roleOrUser
    user = maybeUser || null
  } else if (roleOrUser && typeof roleOrUser === 'object') {
    user = roleOrUser
    role = user.role || 'rep'
  }

  const permissions = getUserPermissions(user, role)
  const targetPage = page === 'Home' ? 'Dashboard' : page

  if (targetPage === 'Invoices & Sell-in') {
    return (
      permissions.pages.includes('Invoices & Sell-in') ||
      permissions.pages.includes('Invoices') ||
      permissions.pages.includes('Sell-in')
    )
  }

  return (
    permissions.pages.includes(targetPage) ||
    (targetPage === 'Dashboard' && permissions.pages.includes('Home'))
  )
}

export function canPerformAction(
  action: keyof Omit<UserPermissions, 'pages'>,
  roleOrUser?: UserRole | User | null,
  maybeUser?: User | null
): boolean {
  let role: UserRole = 'rep'
  let user: User | null = null

  if (typeof roleOrUser === 'string') {
    role = roleOrUser
    user = maybeUser || null
  } else if (roleOrUser && typeof roleOrUser === 'object') {
    user = roleOrUser
    role = user.role || 'rep'
  }

  const permissions = getUserPermissions(user, role)
  return Boolean(permissions[action])
}
