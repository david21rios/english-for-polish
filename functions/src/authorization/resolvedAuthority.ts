import { validateAuthorityResolution } from "@mipymetic/saas-contracts/authority";
import { BACKEND_ERROR_CODES } from "@mipymetic/saas-contracts/errors";
import type { AuthorityResolution } from "../contracts/types.js";
import { BackendError } from "../errors/backendError.js";

export const requireValidAuthorityResolution = (value: unknown): AuthorityResolution => {
  const validation = validateAuthorityResolution(value);
  if (!validation.ok) {
    throw new BackendError(BACKEND_ERROR_CODES.CONTRACT_VIOLATION, "Authority resolution is invalid.");
  }
  return validation.value as AuthorityResolution;
};
