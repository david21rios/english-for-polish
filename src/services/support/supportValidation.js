// src/services/support/supportValidation.js

const EMAIL_PATTERN =
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const SUPPORT_CATEGORIES = Object.freeze([
  {
    value: "technical",
    label: "Problem techniczny"
  },
  {
    value: "account",
    label: "Problem z kontem"
  },
  {
    value: "course",
    label: "Pytanie dotyczące kursu"
  },
  {
    value: "suggestion",
    label: "Sugestia"
  },
  {
    value: "bug",
    label: "Zgłoszenie błędu"
  },
  {
    value: "other",
    label: "Inne"
  }
]);

export const SUPPORT_PRIORITIES = Object.freeze([
  "low",
  "normal",
  "high"
]);

const PUBLIC_NAME_MAX_LENGTH = 80;
const EMAIL_MAX_LENGTH = 120;
const SUBJECT_MAX_LENGTH = 120;
const MESSAGE_MAX_LENGTH = 1000;

const PUBLIC_MESSAGE_MIN_LENGTH = 10;
const SUPPORT_MESSAGE_MIN_LENGTH = 20;
const SUBJECT_MIN_LENGTH = 4;

/**
 * Converts an unknown value to a trimmed string.
 *
 * @param {unknown} value
 * @returns {string}
 */
