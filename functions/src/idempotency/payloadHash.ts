import { createHash } from "node:crypto";
import { canonicalJsonStringify } from "@mipymetic/saas-contracts/validation";
import type { JsonValue } from "../contracts/types.js";

export const canonicalPayloadHash = (
  commandType: string,
  payload: Readonly<Record<string, JsonValue>>,
): string => createHash("sha256").update(canonicalJsonStringify({ commandType, payload }), "utf8").digest("hex");
