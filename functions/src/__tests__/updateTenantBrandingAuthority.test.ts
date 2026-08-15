import type { JsonValue } from "../contracts/types.js";
import test from "node:test";
import assert from "node:assert/strict";
import { CAPABILITY_IDS } from "@mipymetic/saas-contracts/domain";

import {
  resolveUpdateTenantBrandingAuthority,
} from "../authorization/updateTenantBrandingAuthority.js";

import { BackendError } from "../errors/backendError.js";

const instant =
  "2026-08-14T12:00:00.000Z";

const actor = Object.freeze({
  uid: "admin-1",
  tokenEmailVerified: true,
  appCheckVerified: true,
});

const identity = Object.freeze({
  uid: "admin-1",
});

const tenant = Object.freeze({
  tenantId: "tenant-1",
  tenantType: "university",
  displayName: "Tenant",
  shortName: "T",
  country: "PL",
  locale: "pl-PL",
  timezone: "Europe/Warsaw",
  status: "active",
  createdAt: instant,
  updatedAt: instant,
  suspendedAt: null,
  archivedAt: null,
});

const membershipKey = Object.freeze({
  tenantId: "tenant-1",
  uid: "admin-1",
  membershipId: "membership-1",
  status: "approved",
  originRequestId: null,
  updatedAt: "2026-08-14T12:00:00.000Z",
});

const membership = Object.freeze({
  membershipId: "membership-1",
  tenantId: "tenant-1",
  uid: "admin-1",
  role: "tenant_admin",
  status: "approved",
  originRequestId: null,
  createdAt: instant,
  approvedAt: instant,
  approvedBy: "platform-admin-1",
  updatedAt: instant,
  suspendedAt: null,
  removedAt: null,
});

const snapshot = (
  exists: boolean,
  data: Readonly<Record<string, JsonValue>> | null,
) => Object.freeze({
  exists,
  data,
});

const createReader = (
  overrides: Readonly<
    Partial<
      Record<
        string,
        Readonly<{
          exists: boolean;
          data: Readonly<Record<string, JsonValue>> | null;
        }>
      >
    >
  > = {},
) => ({
  read: async (
    _path: string,
    kind?: string,
  ) => {
    if (
      kind !== undefined
      && kind in overrides
    ) {
      return overrides[kind]!;
    }

    if (kind === "identity") {
      return snapshot(
        true,
        identity,
      );
    }

    if (kind === "tenant") {
      return snapshot(
        true,
        tenant,
      );
    }

    if (kind === "membership_key") {
      return snapshot(
        true,
        membershipKey,
      );
    }

    if (kind === "membership") {
      return snapshot(
        true,
        membership,
      );
    }

    throw new Error(
      `Unexpected read: ${kind}`,
    );
  },
});

test(
  "UpdateTenantBranding resolves exact tenant_admin authority",
  async () => {
    const resolution =
      await resolveUpdateTenantBrandingAuthority(
        createReader(),
        actor,
        "tenant-1",
      );

    assert.equal(
      resolution.actorUid,
      "admin-1",
    );

    assert.equal(
      resolution.actorType,
      "identity",
    );

    assert.equal(
      resolution.authority,
      "tenant_admin",
    );

    assert.equal(
      resolution.tenantId,
      "tenant-1",
    );

    assert.deepEqual(
      resolution.roles,
      ["tenant_admin"],
    );

    assert.ok(
      resolution.capabilities.includes(
        CAPABILITY_IDS.TENANT_MANAGE_BRANDING,
      ),
    );
  },
);

test(
  "UpdateTenantBranding authority returns NOT_FOUND for missing Tenant",
  async () => {
    await assert.rejects(
      () =>
        resolveUpdateTenantBrandingAuthority(
          createReader({
            tenant:
              snapshot(
                false,
                null,
              ),
          }),
          actor,
          "tenant-1",
        ),
      BackendError,
    );
  },
);

test(
  "UpdateTenantBranding authority rejects malformed Tenant",
  async () => {
    await assert.rejects(
      () =>
        resolveUpdateTenantBrandingAuthority(
          createReader({
            tenant:
              snapshot(
                true,
                {
                  tenantId:
                    "tenant-1",
                },
              ),
          }),
          actor,
          "tenant-1",
        ),
      BackendError,
    );
  },
);

test(
  "UpdateTenantBranding authority rejects non-active Tenant",
  async () => {
    await assert.rejects(
      () =>
        resolveUpdateTenantBrandingAuthority(
          createReader({
            tenant:
              snapshot(
                true,
                {
                  ...tenant,
                  status:
                    "suspended",
                },
              ),
          }),
          actor,
          "tenant-1",
        ),
      BackendError,
    );
  },
);

test(
  "UpdateTenantBranding authority rejects missing MembershipKey",
  async () => {
    await assert.rejects(
      () =>
        resolveUpdateTenantBrandingAuthority(
          createReader({
            membership_key:
              snapshot(
                false,
                null,
              ),
          }),
          actor,
          "tenant-1",
        ),
      BackendError,
    );
  },
);

test(
  "UpdateTenantBranding authority rejects malformed MembershipKey",
  async () => {
    await assert.rejects(
      () =>
        resolveUpdateTenantBrandingAuthority(
          createReader({
            membership_key:
              snapshot(
                true,
                {
                  tenantId:
                    "tenant-1",
                },
              ),
          }),
          actor,
          "tenant-1",
        ),
      BackendError,
    );
  },
);

test(
  "UpdateTenantBranding authority rejects missing authoritative Membership",
  async () => {
    await assert.rejects(
      () =>
        resolveUpdateTenantBrandingAuthority(
          createReader({
            membership:
              snapshot(
                false,
                null,
              ),
          }),
          actor,
          "tenant-1",
        ),
      BackendError,
    );
  },
);

test(
  "UpdateTenantBranding authority rejects malformed Membership",
  async () => {
    await assert.rejects(
      () =>
        resolveUpdateTenantBrandingAuthority(
          createReader({
            membership:
              snapshot(
                true,
                {
                  membershipId:
                    "membership-1",
                },
              ),
          }),
          actor,
          "tenant-1",
        ),
      BackendError,
    );
  },
);

test(
  "UpdateTenantBranding authority rejects non-tenant_admin Membership",
  async () => {
    await assert.rejects(
      () =>
        resolveUpdateTenantBrandingAuthority(
          createReader({
            membership:
              snapshot(
                true,
                {
                  ...membership,
                  role:
                    "teacher",
                },
              ),
          }),
          actor,
          "tenant-1",
        ),
      BackendError,
    );
  },
);

test(
  "UpdateTenantBranding authority requires coherent persisted Identity",
  async () => {
    await assert.rejects(
      () =>
        resolveUpdateTenantBrandingAuthority(
          createReader({
            identity:
              snapshot(
                false,
                null,
              ),
          }),
          actor,
          "tenant-1",
        ),
      BackendError,
    );

    await assert.rejects(
      () =>
        resolveUpdateTenantBrandingAuthority(
          createReader({
            identity:
              snapshot(
                true,
                {
                  uid:
                    "other-admin",
                },
              ),
          }),
          actor,
          "tenant-1",
        ),
      BackendError,
    );
  },
);
