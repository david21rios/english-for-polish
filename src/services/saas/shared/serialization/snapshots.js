import {
  REPOSITORY_ERROR_CODES,
  RepositoryError
} from "../errors/repositoryError.js";

const isPlainObject = (value) => (
  value !== null &&
  typeof value === "object" &&
  !Array.isArray(value) &&
  Object.getPrototypeOf(value) === Object.prototype
);

const contractError = (message, resource) => new RepositoryError({
  code: REPOSITORY_ERROR_CODES.CONTRACT_VIOLATION,
  message,
  operation: "serialize_snapshot",
  resource
});

const snapshotExists = (snapshot) => {
  if (typeof snapshot?.exists === "function") {
    return snapshot.exists();
  }

  return snapshot?.exists === true;
};

export const serializeSnapshot = (
  snapshot,
  { allowedFields, requiredFields = [], resource = "document" }
) => {
  if (!snapshotExists(snapshot)) {
    throw new RepositoryError({
      code: REPOSITORY_ERROR_CODES.NOT_FOUND,
      message: `${resource} was not found.`,
      operation: "serialize_snapshot",
      resource
    });
  }

  if (typeof snapshot.id !== "string" || !snapshot.id.trim()) {
    throw contractError(`${resource} snapshot has no valid document ID.`, resource);
  }

  if (typeof snapshot.data !== "function") {
    throw contractError(`${resource} snapshot does not expose data().`, resource);
  }

  if (!Array.isArray(allowedFields) || allowedFields.some((field) => typeof field !== "string")) {
    throw contractError("allowedFields must be an array of field names.", resource);
  }

  if (!Array.isArray(requiredFields) || requiredFields.some((field) => typeof field !== "string")) {
    throw contractError("requiredFields must be an array of field names.", resource);
  }

  const data = snapshot.data();

  if (!isPlainObject(data)) {
    throw contractError(`${resource} data must be a plain object.`, resource);
  }

  const allowedFieldSet = new Set(allowedFields);
  const unknownFields = Object.keys(data).filter((field) => !allowedFieldSet.has(field));

  if (unknownFields.length > 0) {
    throw new RepositoryError({
      code: REPOSITORY_ERROR_CODES.CONTRACT_VIOLATION,
      message: `${resource} contains unknown fields.`,
      operation: "serialize_snapshot",
      resource,
      details: { fields: unknownFields.sort() }
    });
  }

  const missingFields = requiredFields.filter(
    (field) => !Object.prototype.hasOwnProperty.call(data, field)
  );

  if (missingFields.length > 0) {
    throw new RepositoryError({
      code: REPOSITORY_ERROR_CODES.CONTRACT_VIOLATION,
      message: `${resource} is missing required fields.`,
      operation: "serialize_snapshot",
      resource,
      details: { fields: missingFields }
    });
  }

  return {
    id: snapshot.id,
    data: Object.fromEntries(
      allowedFields
        .filter((field) => Object.prototype.hasOwnProperty.call(data, field))
        .map((field) => [field, data[field]])
    )
  };
};
