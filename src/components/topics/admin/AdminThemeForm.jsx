// src/components/topics/admin/ThemeForm.jsx

import {
  FaSave,
  FaTimes
} from "react-icons/fa";

import { iconOptions } from "../../../utils/iconOptions";

import {
  THEME_LIMITS,
  isThemeNumberDuplicated,
  isThemeTitleDuplicated
} from "./themeValidation";

const ThemeForm = ({
  themeForm,
  themes,
  editingId,
  saving,
  onChange,
  onSubmit,
  onCancel
}) => {
  const duplicatedNumber =
    isThemeNumberDuplicated({
      numero: themeForm.numero,
      themes,
      editingId
    });

  const duplicatedTitle =
    isThemeTitleDuplicated({
      title: themeForm.title,
      themes,
      editingId
    });

  const titleLength = String(
    themeForm.title || ""
  ).length;

  const descriptionLength = String(
    themeForm.description || ""
  ).length;

  return (
    <section className="mb-8 rounded-3xl border border-gray-100 bg-white p-5 shadow-lg md:p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary-600">
            {editingId
              ? "Edycja tematu"
              : "Nowy temat"}
          </p>

          <h2 className="mt-1 text-2xl font-bold text-gray-900">
            {editingId
              ? "Edytuj temat"
              : "Utwórz temat"}
          </h2>
        </div>

        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50"
          aria-label="Zamknij formularz"
        >
          <FaTimes />
        </button>
      </div>

      <form
        onSubmit={onSubmit}
        className="space-y-5"
      >
        <div>
          <label
            htmlFor="theme-icon"
            className="mb-2 block text-sm font-semibold text-gray-700"
          >
            Ikona tematu
          </label>

          <select
            id="theme-icon"
            name="icon"
            value={themeForm.icon}
            onChange={onChange}
            required
            disabled={saving}
            className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">
              Wybierz ikonę...
            </option>

            {iconOptions.map((option) => (
              <option
                key={
                  option.id ||
                  `${option.icon}_${option.label}`
                }
                value={option.icon}
              >
                {option.icon} {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label
              htmlFor="theme-number"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Numer
            </label>

            <input
              id="theme-number"
              type="number"
              name="numero"
              min="1"
              step="1"
              required
              value={themeForm.numero}
              onChange={onChange}
              placeholder="Np. 1"
              disabled={saving}
              aria-invalid={duplicatedNumber}
              className={`w-full rounded-2xl border px-4 py-3 focus:outline-none focus:ring-2 ${
                duplicatedNumber
                  ? "border-red-300 bg-red-50 focus:ring-red-200"
                  : "border-gray-300 focus:ring-primary-500"
              }`}
            />

            {duplicatedNumber && (
              <p className="mt-2 text-sm font-medium text-red-600">
                Ten numer jest już używany.
              </p>
            )}
          </div>

          <div className="md:col-span-2">
            <div className="mb-2 flex items-center justify-between gap-3">
              <label
                htmlFor="theme-title"
                className="block text-sm font-semibold text-gray-700"
              >
                Tytuł
              </label>

              <span
                className={`text-xs ${
                  titleLength >
                  THEME_LIMITS.titleMax
                    ? "text-red-600"
                    : "text-gray-500"
                }`}
              >
                {titleLength}/
                {THEME_LIMITS.titleMax}
              </span>
            </div>

            <input
              id="theme-title"
              type="text"
              name="title"
              required
              minLength={
                THEME_LIMITS.titleMin
              }
              maxLength={
                THEME_LIMITS.titleMax
              }
              value={themeForm.title}
              onChange={onChange}
              placeholder="Tytuł tematu"
              disabled={saving}
              aria-invalid={duplicatedTitle}
              className={`w-full rounded-2xl border px-4 py-3 focus:outline-none focus:ring-2 ${
                duplicatedTitle
                  ? "border-red-300 bg-red-50 focus:ring-red-200"
                  : "border-gray-300 focus:ring-primary-500"
              }`}
            />

            {duplicatedTitle && (
              <p className="mt-2 text-sm font-medium text-red-600">
                Temat o tej nazwie już istnieje.
              </p>
            )}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <label
              htmlFor="theme-description"
              className="block text-sm font-semibold text-gray-700"
            >
              Opis
            </label>

            <span
              className={`text-xs ${
                descriptionLength >
                THEME_LIMITS.descriptionMax
                  ? "text-red-600"
                  : "text-gray-500"
              }`}
            >
              {descriptionLength}/
              {THEME_LIMITS.descriptionMax}
            </span>
          </div>

          <textarea
            id="theme-description"
            name="description"
            required
            minLength={
              THEME_LIMITS.descriptionMin
            }
            maxLength={
              THEME_LIMITS.descriptionMax
            }
            value={themeForm.description}
            onChange={onChange}
            placeholder="Opis tematu"
            disabled={saving}
            className="min-h-[120px] w-full rounded-2xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />

          <p className="mt-2 text-xs text-gray-500">
            Minimum{" "}
            {THEME_LIMITS.descriptionMin}{" "}
            znaków.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="submit"
            disabled={
              saving ||
              duplicatedNumber ||
              duplicatedTitle
            }
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary-600 px-6 py-3 font-semibold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FaSave />

            {saving
              ? "Zapisywanie..."
              : editingId
                ? "Zaktualizuj temat"
                : "Zapisz temat"}
          </button>

          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gray-100 px-6 py-3 font-semibold text-gray-700 hover:bg-gray-200 disabled:opacity-50"
          >
            <FaTimes />
            Anuluj
          </button>
        </div>
      </form>
    </section>
  );
};

export default ThemeForm;