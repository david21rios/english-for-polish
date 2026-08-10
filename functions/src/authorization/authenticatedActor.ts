import { BACKEND_ERROR_CODES } from "@mipymetic/saas-contracts/errors";
import { validateDocumentIdentifier } from "@mipymetic/saas-contracts/validation";
import type { AuthenticatedActor, JsonValue } from "../contracts/types.js";
import { BackendError } from "../errors/backendError.js";

export interface VerifiedAuthenticationContext {
  readonly uid?: string;
  readonly token?: Readonly<Record<string, JsonValue>>;
  readonly appCheckVerified?: boolean;
}

export const requireAuthenticatedActor = (context: VerifiedAuthenticationContext | null): AuthenticatedActor => {
  if (context?.uid === undefined) {
    throw new BackendError(BACKEND_ERROR_CODES.UNAUTHENTICATED, "Authentication is required.");
  }
  const validation = validateDocumentIdentifier(context.uid, "actorUid");
  if (!validation.ok) {
    throw new BackendError(BACKEND_ERROR_CODES.UNAUTHENTICATED, "The authenticated actor is invalid.");
  }
  return Object.freeze({
    uid: context.uid,
    tokenEmailVerified: context.token?.email_verified === true,
    appCheckVerified: context.appCheckVerified === true,
  });
};

export const rejectActorAuthorityPayload = (payload: Readonly<Record<string, JsonValue>>): void => {
  const forbidden = ["actorUid", "actorType", "authority", "platformRole", "role", "roles", "capability", "capabilities"];
  if (forbidden.some((key) => Object.hasOwn(payload, key))) {
    throw new BackendError(BACKEND_ERROR_CODES.INVALID_ARGUMENT, "Actor and authority fields must not be supplied in the payload.");
  }
};
