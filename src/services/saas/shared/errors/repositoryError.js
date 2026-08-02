export const REPOSITORY_ERROR_CODES = Object.freeze({
  INVALID_ARGUMENT: "INVALID_ARGUMENT",
  UNAUTHENTICATED: "UNAUTHENTICATED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  FAILED_PRECONDITION: "FAILED_PRECONDITION",
  UNAVAILABLE: "UNAVAILABLE",
  CONTRACT_VIOLATION: "CONTRACT_VIOLATION",
  UNKNOWN: "UNKNOWN"
});

const FIREBASE_ERROR_CODE_MAP = Object.freeze({
  "permission-denied": REPOSITORY_ERROR_CODES.FORBIDDEN,
  unauthenticated: REPOSITORY_ERROR_CODES.UNAUTHENTICATED,
  "not-found": REPOSITORY_ERROR_CODES.NOT_FOUND,
  "already-exists": REPOSITORY_ERROR_CODES.CONFLICT,
  "failed-precondition": REPOSITORY_ERROR_CODES.FAILED_PRECONDITION,
  aborted: REPOSITORY_ERROR_CODES.CONFLICT,
  unavailable: REPOSITORY_ERROR_CODES.UNAVAILABLE,
  "deadline-exceeded": REPOSITORY_ERROR_CODES.UNAVAILABLE,
  "invalid-argument": REPOSITORY_ERROR_CODES.INVALID_ARGUMENT
});

const SENSITIVE_DETAIL_KEY_PATTERN =
  /(authorization|credential|email|password|payload|secret|token)/i;

const normalizeFirebaseCode = (code) => {
  if (typeof code !== "string") {
    return "";
  }

  return code.trim().toLowerCase().replace(/^firestore\//, "");
};

const sanitizeDetails = (details) => {
  if (details === undefined) {
    return undefined;
  }

  if (details === null || ["string", "number", "boolean"].includes(typeof details)) {
    return details;
  }

  if (Array.isArray(details)) {
    return details
      .map(sanitizeDetails)
      .filter((value) => value !== undefined);
  }

  if (Object.getPrototypeOf(details) !== Object.prototype) {
    return undefined;
  }

  return Object.fromEntries(
    Object.entries(details)
      .filter(([key]) => !SENSITIVE_DETAIL_KEY_PATTERN.test(key))
      .map(([key, value]) => [key, sanitizeDetails(value)])
      .filter(([, value]) => value !== undefined)
  );
};

const summarizeCause = (cause) => {
  if (cause === undefined || cause === null) {
    return undefined;
  }

  const code = normalizeFirebaseCode(cause.code);
  const name = typeof cause.name === "string" && cause.name.trim()
    ? cause.name.trim()
    : "Error";

  return Object.freeze({
    name,
    ...(code ? { code } : {})
  });
};

export class RepositoryError extends Error {
  constructor({
    code,
    message,
    operation = "unknown",
    resource = "unknown",
    cause,
    details
  }) {
    if (!Object.values(REPOSITORY_ERROR_CODES).includes(code)) {
      throw new TypeError("RepositoryError requires a supported code.");
    }

    if (typeof message !== "string" || !message.trim()) {
      throw new TypeError("RepositoryError requires a non-empty message.");
    }

    super(message);
    this.name = "RepositoryError";
    this.code = code;
    this.operation = operation;
    this.resource = resource;
    this.cause = summarizeCause(cause);
    this.details = sanitizeDetails(details);
  }
}

export const createRepositoryError = (options) => new RepositoryError(options);

export const mapFirebaseError = (
  error,
  { operation = "unknown", resource = "unknown", details } = {}
) => {
  const firebaseCode = normalizeFirebaseCode(error?.code);
  const code = FIREBASE_ERROR_CODE_MAP[firebaseCode] ?? REPOSITORY_ERROR_CODES.UNKNOWN;

  return new RepositoryError({
    code,
    message: code === REPOSITORY_ERROR_CODES.UNKNOWN
      ? "An unknown repository error occurred."
      : `Repository operation failed with ${code}.`,
    operation,
    resource,
    cause: error,
    details: {
      ...(details ?? {}),
      ...(firebaseCode ? { firebaseCode } : {})
    }
  });
};
