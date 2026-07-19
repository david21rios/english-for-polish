// src/components/topics/admin/themeValidation.js

export const THEME_LIMITS = {
  titleMin: 3,
  titleMax: 60,
  descriptionMin: 20,
  descriptionMax: 300
};

export const normalizeThemeTitle = (value = "") => {
  return String(value)
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("en-US");
};

export const normalizeThemeFormData = (themeForm = {}) => {
  return {
    icon: String(themeForm.icon || "").trim(),

    title: String(themeForm.title || "")
      .trim()
      .replace(/\s+/g, " "),

    description: String(themeForm.description || "").trim(),

    numero: Number(themeForm.numero)
  };
};

export const validateThemeForm = ({
  themeForm,
  themes = [],
  editingId = null
}) => {
  const normalizedTheme = normalizeThemeFormData(themeForm);

  if (!normalizedTheme.icon) {
    return "Wybierz ikonę tematu.";
  }

  if (!normalizedTheme.title) {
    return "Tytuł tematu jest wymagany.";
  }

  if (normalizedTheme.title.length < THEME_LIMITS.titleMin) {
    return `Tytuł tematu musi zawierać co najmniej ${THEME_LIMITS.titleMin} znaki.`;
  }

  if (normalizedTheme.title.length > THEME_LIMITS.titleMax) {
    return `Tytuł tematu może zawierać maksymalnie ${THEME_LIMITS.titleMax} znaków.`;
  }

  if (!normalizedTheme.description) {
    return "Opis tematu jest wymagany.";
  }

  if (
    normalizedTheme.description.length <
    THEME_LIMITS.descriptionMin
  ) {
    return `Opis tematu musi zawierać co najmniej ${THEME_LIMITS.descriptionMin} znaków.`;
  }

  if (
    normalizedTheme.description.length >
    THEME_LIMITS.descriptionMax
  ) {
    return `Opis tematu może zawierać maksymalnie ${THEME_LIMITS.descriptionMax} znaków.`;
  }

  if (
    !Number.isInteger(normalizedTheme.numero) ||
    normalizedTheme.numero <= 0
  ) {
    return "Numer tematu musi być dodatnią liczbą całkowitą.";
  }

  const duplicatedNumber = themes.find(
    (theme) =>
      theme.id !== editingId &&
      Number(theme.numero) === normalizedTheme.numero
  );

  if (duplicatedNumber) {
    return `Numer tematu ${normalizedTheme.numero} jest już używany przez temat „${
      duplicatedNumber.title || "bez nazwy"
    }”.`;
  }

  const normalizedTitle = normalizeThemeTitle(
    normalizedTheme.title
  );

  const duplicatedTitle = themes.find(
    (theme) =>
      theme.id !== editingId &&
      normalizeThemeTitle(theme.title) === normalizedTitle
  );

  if (duplicatedTitle) {
    return `Temat o tytule „${
      duplicatedTitle.title || normalizedTheme.title
    }” już istnieje.`;
  }

  return "";
};

export const isThemeNumberDuplicated = ({
  numero,
  themes = [],
  editingId = null
}) => {
  const numberValue = Number(numero);

  if (!Number.isInteger(numberValue) || numberValue <= 0) {
    return false;
  }

  return themes.some(
    (theme) =>
      theme.id !== editingId &&
      Number(theme.numero) === numberValue
  );
};

export const isThemeTitleDuplicated = ({
  title,
  themes = [],
  editingId = null
}) => {
  const normalizedTitle = normalizeThemeTitle(title);

  if (!normalizedTitle) {
    return false;
  }

  return themes.some(
    (theme) =>
      theme.id !== editingId &&
      normalizeThemeTitle(theme.title) === normalizedTitle
  );
};