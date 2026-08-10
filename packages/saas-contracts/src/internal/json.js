import { isPlainObject } from "../validation/objects.js";

/** @param {unknown} value @returns {unknown} */
export const deepCopyJsonValue = (value) => {
  if (value === null || ["string", "boolean"].includes(typeof value)) return value;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (Array.isArray(value)) return value.map(deepCopyJsonValue);
  if (isPlainObject(value)) return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, deepCopyJsonValue(item)]));
  throw new TypeError("Value must be JSON-compatible.");
};

/** @template T @param {T} value @returns {Readonly<T>} */
export const deepFreezeJsonValue = (value) => {
  if (value !== null && typeof value === "object") {
    for (const item of Object.values(value)) deepFreezeJsonValue(item);
    Object.freeze(value);
  }
  return /** @type {Readonly<T>} */ (value);
};

/** @param {unknown} value @returns {string} */
const canonical = (value) => {
  if (value === null || typeof value === "boolean" || typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number" && Number.isFinite(value)) return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (isPlainObject(value)) return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
  throw new TypeError("Canonical JSON accepts JSON-compatible values only.");
};

/** @param {unknown} value */
export const canonicalJsonStringify = (value) => canonical(value);
/** @param {unknown} value */
export const canonicalJsonUtf8 = (value) => new TextEncoder().encode(canonical(value));
