const frozen = (values) => Object.freeze(values);

export const COMMAND_SCHEMA_VERSION = 1;
export const COMMAND_STATUSES = Object.freeze({
  PENDING: "pending", RUNNING: "running", SUCCEEDED: "succeeded",
  FAILED_RETRYABLE: "failed_retryable", FAILED_TERMINAL: "failed_terminal",
  RECOVERY_REQUIRED: "recovery_required"
});
export const COMMAND_TYPES = Object.freeze({
  BOOTSTRAP_PLATFORM_ADMINS: "BootstrapPlatformAdmins",
  RECOVER_PLATFORM_ADMIN: "RecoverPlatformAdmin",
  REVOKE_PLATFORM_ADMIN: "RevokePlatformAdmin",
  BOOTSTRAP_TENANT: "BootstrapTenant",
  APPROVE_REGISTRATION_REQUEST: "ApproveRegistrationRequest",
  REJECT_REGISTRATION_REQUEST: "RejectRegistrationRequest",
  CHANGE_MEMBERSHIP_ROLE: "ChangeMembershipRole",
  SUSPEND_MEMBERSHIP: "SuspendMembership",
  RESTORE_MEMBERSHIP: "RestoreMembership",
  REMOVE_MEMBERSHIP: "RemoveMembership",
  CREATE_COURSE: "CreateCourse", UPDATE_COURSE: "UpdateCourse",
  ACTIVATE_COURSE: "ActivateCourse", ARCHIVE_COURSE: "ArchiveCourse",
  CREATE_ENROLLMENT: "CreateEnrollment", ACTIVATE_ENROLLMENT: "ActivateEnrollment",
  COMPLETE_ENROLLMENT: "CompleteEnrollment", CANCEL_ENROLLMENT: "CancelEnrollment"
});
export const COMMAND_RECORD_FIELDS = frozen(["commandId", "commandType", "payloadHash", "actorUid", "actorType", "authority", "tenantId", "status", "startedAt", "completedAt", "failedAt", "result", "errorCode", "attemptCount", "correlationId", "expiresAt", "leaseExpiresAt", "schemaVersion"]);
export const COMMAND_RECORD_REQUIRED_FIELDS = COMMAND_RECORD_FIELDS;
