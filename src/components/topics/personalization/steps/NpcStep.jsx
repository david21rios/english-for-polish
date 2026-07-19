// src/components/topics/personalization/steps/NpcStep.jsx

import {
  FaComments,
  FaRobot,
  FaUserTie
} from "react-icons/fa";

import {
  PERSONALIZATION_CONVERSATION_TYPE_OPTIONS,
  PERSONALIZATION_NPC_STYLE_OPTIONS
} from "../../../../services/ai/missions/personalization/missionPersonalizationDefaults";

const MAX_AI_ROLE_CHARACTERS = 200;

const NpcStep = ({
  formData = {},
  fieldErrors = {},
  disabled = false,
  onChange
}) => {
  const aiRole =
    String(formData.aiRole || "");

  const npcStyle =
    formData.npcStyle ||
    "adaptive";

  const conversationType =
    formData.conversationType ||
    "role_play";

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
      aria-labelledby="personalization-npc-title"
      className="space-y-7"
    >
      <header>
        <div className="flex items-center gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-purple-100 text-purple-700"
            aria-hidden="true"
          >
            <FaRobot />
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary-600">
              Krok 3
            </p>

            <h2
              id="personalization-npc-title"
              className="text-xl font-bold text-gray-900 md:text-2xl"
            >
              Kim ma być rozmówca AI?
            </h2>
          </div>
        </div>

        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-gray-600 md:text-base">
          Wybierz rolę, zachowanie i rodzaj rozmowy. AI pozostanie w tej roli
          podczas całej misji.
        </p>
      </header>

      <div>
        <label
          htmlFor="personalization-ai-role"
          className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-800"
        >
          <FaUserTie className="text-purple-600" />

          Rola rozmówcy
          <span className="text-red-600">*</span>
        </label>

        <input
          id="personalization-ai-role"
          type="text"
          value={aiRole}
          disabled={disabled}
          maxLength={
            MAX_AI_ROLE_CHARACTERS
          }
          aria-invalid={Boolean(
            fieldErrors.aiRole
          )}
          onChange={(event) =>
            updateField(
              "aiRole",
              event.target.value
            )
          }
          placeholder="Przykład: profesjonalny rekruter techniczny, recepcjonista hotelowy, nauczyciel..."
          className={`w-full rounded-2xl border px-4 py-3 text-gray-900 outline-none transition focus:ring-2 disabled:cursor-not-allowed disabled:bg-gray-100 ${
            fieldErrors.aiRole
              ? "border-red-300 focus:border-red-500 focus:ring-red-100"
              : "border-gray-300 focus:border-primary-500 focus:ring-primary-100"
          }`}
        />

        <div className="mt-2 flex justify-end">
          <span className="text-xs text-gray-400">
            {aiRole.length}/
            {MAX_AI_ROLE_CHARACTERS}
          </span>
        </div>

        {fieldErrors.aiRole && (
          <p className="mt-2 text-sm font-medium text-red-600">
            {fieldErrors.aiRole}
          </p>
        )}
      </div>

      <fieldset>
        <legend className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-800">
          <FaRobot className="text-purple-600" />
          Styl rozmówcy
        </legend>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PERSONALIZATION_NPC_STYLE_OPTIONS.map(
            (option) => {
              const selected =
                npcStyle ===
                option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  disabled={disabled}
                  aria-pressed={
                    selected
                  }
                  onClick={() =>
                    updateField(
                      "npcStyle",
                      option.value
                    )
                  }
                  className={`rounded-2xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${
                    selected
                      ? "border-purple-500 bg-purple-50 ring-2 ring-purple-100"
                      : "border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-50/50"
                  }`}
                >
                  <p
                    className={`font-semibold ${
                      selected
                        ? "text-purple-800"
                        : "text-gray-900"
                    }`}
                  >
                    {option.label}
                  </p>

                  <p className="mt-1 text-xs leading-relaxed text-gray-500">
                    {
                      option.description
                    }
                  </p>
                </button>
              );
            }
          )}
        </div>

        {fieldErrors.npcStyle && (
          <p className="mt-2 text-sm font-medium text-red-600">
            {fieldErrors.npcStyle}
          </p>
        )}
      </fieldset>

      <fieldset>
        <legend className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-800">
          <FaComments className="text-primary-600" />
          Rodzaj rozmowy
        </legend>

        <div className="grid gap-3 sm:grid-cols-2">
          {PERSONALIZATION_CONVERSATION_TYPE_OPTIONS.map(
            (option) => {
              const selected =
                conversationType ===
                option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  disabled={disabled}
                  aria-pressed={
                    selected
                  }
                  onClick={() =>
                    updateField(
                      "conversationType",
                      option.value
                    )
                  }
                  className={`rounded-2xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${
                    selected
                      ? "border-primary-500 bg-primary-50 ring-2 ring-primary-100"
                      : "border-gray-200 bg-white hover:border-primary-300 hover:bg-primary-50/50"
                  }`}
                >
                  <p
                    className={`font-semibold ${
                      selected
                        ? "text-primary-800"
                        : "text-gray-900"
                    }`}
                  >
                    {option.label}
                  </p>

                  <p className="mt-1 text-xs leading-relaxed text-gray-500">
                    {
                      option.description
                    }
                  </p>
                </button>
              );
            }
          )}
        </div>

        {fieldErrors.conversationType && (
          <p className="mt-2 text-sm font-medium text-red-600">
            {
              fieldErrors.conversationType
            }
          </p>
        )}
      </fieldset>
    </section>
  );
};

export default NpcStep;