/** @template {readonly string[]} T @param {T} values @returns {Readonly<T>} */
const frozen = (values) => Object.freeze(values);

export const COMMAND_SCHEMA_VERSION = 2;
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
export const PRIVILEGED_COMMAND_STAGES = Object.freeze({
  NOT_STARTED: "not_started",
  PREPARED: "prepared",
  COMPLETED: "completed",
});
export const PLATFORM_COMMAND_TYPES = frozen([
  COMMAND_TYPES.BOOTSTRAP_PLATFORM_ADMINS,
  COMMAND_TYPES.RECOVER_PLATFORM_ADMIN,
  COMMAND_TYPES.REVOKE_PLATFORM_ADMIN,
]);
export const COMMAND_RECORD_FIELDS = frozen(["commandId", "commandType", "payloadHash", "actorUid", "actorType", "authority", "tenantId", "status", "stage", "startedAt", "completedAt", "failedAt", "result", "errorCode", "attemptCount", "correlationId", "expiresAt", "leaseExpiresAt", "schemaVersion"]);
export const COMMAND_RECORD_REQUIRED_FIELDS = COMMAND_RECORD_FIELDS;

const allowedStatusStages = Object.freeze({
  [COMMAND_STATUSES.PENDING]: frozen([PRIVILEGED_COMMAND_STAGES.NOT_STARTED]),
  [COMMAND_STATUSES.RUNNING]: frozen([PRIVILEGED_COMMAND_STAGES.NOT_STARTED, PRIVILEGED_COMMAND_STAGES.PREPARED]),
  [COMMAND_STATUSES.SUCCEEDED]: frozen([PRIVILEGED_COMMAND_STAGES.COMPLETED]),
  [COMMAND_STATUSES.FAILED_RETRYABLE]: frozen([PRIVILEGED_COMMAND_STAGES.NOT_STARTED]),
  [COMMAND_STATUSES.FAILED_TERMINAL]: frozen([PRIVILEGED_COMMAND_STAGES.NOT_STARTED]),
  [COMMAND_STATUSES.RECOVERY_REQUIRED]: frozen([PRIVILEGED_COMMAND_STAGES.PREPARED]),
});

/** @param {unknown} commandType @param {unknown} stage @returns {boolean} */
export const isPrivilegedCommandStageAllowed = (commandType, stage) =>
  PLATFORM_COMMAND_TYPES.includes(/** @type {never} */ (commandType))
  && Object.values(PRIVILEGED_COMMAND_STAGES).includes(/** @type {never} */ (stage));

/** @param {unknown} status @param {unknown} stage @returns {boolean} */
export const isCommandStatusStageAllowed = (status, stage) =>
  typeof status === "string" && typeof stage === "string"
  && Object.prototype.hasOwnProperty.call(allowedStatusStages, status)
  && allowedStatusStages[/** @type {keyof typeof allowedStatusStages} */ (status)].includes(/** @type {never} */ (stage));
