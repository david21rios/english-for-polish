// src/components/login/loginValidation.js

/**
 * Normalizes an email address before validation.
 *
 * @param {string} email
 * @returns {string}
 */
export const normalizeEmail = (email = "") => {
  return String(email)
    .trim()
    .toLowerCase();
};

/**
 * Validates the login form.
 *
 * @param {object} data
 * @param {string} data.email
 * @param {string} data.password
 * @returns {{
 *   isValid:boolean,
 *   message:string,
 *   normalizedEmail:string
 * }}
 */
export const validateLoginForm = ({
  email = "",
  password = ""
}) => {
  const normalizedEmail =
    normalizeEmail(email);

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

  if (!emailRegex.test(normalizedEmail)) {
    return {
      isValid: false,
      normalizedEmail,
      message:
        "Wprowadź prawidłowy adres e-mail."
    };
  }

  if (!password.trim()) {
    return {
      isValid: false,
      normalizedEmail,
      message:
        "Hasło jest wymagane."
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
 * user-friendly messages.
 *
 * @param {string} errorCode
 * @returns {string}
 */
export const getFriendlyLoginError = (
  errorCode = ""
) => {
  switch (errorCode) {
    case "auth/invalid-email":
      return "Nieprawidłowy adres e-mail.";

    case "auth/user-disabled":
      return "To konto zostało wyłączone.";

    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Nieprawidłowy adres e-mail lub hasło.";

    case "auth/too-many-requests":
      return "Zbyt wiele nieudanych prób logowania. Spróbuj ponownie za kilka minut.";

    case "auth/network-request-failed":
      return "Brak połączenia z Internetem.";

    case "auth/internal-error":
      return "Wystąpił nieoczekiwany błąd. Spróbuj ponownie.";

    default:
      return "Nie udało się zalogować. Spróbuj ponownie.";
  }
};

/**
 * Determines whether the user should be redirected
 * after authentication.
 *
 * @param {string|null} fromPath
 * @returns {string}
 */
export const resolveRedirectPath = (
  fromPath
) => {
  const forbiddenPaths = [
    "/welcome",
    "/register",
    "/forgot-password"
  ];

  if (
    !fromPath ||
    forbiddenPaths.includes(fromPath)
  ) {
    return "/home";
  }

  return fromPath;
};

export default {
  normalizeEmail,
  validateLoginForm,
  getFriendlyLoginError,
  resolveRedirectPath
};