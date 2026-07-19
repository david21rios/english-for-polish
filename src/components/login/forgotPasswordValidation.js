// src/components/login/forgotPasswordValidation.js

/**
 * Normalizes an email address before validation
 * and before sending it to Firebase Authentication.
 *
 * @param {string} email
 * @returns {string}
 */
export const normalizeForgotPasswordEmail = (
  email = ""
) => {
  return String(email)
    .trim()
    .toLowerCase();
};

/**
 * Validates the forgot password form.
 *
 * @param {object} data
 * @param {string} data.email
 * @returns {{
 *   isValid: boolean,
 *   message: string,
 *   normalizedEmail: string
 * }}
 */
export const validateForgotPasswordForm = ({
  email = ""
}) => {
  const normalizedEmail =
    normalizeForgotPasswordEmail(email);

  if (!normalizedEmail) {
    return {
      isValid: false,
      normalizedEmail,
      message:
        "Adres e-mail jest wymagany."
    };
  }

  const emailRegex =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (
    !emailRegex.test(
      normalizedEmail
    )
  ) {
    return {
      isValid: false,
      normalizedEmail,
      message:
        "Wprowadź prawidłowy adres e-mail."
    };
  }

  return {
    isValid: true,
    normalizedEmail,
    message: ""
  };
};

/**
 * Converts Firebase Authentication errors into
 * user-friendly Polish messages.
 *
 * For security reasons, errors related to whether
 * an account exists should not reveal that information.
 *
 * @param {string} errorCode
 * @returns {string}
 */
export const getFriendlyForgotPasswordError = (
  errorCode = ""
) => {
  switch (errorCode) {
    case "auth/invalid-email":
      return "Adres e-mail jest nieprawidłowy.";

    case "auth/user-disabled":
      return "To konto zostało wyłączone.";

    case "auth/too-many-requests":
      return "Wysłano zbyt wiele żądań. Odczekaj chwilę i spróbuj ponownie.";

    case "auth/network-request-failed":
      return "Nie udało się połączyć z Internetem. Sprawdź połączenie i spróbuj ponownie.";

    case "auth/operation-not-allowed":
      return "Odzyskiwanie hasła jest obecnie niedostępne.";

    case "auth/missing-email":
      return "Adres e-mail jest wymagany.";

    case "auth/internal-error":
      return "Wystąpił nieoczekiwany błąd. Spróbuj ponownie.";

    default:
      return "Nie udało się wysłać wiadomości. Spróbuj ponownie.";
  }
};

/**
 * Returns a generic success message.
 *
 * The message intentionally does not confirm whether
 * an account exists for the provided email address.
 *
 * @returns {string}
 */
export const getForgotPasswordSuccessMessage =
  () => {
    return (
      "Jeśli konto powiązane z tym adresem e-mail istnieje, " +
      "wysłaliśmy wiadomość z linkiem do zresetowania hasła. " +
      "Sprawdź również folder spam."
    );
  };

export default {
  normalizeForgotPasswordEmail,
  validateForgotPasswordForm,
  getFriendlyForgotPasswordError,
  getForgotPasswordSuccessMessage
};