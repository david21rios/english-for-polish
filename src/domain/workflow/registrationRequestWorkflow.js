import { REGISTRATION_REQUEST_STATUSES } from "../identity/enums.js";
import { WORKFLOW_ACTORS } from "./actors.js";

export const REGISTRATION_REQUEST_WORKFLOW = Object.freeze({
  initialState: REGISTRATION_REQUEST_STATUSES.PENDING,
  creationActors: Object.freeze([WORKFLOW_ACTORS.IDENTITY_SELF]),
  terminalStates: Object.freeze([
    REGISTRATION_REQUEST_STATUSES.APPROVED,
    REGISTRATION_REQUEST_STATUSES.REJECTED,
    REGISTRATION_REQUEST_STATUSES.CANCELLED,
    REGISTRATION_REQUEST_STATUSES.EXPIRED,
  ]),
  transitions: Object.freeze([
    Object.freeze({
      from: REGISTRATION_REQUEST_STATUSES.PENDING,
      to: REGISTRATION_REQUEST_STATUSES.APPROVED,
      actors: Object.freeze([WORKFLOW_ACTORS.TENANT_ADMIN]),
      observation:
        "ApproveRegistrationRequest must jointly produce this state and exactly one approved Membership.",
    }),
    Object.freeze({
      from: REGISTRATION_REQUEST_STATUSES.PENDING,
      to: REGISTRATION_REQUEST_STATUSES.REJECTED,
      actors: Object.freeze([WORKFLOW_ACTORS.TENANT_ADMIN]),
      observation: "Institutional rejection never originates a Membership.",
    }),
    Object.freeze({
      from: REGISTRATION_REQUEST_STATUSES.PENDING,
      to: REGISTRATION_REQUEST_STATUSES.CANCELLED,
      actors: Object.freeze([WORKFLOW_ACTORS.IDENTITY_SELF]),
      observation: "The requesting identity withdraws the unresolved request.",
    }),
    Object.freeze({
      from: REGISTRATION_REQUEST_STATUSES.PENDING,
      to: REGISTRATION_REQUEST_STATUSES.EXPIRED,
      actors: Object.freeze([WORKFLOW_ACTORS.PLATFORM_SYSTEM]),
      observation: "A future expiry policy invalidates the unresolved request.",
    }),
  ]),
});
