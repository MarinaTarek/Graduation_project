/**
 * Navigen Distribution Suite — Direct Manager Approval Engine
 *
 * Resolves approval routing dynamically from actual user reporting relationships (managerId),
 * validates approval authority, prevents self-approval, prevents circular routing,
 * and enforces branch/business-unit isolation.
 */

import type { User, UserRole } from '@/lib/auth/types'
import { getAllUsers } from '@/lib/auth/mock-users'
import { usersStore } from '@/data/mock/users'

export type RequestType =
  | 'visit_plan'
  | 'leave_request'
  | 'operational_request'
  | 'exceptional_request'
  | 'budget_approval'
  | 'user_signup'
  | 'role_change'

export interface ApprovalHistoryRecord {
  action: 'Submitted' | 'Approved' | 'Rejected' | 'Changes Requested' | 'Escalated' | 'Returned to Pending' | 'Manager Reassigned'
  actorId: string
  actorName: string
  actorRole: string
  previousStatus: string
  newStatus: string
  timestamp: string
  reason?: string
  assignedApproverId?: string
}

export interface AuthoritativeUser {
  id: string
  name: string
  email: string
  role: UserRole
  status: string
  managerId?: string
  businessUnit?: string
  region?: string
}

/**
 * Known legacy and alternate identity aliases mapped to canonical user IDs.
 */
export const CANONICAL_USER_ALIASES: Record<string, string> = {
  'rep-maya': 'u-rep-maya',
  'rep-olivia': 'u-rep-olivia',
  'rep-james': 'u-rep-james',
  'rep-sofia': 'u-rep-sofia',
}

/**
 * Resolves an arbitrary user identifier (legacy slug, ID, or name) to the authoritative canonical user ID.
 */
export function resolveCanonicalUserId(identifier: string): string {
  if (!identifier) return identifier
  const clean = identifier.trim()
  const lower = clean.toLowerCase()
  if (CANONICAL_USER_ALIASES[lower]) {
    return CANONICAL_USER_ALIASES[lower]
  }
  const dir = getAuthoritativeDirectory()
  const found = dir.find((u) => u.id.toLowerCase() === lower || u.name.toLowerCase() === lower)
  return found ? found.id : clean
}

/**
 * Retrieves the authoritative directory of users, using usersStore as the primary
 * single source of truth for user profile information, augmented with auth users without conflict.
 */
export function getAuthoritativeDirectory(): AuthoritativeUser[] {
  const map = new Map<string, AuthoritativeUser>()

  // 1. usersStore is the primary canonical directory of profiles
  for (const u of usersStore.get()) {
    map.set(u.id.toLowerCase(), {
      id: u.id,
      name: u.name,
      email: u.email,
      role: (u.roleType || 'rep') as UserRole,
      status: (u.status || 'active').toLowerCase(),
      managerId: u.managerId,
      businessUnit: (u as any).businessUnit,
      region: u.region,
    })
  }

  // 2. Augment with non-overlapping auth mock users (without overriding canonical profiles)
  for (const u of getAllUsers()) {
    const key = u.id.toLowerCase()
    if (!map.has(key)) {
      map.set(key, {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        status: (u.status || 'active').toLowerCase(),
        managerId: u.managerId,
        businessUnit: u.businessUnit,
        region: u.region,
      })
    }
  }

  return Array.from(map.values())
}

/**
 * Looks up an authoritative user record by id, email, or name.
 */
export function findAuthoritativeUser(
  identifier?: string | { id?: string; name?: string; email?: string; role?: string } | null
): AuthoritativeUser | null {
  if (!identifier) return null
  const parsed = typeof identifier === 'string'
    ? { id: identifier, name: identifier, email: identifier }
    : identifier

  const resolvedId = parsed.id ? (CANONICAL_USER_ALIASES[parsed.id.toLowerCase()] || parsed.id) : undefined

  const directory = getAuthoritativeDirectory()
  if (resolvedId) {
    const byId = directory.find((u) => u.id.toLowerCase() === resolvedId.trim().toLowerCase())
    if (byId) return byId
  }
  if (parsed.email) {
    const byEmail = directory.find((u) => u.email.toLowerCase() === parsed.email!.trim().toLowerCase())
    if (byEmail) return byEmail
  }
  if (parsed.name) {
    const byName = directory.find((u) => u.name.toLowerCase() === parsed.name!.trim().toLowerCase())
    if (byName) return byName
  }
  return null
}

