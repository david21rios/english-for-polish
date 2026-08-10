import { BACKEND_ERROR_CODES } from "@mipymetic/saas-contracts/errors";
import { BackendError } from "../errors/backendError.js";
import type { TransactionPort, TransactionRunnerPort } from "./ports.js";

export interface TransactionContext {
  readonly transaction: TransactionPort;
  readonly registerRead: () => void;
  readonly registerWrite: () => void;
}

export const runAuthoritativeTransaction = async <T>(
  runner: TransactionRunnerPort,
  operation: (context: TransactionContext) => Promise<T>,
): Promise<T> => runner.run(async (transaction) => {
  let reads = 0;
  let writes = 0;
  const result = await operation(Object.freeze({
    transaction,
    registerRead: () => {
      reads += 1;
      if (reads >= 20) throw new BackendError(BACKEND_ERROR_CODES.FAILED_PRECONDITION, "The command exceeds the contractual read budget.");
    },
    registerWrite: () => {
      writes += 1;
      if (writes >= 20) throw new BackendError(BACKEND_ERROR_CODES.FAILED_PRECONDITION, "The command exceeds the contractual write budget.");
    },
  }));
  return result;
});

export const externalEffect = async (): Promise<never> => {
  throw new BackendError(BACKEND_ERROR_CODES.CONTRACT_VIOLATION, "External effects are prohibited inside transaction callbacks.");
};
