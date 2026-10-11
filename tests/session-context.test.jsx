import React from "react";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const authModule = vi.hoisted(() => ({
  onAuthStateChanged: vi.fn(),
  signOut: vi.fn()
}));

vi.mock("firebase/auth", () => authModule);
vi.mock("firebase/firestore", () => ({}));
vi.mock("../src/firebase", () => ({ auth: {}, db: {} }));

import { SessionProvider, SESSION_STORAGE_KEY } from "../src/context/SessionContext.jsx";
import { useSession } from "../src/hooks/useSession.js";

const user = { uid: "user-1", emailVerified: true };
const identity = { uid: "user-1", isActive: true };

const makeUser = (uid) => ({ uid, emailVerified: true });

const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
};

const membership = (tenantId, membershipId = `${tenantId}-membership`, uid = "user-1") => ({
  membershipId,
  tenantId,
  uid,
  role: "teacher",
  status: "approved"
});

const makeRepositories = ({ memberships = [], tenantStatus = "active" } = {}) => ({
  identity: { getIdentity: vi.fn(async () => identity) },
  membership: {
    listOwnMembershipsAcrossTenants: vi.fn(async () => ({ items: memberships })),
    getOwnMembership: vi.fn(async (tenantId) => memberships.find((item) => item.tenantId === tenantId))
  },
  tenant: { getTenant: vi.fn(async (tenantId) => ({ tenantId, status: tenantStatus })) }
});

const makeUserScopedRepositories = ({ pendingSwitch = null } = {}) => {
  const membershipsByUid = {
    "user-a": [membership("tenant-a", undefined, "user-a"), membership("tenant-a2", undefined, "user-a")],
    "user-b": [membership("tenant-b", undefined, "user-b")]
  };

  return {
    identity: {
      getIdentity: vi.fn(async (uid) => ({ uid, isActive: true }))
    },
    membership: {
      listOwnMembershipsAcrossTenants: vi.fn(async (uid) => ({
        items: membershipsByUid[uid] ?? []
      })),
      getOwnMembership: vi.fn(async (tenantId, membershipId, uid) => {
        if (pendingSwitch && uid === "user-a" && tenantId === "tenant-a2") {
          return pendingSwitch.promise;
        }
        return (membershipsByUid[uid] ?? []).find((item) => item.tenantId === tenantId);
      })
    },
    tenant: {
      getTenant: vi.fn(async (tenantId) => ({ tenantId, status: "active" }))
    }
  };
};

function Probe() {
  const session = useSession();
  return (
    <output data-testid="session">
      {JSON.stringify({
        uid: session.uid,
        activeTenantId: session.activeTenantId,
        status: session.status,
        loading: session.loading,
        error: session.error
      })}
    </output>
  );
}

const readProbe = () => JSON.parse(screen.getByTestId("session").textContent);

let authCallback;

beforeEach(() => {
  authModule.onAuthStateChanged.mockImplementation((_auth, callback) => {
    authCallback = callback;
    return vi.fn();
  });
  authModule.signOut.mockResolvedValue(undefined);
  sessionStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  sessionStorage.clear();
});

