export const ARCHIVE_COURSE_INPUT_FIELDS: readonly string[];
export const ARCHIVE_COURSE_RESULT_FIELDS: readonly string[];
export const ARCHIVE_COURSE_OPERATION: "ArchiveCourse";
export const ARCHIVE_COURSE_RESOURCE_TYPE: "course";
export const ARCHIVE_COURSE_REQUIRED_CAPABILITY: "course.archive";
export const ARCHIVE_COURSE_AUDIT_OPERATION: "ArchiveCourse.archive";
export const ARCHIVE_COURSE_AUDIT_LEVEL: "privileged";
export const ARCHIVE_COURSE_AUDIT_RESULT: "succeeded";
export const ARCHIVE_COURSE_AUDIT_BEFORE_FIELDS: readonly string[];
export const ARCHIVE_COURSE_AUDIT_AFTER_FIELDS: readonly string[];
export const ARCHIVE_COURSE_AUDIT_METADATA_FIELDS: readonly string[];
export const ARCHIVE_COURSE_TARGET_STATUS: "archived";
export function validateArchiveCourseInput(value: unknown): Readonly<{
    ok: false;
    issue: Readonly<{
        code: "INVALID_ARGUMENT";
        field: "archiveCourse";
        reason: "invalid_archive_course";
    }>;
}> | Readonly<{
    ok: boolean;
    value: unknown;
}>;
export function archiveCourseBehavioralPayload(input: Record<string, unknown>): Readonly<{
    tenantId: unknown;
    courseId: unknown;
    expectedVersion: unknown;
}>;
export function validateArchiveCourseResult(value: unknown): Readonly<{
    ok: false;
    issue: Readonly<{
        code: "INVALID_ARGUMENT";
        field: "archiveCourse";
        reason: "invalid_archive_course";
    }>;
}> | Readonly<{
    ok: boolean;
    value: unknown;
}>;
