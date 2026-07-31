import { COURSE_STATUSES } from "../academic/enums.js";
import { CAPABILITY_IDS } from "../authorization/capabilities.js";
import { MEMBERSHIP_ROLES } from "../organization/enums.js";
import { WORKFLOW_ACTORS } from "./actors.js";

export const COURSE_WORKFLOW = Object.freeze({
  initialState: COURSE_STATUSES.DRAFT,
  creationActors: Object.freeze([
    MEMBERSHIP_ROLES.TEACHER,
    WORKFLOW_ACTORS.TENANT_ADMIN,
  ]),
  terminalStates: Object.freeze([COURSE_STATUSES.ARCHIVED]),
  transitions: Object.freeze([
    Object.freeze({ from: COURSE_STATUSES.DRAFT, to: COURSE_STATUSES.ACTIVE, actors: Object.freeze([WORKFLOW_ACTORS.TENANT_ADMIN]), requiredCapability: CAPABILITY_IDS.COURSE_ACTIVATE, observation: "Publish the course; no automatic enrollment is created." }),
    Object.freeze({ from: COURSE_STATUSES.DRAFT, to: COURSE_STATUSES.ARCHIVED, actors: Object.freeze([WORKFLOW_ACTORS.TENANT_ADMIN]), observation: "Retire an unpublished course." }),
    Object.freeze({ from: COURSE_STATUSES.ACTIVE, to: COURSE_STATUSES.ARCHIVED, actors: Object.freeze([WORKFLOW_ACTORS.TENANT_ADMIN]), observation: "Stop new ordinary use while retaining history." }),
  ]),
});
