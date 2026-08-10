import {
  CAPABILITIES, CAPABILITY_IDS, IDENTITY_SELF_CAPABILITIES, ROLE_CAPABILITY_MATRIX,
} from "@mipymetic/saas-contracts/domain";
import { BACKEND_ERROR_CODES } from "@mipymetic/saas-contracts/errors";
import { BackendError } from "../errors/backendError.js";

const knownCapabilityIds = new Set(Object.values(CAPABILITY_IDS));
type CapabilityId = (typeof CAPABILITY_IDS)[keyof typeof CAPABILITY_IDS];

export const capabilitiesForMembershipRole = (role: string): readonly string[] => {
  const capabilities = ROLE_CAPABILITY_MATRIX.membershipRoles[role as keyof typeof ROLE_CAPABILITY_MATRIX.membershipRoles];
  if (capabilities === undefined) throw new BackendError(BACKEND_ERROR_CODES.CONTRACT_VIOLATION, "The persisted membership role is unknown.");
  return capabilities;
};

export const capabilitiesForPlatformRole = (role: string): readonly string[] => {
  const capabilities = ROLE_CAPABILITY_MATRIX.platformRoles[role as keyof typeof ROLE_CAPABILITY_MATRIX.platformRoles];
  if (capabilities === undefined) throw new BackendError(BACKEND_ERROR_CODES.CONTRACT_VIOLATION, "The persisted platform role is unknown.");
  return capabilities;
};

export const identitySelfCapabilities = (): readonly string[] => IDENTITY_SELF_CAPABILITIES;

export const requireCapability = (capabilities: readonly string[], capability: string): void => {
  if (!knownCapabilityIds.has(capability as CapabilityId)) {
    throw new BackendError(BACKEND_ERROR_CODES.CONTRACT_VIOLATION, "The required capability is unknown.");
  }
  if (!capabilities.includes(capability)) {
    throw new BackendError(BACKEND_ERROR_CODES.FORBIDDEN, "The actor lacks the required capability.");
  }
  const capabilityId = capability as CapabilityId;
  if (CAPABILITIES[capabilityId] === undefined) {
    throw new BackendError(BACKEND_ERROR_CODES.CONTRACT_VIOLATION, "The capability descriptor is missing.");
  }
};