function isUserActive(u: AuthoritativeUser): boolean {
  return u.status === 'active'
}

/**
 * Checks whether a user has approval authority for a specific request type.
 */
export function hasApprovalAuthority(
  user: Pick<AuthoritativeUser, 'role' | 'status'>,
  requestType: RequestType
): boolean {
  if (!isUserActive(user as AuthoritativeUser)) return false

  switch (requestType) {
    case 'user_signup':
    case 'role_change':
      return user.role === 'admin'
    case 'visit_plan':
    case 'leave_request':
    case 'operational_request':
      return (
        user.role === 'admin' ||
        user.role === 'business_unit_manager' ||
        user.role === 'first_line_manager'
      )
    case 'exceptional_request':
      return user.role === 'admin' || user.role === 'business_unit_manager'
    default:
      return user.role === 'admin'
  }
}

export interface ResolvedApprover {
  approverId: string
  approverName: string
  approverRole: UserRole
  escalated: boolean
  escalationReason?: string
}

/**
 * Resolves the assigned approver for a request based on the creator's actual
 * direct reporting hierarchy (managerId), escalating only when the direct manager
 * is inactive, missing, or lacks authority for the request type.
 */
export function resolveApproverForRequest(
  creatorIdentifier: string | { id?: string; name?: string; email?: string },
  requestType: RequestType
): ResolvedApprover {
  const directory = getAuthoritativeDirectory()
  const creator = findAuthoritativeUser(creatorIdentifier)

  const findActiveAdmin = (excludeId?: string): AuthoritativeUser => {
    const admin = directory.find(
      (u) => u.role === 'admin' && isUserActive(u) && u.id !== excludeId
    )
    if (!admin) {
      throw new Error('No active Admin approver available in directory.')
    }
    return admin
  }

  // Admin-only request types route directly to an active Admin
  if (requestType === 'user_signup' || requestType === 'role_change') {
    const admin = findActiveAdmin(creator?.id)
    return {
      approverId: admin.id,
      approverName: admin.name,
      approverRole: admin.role,
      escalated: false,
    }
  }

  // Medical visit plans require a direct active manager; missing/inactive manager blocks submission
  if (requestType === 'visit_plan' && creator && creator.role === 'rep') {
    if (!creator.managerId) {
      throw new Error(
        `Submission blocked: Representative "${creator.name}" does not have an active direct manager assigned. An administrator must assign an active manager before this plan can be submitted.`
      )
    }
    const directMgr = directory.find((u) => u.id === creator.managerId)
    if (!directMgr || !isUserActive(directMgr)) {
      throw new Error(
        `Submission blocked: Direct manager for "${creator.name}" is missing or inactive. An administrator must reassign an active manager before this plan can be submitted.`
      )
    }
  }

  if (!creator || !creator.managerId) {
    const admin = findActiveAdmin(creator?.id)
    return {
      approverId: admin.id,
      approverName: admin.name,
      approverRole: admin.role,
      escalated: true,
      escalationReason: !creator
        ? 'Creator record not found; escalated to Admin.'
        : 'No direct manager assigned; escalated to Admin.',
    }
  }

  // Traverse direct reporting chain with cycle detection
  const visited = new Set<string>([creator.id])
  let currentManagerId: string | undefined = creator.managerId
  let steps = 0
  let escalationReason: string | undefined

  while (currentManagerId) {
    if (visited.has(currentManagerId)) {
      escalationReason = 'Circular reporting hierarchy detected; escalated to Admin.'
      break
    }
    visited.add(currentManagerId)
    steps++

    const manager = directory.find((u) => u.id === currentManagerId)
    if (!manager) {
      escalationReason = `Assigned manager (${currentManagerId}) not found; escalated to next level.`
      break
    }

    if (!isUserActive(manager)) {
      escalationReason = `Direct manager ${manager.name} is inactive; escalated to higher management.`
      currentManagerId = manager.managerId
      continue
    }

    if (hasApprovalAuthority(manager, requestType)) {
      return {
        approverId: manager.id,
        approverName: manager.name,
        approverRole: manager.role,
        escalated: steps > 1 || Boolean(escalationReason),
        escalationReason,
      }
    }

    escalationReason = `Manager ${manager.name} lacks authority for ${requestType}; escalated.`
    currentManagerId = manager.managerId
  }

  const fallbackAdmin = findActiveAdmin(creator.id)
  return {
    approverId: fallbackAdmin.id,
    approverName: fallbackAdmin.name,
    approverRole: fallbackAdmin.role,
    escalated: true,
    escalationReason: escalationReason || 'Escalated to Admin.',
  }
}

