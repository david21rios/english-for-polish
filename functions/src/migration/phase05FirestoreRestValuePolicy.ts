export const PHASE05_FIRESTORE_REST_VALUE_POLICY_VERSION = "phase05-firestore-rest-value-v1" as const;

export const PHASE05_FIRESTORE_REST_VALUE_DISCRIMINATORS = Object.freeze([
  "arrayValue",
  "booleanValue",
  "bytesValue",
  "doubleValue",
  "geoPointValue",
  "integerValue",
  "mapValue",
  "nullValue",
  "referenceValue",
  "stringValue",
  "timestampValue",
] as const);

export type Phase05FirestoreRestValueProviderType = (typeof PHASE05_FIRESTORE_REST_VALUE_DISCRIMINATORS)[number];

export const PHASE05_FIRESTORE_REST_VALUE_FAILURE_CODES = Object.freeze([
  "REST_VALUE_ZERO_DISCRIMINATORS",
  "REST_VALUE_MULTIPLE_DISCRIMINATORS",
  "REST_VALUE_UNKNOWN_DISCRIMINATOR",
  "REST_VALUE_EXTRA_PROPERTY",
  "REST_VALUE_MALFORMED_VARIANT",
  "FIRESTORE_DOUBLE_REPRESENTATION_UNSUPPORTED_BY_PHASE05_POLICY",
  "REST_VALUE_INVALID_NESTED_VALUE",
  "REST_VALUE_DEPTH_EXCEEDED",
  "REST_VALUE_NODE_COUNT_EXCEEDED",
  "REST_VALUE_CYCLIC_OR_NON_JSON_GRAPH",
  "KNOWN_FIELD_PROVIDER_TYPE_MISMATCH",
  "KNOWN_FIELD_VALUE_INVALID",
] as const);

export type Phase05FirestoreRestValueFailureCode = (typeof PHASE05_FIRESTORE_REST_VALUE_FAILURE_CODES)[number];

export const MAX_REST_VALUE_RECURSION_DEPTH = 20;
export const MAX_REST_VALUE_NODE_COUNT = 4096;
export const MAX_REST_VALUE_NODE_COUNT_PAIR = 8192;

export type Phase05FirestoreRestValueValidationState = {
  readonly seen: WeakSet<object>;
  nodeCount: number;
};

export type Phase05FirestoreRestValueResult = Readonly<
  | { ok: true; providerType: Phase05FirestoreRestValueProviderType; nodeCount: number }
  | { ok: false; failureCode: Phase05FirestoreRestValueFailureCode }
>;

export type Phase05FirestoreKnownScalar = string | number | boolean | null;

export type Phase05FirestoreKnownScalarResult = Readonly<
  | { ok: true; providerType: Phase05FirestoreRestValueProviderType; value: Phase05FirestoreKnownScalar }
  | { ok: false; failureCode: Phase05FirestoreRestValueFailureCode }
>;

const discriminatorSet = new Set<string>(PHASE05_FIRESTORE_REST_VALUE_DISCRIMINATORS);
const integerPattern = /^(?:0|-[1-9][0-9]*|[1-9][0-9]*)$/u;
const timestampPattern = /^(\d{4})-(\d{2})-(\d{2})[Tt](\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,9}))?([Zz]|([+-])(\d{2}):(\d{2}))$/u;
const base64UrlPaddedPattern = /^(?:[A-Za-z0-9_-]{4})*(?:[A-Za-z0-9_-]{2}==|[A-Za-z0-9_-]{3}=)?$/u;

const failure = (failureCode: Phase05FirestoreRestValueFailureCode): Phase05FirestoreRestValueResult => ({
  ok: false,
  failureCode,
});

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return false;
  if (Object.getOwnPropertySymbols(value).length !== 0) return false;
  return Object.getOwnPropertyNames(value).every((key) => {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    return descriptor !== undefined && descriptor.enumerable && Object.hasOwn(descriptor, "value");
  });
};

const isValidTimestamp = (value: string): boolean => {
  const match = timestampPattern.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6]);
  if (year < 1 || month < 1 || month > 12 || hour > 23 || minute > 59 || second > 59) return false;
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const monthDays = daysInMonth[month - 1];
  if (monthDays === undefined || day < 1 || day > monthDays) return false;
  if (match[8] !== "Z" && match[8] !== "z") {
    const offsetHour = Number(match[10]);
    const offsetMinute = Number(match[11]);
    if (offsetHour > 23 || offsetMinute > 59) return false;
  }
  return true;
};

const isValidReference = (value: string): boolean => {
  const segments = value.split("/");
  if (segments.some((segment) => segment.length === 0)) return false;
  if (segments.length < 7
    || segments[0] !== "projects"
    || segments[1] === undefined
    || segments[2] !== "databases"
    || segments[3] === undefined
    || segments[4] !== "documents") return false;
  const documentPathSegmentCount = segments.length - 5;
  return documentPathSegmentCount >= 2 && documentPathSegmentCount % 2 === 0;
};

