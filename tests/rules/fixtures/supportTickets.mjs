import { validServerTimestamp, withOverrides } from "../helpers/testPayloads.mjs";

export const SUPPORT_CATEGORIES = Object.freeze([
  "technical", "account", "course", "suggestion", "bug", "other",
]);

export const validSupportTicket = (overrides = {}) => withOverrides({
  userId: "support-user-01",
  userEmail: "support-user@example.test",
  userName: "Synthetic Support User",
  category: "technical",
  subject: "Synthetic support subject",
  message: "Synthetic support message with enough length",
  priority: "normal",
  status: "open",
  source: "authenticated-support",
  createdAt: validServerTimestamp(),
  updatedAt: validServerTimestamp(),
}, overrides);
