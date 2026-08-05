import {
  REPOSITORY_ERROR_CODES,
  RepositoryError,
  validateUid
} from "../shared/index.js";
export { IDENTITY_FIELDS, IDENTITY_PROFILE_UPDATE_FIELDS, IDENTITY_REQUIRED_FIELDS } from "@mipymetic/saas-contracts/persistence";
import { IDENTITY_PROFILE_UPDATE_FIELDS } from "@mipymetic/saas-contracts/persistence";

const invalidArgument = (message, operation, details) => new RepositoryError({
  code: REPOSITORY_ERROR_CODES.INVALID_ARGUMENT,
  message,
  operation,
  resource: "identity",
  details
});

const isPlainObject = (value) => (
  value !== null &&
  typeof value === "object" &&
  !Array.isArray(value) &&
  Object.getPrototypeOf(value) === Object.prototype
);

export const validateIdentityShape = (identity) => {
  validateUid(identity.uid);

  if (typeof identity.email !== "string") {
    throw invalidArgument("Identity email must be a string.", "serialize_identity");
  }

  if (typeof identity.displayName !== "string") {
    throw invalidArgument("Identity displayName must be a string.", "serialize_identity");
  }

  if (identity.photoURL !== null && typeof identity.photoURL !== "string") {
    throw invalidArgument("Identity photoURL must be a string or null.", "serialize_identity");
  }

  if (typeof identity.emailVerified !== "boolean") {
    throw invalidArgument("Identity emailVerified must be a boolean.", "serialize_identity");
  }

  validateInterfaceLocale(identity.interfaceLocale, "serialize_identity");

  return identity;
};

export const validateIdentityProfilePatch = (patch) => {
  if (!isPlainObject(patch)) {
    throw invalidArgument("Identity profile patch must be a plain object.", "update_identity_profile");
  }

  const fields = Object.keys(patch);

  if (fields.length === 0) {
    throw invalidArgument("Identity profile patch must contain an editable field.", "update_identity_profile");
  }

  const unknownFields = fields.filter(
    (field) => !IDENTITY_PROFILE_UPDATE_FIELDS.includes(field)
  );

  if (unknownFields.length > 0) {
    throw invalidArgument(
      "Identity profile patch contains fields that are not editable.",
      "update_identity_profile",
      { fields: unknownFields.sort() }
    );
  }

  if (Object.prototype.hasOwnProperty.call(patch, "displayName") &&
      typeof patch.displayName !== "string") {
    throw invalidArgument("Identity displayName must be a string.", "update_identity_profile");
  }

  if (Object.prototype.hasOwnProperty.call(patch, "photoURL") &&
      patch.photoURL !== null &&
      typeof patch.photoURL !== "string") {
    throw invalidArgument("Identity photoURL must be a string or null.", "update_identity_profile");
  }

  return Object.fromEntries(
    IDENTITY_PROFILE_UPDATE_FIELDS
      .filter((field) => Object.prototype.hasOwnProperty.call(patch, field))
      .map((field) => [field, patch[field]])
  );
};

export const validateInterfaceLocale = (
  interfaceLocale,
  operation = "update_interface_locale"
) => {
  if (typeof interfaceLocale !== "string" || !interfaceLocale.trim()) {
    throw invalidArgument("Identity interfaceLocale must be a non-empty string.", operation);
  }

  return interfaceLocale;
};
