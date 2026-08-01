import { validServerTimestamp, withOverrides } from "../helpers/testPayloads.mjs";

export const validWelcomeMessage = (overrides = {}) => withOverrides({
  name: "Synthetic User",
  email: "synthetic@example.test",
  message: "Synthetic public message",
  source: "welcome",
  userId: "anon",
  status: "new",
  createdAt: validServerTimestamp(),
}, overrides);

export const validOrphanMessage = (overrides = {}) => validWelcomeMessage({
  updatedAt: validServerTimestamp(),
  ...overrides,
});
