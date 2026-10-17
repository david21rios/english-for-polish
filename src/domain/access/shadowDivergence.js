export const LEGACY_STATES = Object.freeze({
  LOADING: "loading",
  ERROR: "error",
  READY_EMPTY: "ready_empty",
  READY: "ready"
});

export const SHADOW_STATES = Object.freeze({
  LOADING: "loading",
  NOT_REQUIRED: "not_required",
  NO_ENROLLMENT: "no_enrollment",
  SELECTION_REQUIRED: "selection_required",
  COURSE_UNAVAILABLE: "course_unavailable",
  READY: "ready",
  ERROR: "error"
});

export const CLASSIFICATIONS = Object.freeze({
  MATCH: "MATCH",
  DIVERGENCE: "DIVERGENCE",
  NOT_COMPARABLE_YET: "NOT_COMPARABLE_YET"
});

export const DIVERGENCE_REASON_CODES = Object.freeze({
  TENANT_MISMATCH: "TENANT_MISMATCH",
  SHADOW_ERROR_WHILE_LEGACY_READY: "SHADOW_ERROR_WHILE_LEGACY_READY"
});

const KNOWN_SHADOW_RESOLUTION_STATES = new Set([
  "idle",
  SHADOW_STATES.NOT_REQUIRED,
  SHADOW_STATES.NO_ENROLLMENT,
  SHADOW_STATES.SELECTION_REQUIRED,
  SHADOW_STATES.COURSE_UNAVAILABLE,
  SHADOW_STATES.READY,
  SHADOW_STATES.ERROR
]);

const safeScalar = (value) => (
  typeof value === "string" && value.length > 0 ? value : null
);

export const normalizeLegacyState = ({ loading = false, error = null, levels = [] } = {}) => {
  if (loading === true) return LEGACY_STATES.LOADING;
  if (error) return LEGACY_STATES.ERROR;
  return Array.isArray(levels) && levels.length > 0
    ? LEGACY_STATES.READY
    : LEGACY_STATES.READY_EMPTY;
};

export const normalizeShadowState = ({
  loading = false,
  resolved = false,
  resolutionState = null,
  error = null
} = {}) => {
  const normalizedResolutionState = KNOWN_SHADOW_RESOLUTION_STATES.has(resolutionState)
    ? resolutionState
    : null;

  if (
    loading === true ||
    resolved !== true ||
    normalizedResolutionState === null ||
    normalizedResolutionState === "idle"
  ) {
    return Object.freeze({
      shadowState: SHADOW_STATES.LOADING,
      resolutionState: normalizedResolutionState,
      shadowErrorCode: null,
      shadowErrorOperation: null
    });
  }

  return Object.freeze({
    shadowState: normalizedResolutionState,
    resolutionState: normalizedResolutionState,
    shadowErrorCode: normalizedResolutionState === SHADOW_STATES.ERROR
      ? safeScalar(error?.code)
      : null,
    shadowErrorOperation: normalizedResolutionState === SHADOW_STATES.ERROR
      ? safeScalar(error?.operation)
      : null
  });
};

const observation = ({
  classification,
  reason = null,
  legacyState,
  shadowState,
  resolutionState = null,
  tenantMismatch = false,
  shadowErrorCode = null,
  shadowErrorOperation = null
}) => Object.freeze({
  classification,
  reason,
  legacyState,
  shadowState,
  resolutionState,
  tenantMismatch: tenantMismatch === true,
  shadowErrorCode,
  shadowErrorOperation
});

export const compareShadowDivergence = ({
  legacy,
  shadow,
  tenantMismatch = false
} = {}) => {
  const legacyState = typeof legacy === "string"
    ? legacy
    : normalizeLegacyState(legacy);
  const normalizedShadow = shadow?.shadowState
    ? shadow
    : normalizeShadowState(shadow);

  const {
    shadowState,
    resolutionState,
    shadowErrorCode,
    shadowErrorOperation
  } = normalizedShadow;

  if (legacyState === LEGACY_STATES.LOADING && shadowState === SHADOW_STATES.LOADING) {
    return observation({
      classification: CLASSIFICATIONS.MATCH,
      legacyState,
      shadowState,
      resolutionState,
      tenantMismatch,
      shadowErrorCode,
      shadowErrorOperation
    });
  }

  if (legacyState === LEGACY_STATES.LOADING || shadowState === SHADOW_STATES.LOADING) {
    return observation({
      classification: CLASSIFICATIONS.NOT_COMPARABLE_YET,
      legacyState,
      shadowState,
      resolutionState,
      tenantMismatch,
      shadowErrorCode,
      shadowErrorOperation
    });
  }

  if (
    legacyState === LEGACY_STATES.READY &&
    shadowState === SHADOW_STATES.READY
  ) {
    return observation({
      classification: tenantMismatch === true
        ? CLASSIFICATIONS.DIVERGENCE
        : CLASSIFICATIONS.MATCH,
      reason: tenantMismatch === true
        ? DIVERGENCE_REASON_CODES.TENANT_MISMATCH
        : null,
      legacyState,
      shadowState,
      resolutionState,
      tenantMismatch,
      shadowErrorCode,
      shadowErrorOperation
    });
  }

  if (
    legacyState === LEGACY_STATES.READY &&
    shadowState === SHADOW_STATES.ERROR
  ) {
    return observation({
      classification: CLASSIFICATIONS.DIVERGENCE,
      reason: DIVERGENCE_REASON_CODES.SHADOW_ERROR_WHILE_LEGACY_READY,
      legacyState,
      shadowState,
      resolutionState,
      tenantMismatch,
      shadowErrorCode,
      shadowErrorOperation
    });
  }

  return observation({
    classification: CLASSIFICATIONS.NOT_COMPARABLE_YET,
    legacyState,
    shadowState,
    resolutionState,
    tenantMismatch,
    shadowErrorCode,
    shadowErrorOperation
  });
};

const SAFE_SIGNATURE_FIELDS = [
  "classification",
  "reason",
  "legacyState",
  "shadowState",
  "resolutionState",
  "tenantMismatch",
  "shadowErrorCode",
  "shadowErrorOperation"
];

export const getSafeObservationSignature = (value = {}) => JSON.stringify(
  SAFE_SIGNATURE_FIELDS.reduce((safe, field) => ({ ...safe, [field]: value[field] ?? null }), {})
);

export const createDivergenceObserver = (sink = () => {}) => {
  const seen = new Set();

  return Object.freeze({
    observe(value) {
      if (value?.classification !== CLASSIFICATIONS.DIVERGENCE) return false;

      const safeValue = observation(value);
      const signature = getSafeObservationSignature(safeValue);
      if (seen.has(signature)) return false;

      seen.add(signature);
      try {
        sink(safeValue);
      } catch {
        // Telemetry must never affect the legacy runtime.
      }
      return true;
    },
    hasSeen(value) {
      return seen.has(getSafeObservationSignature(value));
    }
  });
};
