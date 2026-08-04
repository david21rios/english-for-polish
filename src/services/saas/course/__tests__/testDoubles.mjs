export const iso = "2026-08-02T12:00:00.000Z";
export const timestamp = (value = iso) => ({ toDate: () => new Date(value) });
export const courseData = (overrides = {}) => ({
  courseId: "course-1", tenantId: "tenant-1", displayName: "English A1",
  description: "Institutional English course.",
  learningLanguage: { languageCode: "en", displayName: "English" },
  supportLanguageCode: "pl",
  interfaceLanguages: [{ locale: "pl-PL", displayName: "Polski" }],
  cefrLevel: "A1", status: "active", createdAt: timestamp(), updatedAt: timestamp(),
  archivedAt: null, ...overrides
});
export const snapshot = (data = courseData(), path = "tenants/tenant-1/courses/course-1") => ({
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
