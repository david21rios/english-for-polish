export function deepCopyJsonValue(value: unknown): unknown;
export function deepFreezeJsonValue<T>(value: T): Readonly<T>;
export function canonicalJsonStringify(value: unknown): string;
export function canonicalJsonUtf8(value: unknown): Uint8Array<ArrayBuffer>;
