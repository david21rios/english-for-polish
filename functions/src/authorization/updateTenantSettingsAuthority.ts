import { validateAuthorityResolution } from "@mipymetic/saas-contracts/authority";
import {
  CAPABILITY_IDS,
  MEMBERSHIP_ROLES,
  MEMBERSHIP_STATUSES,
  TENANT_STATUSES,
} from "@mipymetic/saas-contracts/domain";
import { BACKEND_ERROR_CODES } from "@mipymetic/saas-contracts/errors";
import {
  encodeMembershipUidKey,
  identityDocumentPath,
  membershipDocumentPath,
  membershipKeyDocumentPath,
  tenantDocumentPath,
  validateMembershipKey,
  validatePersistedMembership,
  validatePersistedTenant,
} from "@mipymetic/saas-contracts/persistence";
import {
  isPlainObject,
  validateDocumentIdentifier,
} from "@mipymetic/saas-contracts/validation";
import type {
  AuthenticatedActor,
  AuthorityResolution,
} from "../contracts/types.js";
import { BackendError } from "../errors/backendError.js";
import type { AuthoritativeReaderPort } from "../persistence/ports.js";
import { capabilitiesForMembershipRole } from "./capabilities.js";

const contract = (message: string): never => {
  throw new BackendError(
    BACKEND_ERROR_CODES.CONTRACT_VIOLATION,
    message,
  );
};

const forbidden = (message: string): never => {
  throw new BackendError(
    BACKEND_ERROR_CODES.FORBIDDEN,
    message,
  );
};

export const resolveUpdateTenantSettingsAuthority = async (
  reader: AuthoritativeReaderPort,
  actor: AuthenticatedActor,
  tenantId: string,
): Promise<AuthorityResolution> => {
  const identitySnapshot = await reader.read(
    identityDocumentPath(actor.uid),
    "identity",
  );

  if (!identitySnapshot.exists || identitySnapshot.data === null) {
    throw new BackendError(
      BACKEND_ERROR_CODES.FAILED_PRECONDITION,
      "The actor Identity is missing.",
    );
  }

  if (
    !isPlainObject(identitySnapshot.data)
    || typeof identitySnapshot.data.uid !== "string"
  ) {
    return contract("The actor Identity is invalid.");
  }

  const identityUid = validateDocumentIdentifier(
    identitySnapshot.data.uid,
    "identity.uid",
  );

  if (!identityUid.ok) {
    return contract("The actor Identity is invalid.");
  }

  if (identitySnapshot.data.uid !== actor.uid) {
    return forbidden(
      "The actor Identity is not coherent with authentication.",
    );
  }

  const tenantSnapshot = await reader.read(
    tenantDocumentPath(tenantId),
    "tenant",
  );

  if (!tenantSnapshot.exists) {
    throw new BackendError(
      BACKEND_ERROR_CODES.NOT_FOUND,
      "Tenant does not exist.",
    );
  }

  const tenantValidation =
    validatePersistedTenant(tenantSnapshot.data);

  if (!tenantValidation.ok) {
    return contract("Persisted Tenant is malformed.");
  }

  const tenant =
    tenantValidation.value as Readonly<Record<string, unknown>>;

  if (tenant.tenantId !== tenantId) {
    return contract(
      "Persisted Tenant binding is incoherent.",
    );
  }

  if (tenant.status !== TENANT_STATUSES.ACTIVE) {
    throw new BackendError(
      BACKEND_ERROR_CODES.FAILED_PRECONDITION,
      "Tenant is not active.",
    );
  }

  const uidKey = encodeMembershipUidKey(actor.uid);

  const keySnapshot = await reader.read(
    membershipKeyDocumentPath(
      tenantId,
      uidKey,
    ),
    "membership_key",
  );

  if (!keySnapshot.exists) {
    return forbidden(
      "Approved same-Tenant Membership authority is required.",
    );
  }

  const keyValidation =
    validateMembershipKey(keySnapshot.data);

  if (!keyValidation.ok) {
    return contract(
      "Persisted MembershipKey is malformed.",
    );
  }

  const membershipKey =
    keyValidation.value as Readonly<Record<string, unknown>>;

  if (
    membershipKey.tenantId !== tenantId
    || membershipKey.uid !== actor.uid
    || membershipKey.status !== MEMBERSHIP_STATUSES.APPROVED
  ) {
    return forbidden(
      "MembershipKey authority is not approved for the authenticated actor.",
    );
  }

  const membershipId = membershipKey.membershipId;

  if (typeof membershipId !== "string") {
    return contract(
      "MembershipKey membershipId is malformed.",
    );
  }

  const membershipSnapshot = await reader.read(
    membershipDocumentPath(
      tenantId,
      membershipId,
    ),
    "membership",
  );

  if (!membershipSnapshot.exists) {
    return forbidden(
      "Authoritative Membership is required.",
    );
  }

  const membershipValidation =
    validatePersistedMembership(membershipSnapshot.data);

  if (!membershipValidation.ok) {
    return contract(
      "Persisted Membership is malformed.",
    );
  }

  const membership =
    membershipValidation.value as Readonly<Record<string, unknown>>;

  if (
    membership.membershipId !== membershipId
    || membership.tenantId !== tenantId
    || membership.uid !== actor.uid
    || membership.status !== MEMBERSHIP_STATUSES.APPROVED
    || membershipKey.membershipId !== membership.membershipId
    || membershipKey.status !== membership.status
    || membershipKey.originRequestId !== membership.originRequestId
  ) {
    return forbidden(
      "Membership authority is not coherent with MembershipKey.",
    );
  }

  if (membership.role !== MEMBERSHIP_ROLES.TENANT_ADMIN) {
    return forbidden(
      "UpdateTenantSettings requires tenant_admin authority.",
    );
  }

  const capabilities =
    capabilitiesForMembershipRole(
      MEMBERSHIP_ROLES.TENANT_ADMIN,
    );

  if (
    !capabilities.includes(
      CAPABILITY_IDS.TENANT_UPDATE,
    )
  ) {
    return contract(
      "tenant_admin authority is missing tenant.update.",
    );
  }

  const resolution = Object.freeze({
    actorUid: actor.uid,
    actorType: "identity" as const,
    authority: MEMBERSHIP_ROLES.TENANT_ADMIN,
    tenantId,
    roles: Object.freeze([
      MEMBERSHIP_ROLES.TENANT_ADMIN,
    ]),
    capabilities,
  });

  const resolutionValidation =
    validateAuthorityResolution(resolution);

  if (!resolutionValidation.ok) {
    return contract(
      "UpdateTenantSettings AuthorityResolution is malformed.",
    );
  }

  return resolutionValidation.value as AuthorityResolution;
};
