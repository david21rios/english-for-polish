import {
  REPOSITORY_ERROR_CODES, RepositoryError, coursePath, createFirestoreRepositoryDependencies,
  mapFirebaseError, requireFirestoreSdkFunction, validateCourseId, validateTenantId
} from "../shared/index.js";
import {
  COURSE_QUERY_KINDS, coursePathContext, createCourseBinding, decodeCourseCursor, encodeCourseCursor
} from "./courseCursor.js";
import { coursesCollectionPath, validateAdminOptions, validateCatalogOptions } from "./courseQueries.js";
import { serializeCourse } from "./courseSerializer.js";

const rethrow = (error, operation, resource) => {
  if (error instanceof RepositoryError) throw error;
  throw mapFirebaseError(error, { operation, resource });
};
const mismatch = () => new RepositoryError({
  code: REPOSITORY_ERROR_CODES.CONTRACT_VIOLATION,
  message: "Course path does not match its query context.",
  operation: "serialize_course",
  resource: "course"
});

export const createCourseRepository = (dependencies) => {
  const { db, sdk } = createFirestoreRepositoryDependencies(dependencies);
  const dependencyNames = [
    "doc", "getDoc", "collection", "query", "where", "orderBy", "documentId",
    "limit", "startAfter", "getDocs"
  ];
  if (Object.keys(sdk).length !== dependencyNames.length || Object.keys(sdk).some((name) => !dependencyNames.includes(name))) {
    throw new RepositoryError({
      code: REPOSITORY_ERROR_CODES.INVALID_ARGUMENT,
      message: "Course repository SDK dependencies must match the closed read-only contract.",
      operation: "create_dependencies",
      resource: "firestore"
    });
  }
  const required = Object.fromEntries(dependencyNames.map((name) => [name, requireFirestoreSdkFunction({ sdk }, name)]));

  const getCourse = async (tenantId, courseId) => {
    const expectedTenantId = validateTenantId(tenantId);
    const expectedCourseId = validateCourseId(courseId);
    try {
      const reference = required.doc(db, coursePath(expectedTenantId, expectedCourseId));
      return serializeCourse(await required.getDoc(reference), { expectedTenantId, expectedCourseId });
    } catch (error) { return rethrow(error, "get_course", "course"); }
  };

  const executeList = async ({ queryKind, tenantId, options }) => {
    const expectedTenantId = validateTenantId(tenantId);
    const admin = queryKind === COURSE_QUERY_KINDS.ADMIN;
    const parsed = admin ? validateAdminOptions(options) : validateCatalogOptions(options);
    const binding = createCourseBinding({ queryKind, tenantId: expectedTenantId, ...parsed });
    const operation = admin ? "list_tenant_admin_courses_for_tenant"
      : queryKind === COURSE_QUERY_KINDS.TEACHER ? "list_teacher_courses_for_tenant"
        : "list_active_courses_for_tenant";
    try {
      const source = required.collection(db, coursesCollectionPath(expectedTenantId));
      const constraints = [];
      if (admin) constraints.push(required.where("status", parsed.status === null ? "in" : "==",
        parsed.status === null ? ["draft", "active", "archived"] : parsed.status));
      else constraints.push(required.where("status", queryKind === COURSE_QUERY_KINDS.TEACHER ? "in" : "==",
        queryKind === COURSE_QUERY_KINDS.TEACHER ? ["draft", "active"] : "active"));
      if (!admin && parsed.learningLanguageCode !== null) constraints.push(required.where("learningLanguage.languageCode", "==", parsed.learningLanguageCode));
      if (!admin && parsed.supportLanguageCode !== null) constraints.push(required.where("supportLanguageCode", "==", parsed.supportLanguageCode));
      constraints.push(required.orderBy(admin ? "updatedAt" : "displayName", admin ? "desc" : "asc"));
      constraints.push(required.orderBy(required.documentId(), admin ? "desc" : "asc"));
      if (parsed.cursor !== null) {
        const position = decodeCourseCursor(parsed.cursor, { queryKind, binding });
        const courseId = coursePathContext(position.documentPath).courseId;
        constraints.push(required.startAfter(admin ? new Date(position.updatedAt) : position.displayName, courseId));
      }
      constraints.push(required.limit(parsed.pageSize + 1));
      const snapshots = [...(await required.getDocs(required.query(source, ...constraints))).docs];
      const hasMore = snapshots.length > parsed.pageSize;
      const pageSnapshots = snapshots.slice(0, parsed.pageSize);
      const items = pageSnapshots.map((snapshot) => {
        let path;
        try { path = coursePathContext(snapshot?.ref?.path); } catch { throw mismatch(); }
        if (path.tenantId !== expectedTenantId || path.courseId !== snapshot?.id) throw mismatch();
        return serializeCourse(snapshot, { expectedTenantId, expectedCourseId: path.courseId });
      });
      const lastItem = items.at(-1); const lastSnapshot = pageSnapshots.at(-1);
      const nextCursor = hasMore && lastItem ? encodeCourseCursor({
        queryKind, binding,
        position: admin
          ? { updatedAt: lastItem.updatedAt, documentPath: lastSnapshot.ref.path }
          : { displayName: lastItem.displayName, documentPath: lastSnapshot.ref.path }
      }) : null;
      return Object.freeze({ items: Object.freeze(items), nextCursor, hasMore });
    } catch (error) { return rethrow(error, operation, "course_collection"); }
  };

  return Object.freeze({
    getCourse,
    listActiveCoursesForTenant: (tenantId, options) => executeList({ queryKind: COURSE_QUERY_KINDS.ACTIVE, tenantId, options }),
    listTeacherCoursesForTenant: (tenantId, options) => executeList({ queryKind: COURSE_QUERY_KINDS.TEACHER, tenantId, options }),
    listTenantAdminCoursesForTenant: (tenantId, options) => executeList({ queryKind: COURSE_QUERY_KINDS.ADMIN, tenantId, options })
  });
};
