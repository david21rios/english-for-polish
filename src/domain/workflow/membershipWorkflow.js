import { CAPABILITY_IDS } from "../authorization/capabilities.js";
import { MEMBERSHIP_STATUSES } from "../organization/enums.js";
import { WORKFLOW_ACTORS } from "./actors.js";

export const MEMBERSHIP_WORKFLOW = Object.freeze({
  initialState: MEMBERSHIP_STATUSES.APPROVED,
  creationActors: Object.freeze([WORKFLOW_ACTORS.TENANT_ADMIN]),
  terminalStates: Object.freeze([MEMBERSHIP_STATUSES.REMOVED]),
  transitions: Object.freeze([
    Object.freeze({ from: MEMBERSHIP_STATUSES.APPROVED, to: MEMBERSHIP_STATUSES.SUSPENDED, actors: Object.freeze([WORKFLOW_ACTORS.TENANT_ADMIN]), requiredCapability: CAPABILITY_IDS.MEMBERSHIP_SUSPEND, observation: "Access stops while membership data remains." }),
    Object.freeze({
      from: MEMBERSHIP_STATUSES.APPROVED,
      to: MEMBERSHIP_STATUSES.REMOVED,
      actors: Object.freeze([
        WORKFLOW_ACTORS.TENANT_ADMIN,
        WORKFLOW_ACTORS.IDENTITY_SELF,
      ]),
      requiredCapabilities: Object.freeze({
        [WORKFLOW_ACTORS.TENANT_ADMIN]: CAPABILITY_IDS.MEMBERSHIP_REMOVE,
        [WORKFLOW_ACTORS.IDENTITY_SELF]: CAPABILITY_IDS.MEMBERSHIP_LEAVE_SELF,
      }),
      observation: "Logical removal or voluntary exit.",
    }),
    Object.freeze({ from: MEMBERSHIP_STATUSES.SUSPENDED, to: MEMBERSHIP_STATUSES.APPROVED, actors: Object.freeze([WORKFLOW_ACTORS.TENANT_ADMIN]), requiredCapability: CAPABILITY_IDS.MEMBERSHIP_RESTORE, observation: "Reactivate institutional access." }),
    Object.freeze({
      from: MEMBERSHIP_STATUSES.SUSPENDED,
      to: MEMBERSHIP_STATUSES.REMOVED,
      actors: Object.freeze([
        WORKFLOW_ACTORS.TENANT_ADMIN,
        WORKFLOW_ACTORS.IDENTITY_SELF,
      ]),
      requiredCapabilities: Object.freeze({
        [WORKFLOW_ACTORS.TENANT_ADMIN]: CAPABILITY_IDS.MEMBERSHIP_REMOVE,
        [WORKFLOW_ACTORS.IDENTITY_SELF]: CAPABILITY_IDS.MEMBERSHIP_LEAVE_SELF,
      }),
      observation: "Logical removal or voluntary exit.",
    }),
  ]),
});
