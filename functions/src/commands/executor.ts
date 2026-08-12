import { privilegedCommandDocumentPath } from "@mipymetic/saas-contracts/persistence";
import { rejectActorAuthorityPayload, requireAuthenticatedActor, type VerifiedAuthenticationContext } from "../authorization/authenticatedActor.js";
import type { AuthorityResolution, CommandEnvelope, CommandRecord, JsonValue } from "../contracts/types.js";
import { sanitizeBackendError } from "../errors/backendError.js";
import { decideIdempotency } from "../idempotency/idempotency.js";
import { canonicalPayloadHash } from "../idempotency/payloadHash.js";
import type { TransactionPort, TransactionRunnerPort } from "../persistence/ports.js";
import { createPendingCommandRecord, validateCommandEnvelope, validatePersistedCommandRecord, type PendingCommandWrite } from "./commandRecord.js";

export interface CommandExecutionDependencies {
  readonly transactionRunner: TransactionRunnerPort;
  readonly resolveAuthority: (actorUid: string, envelope: CommandEnvelope) => Promise<AuthorityResolution>;
}

export const prepareCommandExecution = async (input: {
  auth: VerifiedAuthenticationContext | null;
  envelope: CommandEnvelope;
  dependencies: CommandExecutionDependencies;
}): Promise<Readonly<{ decision: string; record: CommandRecord | PendingCommandWrite }>> => {
  validateCommandEnvelope(input.envelope);
  rejectActorAuthorityPayload(input.envelope.payload);
  const actor = requireAuthenticatedActor(input.auth);
  const authority = await input.dependencies.resolveAuthority(actor.uid, input.envelope);
  const payloadHash = canonicalPayloadHash(input.envelope.commandType, input.envelope.payload);
  return input.dependencies.transactionRunner.run(async (transaction: TransactionPort) => {
    const path = privilegedCommandDocumentPath(input.envelope.commandId);
    const snapshot = await transaction.get(path);
    const existing = snapshot.exists ? validatePersistedCommandRecord(snapshot.data) : null;
    const decision = decideIdempotency(existing, payloadHash);
    if (decision.kind === "replay" || decision.kind === "resume") return Object.freeze({ decision: decision.kind, record: decision.record });
    const record = createPendingCommandRecord({ envelope: input.envelope, payloadHash, authority });
    transaction.create(path, record);
    return Object.freeze({ decision: "new", record });
  });
};

export const safeCommandFailure = (error: unknown): JsonValue => sanitizeBackendError(error) as unknown as JsonValue;
