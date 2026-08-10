import {
  identityDocumentPath, membershipDocumentPath, platformAuthorityDocumentPath, tenantDocumentPath,
} from "@mipymetic/saas-contracts/persistence";
import { MEMBERSHIP_STATUSES, PLATFORM_AUTHORITY_STATUSES, PLATFORM_ROLES, TENANT_STATUSES } from "@mipymetic/saas-contracts";
import { BACKEND_ERROR_CODES } from "@mipymetic/saas-contracts/errors";
import { isPlainObject, validateDocumentIdentifier } from "@mipymetic/saas-contracts/validation";
import type { AuthenticatedActor, AuthorityResolution } from "../contracts/types.js";
import { BackendError } from "../errors/backendError.js";
import type { AuthoritativeReaderPort } from "../persistence/ports.js";
import { capabilitiesForMembershipRole, capabilitiesForPlatformRole } from "./capabilities.js";

const activeIdentity = async (reader: AuthoritativeReaderPort, uid: string) => {
  const identity = await reader.read(identityDocumentPath(uid));
  if (!identity.exists || identity.data === null) throw new BackendError(BACKEND_ERROR_CODES.FAILED_PRECONDITION, "The actor Identity is missing.");
  if (!isPlainObject(identity.data) || typeof identity.data.uid !== "string") {
    throw new BackendError(BACKEND_ERROR_CODES.CONTRACT_VIOLATION, "The actor Identity is invalid.");
  }
  const validation = validateDocumentIdentifier(identity.data.uid, "identity.uid");
  if (!validation.ok) {
    throw new BackendError(BACKEND_ERROR_CODES.CONTRACT_VIOLATION, "The actor Identity is invalid.");
  }
  if (identity.data.uid !== uid) {
    throw new BackendError(BACKEND_ERROR_CODES.FORBIDDEN, "The actor Identity is not coherent with authentication.");
  }
  return identity.data;
};

export const resolvePlatformAuthority = async (reader: AuthoritativeReaderPort, actor: AuthenticatedActor): Promise<AuthorityResolution> => {
  await activeIdentity(reader, actor.uid);
  const authority = await reader.read(platformAuthorityDocumentPath(actor.uid));
  if (!authority.exists || !isPlainObject(authority.data)
    || authority.data.uid !== actor.uid
    || authority.data.status !== PLATFORM_AUTHORITY_STATUSES.ACTIVE
    || authority.data.authority !== PLATFORM_ROLES.PLATFORM_ADMIN) {
    throw new BackendError(BACKEND_ERROR_CODES.FORBIDDEN, "Active platform authority is required.");
  }
  return Object.freeze({ actorUid: actor.uid, actorType: "platform_admin", authority: PLATFORM_ROLES.PLATFORM_ADMIN, tenantId: null, roles: Object.freeze([PLATFORM_ROLES.PLATFORM_ADMIN]), capabilities: capabilitiesForPlatformRole(PLATFORM_ROLES.PLATFORM_ADMIN) });
};

export const resolveTenantAuthority = async (reader: AuthoritativeReaderPort, actor: AuthenticatedActor, tenantId: string, membershipId: string): Promise<AuthorityResolution> => {
  await activeIdentity(reader, actor.uid);
  const tenant = await reader.read(tenantDocumentPath(tenantId));
  if (!tenant.exists || !isPlainObject(tenant.data) || tenant.data.tenantId !== tenantId || tenant.data.status !== TENANT_STATUSES.ACTIVE) {
    throw new BackendError(BACKEND_ERROR_CODES.FAILED_PRECONDITION, "An active coherent Tenant is required.");
  }
  const membership = await reader.read(membershipDocumentPath(tenantId, membershipId));
  if (!membership.exists || membership.data === null) throw new BackendError(BACKEND_ERROR_CODES.FORBIDDEN, "An active Membership is required.");
  if (!isPlainObject(membership.data)
    || membership.data.membershipId !== membershipId
    || membership.data.uid !== actor.uid
    || membership.data.tenantId !== tenantId
    || membership.data.status !== MEMBERSHIP_STATUSES.APPROVED
    || typeof membership.data.role !== "string") {
    throw new BackendError(BACKEND_ERROR_CODES.FORBIDDEN, "Membership authority is not coherent with the authenticated actor and Tenant.");
  }
  const role = membership.data.role;
  return Object.freeze({ actorUid: actor.uid, actorType: "identity", authority: role, tenantId, roles: Object.freeze([role]), capabilities: capabilitiesForMembershipRole(role) });
};