const isCanonicalPaddedBase64Url = (value: string): boolean => {
  if (!base64UrlPaddedPattern.test(value)) return false;
  if (value.length === 0) return true;
  try {
    const unpadded = value.replace(/=+$/u, "");
    const bytes = Buffer.from(unpadded, "base64url");
    const encoded = bytes.toString("base64url");
    const padded = encoded + "=".repeat((4 - (encoded.length % 4)) % 4);
    return padded === value;
  } catch {
    return false;
  }
};

export const createPhase05FirestoreRestValueValidationState = (): Phase05FirestoreRestValueValidationState => ({
  seen: new WeakSet<object>(),
  nodeCount: 0,
});

const validateNested = (
  value: unknown,
  state: Phase05FirestoreRestValueValidationState,
  depth: number,
): Phase05FirestoreRestValueResult => {
  const initialNodeCount = state.nodeCount;
  if (!isPlainObject(value)) return failure("REST_VALUE_MALFORMED_VARIANT");
  if (state.seen.has(value)) return failure("REST_VALUE_CYCLIC_OR_NON_JSON_GRAPH");
  state.seen.add(value);
  state.nodeCount += 1;
  if (state.nodeCount > MAX_REST_VALUE_NODE_COUNT) return failure("REST_VALUE_NODE_COUNT_EXCEEDED");

  const keys = Object.keys(value);
  if (keys.length === 0) return failure("REST_VALUE_ZERO_DISCRIMINATORS");
  const recognized = keys.filter((key) => discriminatorSet.has(key)) as Phase05FirestoreRestValueProviderType[];
  if (recognized.length === 0) return failure("REST_VALUE_UNKNOWN_DISCRIMINATOR");
  if (recognized.length > 1) return failure("REST_VALUE_MULTIPLE_DISCRIMINATORS");
  if (keys.length !== 1) return failure("REST_VALUE_EXTRA_PROPERTY");

  const providerType = recognized[0];
  if (providerType === undefined) return failure("REST_VALUE_ZERO_DISCRIMINATORS");
  const payload = value[providerType];
  const malformed = (): Phase05FirestoreRestValueResult => failure("REST_VALUE_MALFORMED_VARIANT");

  if (providerType === "nullValue") return payload === null ? { ok: true, providerType, nodeCount: state.nodeCount - initialNodeCount } : malformed();
  if (providerType === "booleanValue") return typeof payload === "boolean" ? { ok: true, providerType, nodeCount: state.nodeCount - initialNodeCount } : malformed();
  if (providerType === "integerValue") {
    if (typeof payload !== "string" || !integerPattern.test(payload)) return malformed();
    try {
      const integer = BigInt(payload);
      if (integer < -9223372036854775808n || integer > 9223372036854775807n) return malformed();
    } catch {
      return malformed();
    }
    return { ok: true, providerType, nodeCount: state.nodeCount - initialNodeCount };
  }
  if (providerType === "doubleValue") {
    return typeof payload === "number" && Number.isFinite(payload)
      ? { ok: true, providerType, nodeCount: state.nodeCount - initialNodeCount }
      : failure("FIRESTORE_DOUBLE_REPRESENTATION_UNSUPPORTED_BY_PHASE05_POLICY");
  }
  if (providerType === "timestampValue") {
    return typeof payload === "string" && isValidTimestamp(payload)
      ? { ok: true, providerType, nodeCount: state.nodeCount - initialNodeCount }
      : malformed();
  }
  if (providerType === "stringValue") {
    return typeof payload === "string" ? { ok: true, providerType, nodeCount: state.nodeCount - initialNodeCount } : malformed();
  }
  if (providerType === "bytesValue") {
    return typeof payload === "string" && isCanonicalPaddedBase64Url(payload)
      ? { ok: true, providerType, nodeCount: state.nodeCount - initialNodeCount }
      : malformed();
  }
  if (providerType === "referenceValue") {
    return typeof payload === "string" && isValidReference(payload)
      ? { ok: true, providerType, nodeCount: state.nodeCount - initialNodeCount }
      : malformed();
  }
  if (providerType === "geoPointValue") {
    if (!isPlainObject(payload)) return malformed();
    if (state.seen.has(payload)) return failure("REST_VALUE_CYCLIC_OR_NON_JSON_GRAPH");
    state.seen.add(payload);
    const geoKeys = Object.keys(payload).sort();
    if (geoKeys.length !== 2 || geoKeys[0] !== "latitude" || geoKeys[1] !== "longitude") {
      return failure("REST_VALUE_EXTRA_PROPERTY");
    }
    const latitude = payload.latitude;
    const longitude = payload.longitude;
    if (typeof latitude !== "number" || !Number.isFinite(latitude)
      || typeof longitude !== "number" || !Number.isFinite(longitude)
      || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return malformed();
    return { ok: true, providerType, nodeCount: state.nodeCount - initialNodeCount };
  }
  if (providerType === "arrayValue") {
    if (depth + 1 > MAX_REST_VALUE_RECURSION_DEPTH) return failure("REST_VALUE_DEPTH_EXCEEDED");
    if (!isPlainObject(payload)) return malformed();
    if (state.seen.has(payload)) return failure("REST_VALUE_CYCLIC_OR_NON_JSON_GRAPH");
    state.seen.add(payload);
    const payloadKeys = Object.keys(payload);
    if (payloadKeys.length !== 1 || payloadKeys[0] !== "values") return failure("REST_VALUE_EXTRA_PROPERTY");
    if (!Array.isArray(payload.values) || Object.getPrototypeOf(payload.values) !== Array.prototype) return malformed();
    if (state.seen.has(payload.values)) return failure("REST_VALUE_CYCLIC_OR_NON_JSON_GRAPH");
    state.seen.add(payload.values);
    for (const child of payload.values) {
      const childResult = validateNested(child, state, depth + 1);
      if (!childResult.ok) return childResult;
      if (childResult.providerType === "arrayValue") return failure("REST_VALUE_INVALID_NESTED_VALUE");
    }
    return { ok: true, providerType, nodeCount: state.nodeCount - initialNodeCount };
  }
  if (providerType === "mapValue") {
    if (depth + 1 > MAX_REST_VALUE_RECURSION_DEPTH) return failure("REST_VALUE_DEPTH_EXCEEDED");
    if (!isPlainObject(payload)) return malformed();
    if (state.seen.has(payload)) return failure("REST_VALUE_CYCLIC_OR_NON_JSON_GRAPH");
    state.seen.add(payload);
    const payloadKeys = Object.keys(payload);
    if (payloadKeys.length !== 1 || payloadKeys[0] !== "fields") return failure("REST_VALUE_EXTRA_PROPERTY");
    if (!isPlainObject(payload.fields)) return malformed();
    if (state.seen.has(payload.fields)) return failure("REST_VALUE_CYCLIC_OR_NON_JSON_GRAPH");
    state.seen.add(payload.fields);
    for (const child of Object.values(payload.fields)) {
      const childResult = validateNested(child, state, depth + 1);
      if (!childResult.ok) return childResult;
    }
    return { ok: true, providerType, nodeCount: state.nodeCount - initialNodeCount };
  }
  return malformed();
};

export const validatePhase05FirestoreRestValue = (
  value: unknown,
  state: Phase05FirestoreRestValueValidationState = createPhase05FirestoreRestValueValidationState(),
): Phase05FirestoreRestValueResult => validateNested(value, state, 0);

export const readPhase05FirestoreKnownScalar = (
  value: unknown,
  allowedProviderTypes: readonly Phase05FirestoreRestValueProviderType[],
): Phase05FirestoreKnownScalarResult => {
  const validation = validatePhase05FirestoreRestValue(value);
  if (!validation.ok) return validation;
  if (!allowedProviderTypes.includes(validation.providerType)) {
    return { ok: false, failureCode: "KNOWN_FIELD_PROVIDER_TYPE_MISMATCH" };
  }
  if (!isPlainObject(value)) return { ok: false, failureCode: "KNOWN_FIELD_VALUE_INVALID" };
  const payload = value[validation.providerType];
  if (validation.providerType === "nullValue" && payload === null) return { ok: true, providerType: validation.providerType, value: null };
  if ((validation.providerType === "booleanValue" && typeof payload === "boolean")
    || (validation.providerType === "stringValue" && typeof payload === "string")
    || (validation.providerType === "doubleValue" && typeof payload === "number" && Number.isFinite(payload))) {
    return { ok: true, providerType: validation.providerType, value: payload };
  }
  if (validation.providerType === "integerValue" && typeof payload === "string") {
    const integer = BigInt(payload);
    if (integer < BigInt(Number.MIN_SAFE_INTEGER) || integer > BigInt(Number.MAX_SAFE_INTEGER)) {
      return { ok: false, failureCode: "KNOWN_FIELD_VALUE_INVALID" };
    }
    const number = Number(integer);
    if (!Number.isSafeInteger(number) || BigInt(number) !== integer) return { ok: false, failureCode: "KNOWN_FIELD_VALUE_INVALID" };
    return { ok: true, providerType: validation.providerType, value: number };
  }
  return { ok: false, failureCode: "KNOWN_FIELD_VALUE_INVALID" };
};
