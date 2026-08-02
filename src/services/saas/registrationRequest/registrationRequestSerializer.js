import {
  REPOSITORY_ERROR_CODES,
  RepositoryError,
  serializeSnapshot,
  timestampToIsoString,
  validateRequestId,
  validateTenantId,
  validateUid
} from "../shared/index.js";
import {
  REGISTRATION_REQUEST_FIELDS,
  REGISTRATION_REQUEST_REQUIRED_FIELDS,
  validateRegistrationRequestShape
} from "./registrationRequestValidation.js";

const mismatch = (message) => new RepositoryError({
  code: REPOSITORY_ERROR_CODES.CONTRACT_VIOLATION,
  message,
  operation: "serialize_registration_request",
  resource: "registration_request"
});

const convertConditionalTimestamp = (data, field) => (
  Object.prototype.hasOwnProperty.call(data, field)
    ? { [field]: timestampToIsoString(data[field], {
      allowNull: true,
      fieldName: `registration_request.${field}`
    }) }
    : {}
);

export const serializeRegistrationRequest = (snapshot, context = {}) => {
  const serialized = serializeSnapshot(snapshot, {
    allowedFields: REGISTRATION_REQUEST_FIELDS,
    requiredFields: REGISTRATION_REQUEST_REQUIRED_FIELDS,
    resource: "registration_request"
  });
  const documentRequestId = validateRequestId(serialized.id);
  validateRequestId(serialized.data.requestId);
  validateTenantId(serialized.data.tenantId);
  validateUid(serialized.data.uid);

  if (serialized.data.requestId !== documentRequestId) {
    throw mismatch("RegistrationRequest requestId does not match its document ID.");
  }
  if (context.expectedTenantId !== undefined) {
    validateTenantId(context.expectedTenantId);
    if (serialized.data.tenantId !== context.expectedTenantId) {
      throw mismatch("RegistrationRequest tenantId does not match the expected Tenant.");
    }
  }
  if (context.expectedUid !== undefined) {
    validateUid(context.expectedUid);
    if (serialized.data.uid !== context.expectedUid) {
      throw mismatch("RegistrationRequest uid does not match the expected Identity.");
    }
  }

  const request = validateRegistrationRequestShape({
    ...serialized.data,
    requestedAt: timestampToIsoString(serialized.data.requestedAt, {
      fieldName: "registration_request.requestedAt"
    }),
    ...convertConditionalTimestamp(serialized.data, "reviewedAt"),
    ...convertConditionalTimestamp(serialized.data, "cancelledAt"),
    ...convertConditionalTimestamp(serialized.data, "expiredAt")
  });

  return Object.freeze(request);
};
