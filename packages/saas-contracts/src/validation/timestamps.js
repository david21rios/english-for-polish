/**
 * @typedef {Readonly<{ok: true, value: string}> |
 * Readonly<{ok: false, issue: Readonly<{code: "INVALID_ARGUMENT", field: string, reason: "invalid_persisted_timestamp"}>}>} PersistedTimestampValidationResult
 */

/**
 * Validates the portable logical representation of a persisted timestamp.
 * @param {unknown} value
 * @param {string} [name]
 * @returns {PersistedTimestampValidationResult}
 */
export const validatePersistedTimestamp = (value, name = "timestamp") => {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) {
    const milliseconds = Date.parse(value);
    if (!Number.isNaN(milliseconds) && new Date(milliseconds).toISOString() === value) {
      return Object.freeze({ ok: true, value });
    }
  }
  return Object.freeze({
    ok: false,
    issue: Object.freeze({ code: "INVALID_ARGUMENT", field: name, reason: "invalid_persisted_timestamp" }),
  });
};
