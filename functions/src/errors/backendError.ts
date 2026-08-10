import { BACKEND_ERROR_CODES } from "@mipymetic/saas-contracts/errors";
import type { JsonValue } from "../contracts/types.js";

export type BackendErrorCode = (typeof BACKEND_ERROR_CODES)[keyof typeof BACKEND_ERROR_CODES];

const retryableCodes = new Set<BackendErrorCode>([
  BACKEND_ERROR_CODES.UNAVAILABLE,
  BACKEND_ERROR_CODES.UNKNOWN,
]);

export class BackendError extends Error {
  readonly code: BackendErrorCode;
  readonly retryable: boolean;
  readonly auditMetadata: Readonly<Record<string, JsonValue>>;

  constructor(code: BackendErrorCode, message: string, options: {
    cause?: unknown;
    retryable?: boolean;
    auditMetadata?: Readonly<Record<string, JsonValue>>;
  } = {}) {
    super(message, options.cause === undefined ? undefined : { cause: options.cause });
    this.name = "BackendError";
    this.code = code;
    this.retryable = options.retryable ?? retryableCodes.has(code);
    this.auditMetadata = Object.freeze({ ...(options.auditMetadata ?? {}) });
  }
}

export interface PublicBackendError {
  readonly code: BackendErrorCode;
  readonly message: string;
  readonly retryable: boolean;
}

export const sanitizeBackendError = (error: unknown): PublicBackendError => {
  if (error instanceof BackendError) {
    return Object.freeze({ code: error.code, message: error.message, retryable: error.retryable });
  }
  return Object.freeze({
    code: BACKEND_ERROR_CODES.INTERNAL,
    message: "The privileged operation failed.",
    retryable: false,
  });
};

export const mapFirebaseAdminError = (error: unknown): BackendError => {
  const code = typeof error === "object" && error !== null && "code" in error
    ? String(error.code)
    : "";
  if (code.includes("not-found")) return new BackendError(BACKEND_ERROR_CODES.NOT_FOUND, "The requested resource was not found.", { cause: error });
  if (code.includes("already-exists")) return new BackendError(BACKEND_ERROR_CODES.ALREADY_EXISTS, "The resource already exists.", { cause: error });
  if (code.includes("invalid-argument")) return new BackendError(BACKEND_ERROR_CODES.INVALID_ARGUMENT, "The request is invalid.", { cause: error });
  if (code.includes("permission-denied") || code.includes("unauthorized")) return new BackendError(BACKEND_ERROR_CODES.FORBIDDEN, "The operation is forbidden.", { cause: error });
  if (code.includes("unavailable") || code.includes("deadline-exceeded") || code.includes("aborted")) return new BackendError(BACKEND_ERROR_CODES.UNAVAILABLE, "The service is temporarily unavailable.", { cause: error, retryable: true });
  return new BackendError(BACKEND_ERROR_CODES.UNKNOWN, "The privileged operation failed.", { cause: error });
};
