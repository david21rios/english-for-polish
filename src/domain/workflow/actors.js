import { PLATFORM_ROLES } from "../authorization/enums.js";
import { MEMBERSHIP_ROLES } from "../organization/enums.js";

export const WORKFLOW_ACTORS = Object.freeze({
  IDENTITY_SELF: "identity_self",
  TENANT_ADMIN: MEMBERSHIP_ROLES.TENANT_ADMIN,
  PLATFORM_ADMIN: PLATFORM_ROLES.PLATFORM_ADMIN,
  PLATFORM_SYSTEM: "platform_system",
});
