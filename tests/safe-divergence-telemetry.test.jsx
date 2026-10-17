import { describe, expect, it, vi } from "vitest";

import {
  CLASSIFICATIONS,
  DIVERGENCE_REASON_CODES,
  LEGACY_STATES,
  SHADOW_STATES,
  compareShadowDivergence,
  createDivergenceObserver,
  getSafeObservationSignature,
  normalizeLegacyState,
  normalizeShadowState
} from "../src/domain/access/shadowDivergence.js";

const shadow = (overrides = {}) => ({
  loading: false,
  resolved: true,
  resolutionState: SHADOW_STATES.READY,
  error: null,
  ...overrides
});

const legacy = (overrides = {}) => ({
  loading: false,
  error: null,
  levels: [{ id: "legacy-level" }],
  ...overrides
});

const forbiddenKeys = new Set([
  "uid",
  "userId",
  "tenantId",
  "courseId",
  "membershipId",
  "levelId",
  "candidateCourseIds",
  "levels",
  "course",
  "token",
  "email",
  "errorMessage",
  "stack"
]);

const assertSafeRecord = (value) => {
  if (value === null || typeof value !== "object") return;
  for (const [key, nested] of Object.entries(value)) {
    expect(forbiddenKeys.has(key)).toBe(false);
    assertSafeRecord(nested);
  }
};

