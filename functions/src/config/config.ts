import { BACKEND_ERROR_CODES } from "@mipymetic/saas-contracts/errors";
import { BackendError } from "../errors/backendError.js";

export const BACKEND_ENVIRONMENTS = Object.freeze([
  "local", "demo-emulator", "development", "staging", "production",
] as const);
export type BackendEnvironment = (typeof BACKEND_ENVIRONMENTS)[number];

export interface BackendConfig {
  readonly environment: BackendEnvironment;
  readonly projectId: string | null;
  readonly deploymentRegion: string | null;
  readonly emulator: boolean;
  readonly maxApplicationAttempts: 5;
  readonly commandTimeoutMs: 20_000;
  readonly readBudgetTarget: 20;
  readonly writeBudgetTarget: 20;
}

export type ConfigSource = Readonly<Record<string, string | undefined>>;

const allowedKeys = new Set(["BACKEND_ENVIRONMENT", "GCLOUD_PROJECT", "DEPLOYMENT_REGION"]);

export const loadBackendConfig = (source: ConfigSource): BackendConfig => {
  for (const key of Object.keys(source)) {
    if (!allowedKeys.has(key)) {
      throw new BackendError(BACKEND_ERROR_CODES.CONTRACT_VIOLATION, "Versioned backend configuration contains an unknown key.");
    }
    if (/secret|password|token|credential/i.test(key)) {
      throw new BackendError(BACKEND_ERROR_CODES.CONTRACT_VIOLATION, "Secret values are not accepted by versioned backend configuration.");
    }
  }
  const environmentValue = source.BACKEND_ENVIRONMENT;
  if (!BACKEND_ENVIRONMENTS.includes(environmentValue as BackendEnvironment)) {
    throw new BackendError(BACKEND_ERROR_CODES.FAILED_PRECONDITION, "BACKEND_ENVIRONMENT is missing or unknown.");
  }
  const environment = environmentValue as BackendEnvironment;
  const projectId = source.GCLOUD_PROJECT ?? null;
  if (environment === "demo-emulator" && projectId !== "demo-polish-learning") {
    throw new BackendError(BACKEND_ERROR_CODES.FAILED_PRECONDITION, "The emulator environment must use demo-polish-learning.");
  }
  if (environment !== "local" && environment !== "demo-emulator" && projectId === null) {
    throw new BackendError(BACKEND_ERROR_CODES.FAILED_PRECONDITION, "Remote environments require an explicit project ID.");
  }
  const deploymentRegion = source.DEPLOYMENT_REGION ?? null;
  if ((environment === "staging" || environment === "production") && deploymentRegion === null) {
    throw new BackendError(BACKEND_ERROR_CODES.FAILED_PRECONDITION, "DEPLOYMENT_REGION is required before remote deployment.");
  }
  return Object.freeze({
    environment, projectId, deploymentRegion,
    emulator: environment === "demo-emulator",
    maxApplicationAttempts: 5,
    commandTimeoutMs: 20_000,
    readBudgetTarget: 20,
    writeBudgetTarget: 20,
  });
};

export const readBackendConfig = (): BackendConfig => loadBackendConfig({
  BACKEND_ENVIRONMENT: process.env.BACKEND_ENVIRONMENT,
  GCLOUD_PROJECT: process.env.GCLOUD_PROJECT,
  DEPLOYMENT_REGION: process.env.DEPLOYMENT_REGION,
});

export const CONFIG_KEYS = Object.freeze([...allowedKeys]);
