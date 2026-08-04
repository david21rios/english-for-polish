import {
  REPOSITORY_ERROR_CODES, RepositoryError, createFirestoreRepositoryDependencies,
  enrollmentPath, mapFirebaseError, requireFirestoreSdkFunction,
  validateEnrollmentId, validateMembershipId, validateTenantId
} from "../shared/index.js";
import {
  ENROLLMENT_QUERY_KINDS, createEnrollmentBinding, decodeEnrollmentCursor,
  encodeEnrollmentCursor, enrollmentPathContext
} from "./enrollmentCursor.js";
import { enrollmentsCollectionPath, validateEnrollmentOptions } from "./enrollmentQueries.js";
import { serializeEnrollment } from "./enrollmentSerializer.js";
import { ENROLLMENT_STATUS_VALUES } from "./enrollmentValidation.js";

const rethrow = (error, operation, resource) => {
  if (error instanceof RepositoryError) throw error;
  throw mapFirebaseError(error, { operation, resource });
};
const mismatch = () => new RepositoryError({
  code: REPOSITORY_ERROR_CODES.CONTRACT_VIOLATION,
  message: "Enrollment path does not match its query context.",
  operation: "serialize_enrollment",
  resource: "enrollment"
});

export const createEnrollmentRepository = (dependencies) => {
  const { db, sdk } = createFirestoreRepositoryDependencies(dependencies);
  const names = ["doc", "getDoc", "collection", "query", "where", "orderBy", "documentId", "limit", "startAfter", "getDocs"];
  if (Object.keys(sdk).length !== names.length || Object.keys(sdk).some((name) => !names.includes(name))) {
    throw new RepositoryError({
      code: REPOSITORY_ERROR_CODES.INVALID_ARGUMENT,
      message: "Enrollment repository SDK dependencies must match the closed read-only contract.",
      operation: "create_dependencies",
      resource: "firestore"
    });
  }
  const required = Object.fromEntries(names.map((name) => [name, requireFirestoreSdkFunction({ sdk }, name)]));

  const getEnrollment = async (tenantId, enrollmentId) => {
    const expectedTenantId = validateTenantId(tenantId);
    const expectedEnrollmentId = validateEnrollmentId(enrollmentId);
    try {
      const reference = required.doc(db, enrollmentPath(expectedTenantId, expectedEnrollmentId));
      return serializeEnrollment(await required.getDoc(reference), { expectedTenantId, expectedEnrollmentId });
    } catch (error) { return rethrow(error, "get_enrollment", "enrollment"); }
  };

  const executeList = async ({ queryKind, tenantId, membershipId, options }) => {
    const expectedTenantId = validateTenantId(tenantId);
    const self = queryKind === ENROLLMENT_QUERY_KINDS.SELF;
    const expectedMembershipId = self ? validateMembershipId(membershipId) : undefined;
    const parsed = validateEnrollmentOptions(options);
    const binding = createEnrollmentBinding({ queryKind, tenantId: expectedTenantId, membershipId: expectedMembershipId, status: parsed.status });
    const operation = self ? "list_own_enrollments_for_membership" : "list_tenant_enrollments_for_admin";
    try {
      const source = required.collection(db, enrollmentsCollectionPath(expectedTenantId));
      const constraints = [required.where("tenantId", "==", expectedTenantId)];
      if (self) constraints.push(required.where("membershipId", "==", expectedMembershipId));
      constraints.push(required.where("status", parsed.status === null ? "in" : "==",
        parsed.status === null ? [...ENROLLMENT_STATUS_VALUES] : parsed.status));
      constraints.push(required.orderBy(self ? "enrolledAt" : "updatedAt", "desc"));
      constraints.push(required.orderBy(required.documentId(), "desc"));
      if (parsed.cursor !== null) {
        const position = decodeEnrollmentCursor(parsed.cursor, { queryKind, binding });
        const enrollmentId = enrollmentPathContext(position.documentPath).enrollmentId;
        constraints.push(required.startAfter(new Date(self ? position.enrolledAt : position.updatedAt), enrollmentId));
      }
      constraints.push(required.limit(parsed.pageSize + 1));
      const snapshots = [...(await required.getDocs(required.query(source, ...constraints))).docs];
      const hasMore = snapshots.length > parsed.pageSize;
      const pageSnapshots = snapshots.slice(0, parsed.pageSize);
      const items = pageSnapshots.map((snapshot) => {
        let context;
        try { context = enrollmentPathContext(snapshot?.ref?.path); } catch { throw mismatch(); }
        if (context.tenantId !== expectedTenantId || context.enrollmentId !== snapshot?.id) throw mismatch();
        return serializeEnrollment(snapshot, {
          expectedTenantId,
          expectedEnrollmentId: context.enrollmentId,
          ...(self ? { expectedMembershipId } : {})
        });
      });
      const lastItem = items.at(-1);
      const lastSnapshot = pageSnapshots.at(-1);
      const nextCursor = hasMore && lastItem ? encodeEnrollmentCursor({
        queryKind,
        binding,
        position: self
          ? { enrolledAt: lastItem.enrolledAt, documentPath: lastSnapshot.ref.path }
          : { updatedAt: lastItem.updatedAt, documentPath: lastSnapshot.ref.path }
      }) : null;
      return Object.freeze({ items: Object.freeze(items), nextCursor, hasMore });
    } catch (error) { return rethrow(error, operation, "enrollment_collection"); }
  };

  return Object.freeze({
    getEnrollment,
    listOwnEnrollmentsForMembership: (tenantId, membershipId, options) =>
      executeList({ queryKind: ENROLLMENT_QUERY_KINDS.SELF, tenantId, membershipId, options }),
    listTenantEnrollmentsForAdmin: (tenantId, options) =>
      executeList({ queryKind: ENROLLMENT_QUERY_KINDS.ADMIN, tenantId, options })
  });
};
