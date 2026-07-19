// src/utils/errorHandling.js

const AUTH_ERROR_MESSAGES = {
  "auth/user-not-found":
    "Nie znaleziono konta powiązanego z tym adresem e-mail.",

  "auth/wrong-password":
    "Nieprawidłowe hasło.",

  "auth/invalid-credential":
    "Nieprawidłowy adres e-mail lub hasło.",

  "auth/email-already-in-use":
    "Ten adres e-mail jest już używany.",

  "auth/invalid-email":
    "Adres e-mail jest nieprawidłowy.",

  "auth/weak-password":
    "Hasło musi zawierać co najmniej 6 znaków.",

  "auth/network-request-failed":
    "Nie udało się połączyć z Internetem. Sprawdź połączenie i spróbuj ponownie.",

  "auth/too-many-requests":
    "Wykonano zbyt wiele prób. Odczekaj chwilę i spróbuj ponownie.",

  "auth/user-disabled":
    "To konto zostało wyłączone.",

  "auth/operation-not-allowed":
    "Ta operacja jest obecnie niedostępna.",

  "auth/popup-closed-by-user":
    "Okno zostało zamknięte przed zakończeniem operacji.",

  "auth/popup-blocked":
    "Przeglądarka zablokowała okno logowania.",

  "auth/cancelled-popup-request":
    "Operacja logowania została anulowana.",

  "auth/missing-email":
    "Adres e-mail jest wymagany.",

  "auth/missing-password":
    "Hasło jest wymagane.",

  "auth/requires-recent-login":
    "Ze względów bezpieczeństwa zaloguj się ponownie i spróbuj jeszcze raz.",

  "auth/email-not-verified":
    "Przed kontynuowaniem zweryfikuj swój adres e-mail.",

  "auth/internal-error":
    "Wystąpił wewnętrzny błąd uwierzytelniania."
};

const FIRESTORE_ERROR_MESSAGES = {
  "permission-denied":
    "Nie masz uprawnień do wykonania tej operacji.",

  "firestore/permission-denied":
    "Nie masz uprawnień do wykonania tej operacji.",

  "not-found":
    "Nie znaleziono żądanego dokumentu lub zasobu.",

  "firestore/not-found":
    "Nie znaleziono żądanego dokumentu lub zasobu.",

  "already-exists":
    "Ten dokument już istnieje.",

  "firestore/already-exists":
    "Ten dokument już istnieje.",

  "failed-precondition":
    "Nie można wykonać tej operacji w obecnym stanie.",

  "firestore/failed-precondition":
    "Nie można wykonać tej operacji w obecnym stanie.",

  "resource-exhausted":
    "Przekroczono dostępny limit zasobów. Spróbuj ponownie później.",

  "firestore/resource-exhausted":
    "Przekroczono dostępny limit zasobów. Spróbuj ponownie później.",

  "unavailable":
    "Usługa jest tymczasowo niedostępna. Spróbuj ponownie później.",

  "firestore/unavailable":
    "Usługa jest tymczasowo niedostępna. Spróbuj ponownie później.",

  "deadline-exceeded":
    "Operacja trwała zbyt długo. Spróbuj ponownie.",

  "firestore/deadline-exceeded":
    "Operacja trwała zbyt długo. Spróbuj ponownie.",

  "aborted":
    "Operacja została przerwana. Spróbuj ponownie.",

  "firestore/aborted":
    "Operacja została przerwana. Spróbuj ponownie."
};

const GENERAL_ERROR_MESSAGES = {
  "network-error":
    "Nie udało się połączyć z Internetem. Sprawdź połączenie i spróbuj ponownie.",

  "unknown-error":
    "Wystąpił nieoczekiwany błąd.",

  "invalid-input":
    "Wprowadzone dane są nieprawidłowe.",

  "server-error":
    "Wystąpił błąd serwera. Spróbuj ponownie później.",

  "insufficient-permissions":
    "Nie masz wystarczających uprawnień do wykonania tej operacji."
};

export const errorMessages = {
  ...AUTH_ERROR_MESSAGES,
  ...FIRESTORE_ERROR_MESSAGES,
  ...GENERAL_ERROR_MESSAGES
};

/**
 * Normalizes an error code so it can be matched
 * against the application error dictionary.
 *
 * @param {unknown} code
 * @returns {string}
 */
const normalizeErrorCode = (code) => {
  return typeof code === "string"
    ? code.trim().toLowerCase()
    : "";
};

/**
 * Returns a user-friendly Polish error message.
 *
 * @param {unknown} error
 * @param {string} fallbackMessage
 * @returns {string}
 */
export const handleError = (
  error,
  fallbackMessage = GENERAL_ERROR_MESSAGES["unknown-error"]
) => {
  console.error("Application error:", error);

  if (
    typeof navigator !== "undefined" &&
    navigator.onLine === false
  ) {
    return GENERAL_ERROR_MESSAGES["network-error"];
  }

  if (typeof error === "string") {
    const normalizedStringCode =
      normalizeErrorCode(error);

    return (
      errorMessages[normalizedStringCode] ||
      fallbackMessage
    );
  }

  if (
    error &&
    typeof error === "object"
  ) {
    const normalizedCode =
      normalizeErrorCode(error.code);

    if (
      normalizedCode &&
      errorMessages[normalizedCode]
    ) {
      return errorMessages[normalizedCode];
    }
  }

  return fallbackMessage;
};

export default handleError;