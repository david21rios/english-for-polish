export const ACTIVATE_COURSE_INPUT_FIELDS: readonly string[];
export const ACTIVATE_COURSE_RESULT_FIELDS: readonly string[];
export const ACTIVATE_COURSE_OPERATION: "ActivateCourse";
export const ACTIVATE_COURSE_RESOURCE_TYPE: "course";
export const ACTIVATE_COURSE_REQUIRED_CAPABILITY: "course.activate";
export const ACTIVATE_COURSE_AUDIT_OPERATION: "ActivateCourse.activate";
export const ACTIVATE_COURSE_AUDIT_LEVEL: "privileged";
export const ACTIVATE_COURSE_AUDIT_RESULT: "succeeded";
export const ACTIVATE_COURSE_AUDIT_BEFORE_FIELDS: readonly string[];
export const ACTIVATE_COURSE_AUDIT_AFTER_FIELDS: readonly string[];
export const ACTIVATE_COURSE_AUDIT_METADATA_FIELDS: readonly string[];
export const ACTIVATE_COURSE_TARGET_STATUS: "active";
export function validateActivateCourseInput(value: unknown): Readonly<{
    ok: false;
    issue: Readonly<{
        code: "INVALID_ARGUMENT";
        field: "activateCourse";
        reason: "invalid_activate_course";
    }>;
}> | Readonly<{
    ok: boolean;
    value: unknown;
}>;
export function activateCourseBehavioralPayload(input: Record<string, unknown>): Readonly<{
    tenantId: unknown;
    courseId: unknown;
    expectedVersion: unknown;
}>;
export function validateActivateCourseResult(value: unknown): Readonly<{
    ok: false;
    issue: Readonly<{
        code: "INVALID_ARGUMENT";
        field: "activateCourse";
        reason: "invalid_activate_course";
    }>;
}> | Readonly<{
    ok: boolean;
    value: unknown;
}>;
