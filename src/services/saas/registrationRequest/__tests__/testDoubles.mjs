export const iso = "2026-08-02T12:00:00.000Z";
export const timestamp = (value = iso) => ({ toDate: () => new Date(value) });

export const requestData = (overrides = {}) => ({
  requestId: "request-1",
  tenantId: "tenant-1",
  uid: "uid-1",
  requestedRole: "student",
  status: "pending",
  requestedAt: timestamp(),
  reviewedAt: null,
  reviewedBy: null,
  approvedMembershipId: null,
  cancelledAt: null,
  expiredAt: null,
  ...overrides
});

export const snapshot = (data = requestData(), path = "tenants/tenant-1/registrationRequests/request-1") => ({
  id: path.split("/").at(-1),
  ref: { path },
  exists: () => true,
  data: () => data
});

export const createSdk = ({ getDocResult, getDocsResult } = {}) => {
  const calls = [];
  const sdk = {
    doc: (db, path) => (calls.push(["doc", db, path]), { kind: "doc", path }),
    getDoc: async (ref) => (calls.push(["getDoc", ref]), getDocResult ?? snapshot()),
    collection: (db, path) => (calls.push(["collection", db, path]), { kind: "collection", path }),
    collectionGroup: (db, name) => (calls.push(["collectionGroup", db, name]), { kind: "collectionGroup", name }),
    query: (source, ...constraints) => (calls.push(["query", source, ...constraints]), { source, constraints }),
    where: (...args) => (calls.push(["where", ...args]), { kind: "where", args }),
    orderBy: (...args) => (calls.push(["orderBy", ...args]), { kind: "orderBy", args }),
    documentId: () => (calls.push(["documentId"]), "__name__"),
    limit: (value) => (calls.push(["limit", value]), { kind: "limit", value }),
    startAfter: (...args) => (calls.push(["startAfter", ...args]), { kind: "startAfter", args }),
    getDocs: async (queryValue) => (calls.push(["getDocs", queryValue]), getDocsResult ?? { docs: [] })
  };
  return { sdk, calls };
};
