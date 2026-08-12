export type JsonPrimitive = null | boolean | number | string;
export type JsonValue = JsonPrimitive | readonly JsonValue[] | { readonly [key: string]: JsonValue };

import type { COMMAND_STATUSES, PRIVILEGED_COMMAND_STAGES } from "@mipymetic/saas-contracts/commands";

export type CommandStatus = (typeof COMMAND_STATUSES)[keyof typeof COMMAND_STATUSES];
export type PrivilegedCommandStage = (typeof PRIVILEGED_COMMAND_STAGES)[keyof typeof PRIVILEGED_COMMAND_STAGES];

export interface AuthenticatedActor {
  readonly uid: string;
  readonly tokenEmailVerified: boolean;
  readonly appCheckVerified: boolean;
}

export interface AuthorityResolution {
  readonly actorUid: string;
  readonly actorType: "identity" | "platform_admin" | "system";
  readonly authority: string;
  readonly tenantId: string | null;
  readonly roles: readonly string[];
  readonly capabilities: readonly string[];
}

export interface CommandEnvelope {
  readonly commandId: string;
  readonly commandType: string;
  readonly correlationId: string;
  readonly tenantId: string | null;
  readonly payload: Readonly<Record<string, JsonValue>>;
}

export interface CommandRecord {
  readonly [key: string]: JsonValue;
  readonly commandId: string;
  readonly commandType: string;
  readonly payloadHash: string;
  readonly actorUid: string;
  readonly actorType: string;
  readonly authority: string;
  readonly tenantId: string | null;
  readonly status: CommandStatus;
  readonly stage: PrivilegedCommandStage;
  readonly startedAt: string;
  readonly completedAt: string | null;
  readonly failedAt: string | null;
  readonly result: JsonValue;
  readonly errorCode: string | null;
  readonly attemptCount: number;
  readonly correlationId: string;
  readonly expiresAt: string | null;
  readonly leaseExpiresAt: string | null;
  readonly schemaVersion: number;
}
