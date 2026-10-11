import React from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const authModule = vi.hoisted(() => ({
  onAuthStateChanged: vi.fn(),
  signOut: vi.fn()
}));

vi.mock("firebase/auth", () => authModule);
vi.mock("firebase/firestore", () => ({}));
vi.mock("../src/firebase", () => ({ auth: {}, db: {} }));

import { SessionProvider } from "../src/context/SessionContext.jsx";
import { TenantProvider } from "../src/context/TenantContext.jsx";
import { useActiveTenant } from "../src/hooks/useActiveTenant.js";

const sessionRepositories = ({ memberships = [] } = {}) => ({
  identity: { getIdentity: vi.fn(async (uid) => ({ uid, isActive: true })) },
  membership: {
    listOwnMembershipsAcrossTenants: vi.fn(async () => ({ items: memberships })),
    getOwnMembership: vi.fn(async (tenantId, _membershipId, uid) => (
      memberships.find((item) => item.tenantId === tenantId && item.uid === uid)
    ))
  },
  tenant: { getTenant: vi.fn(async (tenantId) => ({ tenantId, status: "active" })) }
});

const membership = {
  membershipId: "membership-1",
  tenantId: "tenant-1",
  uid: "user-1",
  role: "teacher",
  status: "approved"
};

function Probe() {
  const tenant = useActiveTenant();
  return <output data-testid="tenant-composition">{JSON.stringify(tenant)}</output>;
}

let authCallback;

beforeEach(() => {
  authModule.onAuthStateChanged.mockImplementation((_auth, callback) => {
    authCallback = callback;
    return vi.fn();
  });
  authModule.signOut.mockResolvedValue(undefined);
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("SessionProvider and TenantProvider composition", () => {
  it("mounts the additive tenant boundary without replacing session authority", async () => {
    const sessionRepos = sessionRepositories({ memberships: [membership] });
    const tenantRepos = {
      tenant: { getTenant: vi.fn(async () => ({ tenantId: "tenant-1", status: "active" })) },
      membership: {
        listOwnMembershipsForTenant: vi.fn(async () => ({ items: [membership] }))
      }
    };

    render(
      <SessionProvider dependencies={{ repositories: sessionRepos }}>
        <TenantProvider dependencies={{ repositories: tenantRepos }}>
          <Probe />
        </TenantProvider>
      </SessionProvider>
    );

    await authCallback({ uid: "user-1", emailVerified: true });
    await waitFor(() => {
      const value = JSON.parse(screen.getByTestId("tenant-composition").textContent);
      expect(value).toMatchObject({
        activeTenantId: "tenant-1",
        tenant: { tenantId: "tenant-1", status: "active" },
        membership: { membershipId: "membership-1", status: "approved" },
        resolved: true,
        loading: false
      });
    });
    expect(tenantRepos.tenant.getTenant).toHaveBeenCalledWith("tenant-1");
    expect(tenantRepos.membership.listOwnMembershipsForTenant).toHaveBeenCalledWith(
      "tenant-1",
      "user-1",
      { status: "approved", pageSize: 50 }
    );
  });
});