export const normalizeSupportText = (
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
 * Normalizes an email address.
 *
 * @param {unknown} value
 * @returns {string}
 */
export const normalizeSupportEmail = (
  value
) => {
  return normalizeSupportText(
    value
  ).toLowerCase();
};

/**
 * Determines whether an email address has
 * a valid basic structure.
 *
 * @param {unknown} value
 * @returns {boolean}
 */
export const isValidSupportEmail = (
  value
) => {
  const email =
    normalizeSupportEmail(
      value
    );

  return EMAIL_PATTERN.test(
    email
  );
};

/**
 * Determines whether a support category
 * is supported by the application.
 *
 * @param {unknown} value
 * @returns {boolean}
 */
export const isValidSupportCategory = (
  value
) => {
  const normalizedCategory =
    normalizeSupportText(
      value
    );

  return SUPPORT_CATEGORIES.some(
    (category) =>
      category.value ===
      normalizedCategory
  );
};

/**
 * Determines whether a priority value
 * is supported.
 *
 * @param {unknown} value
 * @returns {boolean}
 */
export const isValidSupportPriority = (
  value
) => {
  const normalizedPriority =
    normalizeSupportText(
      value
    );

  return SUPPORT_PRIORITIES.includes(
    normalizedPriority
  );
};

/**
 * Validates a public contact message.
 *
 * @param {{
 *   name?: unknown,
 *   email?: unknown,
 *   message?: unknown
 * }} data
 * @returns {{
 *   isValid: boolean,
 *   errors: {
 *     name?: string,
 *     email?: string,
 *     message?: string
 *   },
 *   values: {
 *     name: string,
 *     email: string,
 *     message: string
 *   }
 * }}
 */
export const validatePublicMessage = (
  data = {}
) => {
  const name =
    normalizeSupportText(
      data.name
    );

  const email =
    normalizeSupportEmail(
      data.email
    );

  const message =
    normalizeSupportText(
      data.message
    );

  const errors = {};

  if (!name) {
    errors.name =
      "Wpisz imię i nazwisko.";
  } else if (
    name.length >
    PUBLIC_NAME_MAX_LENGTH
  ) {
    errors.name =
      `Imię i nazwisko może mieć maksymalnie ${PUBLIC_NAME_MAX_LENGTH} znaków.`;
  }

  if (!email) {
    errors.email =
      "Wpisz adres e-mail.";
  } else if (
    email.length >
    EMAIL_MAX_LENGTH
  ) {
    errors.email =
      `Adres e-mail może mieć maksymalnie ${EMAIL_MAX_LENGTH} znaków.`;
  } else if (
    !isValidSupportEmail(
      email
    )
  ) {
    errors.email =
      "Wpisz poprawny adres e-mail.";
  }

  if (!message) {
    errors.message =
      "Wpisz wiadomość.";
  } else if (
    message.length <
    PUBLIC_MESSAGE_MIN_LENGTH
  ) {
    errors.message =
      `Wiadomość musi zawierać co najmniej ${PUBLIC_MESSAGE_MIN_LENGTH} znaków.`;
  } else if (
    message.length >
    MESSAGE_MAX_LENGTH
  ) {
    errors.message =
      `Wiadomość może mieć maksymalnie ${MESSAGE_MAX_LENGTH} znaków.`;
  }

  return {
    isValid:
      Object.keys(errors).length === 0,

    errors,

    values: {
      name,
      email,
      message
    }
  };
};

/**
 * Validates a support ticket created by
 * an authenticated user.
 *
 * @param {{
 *   category?: unknown,
 *   subject?: unknown,
 *   message?: unknown,
 *   priority?: unknown
 * }} data
 * @returns {{
 *   isValid: boolean,
 *   errors: {
 *     category?: string,
 *     subject?: string,
 *     message?: string,
 *     priority?: string
 *   },
 *   values: {
 *     category: string,
 *     subject: string,
 *     message: string,
 *     priority: string
 *   }
 * }}
 */
export const validateSupportTicket = (
  data = {}
) => {
  const category =
    normalizeSupportText(
      data.category
    );

  const subject =
    normalizeSupportText(
      data.subject
    );

  const message =
    normalizeSupportText(
      data.message
    );

  const priority =
    normalizeSupportText(
      data.priority
    ) || "normal";

  const errors = {};

  if (!category) {
    errors.category =
      "Wybierz kategorię.";
  } else if (
    !isValidSupportCategory(
      category
    )
  ) {
    errors.category =
      "Wybrana kategoria jest nieprawidłowa.";
  }

  if (!subject) {
    errors.subject =
      "Wpisz temat wiadomości.";
  } else if (
    subject.length <
    SUBJECT_MIN_LENGTH
  ) {
    errors.subject =
      `Temat musi zawierać co najmniej ${SUBJECT_MIN_LENGTH} znaki.`;
  } else if (
    subject.length >
    SUBJECT_MAX_LENGTH
  ) {
    errors.subject =
      `Temat może mieć maksymalnie ${SUBJECT_MAX_LENGTH} znaków.`;
  }

  if (!message) {
    errors.message =
      "Wpisz wiadomość.";
  } else if (
    message.length <
    SUPPORT_MESSAGE_MIN_LENGTH
  ) {
    errors.message =
      `Wiadomość musi zawierać co najmniej ${SUPPORT_MESSAGE_MIN_LENGTH} znaków.`;
  } else if (
    message.length >
    MESSAGE_MAX_LENGTH
  ) {
    errors.message =
      `Wiadomość może mieć maksymalnie ${MESSAGE_MAX_LENGTH} znaków.`;
  }

  if (
    !isValidSupportPriority(
      priority
    )
  ) {
    errors.priority =
      "Wybrany priorytet jest nieprawidłowy.";
  }

  return {
    isValid:
      Object.keys(errors).length === 0,

    errors,

    values: {
      category,
      subject,
      message,
      priority
    }
  };
};

/**
 * Returns a user-facing message for support-related
 * service and Firebase errors.
 *
 * @param {unknown} error
 * @returns {string}
 */
export const getFriendlySupportError = (
  error
) => {
  const errorCode =
    error &&
    typeof error === "object" &&
    typeof error.code === "string"
      ? error.code
      : "";

  const messagesByCode = {
    "permission-denied":
      "Nie masz uprawnień do wysłania tej wiadomości.",

    "unavailable":
      "Usługa jest chwilowo niedostępna. Spróbuj ponownie później.",

    "network-request-failed":
      "Sprawdź połączenie z internetem i spróbuj ponownie.",

    "resource-exhausted":
      "Osiągnięto chwilowy limit wysyłania wiadomości. Spróbuj ponownie później."
  };

  if (
    messagesByCode[
      errorCode
    ]
  ) {
    return messagesByCode[
      errorCode
    ];
  }

  const message =
    error instanceof Error
      ? error.message
      : "";

  if (
    message.includes(
      "authenticated user is required"
    )
  ) {
    return "Musisz być zalogowany, aby wysłać zgłoszenie.";
  }

  return "Nie udało się wysłać wiadomości. Spróbuj ponownie później.";
};

export default {
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
};