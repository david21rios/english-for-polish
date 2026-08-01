import { Timestamp, serverTimestamp } from "firebase/firestore";

export const validServerTimestamp = () => serverTimestamp();
export const arbitraryTimestamp = () => Timestamp.fromMillis(946684800000);
export const repeated = (length, character = "x") => character.repeat(length);
export const withoutKey = (value, key) => {
  const copy = { ...value };
  delete copy[key];
  return copy;
};
export const withOverrides = (value, overrides = {}) => ({ ...value, ...overrides });
