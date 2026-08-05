export const isPlainObject = (value) => value !== null && typeof value === "object" &&
  !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;

export const hasExactKeys = (value, keys) => isPlainObject(value) &&
  Object.keys(value).length === keys.length &&
  keys.every((key) => Object.prototype.hasOwnProperty.call(value, key));

export const hasRequiredKeys = (value, keys) => isPlainObject(value) &&
  keys.every((key) => Object.prototype.hasOwnProperty.call(value, key));

export const isEnumValue = (value, enumObject) =>
  Object.values(enumObject).includes(value);

export const isCanonicalBcp47 = (value) => {
  if (typeof value !== "string" || !value || value !== value.trim()) return false;
  try {
    const [canonical] = Intl.getCanonicalLocales([value]);
    return canonical === value;
  } catch {
    return false;
  }
};
