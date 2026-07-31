/**
 * Canonical tenant-owned academic course.
 *
 * `interfaceLanguages` lists interface locales available in the course
 * context. It never selects a user's locale and is independent from
 * `learningLanguage`.
 *
 * @typedef {object} Course
 * @property {string} courseId Stable, opaque course identifier.
 * @property {string} tenantId Owning tenant identifier.
 * @property {string} displayName
 * @property {string} description
 * @property {import("./learningLanguage.js").LearningLanguage} learningLanguage
 * @property {string} supportLanguageCode Canonical BCP 47 pedagogical support language tag.
 * @property {ReadonlyArray<import("./interfaceLanguage.js").InterfaceLanguage>} interfaceLanguages
 * @property {import("./enums.js").CEFRLevel} cefrLevel
 * @property {import("./enums.js").CourseStatus} status
 * @property {string} createdAt UTC ISO 8601 timestamp.
 * @property {string} updatedAt UTC ISO 8601 timestamp.
 */

export {};
