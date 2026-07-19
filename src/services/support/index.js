// src/services/support/index.js

// Main service
export {
  default,
  createPublicMessage,
  createSupportTicket
} from "./supportService";

// Validation
export {
  SUPPORT_CATEGORIES,
  SUPPORT_PRIORITIES,
  normalizeSupportText,
  normalizeSupportEmail,
  isValidSupportEmail,
  isValidSupportCategory,
  isValidSupportPriority,
  validatePublicMessage,
  validateSupportTicket,
  getFriendlySupportError
} from "./supportValidation";