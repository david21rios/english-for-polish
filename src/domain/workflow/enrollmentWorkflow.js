import { ENROLLMENT_STATUSES } from "../academic/enums.js";
import { CAPABILITY_IDS } from "../authorization/capabilities.js";
import { WORKFLOW_ACTORS } from "./actors.js";

export const ENROLLMENT_WORKFLOW = Object.freeze({
  initialState: ENROLLMENT_STATUSES.PENDING,
  creationActors: Object.freeze([WORKFLOW_ACTORS.TENANT_ADMIN]),
  terminalStates: Object.freeze([
    ENROLLMENT_STATUSES.COMPLETED,
    ENROLLMENT_STATUSES.CANCELLED,
  ]),
  transitions: Object.freeze([
    Object.freeze({ from: ENROLLMENT_STATUSES.PENDING, to: ENROLLMENT_STATUSES.ACTIVE, actors: Object.freeze([WORKFLOW_ACTORS.TENANT_ADMIN]), requiredCapability: CAPABILITY_IDS.ENROLLMENT_UPDATE_STATUS, observation: "Activate the enrollment." }),
    Object.freeze({ from: ENROLLMENT_STATUSES.PENDING, to: ENROLLMENT_STATUSES.CANCELLED, actors: Object.freeze([WORKFLOW_ACTORS.TENANT_ADMIN, WORKFLOW_ACTORS.IDENTITY_SELF]), requiredCapabilities: Object.freeze({ [WORKFLOW_ACTORS.TENANT_ADMIN]: CAPABILITY_IDS.ENROLLMENT_UPDATE_STATUS, [WORKFLOW_ACTORS.IDENTITY_SELF]: CAPABILITY_IDS.ENROLLMENT_CANCEL_SELF }), observation: "Administrative or self cancellation." }),
    Object.freeze({ from: ENROLLMENT_STATUSES.ACTIVE, to: ENROLLMENT_STATUSES.COMPLETED, actors: Object.freeze([WORKFLOW_ACTORS.TENANT_ADMIN]), requiredCapability: CAPABILITY_IDS.ENROLLMENT_UPDATE_STATUS, observation: "Conclude participation without modeling progress or grades." }),
    Object.freeze({ from: ENROLLMENT_STATUSES.ACTIVE, to: ENROLLMENT_STATUSES.CANCELLED, actors: Object.freeze([WORKFLOW_ACTORS.TENANT_ADMIN, WORKFLOW_ACTORS.IDENTITY_SELF]), requiredCapabilities: Object.freeze({ [WORKFLOW_ACTORS.TENANT_ADMIN]: CAPABILITY_IDS.ENROLLMENT_UPDATE_STATUS, [WORKFLOW_ACTORS.IDENTITY_SELF]: CAPABILITY_IDS.ENROLLMENT_CANCEL_SELF }), observation: "Administrative or self cancellation." }),
  ]),
});
