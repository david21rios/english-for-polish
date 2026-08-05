import { isPlainObject } from "../validation/objects.js";

export const deepCopyJsonValue = (value) => {
  if (value === null || ["string", "boolean"].includes(typeof value)) return value;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (Array.isArray(value)) return value.map(deepCopyJsonValue);
  if (isPlainObject(value)) return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, deepCopyJsonValue(item)]));
  throw new TypeError("Value must be JSON-compatible.");
};

export const deepFreezeJsonValue = (value) => {
  if (value !== null && typeof value === "object") {
    for (const item of Object.values(value)) deepFreezeJsonValue(item);
    Object.freeze(value);
  }
  return value;
};

const canonical = (value) => {
  if (value === null || typeof value === "boolean" || typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number" && Number.isFinite(value)) return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (isPlainObject(value)) return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
  throw new TypeError("Canonical JSON accepts JSON-compatible values only.");
};

export const canonicalJsonStringify = (value) => canonical(value);
export const canonicalJsonUtf8 = (value) => new TextEncoder().encode(canonical(value));
