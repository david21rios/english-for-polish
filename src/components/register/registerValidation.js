import { getAgeGroup } from "../../utils/ageGroup";

const MINIMUM_AGE = 5;
const MAXIMUM_AGE = 120;
const MINIMUM_PASSWORD_LENGTH = 6;

const COMMON_EMAIL_DOMAINS = [
  "gmail.com",
  "hotmail.com",
  "yahoo.com",
  "outlook.com",
  "icloud.com"
];

/**
 * Normalizes an email address before validation or registration.
 *
 * @param {string} email
 * @returns {string}
 */
export const normalizeEmail = (email = "") => {
  return email.trim().toLowerCase();
};

/**
 * Validates an email address and optionally returns a warning when its
 * domain is not included in the list of common email providers.
 *
 * @param {string} email
 * @returns {{
 *   isValid: boolean,
 *   message: string,
 *   warning: string
 * }}
 */
export const validateEmail = (email = "") => {
  const cleanEmail = normalizeEmail(email);

  if (!cleanEmail) {
    return {
      isValid: false,
      message: "",
      warning: ""
    };
  }

  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

  if (!emailRegex.test(cleanEmail)) {
    return {
      isValid: false,
      message: "Wprowadź poprawny adres e-mail.",
      warning: ""
    };
  }

  const domain = cleanEmail.split("@")[1];

  if (!COMMON_EMAIL_DOMAINS.includes(domain)) {
    return {
      isValid: true,
      message: "",
      warning:
        "Sprawdź, czy ten adres e-mail jest poprawny i czy masz do niego dostęp."
    };
  }

  return {
    isValid: true,
    message: "",
    warning: ""
  };
};

/**
 * Validates and normalizes the age entered in the registration form.
 *
 * @param {string | number} age
 * @returns {{
 *   isValid: boolean,
 *   numericAge: number | null,
 *   ageGroup: string | null,
 *   message: string
 * }}
 */
export const validateAge = (age) => {
  if (age === "" || age === null || age === undefined) {
    return {
      isValid: false,
      numericAge: null,
      ageGroup: null,
      message: "Wiek jest wymagany."
    };
  }

  const numericAge = Number(age);

  if (!Number.isInteger(numericAge)) {
    return {
      isValid: false,
      numericAge: null,
      ageGroup: null,
      message: "Wiek musi być liczbą całkowitą."
    };
  }

  if (numericAge < MINIMUM_AGE || numericAge > MAXIMUM_AGE) {
    return {
      isValid: false,
      numericAge,
      ageGroup: null,
      message: `Wprowadź wiek od ${MINIMUM_AGE} do ${MAXIMUM_AGE} lat.`
    };
  }

  const ageGroup = getAgeGroup(numericAge);

  if (!ageGroup || ageGroup === "invalid") {
    return {
      isValid: false,
      numericAge,
      ageGroup: null,
      message:
        "Minimalny wiek wymagany do korzystania z platformy wynosi 5 lat."
    };
  }

  return {
    isValid: true,
    numericAge,
    ageGroup,
    message: ""
  };
};

/**
 * Validates the password and password confirmation fields.
 *
 * @param {string} password
 * @param {string} confirmPassword
 * @returns {{
 *   isValid: boolean,
 *   message: string
 * }}
 */
export const validatePasswords = (
  password = "",
  confirmPassword = ""
) => {
  if (!password || !confirmPassword) {
    return {
      isValid: false,
      message: "Hasło i jego potwierdzenie są wymagane."
    };
  }

  if (password.length < MINIMUM_PASSWORD_LENGTH) {
    return {
      isValid: false,
      message: `Hasło musi zawierać co najmniej ${MINIMUM_PASSWORD_LENGTH} znaków.`
    };
  }

  if (password !== confirmPassword) {
    return {
      isValid: false,
      message: "Hasła nie są takie same."
    };
  }

  return {
    isValid: true,
    message: ""
  };
};

/**
 * Validates all registration fields and returns normalized data ready
 * to be passed to the authentication service.
 *
 * @param {{
 *   name: string,
 *   lastName: string,
 *   email: string,
 *   password: string,
 *   confirmPassword: string,
 *   country: string,
 *   age: string | number
 * }} formData
 *
 * @returns {{
 *   isValid: boolean,
 *   message: string,
 *   data: null | {
 *     name: string,
 *     lastName: string,
 *     email: string,
 *     password: string,
 *     country: string,
 *     age: number,
 *     ageGroup: string
 *   }
 * }}
 */
export const validateRegisterForm = ({
  name = "",
  lastName = "",
  email = "",
  password = "",
  confirmPassword = "",
  country = "",
  age = ""
}) => {
  const cleanName = name.trim();
  const cleanLastName = lastName.trim();
  const cleanEmail = normalizeEmail(email);
  const cleanCountry = country.trim().toUpperCase();

  if (
    !cleanName ||
    !cleanLastName ||
    !cleanEmail ||
    !password ||
    !confirmPassword ||
    !cleanCountry ||
    age === "" ||
    age === null ||
    age === undefined
  ) {
    return {
      isValid: false,
      message: "Wszystkie pola są wymagane.",
      data: null
    };
  }

  const emailValidation = validateEmail(cleanEmail);

  if (!emailValidation.isValid) {
    return {
      isValid: false,
      message: emailValidation.message,
      data: null
    };
  }

  const ageValidation = validateAge(age);

  if (!ageValidation.isValid) {
    return {
      isValid: false,
      message: ageValidation.message,
      data: null
    };
  }

  const passwordValidation = validatePasswords(
    password,
    confirmPassword
  );

  if (!passwordValidation.isValid) {
    return {
      isValid: false,
      message: passwordValidation.message,
      data: null
    };
  }

  return {
    isValid: true,
    message: "",
    data: {
      name: cleanName,
      lastName: cleanLastName,
      email: cleanEmail,
      password,
      country: cleanCountry,
      age: ageValidation.numericAge,
      ageGroup: ageValidation.ageGroup
    }
  };
};

/**
 * Converts Firebase Authentication error codes into user-friendly
 * Polish messages.
 *
 * @param {string} errorCode
 * @param {string} fallbackMessage
 * @returns {string}
 */
export const getFriendlyRegisterError = (
  errorCode,
  fallbackMessage = ""
) => {
  switch (errorCode) {
    case "auth/email-already-in-use":
      return "Konto z tym adresem e-mail już istnieje.";

    case "auth/invalid-email":
      return "Adres e-mail jest nieprawidłowy.";

    case "auth/weak-password":
      return "Hasło jest zbyt słabe. Użyj co najmniej 6 znaków.";

    case "auth/too-many-requests":
      return "Wykonano zbyt wiele prób. Poczekaj chwilę i spróbuj ponownie.";

    case "auth/network-request-failed":
      return "Nie udało się połączyć z siecią. Sprawdź połączenie internetowe.";

    case "auth/operation-not-allowed":
      return "Rejestracja za pomocą adresu e-mail jest obecnie niedostępna.";

    case "auth/internal-error":
      return "Wystąpił wewnętrzny błąd usługi. Spróbuj ponownie później.";

    default:
      return (
        fallbackMessage ||
        "Nie udało się utworzyć konta. Spróbuj ponownie."
      );
  }
};