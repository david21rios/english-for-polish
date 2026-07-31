import { REGISTRATION_REQUEST_STATUSES } from "../identity/enums.js";
import { MEMBERSHIP_STATUSES, TENANT_STATUSES } from "../organization/enums.js";
import { WORKFLOW_ACTORS } from "./actors.js";

/**
 * Declarative cross-aggregate consistency boundary for institutional approval.
 *
 * This descriptor is not an executable command, transaction, service or state
 * machine. Technology and persistence semantics remain deferred.
 */
export const APPROVE_REGISTRATION_REQUEST = Object.freeze({
  name: "ApproveRegistrationRequest",
  idempotencyKey: "requestId",
  actor: WORKFLOW_ACTORS.TENANT_ADMIN,
  affectedAggregates: Object.freeze([
    "RegistrationRequest",
    "Membership",
  ]),
  validatedAggregates: Object.freeze(["Identity", "Tenant"]),
  preconditions: Object.freeze([
    "RegistrationRequest exists.",
    `RegistrationRequest.status is ${REGISTRATION_REQUEST_STATUSES.PENDING}.`,
    "Identity exists.",
    "Tenant exists.",
    `Tenant.status is not ${TENANT_STATUSES.ARCHIVED}.`,
    "The actor has conceptual authority to review the request.",
    "No non-terminal Membership exists for the same tenantId and uid.",
    "No incompatible prior approval exists.",
  ]),
  effects: Object.freeze([
    `RegistrationRequest.status becomes ${REGISTRATION_REQUEST_STATUSES.APPROVED}.`,
    `Exactly one Membership exists with status ${MEMBERSHIP_STATUSES.APPROVED}.`,
  ]),
  consistencyRequirement:
    "Both effects complete together through a future atomic or equivalently verifiable consistency strategy.",
  replayResult:
    "Replaying the same requestId returns the existing result without changing membershipId or duplicating effects.",
});
