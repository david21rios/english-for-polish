import { TENANT_STATUSES } from "../organization/enums.js";
import { CAPABILITY_IDS } from "../authorization/capabilities.js";
import { WORKFLOW_ACTORS } from "./actors.js";

export const TENANT_WORKFLOW = Object.freeze({
  initialState: TENANT_STATUSES.ACTIVE,
  creationActors: Object.freeze([WORKFLOW_ACTORS.PLATFORM_ADMIN]),
  terminalStates: Object.freeze([TENANT_STATUSES.ARCHIVED]),
  transitions: Object.freeze([
    Object.freeze({ from: TENANT_STATUSES.ACTIVE, to: TENANT_STATUSES.SUSPENDED, actors: Object.freeze([WORKFLOW_ACTORS.PLATFORM_ADMIN]), observation: "Suppress effective institutional access without mutating child states." }),
    Object.freeze({ from: TENANT_STATUSES.SUSPENDED, to: TENANT_STATUSES.ACTIVE, actors: Object.freeze([WORKFLOW_ACTORS.PLATFORM_ADMIN]), observation: "Restore effective access subject to each child state." }),
    Object.freeze({ from: TENANT_STATUSES.ACTIVE, to: TENANT_STATUSES.ARCHIVED, actors: Object.freeze([WORKFLOW_ACTORS.PLATFORM_ADMIN]), requiredCapability: CAPABILITY_IDS.PLATFORM_TENANT_ARCHIVE, observation: "Retire the tenant while retaining institutional history." }),
    Object.freeze({ from: TENANT_STATUSES.SUSPENDED, to: TENANT_STATUSES.ARCHIVED, actors: Object.freeze([WORKFLOW_ACTORS.PLATFORM_ADMIN]), requiredCapability: CAPABILITY_IDS.PLATFORM_TENANT_ARCHIVE, observation: "Retire a suspended tenant." }),
  ]),
});