describe("safe divergence telemetry", () => {
  it("normalizes legacy loading, error, empty, and ready states", () => {
    expect(normalizeLegacyState({ loading: true, levels: [{ id: "x" }] })).toBe(LEGACY_STATES.LOADING);
    expect(normalizeLegacyState({ error: "raw error" })).toBe(LEGACY_STATES.ERROR);
    expect(normalizeLegacyState({ levels: [] })).toBe(LEGACY_STATES.READY_EMPTY);
    expect(normalizeLegacyState({ levels: [{ id: "legacy-level" }] })).toBe(LEGACY_STATES.READY);
  });

  it("normalizes shadow loading and known resolution states", () => {
    expect(normalizeShadowState({ loading: true, resolved: false, resolutionState: "idle" })).toMatchObject({
      shadowState: SHADOW_STATES.LOADING,
      resolutionState: "idle"
    });
    for (const resolutionState of [
      SHADOW_STATES.NOT_REQUIRED,
      SHADOW_STATES.NO_ENROLLMENT,
      SHADOW_STATES.SELECTION_REQUIRED,
      SHADOW_STATES.COURSE_UNAVAILABLE,
      SHADOW_STATES.READY,
      SHADOW_STATES.ERROR
    ]) {
      expect(normalizeShadowState({ resolved: true, resolutionState })).toMatchObject({
        shadowState: resolutionState,
        resolutionState
      });
    }
  });

  it("classifies legacy and shadow loading as a match", () => {
    expect(compareShadowDivergence({ legacy: legacy({ loading: true }), shadow: shadow({ loading: true, resolved: false, resolutionState: "idle" }) })).toMatchObject({
      classification: CLASSIFICATIONS.MATCH,
      legacyState: LEGACY_STATES.LOADING,
      shadowState: SHADOW_STATES.LOADING
    });
  });

  it("does not compare a resolved shadow while legacy is loading", () => {
    expect(compareShadowDivergence({ legacy: legacy({ loading: true }), shadow: shadow() }).classification).toBe(CLASSIFICATIONS.NOT_COMPARABLE_YET);
  });

  it("does not compare a loading shadow while legacy is ready", () => {
    expect(compareShadowDivergence({ legacy: legacy(), shadow: shadow({ loading: true, resolved: false, resolutionState: "idle" }) }).classification).toBe(CLASSIFICATIONS.NOT_COMPARABLE_YET);
  });

  it("matches ready results without comparing course identity", () => {
    const result = compareShadowDivergence({ legacy: legacy(), shadow: shadow({ course: { courseId: "secret-course" } }) });
    expect(result).toMatchObject({ classification: CLASSIFICATIONS.MATCH, tenantMismatch: false });
    assertSafeRecord(result);
  });

  it("classifies a tenant mismatch using only a boolean", () => {
    const result = compareShadowDivergence({ legacy: legacy(), shadow: shadow(), tenantMismatch: true });
    expect(result).toMatchObject({
      classification: CLASSIFICATIONS.DIVERGENCE,
      reason: DIVERGENCE_REASON_CODES.TENANT_MISMATCH,
      tenantMismatch: true
    });
  });

  it("classifies shadow error while legacy is ready", () => {
    const result = compareShadowDivergence({
      legacy: legacy(),
      shadow: shadow({ resolutionState: SHADOW_STATES.ERROR, error: { code: "UNKNOWN", operation: "resolveCourse", message: "secret", stack: "secret" } })
    });
    expect(result).toMatchObject({
      classification: CLASSIFICATIONS.DIVERGENCE,
      reason: DIVERGENCE_REASON_CODES.SHADOW_ERROR_WHILE_LEGACY_READY,
      shadowErrorCode: "UNKNOWN",
      shadowErrorOperation: "resolveCourse"
    });
    expect(result).not.toHaveProperty("message");
    expect(result).not.toHaveProperty("stack");
    assertSafeRecord(result);
  });

  it("keeps enrollment-semantic states non-comparable to legacy empty", () => {
    for (const resolutionState of [
      SHADOW_STATES.NOT_REQUIRED,
      SHADOW_STATES.NO_ENROLLMENT,
      SHADOW_STATES.SELECTION_REQUIRED,
      SHADOW_STATES.COURSE_UNAVAILABLE
    ]) {
      expect(compareShadowDivergence({ legacy: legacy({ levels: [] }), shadow: shadow({ resolutionState }) }).classification).toBe(CLASSIFICATIONS.NOT_COMPARABLE_YET);
    }
  });

  it("does not compare generic legacy errors with shadow errors", () => {
    const result = compareShadowDivergence({
      legacy: legacy({ error: "private legacy error" }),
      shadow: shadow({ resolutionState: SHADOW_STATES.ERROR, error: { code: "UNKNOWN", operation: "resolveCourse" } })
    });
    expect(result.classification).toBe(CLASSIFICATIONS.NOT_COMPARABLE_YET);
    expect(result).not.toHaveProperty("error");
  });

  it("defaults ambiguous combinations to non-comparable", () => {
    expect(compareShadowDivergence({ legacy: legacy({ levels: [] }), shadow: shadow() }).classification).toBe(CLASSIFICATIONS.NOT_COMPARABLE_YET);
    expect(compareShadowDivergence({ legacy: "invalid", shadow: { shadowState: "invalid", resolutionState: null } }).classification).toBe(CLASSIFICATIONS.NOT_COMPARABLE_YET);
  });

  it("returns deterministic safe signatures", () => {
    const result = compareShadowDivergence({ legacy: legacy(), shadow: shadow(), tenantMismatch: true });
    expect(getSafeObservationSignature(result)).toBe(getSafeObservationSignature({ ...result, courseId: "not included" }));
  });

  it("deduplicates identical divergence observations but keeps distinct reasons", () => {
    const sink = vi.fn();
    const observer = createDivergenceObserver(sink);
    const tenantMismatch = compareShadowDivergence({ legacy: legacy(), shadow: shadow(), tenantMismatch: true });
    const shadowError = compareShadowDivergence({
      legacy: legacy(),
      shadow: shadow({ resolutionState: SHADOW_STATES.ERROR, error: { code: "UNKNOWN", operation: "resolveCourse" } })
    });

    expect(observer.observe(tenantMismatch)).toBe(true);
    expect(observer.observe(tenantMismatch)).toBe(false);
    expect(observer.observe(shadowError)).toBe(true);
    expect(sink).toHaveBeenCalledTimes(2);
    assertSafeRecord(sink.mock.calls[0][0]);
    assertSafeRecord(sink.mock.calls[1][0]);
  });

  it("never emits MATCH or NOT_COMPARABLE_YET observations", () => {
    const sink = vi.fn();
    const observer = createDivergenceObserver(sink);
    expect(observer.observe(compareShadowDivergence({ legacy: legacy(), shadow: shadow() }))).toBe(false);
    expect(observer.observe(compareShadowDivergence({ legacy: legacy({ loading: true }), shadow: shadow() }))).toBe(false);
    expect(sink).not.toHaveBeenCalled();
  });
});
