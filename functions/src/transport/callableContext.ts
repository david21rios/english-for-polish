import type { CallableRequest } from "firebase-functions/v2/https";
import type { JsonValue } from "../contracts/types.js";
import type { VerifiedAuthenticationContext } from "../authorization/authenticatedActor.js";

export const authenticationContextFromCallable = (request: Pick<CallableRequest<unknown>, "auth" | "app">): VerifiedAuthenticationContext | null => {
  if (request.auth === undefined) return null;
  return Object.freeze({
    uid: request.auth.uid,
    token: request.auth.token as Readonly<Record<string, JsonValue>>,
    appCheckVerified: request.app !== undefined,
  });
};

export interface PrivilegedTransportBoundary {
  readonly requireAppCheck: boolean;
}

export const PRIVILEGED_TRANSPORT_BOUNDARY: PrivilegedTransportBoundary = Object.freeze({ requireAppCheck: false });
