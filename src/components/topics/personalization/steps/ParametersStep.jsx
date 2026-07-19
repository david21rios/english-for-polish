// src/components/topics/personalization/steps/ParametersStep.jsx

import {
  FaBookOpen,
  FaClock,
  FaLanguage,
  FaLayerGroup,
  FaSlidersH
} from "react-icons/fa";

import {
  PERSONALIZATION_COMPLEXITY_OPTIONS,
  PERSONALIZATION_GRAMMAR_OPTIONS,
  PERSONALIZATION_LENGTH_OPTIONS,
  PERSONALIZATION_LEVEL_OPTIONS,
  PERSONALIZATION_VOCABULARY_OPTIONS
} from "../../../../services/ai/missions/personalization/missionPersonalizationDefaults";

const ParametersStep = ({
  formData = {},
  fieldErrors = {},
  disabled = false,
  onChange
}) => {
  const updateField = (
    field,
    value
  ) => {
    if (
      disabled ||
      typeof onChange !== "function"
    ) {
      return;
    }

    onChange(field, value);
  };

  const renderSelect = ({
    id,
    field,
    label,
    icon: Icon,
    options,
    value
  }) => {
    const selectedOption =
      options.find(
        (option) =>
          option.value === value
      );

    return (
      <div>
        <label
          htmlFor={id}
          className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-800"
        >
          <Icon className="text-primary-600" />
          {label}
        </label>

        <select
          id={id}
          value={value}
          disabled={disabled}
          aria-invalid={Boolean(
            fieldErrors[field]
          )}
          onChange={(event) =>
            updateField(
              field,
              event.target.value
            )
          }
          className={`w-full rounded-2xl border bg-white px-4 py-3 text-gray-900 outline-none transition focus:ring-2 disabled:cursor-not-allowed disabled:bg-gray-100 ${
            fieldErrors[field]
              ? "border-red-300 focus:border-red-500 focus:ring-red-100"
              : "border-gray-300 focus:border-primary-500 focus:ring-primary-100"
          }`}
        >
          {options.map(
            (option) => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            )
          )}
        </select>

        {selectedOption?.description && (
          <p className="mt-2 text-xs leading-relaxed text-gray-500">
            {
              selectedOption.description
            }
          </p>
        )}

        {fieldErrors[field] && (
          <p className="mt-2 text-sm font-medium text-red-600">
            {fieldErrors[field]}
          </p>
        )}
      </div>
    );
  };

  const vocabularyFocus =
    formData.vocabularyFocus ||
    "no_preference";

  const grammarFocus =
    formData.grammarFocus ||
    "no_preference";

  return (
    <section
      aria-labelledby="personalization-parameters-title"
      className="space-y-7"
    >
      <header>
        <div className="flex items-center gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-700"
            aria-hidden="true"
          >
            <FaSlidersH />
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary-600">
              Krok 4
            </p>

            <h2
              id="personalization-parameters-title"
              className="text-xl font-bold text-gray-900 md:text-2xl"
            >
              Ustaw parametry misji
            </h2>
          </div>
        </div>

        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-gray-600 md:text-base">
          Dostosuj poziom języka, trudność oraz zakres ćwiczenia. Poziom CEFR
          i trudność rozmowy są niezależnymi ustawieniami.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {renderSelect({
          id:
            "personalization-level",

          field: "level",

          label:
            "Poziom językowy",

          icon: FaLanguage,

          options:
            PERSONALIZATION_LEVEL_OPTIONS,

          value:
            formData.level ||
            "Adaptive"
        })}

        {renderSelect({
          id:
            "personalization-complexity",

          field:
            "complexity",

          label:
            "Trudność rozmowy",

          icon: FaLayerGroup,

          options:
            PERSONALIZATION_COMPLEXITY_OPTIONS,

          value:
            formData.complexity ||
            "adaptive"
        })}

        {renderSelect({
          id:
            "personalization-length",

          field:
            "missionLength",

          label:
            "Długość misji",

          icon: FaClock,

          options:
            PERSONALIZATION_LENGTH_OPTIONS,

          value:
            formData.missionLength ||
            "adaptive"
        })}

        {renderSelect({
          id:
            "personalization-vocabulary",

          field:
            "vocabularyFocus",

          label:
            "Zakres słownictwa",

          icon: FaBookOpen,

          options:
            PERSONALIZATION_VOCABULARY_OPTIONS,

          value:
            vocabularyFocus
        })}

        {renderSelect({
          id:
            "personalization-grammar",

          field:
            "grammarFocus",

          label:
            "Zakres gramatyki",

          icon: FaLanguage,

          options:
            PERSONALIZATION_GRAMMAR_OPTIONS,

          value:
            grammarFocus
        })}
      </div>

      {vocabularyFocus ===
        "custom" && (
        <div>
          <label
            htmlFor="personalization-custom-vocabulary"
            className="mb-2 block text-sm font-semibold text-gray-800"
          >
            Własny zakres słownictwa
          </label>

          <input
            id="personalization-custom-vocabulary"
            type="text"
            value={
              formData.customVocabularyFocus ||
              ""
            }
            disabled={disabled}
            maxLength={300}
            aria-invalid={Boolean(
              fieldErrors.customVocabularyFocus
            )}
            onChange={(event) =>
              updateField(
                "customVocabularyFocus",
                event.target.value
              )
            }
            placeholder="Przykład: słownictwo dotyczące React, projektów IT i pracy zespołowej"
            className={`w-full rounded-2xl border px-4 py-3 outline-none transition focus:ring-2 disabled:cursor-not-allowed disabled:bg-gray-100 ${
              fieldErrors.customVocabularyFocus
                ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                : "border-gray-300 focus:border-primary-500 focus:ring-primary-100"
            }`}
          />

          {fieldErrors.customVocabularyFocus && (
            <p className="mt-2 text-sm font-medium text-red-600">
              {
                fieldErrors.customVocabularyFocus
              }
            </p>
          )}
        </div>
      )}

      {grammarFocus ===
        "custom" && (
        <div>
          <label
            htmlFor="personalization-custom-grammar"
            className="mb-2 block text-sm font-semibold text-gray-800"
          >
            Własny zakres gramatyki
          </label>

          <input
            id="personalization-custom-grammar"
            type="text"
            value={
              formData.customGrammarFocus ||
              ""
            }
            disabled={disabled}
            maxLength={300}
            aria-invalid={Boolean(
              fieldErrors.customGrammarFocus
            )}
            onChange={(event) =>
              updateField(
                "customGrammarFocus",
                event.target.value
              )
            }
            placeholder="Przykład: pytania w czasie przeszłym i opisywanie doświadczenia"
            className={`w-full rounded-2xl border px-4 py-3 outline-none transition focus:ring-2 disabled:cursor-not-allowed disabled:bg-gray-100 ${
              fieldErrors.customGrammarFocus
                ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                : "border-gray-300 focus:border-primary-500 focus:ring-primary-100"
            }`}
          />

          {fieldErrors.customGrammarFocus && (
            <p className="mt-2 text-sm font-medium text-red-600">
              {
                fieldErrors.customGrammarFocus
              }
            </p>
          )}
        </div>
      )}

      <div className="rounded-2xl border border-primary-100 bg-primary-50 p-4">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={
              formData.allowPolishSupport !==
              false
            }
            disabled={disabled}
            onChange={(event) =>
              updateField(
                "allowPolishSupport",
                event.target.checked
              )
            }
            className="mt-1 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />

          <span>
            <span className="block text-sm font-semibold text-primary-900">
              Zezwól na ograniczone wsparcie w języku polskim
            </span>

            <span className="mt-1 block text-xs leading-relaxed text-primary-800">
              Rozmowa będzie prowadzona przede wszystkim po angielsku. AI może
              użyć krótkiego wyjaśnienia po polsku, gdy student rzeczywiście
              potrzebuje pomocy.
            </span>
          </span>
        </label>
      </div>

      <div className="rounded-2xl border border-yellow-100 bg-yellow-50 p-4 text-sm text-yellow-900">
        Misje personalizowane służą do praktyki i obecnie nie przyznają punktów
        XP. Po rozmowie nadal otrzymasz ocenę, poprawki i zalecenia.
      </div>
    </section>
  );
};

export default ParametersStep;