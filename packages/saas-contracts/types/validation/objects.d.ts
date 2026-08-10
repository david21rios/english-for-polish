export function isPlainObject(value: unknown): value is Record<string, unknown>;
export function hasExactKeys(value: unknown, keys: readonly string[]): boolean;
export function hasRequiredKeys(value: unknown, keys: readonly string[]): boolean;
export function isEnumValue(value: unknown, enumObject: Readonly<Record<string, unknown>>): boolean;
export function isCanonicalBcp47(value: unknown): boolean;
