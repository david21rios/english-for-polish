import {
  REPOSITORY_ERROR_CODES, RepositoryError, serializeSnapshot, timestampToIsoString,
  validateCourseId, validateTenantId
} from "../shared/index.js";
import {
  COURSE_FIELDS, COURSE_REQUIRED_FIELDS, copyInterfaceLanguages, copyLearningLanguage,
  validateBcp47, validateCefrLevel, validateCourseLifecycle, validateNonBlankString
} from "./courseValidation.js";

const mismatch = (message) => new RepositoryError({
  code: REPOSITORY_ERROR_CODES.CONTRACT_VIOLATION,
  message,
  operation: "serialize_course",
  resource: "course"
});
const timestamp = (data, field, allowNull = false) => timestampToIsoString(data[field], {
  allowNull, fieldName: `course.${field}`
});

export const serializeCourse = (snapshot, context = {}) => {
  const serialized = serializeSnapshot(snapshot, {
    allowedFields: COURSE_FIELDS,
    requiredFields: COURSE_REQUIRED_FIELDS,
    resource: "course"
  });
  const path = snapshot?.ref?.path;
  const parts = typeof path === "string" ? path.split("/") : [];
  if (parts.length !== 4 || parts[0] !== "tenants" || parts[2] !== "courses" ||
      path.startsWith("/") || path.endsWith("/")) {
    throw mismatch("Course snapshot path is not canonical.");
  }
  validateTenantId(parts[1]);
  validateCourseId(parts[3]);
  const documentCourseId = validateCourseId(serialized.id);
  validateCourseId(serialized.data.courseId);
  validateTenantId(serialized.data.tenantId);
  if (documentCourseId !== serialized.data.courseId) throw mismatch("Course courseId does not match its document ID.");
  if (parts[3] !== documentCourseId || parts[1] !== serialized.data.tenantId) {
    throw mismatch("Course path does not match its physical identifiers.");
  }
  if (context.expectedCourseId !== undefined && validateCourseId(context.expectedCourseId) !== documentCourseId) {
    throw mismatch("Course document ID does not match the expected Course.");
  }
  if (context.expectedTenantId !== undefined && validateTenantId(context.expectedTenantId) !== serialized.data.tenantId) {
    throw mismatch("Course tenantId does not match the expected Tenant.");
  }
  const result = {
    ...serialized.data,
    displayName: validateNonBlankString(serialized.data.displayName, "course.displayName"),
    description: typeof serialized.data.description === "string"
      ? serialized.data.description
      : (() => { throw mismatch("Course description must be a string."); })(),
    learningLanguage: copyLearningLanguage(serialized.data.learningLanguage),
    supportLanguageCode: validateBcp47(serialized.data.supportLanguageCode, "course.supportLanguageCode"),
    interfaceLanguages: copyInterfaceLanguages(serialized.data.interfaceLanguages),
    cefrLevel: validateCefrLevel(serialized.data.cefrLevel),
    createdAt: timestamp(serialized.data, "createdAt"),
    updatedAt: timestamp(serialized.data, "updatedAt"),
    archivedAt: timestamp(serialized.data, "archivedAt", true)
  };
  return Object.freeze(validateCourseLifecycle(result));
};
