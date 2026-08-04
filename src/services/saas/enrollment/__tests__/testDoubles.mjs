export const iso = "2026-08-03T12:00:00.000Z";
export const timestamp = (value = iso) => ({ toDate: () => new Date(value) });
export const enrollmentData = (overrides = {}) => ({
  enrollmentId: "enrollment-1", tenantId: "tenant-1", membershipId: "membership-1",
  courseId: "course-1", status: "active", enrolledAt: timestamp(), updatedAt: timestamp(),
  completedAt: null, cancelledAt: null, ...overrides
});
export const snapshot = (data = enrollmentData(), path = "tenants/tenant-1/enrollments/enrollment-1") => ({
  id: path.split("/").at(-1), ref: { path }, exists: () => true, data: () => data
});
export const createSdk = ({ getDocResult, getDocsResult } = {}) => {
  const calls = [];
  const sdk = {
    doc: (db, path) => (calls.push(["doc", db, path]), { path }),
    getDoc: async (ref) => (calls.push(["getDoc", ref]), getDocResult ?? snapshot()),
    collection: (db, path) => (calls.push(["collection", db, path]), { path }),
    query: (source, ...constraints) => (calls.push(["query", source, ...constraints]), { source, constraints }),
    where: (...args) => (calls.push(["where", ...args]), { kind: "where", args }),
    orderBy: (...args) => (calls.push(["orderBy", ...args]), { kind: "orderBy", args }),
    documentId: () => (calls.push(["documentId"]), "__name__"),
    limit: (value) => (calls.push(["limit", value]), { kind: "limit", value }),
    startAfter: (...args) => (calls.push(["startAfter", ...args]), { kind: "startAfter", args }),
    getDocs: async (value) => (calls.push(["getDocs", value]), getDocsResult ?? { docs: [] })
  };
  return { sdk, calls };
};
