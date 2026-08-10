import { COMMAND_STATUSES } from "@mipymetic/saas-contracts/commands";
import { BACKEND_ERROR_CODES } from "@mipymetic/saas-contracts/errors";
import type { CommandRecord } from "../contracts/types.js";
import { BackendError } from "../errors/backendError.js";

export type IdempotencyDecision =
  | Readonly<{ kind: "new" }>
  | Readonly<{ kind: "replay"; record: CommandRecord }>
  | Readonly<{ kind: "resume"; record: CommandRecord }>;

export const decideIdempotency = (record: CommandRecord | null, payloadHash: string): IdempotencyDecision => {
  if (record === null) return Object.freeze({ kind: "new" });
  if (record.payloadHash !== payloadHash) throw new BackendError(BACKEND_ERROR_CODES.CONFLICT, "The command ID is already bound to a different payload.");
  if (record.status === COMMAND_STATUSES.SUCCEEDED) return Object.freeze({ kind: "replay", record });
  if (record.status === COMMAND_STATUSES.FAILED_RETRYABLE || record.status === COMMAND_STATUSES.RECOVERY_REQUIRED) {
    return Object.freeze({ kind: "resume", record });
  }
  if (record.status === COMMAND_STATUSES.FAILED_TERMINAL) throw new BackendError(BACKEND_ERROR_CODES.FAILED_PRECONDITION, "The command failed terminally and cannot be retried.");
  throw new BackendError(BACKEND_ERROR_CODES.CONFLICT, "The command is already in progress.", { retryable: true });
};
