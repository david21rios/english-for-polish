export const ISO_CREATED = "2026-01-01T00:00:00.000Z";
export const ISO_UPDATED = "2026-02-01T00:00:00.000Z";
export const ISO_SUSPENDED = "2026-01-15T00:00:00.000Z";
export const ISO_ARCHIVED = "2026-03-01T00:00:00.000Z";

const timestamp = (iso) => ({ toDate: () => new Date(iso) });

export const validTenantData = (overrides = {}) => ({
  tenantId: "tenant-1",
  tenantType: "university",
  displayName: "Tenant One",
  shortName: "T1",
  country: "PL",
  locale: "pl-PL",
  timezone: "Europe/Warsaw",
  status: "active",
  createdAt: timestamp(ISO_CREATED),
  updatedAt: timestamp(ISO_UPDATED),
  suspendedAt: null,
  archivedAt: null,
  ...overrides
});

export const tenantSnapshot = (
  data = validTenantData(),
  { id = "tenant-1", exists = true } = {}
) => ({
  id,
  exists: () => exists,
  data: () => data,
  ref: { path: "sdk/reference/must/not/escape" }
});

export const tenantAtStatus = (status) => {
  if (status === "suspended") {
    return validTenantData({ status, suspendedAt: timestamp(ISO_SUSPENDED) });
  }

  if (status === "archived") {
    return validTenantData({ status, archivedAt: timestamp(ISO_ARCHIVED) });
  }

  return validTenantData({ status });
};

export const createRepositoryDouble = ({ snapshot = tenantSnapshot(), extraSdk = {} } = {}) => {
  const calls = { doc: [], getDoc: [] };
  const sdk = {
    doc: (db, path) => {
      calls.doc.push([db, path]);
      return { path };
    },
    getDoc: async (reference) => {
      calls.getDoc.push(reference);
      return snapshot;
    },
    ...extraSdk
  };

  return {
    calls,
    db: Object.freeze({ kind: "fake-firestore" }),
    sdk
  };
};
