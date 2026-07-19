// src/services/support/supportService.js

import {
  addDoc,
  collection,
  serverTimestamp
} from "firebase/firestore";

import {
  auth,
  db
} from "../../firebase";

const PUBLIC_MESSAGES_COLLECTION =
  "messages";

const SUPPORT_TICKETS_COLLECTION =
  "supportTickets";

const DEFAULT_TICKET_STATUS =
  "open";

const DEFAULT_TICKET_PRIORITY =
  "normal";

/**
 * Converts an unknown value to a trimmed string.
 *
 * @param {unknown} value
 * @returns {string}
 */
const normalizeText = (
  value
) => {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value).trim();
};

/**
 * Converts an email address to a normalized value.
 *
 * @param {unknown} value
 * @returns {string}
 */
const normalizeEmail = (
  value
) => {
  return normalizeText(value)
    .toLowerCase();
};

/**
 * Creates a readable service error while preserving
 * the original Firebase error code when available.
 *
 * @param {string} message
 * @param {unknown} error
 * @returns {Error}
 */
const createSupportServiceError = (
  message,
  error
) => {
  const originalMessage =
    error instanceof Error
      ? error.message
      : "Unknown error.";

  const serviceError =
    new Error(
      `${message}: ${originalMessage}`,
      {
        cause: error
      }
    );

  if (
    error &&
    typeof error === "object" &&
    typeof error.code === "string"
  ) {
    serviceError.code =
      error.code;
  }

  return serviceError;
};

/**
 * Saves a public message sent by a visitor
 * from the Welcome page.
 *
 * @param {{
 *   name: string,
 *   email: string,
 *   message: string
 * }} data
 * @returns {Promise<string>}
 */
export const createPublicMessage =
  async (
    data = {}
  ) => {
    try {
      const name =
        normalizeText(
          data.name
        );

      const email =
        normalizeEmail(
          data.email
        );

      const message =
        normalizeText(
          data.message
        );

      const documentReference =
        await addDoc(
          collection(
            db,
            PUBLIC_MESSAGES_COLLECTION
          ),
          {
            name,
            email,
            message,
            source: "welcome",
            userId: "anon",
            status: "new",
            createdAt:
              serverTimestamp(),
            updatedAt:
              serverTimestamp()
          }
        );

      return documentReference.id;
    } catch (error) {
      console.error(
        "Public message creation failed:",
        error
      );

      throw createSupportServiceError(
        "Could not create the public message",
        error
      );
    }
  };

/**
 * Saves a support ticket created by an
 * authenticated platform user.
 *
 * @param {{
 *   category: string,
 *   subject: string,
 *   message: string,
 *   priority?: string
 * }} data
 * @returns {Promise<string>}
 */
export const createSupportTicket =
  async (
    data = {}
  ) => {
    try {
      const currentUser =
        auth.currentUser;

      if (!currentUser) {
        throw new Error(
          "An authenticated user is required."
        );
      }

      const category =
        normalizeText(
          data.category
        );

      const subject =
        normalizeText(
          data.subject
        );

      const message =
        normalizeText(
          data.message
        );

      const priority =
        normalizeText(
          data.priority
        ) ||
        DEFAULT_TICKET_PRIORITY;

      const documentReference =
        await addDoc(
          collection(
            db,
            SUPPORT_TICKETS_COLLECTION
          ),
          {
            userId:
              currentUser.uid,

            userEmail:
              normalizeEmail(
                currentUser.email
              ),

            userName:
              normalizeText(
                currentUser.displayName
              ),

            category,
            subject,
            message,
            priority,
            status:
              DEFAULT_TICKET_STATUS,

            source:
              "authenticated-support",

            createdAt:
              serverTimestamp(),

            updatedAt:
              serverTimestamp()
          }
        );

      return documentReference.id;
    } catch (error) {
      console.error(
        "Support ticket creation failed:",
        error
      );

      throw createSupportServiceError(
        "Could not create the support ticket",
        error
      );
    }
  };

const supportService = {
  createPublicMessage,
  createSupportTicket
};

export default supportService;