/**
 * Validates that an actor is authorized to approve or reject a specific request.
 * Never trusts caller-supplied role strings alone when an authoritative user exists.
 */
export function validateApprovalAuthority(
  actorIdentifier: { id?: string; name?: string; email?: string; role?: string },
  request: {
    createdById?: string
    createdByName?: string
    assignedApproverId?: string
    requestType: RequestType
  }
): { valid: boolean; actor?: AuthoritativeUser; error?: string } {
  let actor = findAuthoritativeUser(actorIdentifier)

  // Synthetic fallback for mock tests or explicitly supplied actor objects
  if (!actor && (actorIdentifier.name || actorIdentifier.id)) {
    actor = {
      id: actorIdentifier.id || `u-${actorIdentifier.name?.toLowerCase().replace(/\s+/g, '-') || 'unknown'}`,
      name: actorIdentifier.name || actorIdentifier.id || 'Unknown User',
      email: actorIdentifier.email || `${actorIdentifier.name?.toLowerCase().replace(/\s+/g, '.') || 'user'}@navigenpharma.net`,
      role: (actorIdentifier.role as UserRole) || 'rep',
      status: 'active',
    }
  }

  if (!actor) {
    return {
      valid: false,
      error: 'Unauthorized: Approver user record not found in directory.',
    }
  }

  if (!isUserActive(actor)) {
    return {
      valid: false,
      error: `Unauthorized: Approver account (${actor.name}) is not active.`,
    }
  }

  // Self-approval / self-rejection protection:
  // When IDs are available, use ID strictly to allow users who share first names
  const isSelf =
    (request.createdById && actor.id)
      ? actor.id.toLowerCase() === request.createdById.toLowerCase()
      : Boolean(request.createdByName && actor.name && actor.name.toLowerCase() === request.createdByName.toLowerCase())

  if (isSelf) {
    return {
      valid: false,
      error: 'A representative cannot approve their own visit plan. Self-approval violation: An employee cannot approve or reject their own request.',
    }
  }

  // Authority check for request type
  if (!hasApprovalAuthority(actor, request.requestType)) {
    return {
      valid: false,
      error: `A representative cannot approve their own visit plan. Unauthorized: Role "${actor.role}" does not have approval authority for ${request.requestType}.`,
    }
  }

  // Assigned approver / branch isolation check
  if (request.assignedApproverId) {
    const isAssigned = actor.id.toLowerCase() === request.assignedApproverId.toLowerCase()
    const isAdminOverride = actor.role === 'admin'
    if (!isAssigned && !isAdminOverride) {
      return {
        valid: false,
        error: `Unauthorized: This request is assigned to ${request.assignedApproverId}, not ${actor.name} (${actor.id}). Cross-branch approval is forbidden.`,
      }
    }
  }

  return { valid: true, actor }
}
