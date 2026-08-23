export const UPDATE_COURSE_INPUT_FIELDS: readonly string[];
export const UPDATE_COURSE_PATCH_FIELDS: readonly string[];
export const UPDATE_COURSE_LEARNING_LANGUAGE_FIELDS: readonly string[];
export const UPDATE_COURSE_INTERFACE_LANGUAGE_FIELDS: readonly string[];
export const UPDATE_COURSE_RESULT_FIELDS: readonly string[];
export const UPDATE_COURSE_OPERATION: "UpdateCourse";
export const UPDATE_COURSE_RESOURCE_TYPE: "course";
export const UPDATE_COURSE_REQUIRED_CAPABILITY: "course.update";
export const UPDATE_COURSE_AUDIT_OPERATION: "UpdateCourse.update";
export const UPDATE_COURSE_AUDIT_LEVEL: "privileged";
export const UPDATE_COURSE_AUDIT_RESULT: "succeeded";
export const UPDATE_COURSE_AUDIT_BEFORE_FIELDS: readonly string[];
export const UPDATE_COURSE_AUDIT_AFTER_FIELDS: readonly string[];
export const UPDATE_COURSE_AUDIT_METADATA_FIELDS: readonly string[];
export function validateUpdateCourseInput(value: unknown): Readonly<{
    ok: false;
    issue: Readonly<{
        code: "INVALID_ARGUMENT";
        field: "updateCourse";
        reason: "invalid_update_course";
    }>;
}> | Readonly<{
    ok: boolean;
    value: unknown;
}>;
export function updateCourseBehavioralPayload(input: Record<string, unknown>): Readonly<{
    tenantId: unknown;
    courseId: unknown;
    expectedVersion: unknown;
    patch: Readonly<Record<string, unknown>>;
}>;
export function validateUpdateCourseResult(value: unknown): Readonly<{
    ok: false;
    issue: Readonly<{
        code: "INVALID_ARGUMENT";
        field: "updateCourse";
        reason: "invalid_update_course";
    }>;
}> | Readonly<{
    ok: boolean;
    value: unknown;
}>;
export const UPDATE_COURSE_ALLOWED_LIFECYCLE_STATUSES: readonly ("active" | "draft")[];
