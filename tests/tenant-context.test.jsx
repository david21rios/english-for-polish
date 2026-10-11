import React from "react";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("firebase/firestore", () => ({}));
vi.mock("../src/firebase", () => ({ db: {} }));

const sessionHook = vi.hoisted(() => ({ useSession: vi.fn() }));
vi.mock("../src/hooks/useSession.js", () => sessionHook);

import { TenantProvider } from "../src/context/TenantContext.jsx";
import { useActiveTenant } from "../src/hooks/useActiveTenant.js";

const renderState = () => JSON.parse(screen.getByTestId("tenant").textContent);

function Probe() {
  const value = useActiveTenant();
  return <output data-testid="tenant">{JSON.stringify(value)}</output>;
}

const session = (overrides = {}) => ({
  uid: "user-1",
  activeTenantId: "tenant-1",
  loading: false,
  status: "active",
  ...overrides
});

const tenant = (overrides = {}) => ({
  tenantId: "tenant-1",
  status: "active",
  ...overrides
});

const membership = (overrides = {}) => ({
  membershipId: "membership-1",
  tenantId: "tenant-1",
  uid: "user-1",
  role: "teacher",
  status: "approved",
  ...overrides
});

const repositories = ({ tenantValue = tenant(), memberships = [membership()] } = {}) => ({
  tenant: { getTenant: vi.fn(async () => tenantValue) },
  membership: {
    listOwnMembershipsForTenant: vi.fn(async () => ({ items: memberships }))
  }
});

afterEach(() => {
  cleanup();
  sessionHook.useSession.mockReset();
});

describe("TenantContext shadow contract", () => {
  it("fails deterministically outside TenantProvider", () => {
    sessionHook.useSession.mockReturnValue(session());
    expect(() => render(<Probe />)).toThrow(
      "useActiveTenant must be used within a TenantProvider."
    );
  });

  it("exposes a neutral state without a selected tenant", () => {
    const repos = repositories();
    sessionHook.useSession.mockReturnValue(session({ activeTenantId: null }));
    render(<TenantProvider dependencies={{ repositories: repos }}><Probe /></TenantProvider>);

    expect(renderState()).toMatchObject({
      activeTenantId: null,
      tenant: null,
      membership: null,
      loading: false,
      resolved: false,
      error: null
    });
    expect(repos.tenant.getTenant).not.toHaveBeenCalled();
    expect(repos.membership.listOwnMembershipsForTenant).not.toHaveBeenCalled();
  });

  it("revalidates and exposes an active tenant and approved membership", async () => {
    const repos = repositories();
    sessionHook.useSession.mockReturnValue(session());
    render(<TenantProvider dependencies={{ repositories: repos }}><Probe /></TenantProvider>);

    await waitFor(() => expect(renderState()).toMatchObject({
      activeTenantId: "tenant-1",
      tenant: { tenantId: "tenant-1", status: "active" },
      membership: { tenantId: "tenant-1", uid: "user-1", status: "approved" },
      loading: false,
      resolved: true,
      error: null
    }));
    expect(repos.tenant.getTenant).toHaveBeenCalledWith("tenant-1");
    expect(repos.membership.listOwnMembershipsForTenant).toHaveBeenCalledWith(
      "tenant-1",
      "user-1",
      { status: "approved", pageSize: 50 }
    );
  });

  it("does not expose a missing or inactive tenant as resolved", async () => {
    const missing = repositories({ tenantValue: undefined });
    missing.tenant.getTenant.mockRejectedValue({ code: "NOT_FOUND" });
    sessionHook.useSession.mockReturnValue(session());
    render(<TenantProvider dependencies={{ repositories: missing }}><Probe /></TenantProvider>);
    await waitFor(() => expect(renderState()).toMatchObject({
      resolved: false,
      tenant: null,
      membership: null,
      error: { code: "NOT_FOUND" }
    }));

    cleanup();
    const inactive = repositories({ tenantValue: tenant({ status: "suspended" }) });
    sessionHook.useSession.mockReturnValue(session());
    render(<TenantProvider dependencies={{ repositories: inactive }}><Probe /></TenantProvider>);
    await waitFor(() => expect(renderState()).toMatchObject({
      resolved: false,
      tenant: null,
      membership: null,
      error: { code: "FORBIDDEN" }
    }));
    expect(inactive.membership.listOwnMembershipsForTenant).not.toHaveBeenCalled();
  });

  it("does not expose a missing or invalid membership as resolved", async () => {
    const repos = repositories({ memberships: [membership({ status: "pending" })] });
    sessionHook.useSession.mockReturnValue(session());
    render(<TenantProvider dependencies={{ repositories: repos }}><Probe /></TenantProvider>);

    await waitFor(() => expect(renderState()).toMatchObject({
      resolved: false,
      tenant: null,
      membership: null,
      error: { code: "NOT_FOUND" }
    }));
  });

  it("ignores a stale async resolution after the active tenant changes", async () => {
    const firstTenant = { promise: null, resolve: null };
    firstTenant.promise = new Promise((resolve) => { firstTenant.resolve = resolve; });
    const repos = {
      tenant: {
        getTenant: vi.fn((tenantId) => tenantId === "tenant-1"
          ? firstTenant.promise
          : Promise.resolve(tenant({ tenantId: "tenant-2" })))
      },
      membership: {
        listOwnMembershipsForTenant: vi.fn(async (tenantId) => ({
          items: [membership({ tenantId, membershipId: `${tenantId}-membership` })]
        }))
      }
    };
    let currentSession = session();
    sessionHook.useSession.mockImplementation(() => currentSession);
    const view = render(<TenantProvider dependencies={{ repositories: repos }}><Probe /></TenantProvider>);

    currentSession = session({ activeTenantId: "tenant-2" });
    view.rerender(<TenantProvider dependencies={{ repositories: repos }}><Probe /></TenantProvider>);
    await waitFor(() => expect(renderState()).toMatchObject({
      activeTenantId: "tenant-2",
      tenant: { tenantId: "tenant-2" },
      resolved: true
    }));

    await act(async () => {
      firstTenant.resolve(tenant({ tenantId: "tenant-1" }));
    });
    expect(renderState()).toMatchObject({
      activeTenantId: "tenant-2",
      tenant: { tenantId: "tenant-2" },
      membership: { tenantId: "tenant-2" },
      resolved: true
    });
  });
});