describe("SessionContext frozen contract", () => {
  it("keeps Auth-unresolved state until the observer resolves", () => {
    render(<SessionProvider dependencies={{ repositories: makeRepositories() }}><Probe /></SessionProvider>);
    expect(readProbe()).toMatchObject({ loading: true, status: null, activeTenantId: null });
  });

  it("derives anonymous without Membership or Tenant reads", async () => {
    const repositories = makeRepositories();
    render(<SessionProvider dependencies={{ repositories }}><Probe /></SessionProvider>);

    await act(async () => authCallback(null));
    expect(readProbe()).toMatchObject({ loading: false, status: "anonymous", uid: null });
    expect(repositories.identity.getIdentity).not.toHaveBeenCalled();
    expect(repositories.membership.listOwnMembershipsAcrossTenants).not.toHaveBeenCalled();
    expect(repositories.tenant.getTenant).not.toHaveBeenCalled();
  });

  it("denies tenant switching for an unverified authenticated user", async () => {
    const repositories = makeRepositories({ memberships: [membership("tenant-1")] });
    let switchTenant;
    function ActionProbe() {
      const session = useSession();
      switchTenant = session.setActiveTenantId;
      return <Probe />;
    }

    render(<SessionProvider dependencies={{ repositories }}><ActionProbe /></SessionProvider>);
    await act(async () => authCallback({ uid: "user-unverified", emailVerified: false }));
    await waitFor(() => expect(readProbe()).toMatchObject({
      uid: "user-unverified",
      activeTenantId: null,
      status: "authenticated_unverified",
      loading: false
    }));

    let result;
    await act(async () => { result = await switchTenant("tenant-1"); });
    expect(result).toEqual({ ok: false, code: "UNAUTHENTICATED" });
    expect(readProbe()).toMatchObject({
      activeTenantId: null,
      status: "authenticated_unverified",
      loading: false
    });
    expect(repositories.identity.getIdentity).not.toHaveBeenCalled();
    expect(repositories.membership.listOwnMembershipsAcrossTenants).not.toHaveBeenCalled();
    expect(repositories.tenant.getTenant).not.toHaveBeenCalled();
  });

  it("validates and restores a single approved tenant", async () => {
    const repositories = makeRepositories({ memberships: [membership("tenant-1")] });
    render(<SessionProvider dependencies={{ repositories }}><Probe /></SessionProvider>);

    await act(async () => authCallback(user));
    await waitFor(() => expect(readProbe()).toMatchObject({
      uid: "user-1",
      activeTenantId: "tenant-1",
      status: "active",
      loading: false
    }));
    expect(JSON.parse(sessionStorage.getItem(SESSION_STORAGE_KEY))).toEqual({
      uid: "user-1",
      activeTenantId: "tenant-1"
    });
  });

  it("requires selection for multiple approved tenants", async () => {
    const repositories = makeRepositories({
      memberships: [membership("tenant-1"), membership("tenant-2")]
    });
    render(<SessionProvider dependencies={{ repositories }}><Probe /></SessionProvider>);

    await act(async () => authCallback(user));
    await waitFor(() => expect(readProbe()).toMatchObject({
      status: "tenant_selection_required",
      activeTenantId: null,
      loading: false
    }));
  });

  it("preserves the current tenant when a switch target is invalid", async () => {
    const repositories = makeRepositories({ memberships: [membership("tenant-1")] });
    let switchTenant;
    function ActionProbe() {
      const session = useSession();
      switchTenant = session.setActiveTenantId;
      return <Probe />;
    }

    render(<SessionProvider dependencies={{ repositories }}><ActionProbe /></SessionProvider>);
    await act(async () => authCallback(user));
    await waitFor(() => expect(readProbe().activeTenantId).toBe("tenant-1"));

    let result;
    await act(async () => { result = await switchTenant("tenant-missing"); });
    expect(result.ok).toBe(false);
    expect(readProbe().activeTenantId).toBe("tenant-1");
    expect(JSON.parse(sessionStorage.getItem(SESSION_STORAGE_KEY)).activeTenantId).toBe("tenant-1");
  });

  it("ignores a stale rejected switch after the authenticated UID changes", async () => {
    const pendingSwitch = deferred();
    const repositories = makeUserScopedRepositories({ pendingSwitch });
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({
      uid: "user-a",
      activeTenantId: "tenant-a"
    }));
    let switchTenant;
    function ActionProbe() {
      const session = useSession();
      switchTenant = session.setActiveTenantId;
      return <Probe />;
    }

    render(<SessionProvider dependencies={{ repositories }}><ActionProbe /></SessionProvider>);
    await act(async () => authCallback(makeUser("user-a")));
    await waitFor(() => expect(readProbe()).toMatchObject({
      uid: "user-a",
      activeTenantId: "tenant-a",
      status: "active",
      loading: false
    }));

    const staleSwitch = switchTenant("tenant-a2");
    await act(async () => authCallback(makeUser("user-b")));
    await waitFor(() => expect(readProbe()).toMatchObject({
      uid: "user-b",
      activeTenantId: "tenant-b",
      status: "active",
      loading: false
    }));

    let result;
    await act(async () => {
      pendingSwitch.reject(Object.assign(new Error("stale target disappeared"), {
        code: "NOT_FOUND"
      }));
      result = await staleSwitch;
    });

    expect(result).toEqual({ ok: false, code: "UNAUTHENTICATED" });
    expect(readProbe()).toMatchObject({
      uid: "user-b",
      activeTenantId: "tenant-b",
      status: "active"
    });
    expect(JSON.parse(sessionStorage.getItem(SESSION_STORAGE_KEY))).toEqual({
      uid: "user-b",
      activeTenantId: "tenant-b"
    });
  });

  it("rejects a stale successful switch without changing the newer session", async () => {
    const pendingSwitch = deferred();
    const repositories = makeUserScopedRepositories({ pendingSwitch });
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({
      uid: "user-a",
      activeTenantId: "tenant-a"
    }));
    let switchTenant;
    function ActionProbe() {
      const session = useSession();
      switchTenant = session.setActiveTenantId;
      return <Probe />;
    }

    render(<SessionProvider dependencies={{ repositories }}><ActionProbe /></SessionProvider>);
    await act(async () => authCallback(makeUser("user-a")));
    await waitFor(() => expect(readProbe().activeTenantId).toBe("tenant-a"));

    const staleSwitch = switchTenant("tenant-a2");
    await act(async () => authCallback(makeUser("user-b")));
    await waitFor(() => expect(readProbe()).toMatchObject({
      uid: "user-b",
      activeTenantId: "tenant-b",
      status: "active"
    }));

    let result;
    await act(async () => {
      pendingSwitch.resolve(membership("tenant-a2", undefined, "user-a"));
      result = await staleSwitch;
    });

    expect(result).toEqual({ ok: false, code: "UNAUTHENTICATED" });
    expect(readProbe()).toMatchObject({
      uid: "user-b",
      activeTenantId: "tenant-b",
      status: "active"
    });
    expect(JSON.parse(sessionStorage.getItem(SESSION_STORAGE_KEY))).toEqual({
      uid: "user-b",
      activeTenantId: "tenant-b"
    });
  });

  it("rejects UID-bound storage during a UID change", async () => {
    const repositories = makeUserScopedRepositories();
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({
      uid: "user-a",
      activeTenantId: "tenant-a"
    }));
    render(<SessionProvider dependencies={{ repositories }}><Probe /></SessionProvider>);

    await act(async () => authCallback(makeUser("user-b")));
    await waitFor(() => expect(readProbe()).toMatchObject({
      uid: "user-b",
      activeTenantId: "tenant-b",
      status: "active",
      loading: false
    }));
    expect(JSON.parse(sessionStorage.getItem(SESSION_STORAGE_KEY))).toEqual({
      uid: "user-b",
      activeTenantId: "tenant-b"
    });
  });

  it("does not restore the prior user's tenant during a new-user loading transition", async () => {
    const userBIdentity = deferred();
    const repositories = {
      identity: {
        getIdentity: vi.fn(async (uid) => (
          uid === "user-b" ? userBIdentity.promise : { uid, isActive: true }
        ))
      },
      membership: {
        listOwnMembershipsAcrossTenants: vi.fn(async (uid) => ({
          items: uid === "user-a" ? [membership("tenant-a", undefined, "user-a")] : []
        })),
        getOwnMembership: vi.fn(async (tenantId, membershipId, uid) => (
          uid === "user-a" && tenantId === "tenant-a"
            ? membership("tenant-a", membershipId, "user-a")
            : undefined
        ))
      },
      tenant: {
        getTenant: vi.fn(async (tenantId) => ({ tenantId, status: "active" }))
      }
    };
    let switchTenant;
    function ActionProbe() {
      const session = useSession();
      switchTenant = session.setActiveTenantId;
      return <Probe />;
    }

    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({
      uid: "user-a",
      activeTenantId: "tenant-a"
    }));
    render(<SessionProvider dependencies={{ repositories }}><ActionProbe /></SessionProvider>);
    await act(async () => authCallback(makeUser("user-a")));
    await waitFor(() => expect(readProbe()).toMatchObject({
      uid: "user-a",
      activeTenantId: "tenant-a",
      status: "active",
      loading: false
    }));

    await act(async () => authCallback(makeUser("user-b")));
    await waitFor(() => expect(readProbe()).toMatchObject({
      uid: "user-b",
      activeTenantId: null,
      loading: true
    }));

    let result;
    await act(async () => { result = await switchTenant(""); });
    expect(result).toEqual({ ok: false, code: "INVALID_ARGUMENT" });
    expect(readProbe()).toMatchObject({ uid: "user-b", activeTenantId: null });

    await act(async () => userBIdentity.resolve({ uid: "user-b", isActive: true }));
    await waitFor(() => expect(readProbe()).toMatchObject({
      uid: "user-b",
      activeTenantId: null,
      status: "email_verified_without_membership",
      loading: false
    }));
    expect(readProbe().activeTenantId).not.toBe("tenant-a");
  });

  it("cleans session storage and returns anonymous state on logout", async () => {
    const repositories = makeRepositories({ memberships: [membership("tenant-1")] });
    let logout;
    function ActionProbe() {
      const session = useSession();
      logout = session.logout;
      return <Probe />;
    }

    render(<SessionProvider dependencies={{ repositories }}><ActionProbe /></SessionProvider>);
    await act(async () => authCallback(user));
    await waitFor(() => expect(readProbe().activeTenantId).toBe("tenant-1"));
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({
      uid: user.uid,
      activeTenantId: "tenant-1"
    }));

    let result;
    await act(async () => { result = await logout(); });
    expect(result).toEqual({ ok: true });
    expect(authModule.signOut).toHaveBeenCalledTimes(1);
    expect(readProbe()).toMatchObject({
      uid: null,
      activeTenantId: null,
      status: "anonymous",
      loading: false,
      error: null
    });
    expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
  });

  it("fails closed when Identity is missing", async () => {
    const repositories = makeRepositories();
    repositories.identity.getIdentity.mockRejectedValue(
      Object.assign(new Error("Identity not found"), { code: "NOT_FOUND" })
    );
    render(<SessionProvider dependencies={{ repositories }}><Probe /></SessionProvider>);

    await act(async () => authCallback(user));
    await waitFor(() => expect(readProbe()).toMatchObject({
      uid: user.uid,
      activeTenantId: null,
      status: null,
      loading: false,
      error: { operation: "initialize", code: "NOT_FOUND" }
    }));
  });

  it("fails closed when Identity is malformed or UID-mismatched", async () => {
    const repositories = makeRepositories();
    repositories.identity.getIdentity.mockRejectedValue(
      Object.assign(new Error("Identity contract violation"), { code: "CONTRACT_VIOLATION" })
    );
    render(<SessionProvider dependencies={{ repositories }}><Probe /></SessionProvider>);

    await act(async () => authCallback(user));
    await waitFor(() => expect(readProbe()).toMatchObject({
      uid: user.uid,
      activeTenantId: null,
      status: null,
      loading: false,
      error: { operation: "initialize", code: "CONTRACT_VIOLATION" }
    }));
  });

  it("clears malformed stored session data before selecting validated authority", async () => {
    const repositories = makeRepositories({ memberships: [membership("tenant-1")] });
    sessionStorage.setItem(SESSION_STORAGE_KEY, "not-json");
    render(<SessionProvider dependencies={{ repositories }}><Probe /></SessionProvider>);

    await act(async () => authCallback(user));
    await waitFor(() => expect(readProbe()).toMatchObject({
      activeTenantId: "tenant-1",
      status: "active",
      loading: false
    }));
    expect(JSON.parse(sessionStorage.getItem(SESSION_STORAGE_KEY))).toEqual({
      uid: user.uid,
      activeTenantId: "tenant-1"
    });
  });

  it("rejects a stale stored tenant and resolves the current approved tenant", async () => {
    const repositories = makeRepositories({ memberships: [membership("tenant-valid")] });
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({
      uid: user.uid,
      activeTenantId: "tenant-stale"
    }));
    render(<SessionProvider dependencies={{ repositories }}><Probe /></SessionProvider>);

    await act(async () => authCallback(user));
    await waitFor(() => expect(readProbe()).toMatchObject({
      activeTenantId: "tenant-valid",
      status: "active",
      loading: false
    }));
    expect(JSON.parse(sessionStorage.getItem(SESSION_STORAGE_KEY))).toEqual({
      uid: user.uid,
      activeTenantId: "tenant-valid"
    });
  });

  it("switches successfully only after target authority validation", async () => {
    const repositories = makeRepositories({
      memberships: [membership("tenant-1"), membership("tenant-2")]
    });
    let switchTenant;
    let observedKeys;
    function ActionProbe() {
      const session = useSession();
      switchTenant = session.setActiveTenantId;
      observedKeys = Object.keys(session).sort();
      return <Probe />;
    }

    render(<SessionProvider dependencies={{ repositories }}><ActionProbe /></SessionProvider>);
    await act(async () => authCallback(user));
    await waitFor(() => expect(readProbe()).toMatchObject({
      status: "tenant_selection_required",
      activeTenantId: null,
      loading: false
    }));

    let result;
    await act(async () => { result = await switchTenant("tenant-2"); });
    expect(result).toEqual({ ok: true });
    expect(readProbe()).toMatchObject({ activeTenantId: "tenant-2", status: "active" });
    expect(JSON.parse(sessionStorage.getItem(SESSION_STORAGE_KEY))).toEqual({
      uid: user.uid,
      activeTenantId: "tenant-2"
    });
    expect(observedKeys).toEqual([
      "activeTenantId",
      "error",
      "identity",
      "loading",
      "logout",
      "refresh",
      "setActiveTenantId",
      "status",
      "uid",
      "user"
    ]);
  });
});
