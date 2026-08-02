export const ISO_CREATED = "2026-01-01T00:00:00.000Z";
export const ISO_UPDATED = "2026-02-01T00:00:00.000Z";

export const validIdentityData = (overrides = {}) => ({
  uid: "identity-1",
  email: "identity@example.test",
  displayName: "Identity One",
  photoURL: null,
  emailVerified: true,
  interfaceLocale: "en-US",
  createdAt: { toDate: () => new Date(ISO_CREATED) },
  updatedAt: { toDate: () => new Date(ISO_UPDATED) },
  ...overrides
});

export const identitySnapshot = (
  data = validIdentityData(),
  { id = "identity-1", exists = true } = {}
) => ({
  id,
  exists: () => exists,
  data: () => data,
  ref: { path: "sdk/reference/must/not/escape" }
});

export const createRepositoryDouble = ({ snapshot = identitySnapshot() } = {}) => {
  const calls = {
    doc: [],
    getDoc: [],
    updateDoc: [],
    serverTimestamp: 0
  };
  const timestampSentinel = Object.freeze({ type: "server-timestamp" });

  const sdk = {
    doc: (db, path) => {
      calls.doc.push([db, path]);
      return { path };
    },
    getDoc: async (reference) => {
      calls.getDoc.push(reference);
      return snapshot;
    },
    updateDoc: async (reference, patch) => {
      calls.updateDoc.push([reference, patch]);
    },
    serverTimestamp: () => {
      calls.serverTimestamp += 1;
      return timestampSentinel;
    }
  };

  return {
    calls,
    db: Object.freeze({ kind: "fake-firestore" }),
    sdk,
    timestampSentinel
  };
};
