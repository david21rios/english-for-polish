export const COMMAND_SCHEMA_VERSION: 2;
export const COMMAND_STATUSES: Readonly<{
    PENDING: "pending";
    RUNNING: "running";
    SUCCEEDED: "succeeded";
    FAILED_RETRYABLE: "failed_retryable";
    FAILED_TERMINAL: "failed_terminal";
    RECOVERY_REQUIRED: "recovery_required";
}>;
export const COMMAND_TYPES: Readonly<{
    BOOTSTRAP_PLATFORM_ADMINS: "BootstrapPlatformAdmins";
    RECOVER_PLATFORM_ADMIN: "RecoverPlatformAdmin";
    REVOKE_PLATFORM_ADMIN: "RevokePlatformAdmin";
    BOOTSTRAP_TENANT: "BootstrapTenant";
    APPROVE_REGISTRATION_REQUEST: "ApproveRegistrationRequest";
    REJECT_REGISTRATION_REQUEST: "RejectRegistrationRequest";
    CHANGE_MEMBERSHIP_ROLE: "ChangeMembershipRole";
    SUSPEND_MEMBERSHIP: "SuspendMembership";
    RESTORE_MEMBERSHIP: "RestoreMembership";
    REMOVE_MEMBERSHIP: "RemoveMembership";
    CREATE_COURSE: "CreateCourse";
    UPDATE_COURSE: "UpdateCourse";
    ACTIVATE_COURSE: "ActivateCourse";
    ARCHIVE_COURSE: "ArchiveCourse";
    CREATE_ENROLLMENT: "CreateEnrollment";
    ACTIVATE_ENROLLMENT: "ActivateEnrollment";
    COMPLETE_ENROLLMENT: "CompleteEnrollment";
    CANCEL_ENROLLMENT: "CancelEnrollment";
}>;
export const PRIVILEGED_COMMAND_STAGES: Readonly<{
    NOT_STARTED: "not_started";
    PREPARED: "prepared";
    COMPLETED: "completed";
}>;
export const PLATFORM_COMMAND_TYPES: readonly ("BootstrapPlatformAdmins" | "RecoverPlatformAdmin" | "RevokePlatformAdmin")[];
export const COMMAND_RECORD_FIELDS: readonly string[];
export const COMMAND_RECORD_REQUIRED_FIELDS: readonly string[];
export function isPrivilegedCommandStageAllowed(commandType: unknown, stage: unknown): boolean;
export function isCommandStatusStageAllowed(status: unknown, stage: unknown): boolean;
