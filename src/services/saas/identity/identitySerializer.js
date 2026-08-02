import {
  REPOSITORY_ERROR_CODES,
  RepositoryError,
  serializeSnapshot,
  timestampToIsoString,
  validateUid
} from "../shared/index.js";
import {
  IDENTITY_FIELDS,
  IDENTITY_REQUIRED_FIELDS,
  validateIdentityShape
} from "./identityValidation.js";

export const serializeIdentitySnapshot = (snapshot) => {
  const serialized = serializeSnapshot(snapshot, {
    allowedFields: IDENTITY_FIELDS,
    requiredFields: IDENTITY_REQUIRED_FIELDS,
    resource: "identity"
  });

  const documentUid = validateUid(serialized.id);

  if (serialized.data.uid !== documentUid) {
    throw new RepositoryError({
      code: REPOSITORY_ERROR_CODES.CONTRACT_VIOLATION,
      message: "Identity uid does not match its document ID.",
      operation: "serialize_identity",
      resource: "identity"
    });
  }

  const identity = validateIdentityShape({
    ...serialized.data,
    createdAt: timestampToIsoString(serialized.data.createdAt, {
      fieldName: "identity.createdAt"
    }),
    updatedAt: timestampToIsoString(serialized.data.updatedAt, {
      fieldName: "identity.updatedAt"
    })
  });

  return Object.freeze(identity);
};
