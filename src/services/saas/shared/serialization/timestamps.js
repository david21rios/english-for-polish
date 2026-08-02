import {
  REPOSITORY_ERROR_CODES,
  RepositoryError
} from "../errors/repositoryError.js";

const timestampError = (fieldName) => new RepositoryError({
  code: REPOSITORY_ERROR_CODES.CONTRACT_VIOLATION,
  message: `${fieldName} must be a valid Firestore-like timestamp or Date.`,
  operation: "serialize_timestamp",
  resource: fieldName
});

export const timestampToIsoString = (
  value,
  { allowNull = false, fieldName = "timestamp" } = {}
) => {
  if (value === null) {
    if (allowNull) {
      return null;
    }

    throw timestampError(fieldName);
  }

  let date;

  if (value instanceof Date) {
    date = value;
  } else if (value && typeof value === "object" && typeof value.toDate === "function") {
    try {
      date = value.toDate();
    } catch {
      throw timestampError(fieldName);
    }
  } else {
    throw timestampError(fieldName);
  }

  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    throw timestampError(fieldName);
  }

  return date.toISOString();
};
