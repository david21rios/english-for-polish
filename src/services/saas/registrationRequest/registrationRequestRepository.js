import {
  RepositoryError,
  createFirestoreRepositoryDependencies,
  mapFirebaseError,
  registrationRequestPath,
  requireFirestoreSdkFunction,
  validateRequestId,
  validateTenantId,
  validateUid
} from "../shared/index.js";
import {
  REGISTRATION_REQUEST_QUERY_KINDS,
  createRegistrationRequestBinding,
  decodeRegistrationRequestCursor,
  encodeRegistrationRequestCursor,
  registrationRequestPathContext
} from "./registrationRequestCursor.js";
import {
  registrationRequestsCollectionPath,
  validateRegistrationRequestListOptions
} from "./registrationRequestQueries.js";
import { serializeRegistrationRequest } from "./registrationRequestSerializer.js";

const rethrow = (error, operation, resource) => {
  if (error instanceof RepositoryError) throw error;
  throw mapFirebaseError(error, { operation, resource });
};

export const createRegistrationRequestRepository = (dependencies) => {
  const { db, sdk } = createFirestoreRepositoryDependencies(dependencies);
  const required = Object.fromEntries([
    "doc", "getDoc", "collection", "collectionGroup", "query", "where",
    "orderBy", "documentId", "limit", "startAfter", "getDocs"
  ].map((name) => [name, requireFirestoreSdkFunction({ sdk }, name)]));

  const getOwnRegistrationRequest = async (tenantId, requestId, uid) => {
    const expectedTenantId = validateTenantId(tenantId);
    const expectedRequestId = validateRequestId(requestId);
    const expectedUid = validateUid(uid);
    try {
      const reference = required.doc(db, registrationRequestPath(expectedTenantId, expectedRequestId));
      const snapshot = await required.getDoc(reference);
      return serializeRegistrationRequest(snapshot, { expectedTenantId, expectedUid });
    } catch (error) {
      return rethrow(error, "get_own_registration_request", "registration_request");
    }
  };

  const executeList = async ({ queryKind, tenantId, uid, options }) => {
    const expectedUid = validateUid(uid);
    const expectedTenantId = tenantId === null ? null : validateTenantId(tenantId);
    const parsed = validateRegistrationRequestListOptions(options);
    const binding = createRegistrationRequestBinding({
      queryKind, tenantId: expectedTenantId, uid: expectedUid, status: parsed.status
    });
    try {
      const source = queryKind === REGISTRATION_REQUEST_QUERY_KINDS.TENANT
        ? required.collection(db, registrationRequestsCollectionPath(expectedTenantId))
        : required.collectionGroup(db, "registrationRequests");
      const constraints = [required.where("uid", "==", expectedUid)];
      if (parsed.status !== null) constraints.push(required.where("status", "==", parsed.status));
      constraints.push(
        required.orderBy("requestedAt", "desc"),
        required.orderBy(required.documentId(), "desc")
      );
      if (parsed.cursor !== null) {
        const position = decodeRegistrationRequestCursor(parsed.cursor, { queryKind, binding });
        const documentCursor = queryKind === REGISTRATION_REQUEST_QUERY_KINDS.TENANT
          ? registrationRequestPathContext(position.documentPath).requestId
          : position.documentPath;
        constraints.push(required.startAfter(
          new Date(position.requestedAt),
          documentCursor
        ));
      }
      constraints.push(required.limit(parsed.pageSize + 1));
      const querySnapshot = await required.getDocs(required.query(source, ...constraints));
      const snapshots = [...querySnapshot.docs];
      const hasMore = snapshots.length > parsed.pageSize;
      const pageSnapshots = snapshots.slice(0, parsed.pageSize);
      const items = pageSnapshots.map((snapshot) => {
        const path = registrationRequestPathContext(snapshot?.ref?.path);
        if (path.requestId !== snapshot?.id) {
          throw new RepositoryError({
            code: "CONTRACT_VIOLATION",
            message: "RegistrationRequest path does not match its document ID.",
            operation: "serialize_registration_request",
            resource: "registration_request"
          });
        }
        return serializeRegistrationRequest(snapshot, {
          expectedTenantId: queryKind === REGISTRATION_REQUEST_QUERY_KINDS.TENANT
            ? expectedTenantId
            : path.tenantId,
          expectedUid
        });
      });
      let nextCursor = null;
      if (hasMore && pageSnapshots.length) {
        const lastSnapshot = pageSnapshots.at(-1);
        const lastItem = items.at(-1);
        nextCursor = encodeRegistrationRequestCursor({
          queryKind,
          binding,
          position: {
            requestedAt: lastItem.requestedAt,
            documentPath: lastSnapshot.ref.path
          }
        });
      }
      return Object.freeze({
        items: Object.freeze(items),
        nextCursor,
        hasMore
      });
    } catch (error) {
      return rethrow(
        error,
        queryKind === REGISTRATION_REQUEST_QUERY_KINDS.TENANT
          ? "list_own_registration_requests_for_tenant"
          : "list_own_registration_requests_across_tenants",
        "registration_request_collection"
      );
    }
  };

  return Object.freeze({
    getOwnRegistrationRequest,
    listOwnRegistrationRequestsForTenant: (tenantId, uid, options) => executeList({
      queryKind: REGISTRATION_REQUEST_QUERY_KINDS.TENANT,
      tenantId,
      uid,
      options
    }),
    listOwnRegistrationRequestsAcrossTenants: (uid, options) => executeList({
      queryKind: REGISTRATION_REQUEST_QUERY_KINDS.COLLECTION_GROUP,
      tenantId: null,
      uid,
      options
    })
  });
};
