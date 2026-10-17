import {
  ACCESS_STATE_CONTEXT,
  ACCESS_STATE_PRECEDENCE
} from "../identity/accessStatePrecedence.js";
import {
  REGISTRATION_REQUEST_STATUSES
} from "../identity/enums.js";
import {
  MEMBERSHIP_STATUSES,
  TENANT_STATUSES
} from "../organization/enums.js";

const RESULT_BY_KEY = Object.freeze(Object.fromEntries(
  ACCESS_STATE_PRECEDENCE.map(({ key, result }) => [key, result])
));

const isRecord = (value) => value !== null && typeof value === "object" && !Array.isArray(value);

const isNonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;

const isCanonicalStatus = (value, statuses) => Object.values(statuses).includes(value);

const matchesContext = (value, { uid, tenantId }) => (
  (value.tenantId === undefined || value.tenantId === tenantId) &&
  (value.uid === undefined || value.uid === uid)
);

const resultFor = (key) => RESULT_BY_KEY[key];

/**
 * Derives the tenant-scoped AccessState without performing authorization or
 * persistence. The input objects are treated as immutable snapshots.
 *
 * @param {object} input
 * @param {string} input.uid
 * @param {string} input.tenantId
 * @param {{emailVerified?: boolean}|undefined} input.identity
 * @param {{tenantId?: string, status: string}} input.tenant
 * @param {{tenantId?: string, uid?: string, status: string}|null|undefined} input.membership
 * @param {{tenantId?: string, uid?: string, status: string}|null|undefined} input.registrationRequest
 * @param {boolean} input.requiresVerifiedEmail
 * @returns {string|null}
 */
export const resolveAccessState = ({
  uid,
  tenantId,
  identity,
  tenant,
  membership,
  registrationRequest,
  requiresVerifiedEmail
} = {}) => {
  if (
    !isNonEmptyString(uid) ||
    !isNonEmptyString(tenantId) ||
    typeof requiresVerifiedEmail !== "boolean" ||
    !isRecord(tenant) ||
    !isCanonicalStatus(tenant.status, TENANT_STATUSES) ||
    !matchesContext(tenant, { uid, tenantId })
  ) {
    return ACCESS_STATE_CONTEXT.outsideTenantResult;
  }

  if (requiresVerifiedEmail && (
    !isRecord(identity) ||
    typeof identity.emailVerified !== "boolean"
  )) {
    return ACCESS_STATE_CONTEXT.outsideTenantResult;
  }

  if (membership !== null && membership !== undefined && (
    !isRecord(membership) ||
    !isCanonicalStatus(membership.status, MEMBERSHIP_STATUSES) ||
    !matchesContext(membership, { uid, tenantId })
  )) {
    return ACCESS_STATE_CONTEXT.outsideTenantResult;
  }

  if (tenant.status === TENANT_STATUSES.ARCHIVED) {
    return ACCESS_STATE_CONTEXT.outsideTenantResult;
  }

  if (membership?.status === MEMBERSHIP_STATUSES.REMOVED) {
    return ACCESS_STATE_CONTEXT.outsideTenantResult;
  }

  if (requiresVerifiedEmail && identity.emailVerified === false) {
    return resultFor("email_unverified");
  }

  if (
    tenant.status === TENANT_STATUSES.SUSPENDED ||
    membership?.status === MEMBERSHIP_STATUSES.SUSPENDED
  ) {
    return resultFor("institutional_suspension");
  }

  if (tenant.status !== TENANT_STATUSES.ACTIVE) {
    return ACCESS_STATE_CONTEXT.outsideTenantResult;
  }

  if (membership?.status === MEMBERSHIP_STATUSES.APPROVED) {
    return resultFor("approved_membership");
  }

  if (membership !== null && membership !== undefined) {
    return ACCESS_STATE_CONTEXT.outsideTenantResult;
  }

  if (registrationRequest === null || registrationRequest === undefined) {
    return ACCESS_STATE_CONTEXT.outsideTenantResult;
  }

  if (
    !isRecord(registrationRequest) ||
    !isCanonicalStatus(registrationRequest.status, REGISTRATION_REQUEST_STATUSES) ||
    !matchesContext(registrationRequest, { uid, tenantId })
  ) {
    return ACCESS_STATE_CONTEXT.outsideTenantResult;
  }

  if (registrationRequest.status === REGISTRATION_REQUEST_STATUSES.PENDING) {
    return resultFor("pending_request");
  }

  if (registrationRequest.status === REGISTRATION_REQUEST_STATUSES.REJECTED) {
    return resultFor("rejected_request");
  }

  return ACCESS_STATE_CONTEXT.outsideTenantResult;
};
