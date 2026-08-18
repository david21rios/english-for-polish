import {
  MEMBERSHIP_ROLES,
  REGISTRATION_REQUEST_STATUSES,
} from "../domain/index.js";
import {
  hasExactKeys,
  isDocumentIdentifier,
  validatePersistedTimestamp,
} from "../validation/index.js";
import {
  REGISTRATION_REQUEST_FIELDS,
  REGISTRATION_REQUEST_KEY_FIELDS,
} from "./fields.js";

/** @param {string} field @param {string} reason */
const invalid = (field, reason) =>
  Object.freeze({
    ok: false,
    issue: Object.freeze({
      code: "INVALID_ARGUMENT",
      field,
      reason,
    }),
  });

/** @template T @param {T} value */
const ok = (value) =>
  Object.freeze({
    ok: true,
    value,
  });

/** @param {unknown} value */
const id = (value) =>
  isDocumentIdentifier(value);

/** @param {unknown} value */
const timestamp = (value) =>
  validatePersistedTimestamp(value).ok === true;

/** @param {unknown} value */
const nullish = (value) =>
  value === null || value === undefined;

/** @param {unknown} value */
const validRole = (value) =>
  Object.values(MEMBERSHIP_ROLES).includes(
    /** @type {never} */ (value),
  );

/** @param {unknown} value */
const validStatus = (value) =>
  Object.values(REGISTRATION_REQUEST_STATUSES).includes(
    /** @type {never} */ (value),
  );

/** @param {unknown} uid */
export const encodeRegistrationRequestUidKey = (uid) => {
  if (!id(uid)) {
    throw new TypeError(
      "uid is not a valid document identifier.",
    );
  }

  const bytes =
    new TextEncoder().encode(
      /** @type {string} */ (uid),
    );

  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return `u1_${btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/u, "")}`;
};

/** @param {unknown} value */
export const validateRegistrationRequestKey = (value) => {
  if (!hasExactKeys(value, REGISTRATION_REQUEST_KEY_FIELDS)) {
    return invalid(
      "registrationRequestKey",
      "invalid_registration_request_key",
    );
  }

  const v =
    /** @type {Record<string, unknown>} */ (value);

  if (
    !id(v.uid) ||
    !id(v.requestId) ||
    !validStatus(v.status)
  ) {
    return invalid(
      "registrationRequestKey",
      "invalid_registration_request_key",
    );
  }

  return ok(value);
};

/** @param {unknown} value */
export const validatePersistedRegistrationRequest = (value) => {
  if (!hasExactKeys(value, REGISTRATION_REQUEST_FIELDS)) {
    return invalid(
      "registrationRequest",
      "invalid_registration_request",
    );
  }

  const v =
    /** @type {Record<string, unknown>} */ (value);

  if (
    !id(v.requestId) ||
    !id(v.tenantId) ||
    !id(v.uid) ||
    !validRole(v.requestedRole) ||
    !validStatus(v.status) ||
    !timestamp(v.requestedAt)
  ) {
    return invalid(
      "registrationRequest",
      "invalid_registration_request",
    );
  }

  const pending =
    v.status === REGISTRATION_REQUEST_STATUSES.PENDING &&
    nullish(v.reviewedAt) &&
    nullish(v.reviewedBy) &&
    nullish(v.approvedMembershipId) &&
    nullish(v.cancelledAt) &&
    nullish(v.expiredAt);

  const approved =
    v.status === REGISTRATION_REQUEST_STATUSES.APPROVED &&
    timestamp(v.reviewedAt) &&
    id(v.reviewedBy) &&
    id(v.approvedMembershipId) &&
    nullish(v.cancelledAt) &&
    nullish(v.expiredAt);

  const rejected =
    v.status === REGISTRATION_REQUEST_STATUSES.REJECTED &&
    timestamp(v.reviewedAt) &&
    id(v.reviewedBy) &&
    nullish(v.approvedMembershipId) &&
    nullish(v.cancelledAt) &&
    nullish(v.expiredAt);

  const cancelled =
    v.status === REGISTRATION_REQUEST_STATUSES.CANCELLED &&
    timestamp(v.cancelledAt) &&
    nullish(v.reviewedAt) &&
    nullish(v.reviewedBy) &&
    nullish(v.approvedMembershipId) &&
    nullish(v.expiredAt);

  const expired =
    v.status === REGISTRATION_REQUEST_STATUSES.EXPIRED &&
    timestamp(v.expiredAt) &&
    nullish(v.reviewedAt) &&
    nullish(v.reviewedBy) &&
    nullish(v.approvedMembershipId) &&
    nullish(v.cancelledAt);

  return (
    pending ||
    approved ||
    rejected ||
    cancelled ||
    expired
  )
    ? ok(value)
    : invalid(
        "registrationRequest",
        "invalid_registration_request",
      );
};
