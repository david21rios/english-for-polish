/**
 * Capabilities owned by an authenticated Identity independently of
 * MembershipRole and PlatformRole.
 *
 * This declarative set does not grant access by itself. Every future use
 * remains subject to self ownership, tenant context where applicable and
 * access-state requirements.
 */
export const IDENTITY_SELF_CAPABILITIES: readonly ("identity.read_self" | "identity.update_self" | "membership.leave_self" | "registration_request.create" | "registration_request.read_self" | "registration_request.cancel_self")[];
