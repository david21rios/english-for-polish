import assert from "node:assert/strict";
import test from "node:test";

import {
  PLATFORM_AUTHORITY_STATUSES,
} from "@mipymetic/saas-contracts/authority";

import {
  CAPABILITY_IDS,
  PLATFORM_ROLES,
} from "@mipymetic/saas-contracts/domain";

import {
  BACKEND_ERROR_CODES,
} from "@mipymetic/saas-contracts/errors";

import {
  identityDocumentPath,
  platformAuthorityDocumentPath,
} from "@mipymetic/saas-contracts/persistence";

import type {
  AuthenticatedActor,
  JsonValue,
} from "../contracts/types.js";

import {
  BackendError,
} from "../errors/backendError.js";

import type {
  AuthoritativeReaderPort,
  DocumentSnapshotPort,
} from "../persistence/ports.js";

import {
  ARCHIVE_TENANT_REQUIRED_AUTHORITY,
  ARCHIVE_TENANT_REQUIRED_CAPABILITY,
  resolveArchiveTenantAuthority,
} from "../authorization/archiveTenantAuthority.js";

const actor: AuthenticatedActor =
  Object.freeze({
    uid:
      "platform-admin-1",

    tokenEmailVerified:
      true,

    appCheckVerified:
      false,
  });

const snapshot = (
  data: Readonly<Record<string, JsonValue>> | null,
): DocumentSnapshotPort =>
  Object.freeze({
    exists:
      data !== null,

    data,
  });

class Reader implements AuthoritativeReaderPort {
  constructor(
    private readonly values:
      ReadonlyMap<string, DocumentSnapshotPort>,
  ) {}

  async read(
    path: string,
  ): Promise<DocumentSnapshotPort> {
    return this.values.get(path)
      ?? snapshot(null);
  }
}

const platformReader = (
  status: string =
    PLATFORM_AUTHORITY_STATUSES.ACTIVE,
): Reader =>
  new Reader(
    new Map([
      [
        identityDocumentPath(actor.uid),
        snapshot({
          uid:
            actor.uid,
        }),
      ],
      [
        platformAuthorityDocumentPath(actor.uid),
        snapshot({
          uid:
            actor.uid,

          status,

          authority:
            PLATFORM_ROLES.PLATFORM_ADMIN,

          transitionCommandId:
            null,
        }),
      ],
    ]),
  );

test(
  "ArchiveTenant authority literals are canonical",
  () => {
    assert.equal(
      ARCHIVE_TENANT_REQUIRED_AUTHORITY,
      "platform_admin",
    );

    assert.equal(
      ARCHIVE_TENANT_REQUIRED_CAPABILITY,
      "platform.tenant_archive",
    );

    assert.equal(
      ARCHIVE_TENANT_REQUIRED_AUTHORITY,
      PLATFORM_ROLES.PLATFORM_ADMIN,
    );

    assert.equal(
      ARCHIVE_TENANT_REQUIRED_CAPABILITY,
      CAPABILITY_IDS.PLATFORM_TENANT_ARCHIVE,
    );
  },
);

test(
  "ArchiveTenant resolves active Platform Admin authority",
  async () => {
    const resolved =
      await resolveArchiveTenantAuthority(
        platformReader(),
        actor,
      );

    assert.equal(
      resolved.actorUid,
      actor.uid,
    );

    assert.equal(
      resolved.actorType,
      "platform_admin",
    );

    assert.equal(
      resolved.authority,
      PLATFORM_ROLES.PLATFORM_ADMIN,
    );

    assert.equal(
      resolved.tenantId,
      null,
    );

    assert.ok(
      resolved.capabilities.includes(
        CAPABILITY_IDS.PLATFORM_TENANT_ARCHIVE,
      ),
    );
  },
);

test(
  "ArchiveTenant rejects missing Platform Authority",
  async () => {
    const reader =
      new Reader(
        new Map([
          [
            identityDocumentPath(actor.uid),
            snapshot({
              uid:
                actor.uid,
            }),
          ],
        ]),
      );

    await assert.rejects(
      resolveArchiveTenantAuthority(
        reader,
        actor,
      ),
      (
        error: unknown,
      ) =>
        error instanceof BackendError
        &&
        error.code ===
        BACKEND_ERROR_CODES.FORBIDDEN,
    );
  },
);

test(
  "ArchiveTenant rejects revoked Platform Authority",
  async () => {
    await assert.rejects(
      resolveArchiveTenantAuthority(
        platformReader("revoked"),
        actor,
      ),
      BackendError,
    );
  },
);

test(
  "ArchiveTenant rejects missing Identity",
  async () => {
    const reader =
      new Reader(
        new Map([
          [
            platformAuthorityDocumentPath(
              actor.uid,
            ),
            snapshot({
              uid:
                actor.uid,

              status:
                PLATFORM_AUTHORITY_STATUSES.ACTIVE,

              authority:
                PLATFORM_ROLES.PLATFORM_ADMIN,

              transitionCommandId:
                null,
            }),
          ],
        ]),
      );

    await assert.rejects(
      resolveArchiveTenantAuthority(
        reader,
        actor,
      ),
      BackendError,
    );
  },
);

test(
  "ArchiveTenant rejects mismatched Platform Authority uid",
  async () => {
    const reader =
      new Reader(
        new Map([
          [
            identityDocumentPath(actor.uid),
            snapshot({
              uid:
                actor.uid,
            }),
          ],
          [
            platformAuthorityDocumentPath(
              actor.uid,
            ),
            snapshot({
              uid:
                "other-admin",

              status:
                PLATFORM_AUTHORITY_STATUSES.ACTIVE,

              authority:
                PLATFORM_ROLES.PLATFORM_ADMIN,

              transitionCommandId:
                null,
            }),
          ],
        ]),
      );

    await assert.rejects(
      resolveArchiveTenantAuthority(
        reader,
        actor,
      ),
      BackendError,
    );
  },
);
