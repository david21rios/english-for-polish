import {
  validateAuthorityResolution,
} from "@mipymetic/saas-contracts/authority";

import {
  CAPABILITY_IDS,
  PLATFORM_ROLES,
} from "@mipymetic/saas-contracts/domain";

import {
  BACKEND_ERROR_CODES,
} from "@mipymetic/saas-contracts/errors";

import type {
  AuthenticatedActor,
  AuthorityResolution,
} from "../contracts/types.js";

import {
  BackendError,
} from "../errors/backendError.js";

import type {
  AuthoritativeReaderPort,
} from "../persistence/ports.js";

import {
  capabilitiesForPlatformRole,
} from "./capabilities.js";

import {
  resolvePlatformAuthority,
} from "./authorityResolver.js";

const contract = (
  message: string,
): never => {
  throw new BackendError(
    BACKEND_ERROR_CODES.CONTRACT_VIOLATION,
    message,
  );
};

const forbidden = (
  message: string,
): never => {
  throw new BackendError(
    BACKEND_ERROR_CODES.FORBIDDEN,
    message,
  );
};

export const SUSPEND_TENANT_REQUIRED_AUTHORITY =
  PLATFORM_ROLES.PLATFORM_ADMIN;

export const SUSPEND_TENANT_REQUIRED_CAPABILITY =
  CAPABILITY_IDS.PLATFORM_TENANT_SUSPEND;

export const resolveSuspendTenantAuthority = async (
  reader: AuthoritativeReaderPort,
  actor: AuthenticatedActor,
): Promise<AuthorityResolution> => {
  const authority =
    await resolvePlatformAuthority(
      reader,
      actor,
    );

  if (
    authority.actorType !== "platform_admin"
  ) {
    return forbidden(
      "SuspendTenant requires Platform Admin actor type.",
    );
  }

  if (
    authority.authority !==
    PLATFORM_ROLES.PLATFORM_ADMIN
  ) {
    return forbidden(
      "SuspendTenant requires Platform Admin authority.",
    );
  }

  if (authority.tenantId !== null) {
    return forbidden(
      "SuspendTenant requires global Platform Admin scope.",
    );
  }

  if (
    !Array.isArray(authority.roles)
  ) {
    return contract(
      "SuspendTenant Platform Admin roles are malformed.",
    );
  }

  if (authority.roles.length !== 1) {
    return contract(
      "SuspendTenant Platform Admin role binding is incoherent.",
    );
  }

  if (
    authority.roles[0] !==
    PLATFORM_ROLES.PLATFORM_ADMIN
  ) {
    return contract(
      "SuspendTenant Platform Admin role binding is incoherent.",
    );
  }

  if (
    !authority.capabilities.includes(
      CAPABILITY_IDS.PLATFORM_TENANT_SUSPEND,
    )
  ) {
    return forbidden(
      "SuspendTenant requires platform.tenant_suspend capability.",
    );
  }

  const canonicalCapabilities =
    capabilitiesForPlatformRole(
      PLATFORM_ROLES.PLATFORM_ADMIN,
    );

  if (
    !canonicalCapabilities.includes(
      CAPABILITY_IDS.PLATFORM_TENANT_SUSPEND,
    )
  ) {
    return contract(
      "Canonical Platform Admin capabilities are incoherent.",
    );
  }

  const resolution =
    Object.freeze({
      actorUid:
        authority.actorUid,

      actorType:
        "platform_admin" as const,

      authority:
        PLATFORM_ROLES.PLATFORM_ADMIN,

      tenantId:
        null,

      roles:
        Object.freeze([
          PLATFORM_ROLES.PLATFORM_ADMIN,
        ]),

      capabilities:
        canonicalCapabilities,
    });

  const validation =
    validateAuthorityResolution(
      resolution,
    );

  if (!validation.ok) {
    return contract(
      "SuspendTenant AuthorityResolution is malformed.",
    );
  }

  return validation.value as AuthorityResolution;
};