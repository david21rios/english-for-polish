// src/components/topics/personalization/steps/SituationStep.jsx

import {
  FaBrain,
  FaLightbulb,
  FaPen
} from "react-icons/fa";

const MAX_SITUATION_CHARACTERS = 3000;
const MAX_ADDITIONAL_INSTRUCTIONS_CHARACTERS = 1000;

const SituationStep = ({
  formData = {},
  fieldErrors = {},
  disabled = false,
  onChange
}) => {
  const situation =
    String(formData.situation || "");

  const additionalInstructions =
    String(
      formData.additionalInstructions || ""
    );

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

  return (
    <section
      aria-labelledby="personalization-situation-title"
      className="space-y-6"
    >
      <header>
        <div className="flex items-center gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-100 text-primary-600"
            aria-hidden="true"
          >
            <FaBrain />
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary-600">
              Krok 1
            </p>

            <h2
              id="personalization-situation-title"
              className="text-xl font-bold text-gray-900 md:text-2xl"
            >
              Jaką sytuację chcesz przećwiczyć?
            </h2>
          </div>
        </div>

        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-gray-600 md:text-base">
          Opisz prawdziwą lub hipotetyczną sytuację. Im więcej istotnych
          szczegółów podasz, tym lepiej AI dopasuje scenariusz rozmowy.
        </p>
      </header>

      <div>
        <label
          htmlFor="personalization-situation"
          className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-800"
        >
          <FaPen className="text-primary-600" />

          Opis sytuacji
          <span className="text-red-600">*</span>
        </label>

        <textarea
          id="personalization-situation"
          rows={7}
          value={situation}
          disabled={disabled}
          maxLength={
            MAX_SITUATION_CHARACTERS
          }
          aria-invalid={
            Boolean(
              fieldErrors.situation
            )
          }
          aria-describedby={
            fieldErrors.situation
              ? "personalization-situation-error personalization-situation-help"
              : "personalization-situation-help"
          }
          onChange={(event) =>
            updateField(
              "situation",
              event.target.value
            )
          }
          placeholder="Przykład: Jutro mam rozmowę kwalifikacyjną na stanowisko programisty. Chcę przećwiczyć przedstawienie mojego doświadczenia, opis projektu oraz odpowiedzi na pytania rekrutera."
          className={`w-full resize-y rounded-2xl border px-4 py-3 text-gray-900 outline-none transition focus:ring-2 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 ${
            fieldErrors.situation
              ? "border-red-300 focus:border-red-500 focus:ring-red-100"
              : "border-gray-300 focus:border-primary-500 focus:ring-primary-100"
          }`}
        />

        <div className="mt-2 flex items-start justify-between gap-4">
          <p
            id="personalization-situation-help"
            className="text-xs leading-relaxed text-gray-500"
          >
            Opisz miejsce, uczestników, okoliczności i problem, który chcesz
            przećwiczyć.
          </p>

          <span
            className={`shrink-0 text-xs font-medium ${
              situation.length >=
              MAX_SITUATION_CHARACTERS
                ? "text-red-600"
                : "text-gray-400"
            }`}
          >
            {situation.length}/
            {MAX_SITUATION_CHARACTERS}
          </span>
        </div>

        {fieldErrors.situation && (
          <p
            id="personalization-situation-error"
            className="mt-2 text-sm font-medium text-red-600"
          >
            {fieldErrors.situation}
          </p>
        )}
      </div>

      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <FaLightbulb
            className="mt-0.5 shrink-0 text-blue-600"
            aria-hidden="true"
          />

          <div>
            <p className="text-sm font-semibold text-blue-900">
              Dobry opis sytuacji
            </p>

            <p className="mt-1 text-sm leading-relaxed text-blue-800">
              Zamiast „Chcę ćwiczyć rozmowę w hotelu”, napisz: „Przyjechałem
              do hotelu, ale mój pokój nie jest gotowy. Chcę wyjaśnić problem,
              zapytać o czas oczekiwania i poprosić o inne rozwiązanie”.
            </p>
          </div>
        </div>
      </div>

      <div>
        <label
          htmlFor="personalization-additional-instructions"
          className="mb-2 block text-sm font-semibold text-gray-800"
        >
          Dodatkowe wskazówki dla misji
          <span className="ml-2 text-xs font-normal text-gray-500">
            opcjonalnie
          </span>
        </label>

        <textarea
          id="personalization-additional-instructions"
          rows={3}
          value={
            additionalInstructions
          }
          disabled={disabled}
          maxLength={
            MAX_ADDITIONAL_INSTRUCTIONS_CHARACTERS
          }
          aria-invalid={Boolean(
            fieldErrors.additionalInstructions
          )}
          onChange={(event) =>
            updateField(
              "additionalInstructions",
              event.target.value
            )
          }
          placeholder="Przykład: Chcę, aby rozmówca zadawał krótkie pytania i nie używał specjalistycznego słownictwa."
          className={`w-full resize-y rounded-2xl border px-4 py-3 text-gray-900 outline-none transition focus:ring-2 disabled:cursor-not-allowed disabled:bg-gray-100 ${
            fieldErrors.additionalInstructions
              ? "border-red-300 focus:border-red-500 focus:ring-red-100"
              : "border-gray-300 focus:border-primary-500 focus:ring-primary-100"
          }`}
        />

        <div className="mt-2 flex justify-end">
          <span className="text-xs text-gray-400">
            {additionalInstructions.length}/
            {
              MAX_ADDITIONAL_INSTRUCTIONS_CHARACTERS
            }
          </span>
        </div>

        {fieldErrors.additionalInstructions && (
          <p className="mt-2 text-sm font-medium text-red-600">
            {
              fieldErrors.additionalInstructions
            }
          </p>
        )}
      </div>
    </section>
  );
};

export default SituationStep;