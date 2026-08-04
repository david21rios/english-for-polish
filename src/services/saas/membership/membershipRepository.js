import {
  RepositoryError,
  createFirestoreRepositoryDependencies,
  mapFirebaseError,
  membershipPath,
  requireFirestoreSdkFunction,
  validateMembershipId,
  validateTenantId,
  validateUid
} from "../shared/index.js";
import {
  MEMBERSHIP_QUERY_KINDS,
  createMembershipBinding,
  decodeMembershipCursor,
  encodeMembershipCursor,
  membershipPathContext
} from "./membershipCursor.js";
import { membershipsCollectionPath, validateMembershipListOptions } from "./membershipQueries.js";
import { serializeMembership } from "./membershipSerializer.js";

const rethrow = (error, operation, resource) => {
  if (error instanceof RepositoryError) throw error;
  throw mapFirebaseError(error, { operation, resource });
};

export const createMembershipRepository = (dependencies) => {
  const { db, sdk } = createFirestoreRepositoryDependencies(dependencies);
  const required = Object.fromEntries([
    "doc", "getDoc", "collection", "collectionGroup", "query", "where", "orderBy",
    "documentId", "limit", "startAfter", "getDocs"
  ].map((name) => [name, requireFirestoreSdkFunction({ sdk }, name)]));

  const getOwnMembership = async (tenantId, membershipId, uid) => {
    const expectedTenantId = validateTenantId(tenantId);
    const expectedMembershipId = validateMembershipId(membershipId);
    const expectedUid = validateUid(uid);
    try {
      const reference = required.doc(db, membershipPath(expectedTenantId, expectedMembershipId));
      return serializeMembership(await required.getDoc(reference), { expectedTenantId, expectedUid });
    } catch (error) {
      return rethrow(error, "get_own_membership", "membership");
    }
  };

  const executeList = async ({ queryKind, tenantId, uid, options }) => {
    const expectedUid = validateUid(uid);
    const expectedTenantId = tenantId === null ? null : validateTenantId(tenantId);
    const parsed = validateMembershipListOptions(options);
    const binding = createMembershipBinding({
      queryKind, tenantId: expectedTenantId, uid: expectedUid, status: parsed.status, role: parsed.role
    });
    try {
      const source = queryKind === MEMBERSHIP_QUERY_KINDS.TENANT
        ? required.collection(db, membershipsCollectionPath(expectedTenantId))
        : required.collectionGroup(db, "memberships");
      const constraints = [required.where("uid", "==", expectedUid)];
      if (parsed.status !== null) constraints.push(required.where("status", "==", parsed.status));
      if (parsed.role !== null) constraints.push(required.where("role", "==", parsed.role));
      constraints.push(required.orderBy("createdAt", "desc"), required.orderBy(required.documentId(), "desc"));
      if (parsed.cursor !== null) {
        const position = decodeMembershipCursor(parsed.cursor, { queryKind, binding });
        const documentCursor = queryKind === MEMBERSHIP_QUERY_KINDS.TENANT
          ? membershipPathContext(position.documentPath).membershipId
          : position.documentPath;
        constraints.push(required.startAfter(new Date(position.createdAt), documentCursor));
      }
      constraints.push(required.limit(parsed.pageSize + 1));
      const snapshots = [...(await required.getDocs(required.query(source, ...constraints))).docs];
      const hasMore = snapshots.length > parsed.pageSize;
      const pageSnapshots = snapshots.slice(0, parsed.pageSize);
      const items = pageSnapshots.map((snapshot) => {
        const path = membershipPathContext(snapshot?.ref?.path);
        if (path.membershipId !== snapshot?.id ||
            (queryKind === MEMBERSHIP_QUERY_KINDS.TENANT && path.tenantId !== expectedTenantId)) {
          throw new RepositoryError({
            code: "CONTRACT_VIOLATION",
            message: "Membership path does not match its query context.",
            operation: "serialize_membership",
            resource: "membership"
          });
        }
        return serializeMembership(snapshot, {
          expectedTenantId: queryKind === MEMBERSHIP_QUERY_KINDS.TENANT ? expectedTenantId : path.tenantId,
          expectedUid
        });
      });
      const nextCursor = hasMore && pageSnapshots.length
        ? encodeMembershipCursor({
          queryKind,
          binding,
          position: { createdAt: items.at(-1).createdAt, documentPath: pageSnapshots.at(-1).ref.path }
        })
        : null;
      return Object.freeze({ items: Object.freeze(items), nextCursor, hasMore });
    } catch (error) {
      return rethrow(error,
        queryKind === MEMBERSHIP_QUERY_KINDS.TENANT
          ? "list_own_memberships_for_tenant"
          : "list_own_memberships_across_tenants",
        "membership_collection");
    }
  };

  return Object.freeze({
    getOwnMembership,
    listOwnMembershipsForTenant: (tenantId, uid, options) => executeList({
      queryKind: MEMBERSHIP_QUERY_KINDS.TENANT, tenantId, uid, options
    }),
    listOwnMembershipsAcrossTenants: (uid, options) => executeList({
      queryKind: MEMBERSHIP_QUERY_KINDS.COLLECTION_GROUP, tenantId: null, uid, options
    })
  });
};
