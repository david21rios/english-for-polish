import { CAPABILITY_IDS } from "./capabilities.js";

/**
 * Capabilities owned by an authenticated Identity independently of
 * MembershipRole and PlatformRole.
 *
 * This declarative set does not grant access by itself. Every future use
 * remains subject to self ownership, tenant context where applicable and
 * access-state requirements.
 */
export const IDENTITY_SELF_CAPABILITIES = Object.freeze([
  CAPABILITY_IDS.IDENTITY_READ_SELF,
  CAPABILITY_IDS.IDENTITY_UPDATE_SELF,
  CAPABILITY_IDS.MEMBERSHIP_LEAVE_SELF,
  CAPABILITY_IDS.REGISTRATION_REQUEST_CREATE,
  CAPABILITY_IDS.REGISTRATION_REQUEST_READ_SELF,
]);
