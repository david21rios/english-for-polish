import {
  PLATFORM_AUTHORITY_STATUSES,
  validateAuthorityResolution,
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
  AuthorityResolution,
  JsonValue,
} from "../contracts/types.js";

import {
  BackendError,
} from "../errors/backendError.js";

import type {
  AuthoritativeReaderPort,
} from "../persistence/ports.js";

export const ARCHIVE_TENANT_REQUIRED_AUTHORITY =
  PLATFORM_ROLES.PLATFORM_ADMIN;

export const ARCHIVE_TENANT_REQUIRED_CAPABILITY =
  CAPABILITY_IDS.PLATFORM_TENANT_ARCHIVE;

const forbidden = (
  message: string,
): never => {
  throw new BackendError(
    BACKEND_ERROR_CODES.FORBIDDEN,
    message,
  );
};

export const resolveArchiveTenantAuthority = async (
  reader: AuthoritativeReaderPort,
  actor: AuthenticatedActor,
): Promise<AuthorityResolution> => {
  const identitySnapshot =
    await reader.read(
      identityDocumentPath(
        actor.uid,
      ),
    );

  if (!identitySnapshot.exists) {
    return forbidden(
      "ArchiveTenant requires existing Identity.",
    );
  }

  const identity =
    identitySnapshot.data as Readonly<
      Record<string, JsonValue>
    >;

  if (
    identity.uid !== actor.uid
  ) {
    return forbidden(
      "ArchiveTenant Identity binding is incoherent.",
    );
  }

  const authoritySnapshot =
    await reader.read(
      platformAuthorityDocumentPath(
        actor.uid,
      ),
    );

  if (!authoritySnapshot.exists) {
    return forbidden(
      "ArchiveTenant requires Platform Authority.",
    );
  }

  const authority =
    authoritySnapshot.data as Readonly<
      Record<string, JsonValue>
    >;

  if (
    authority.uid !== actor.uid
  ) {
    return forbidden(
      "ArchiveTenant Platform Authority uid is incoherent.",
    );
  }

  if (
    authority.status !==
    PLATFORM_AUTHORITY_STATUSES.ACTIVE
  ) {
    return forbidden(
      "ArchiveTenant requires active Platform Authority.",
    );
  }

  if (
    authority.authority !==
    PLATFORM_ROLES.PLATFORM_ADMIN
  ) {
    return forbidden(
      "ArchiveTenant requires Platform Admin authority.",
    );
  }

  const resolution =
    Object.freeze({
      actorUid:
        actor.uid,

      actorType:
        PLATFORM_ROLES.PLATFORM_ADMIN,

      authority:
        PLATFORM_ROLES.PLATFORM_ADMIN,

      tenantId:
        null,

      roles:
        Object.freeze([
          PLATFORM_ROLES.PLATFORM_ADMIN,
        ]),

      capabilities:
        Object.freeze([
          CAPABILITY_IDS.PLATFORM_TENANT_LIST,
          CAPABILITY_IDS.PLATFORM_TENANT_READ,
          CAPABILITY_IDS.PLATFORM_TENANT_CREATE,
          CAPABILITY_IDS.PLATFORM_TENANT_UPDATE,
          CAPABILITY_IDS.PLATFORM_TENANT_SUSPEND,
          CAPABILITY_IDS.PLATFORM_TENANT_RESTORE,
          CAPABILITY_IDS.PLATFORM_TENANT_ARCHIVE,
          CAPABILITY_IDS.PLATFORM_IDENTITY_READ,
          CAPABILITY_IDS.PLATFORM_AUTHORITY_REVOKE,
        ]),
    });

  const validation =
    validateAuthorityResolution(
      resolution,
    );

  if (!validation.ok) {
    return forbidden(
      "ArchiveTenant AuthorityResolution is malformed.",
    );
  }

  if (
    validation.value.actorType !==
    PLATFORM_ROLES.PLATFORM_ADMIN
  ) {
    return forbidden(
      "ArchiveTenant requires Platform Admin actor type.",
    );
  }

  if (
    validation.value.authority !==
    PLATFORM_ROLES.PLATFORM_ADMIN
  ) {
    return forbidden(
      "ArchiveTenant requires Platform Admin authority.",
    );
  }

  if (
    validation.value.tenantId !== null
  ) {
    return forbidden(
      "ArchiveTenant requires global Platform Admin scope.",
    );
  }

  if (
    validation.value.roles.length !== 1
    ||
    validation.value.roles[0] !==
    PLATFORM_ROLES.PLATFORM_ADMIN
  ) {
    return forbidden(
      "ArchiveTenant Platform Admin role binding is incoherent.",
    );
  }

  if (
    !validation.value.capabilities.includes(
      CAPABILITY_IDS.PLATFORM_TENANT_ARCHIVE,
    )
  ) {
    return forbidden(
      "ArchiveTenant requires platform.tenant_archive capability.",
    );
  }

  return validation.value as AuthorityResolution;
};
