// src/components/topics/personalization/steps/GoalStep.jsx

import {
  FaBullseye,
  FaCheckCircle,
  FaInfoCircle
} from "react-icons/fa";

const MAX_GOAL_CHARACTERS = 1000;

const GOAL_EXAMPLES = [
  "Przedstawić się i opowiedzieć o swoim doświadczeniu.",
  "Wyjaśnić problem i poprosić o konkretne rozwiązanie.",
  "Zadać pytania i uzyskać potrzebne informacje.",
  "Przedstawić opinię i uzasadnić swoje stanowisko."
];

const GoalStep = ({
  formData = {},
  fieldErrors = {},
  disabled = false,
  onChange
}) => {
  const goal =
    String(formData.goal || "");

  const updateGoal = (
    value
  ) => {
    if (
      disabled ||
      typeof onChange !== "function"
    ) {
      return;
    }

    onChange("goal", value);
  };

  return (
    <section
      aria-labelledby="personalization-goal-title"
      className="space-y-6"
    >
      <header>
        <div className="flex items-center gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-green-100 text-green-700"
            aria-hidden="true"
          >
            <FaBullseye />
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary-600">
              Krok 2
            </p>

            <h2
              id="personalization-goal-title"
              className="text-xl font-bold text-gray-900 md:text-2xl"
            >
              Co chcesz osiągnąć?
            </h2>
          </div>
        </div>

        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-gray-600 md:text-base">
          Określ rezultat, który powinien zostać osiągnięty podczas rozmowy.
          Na tej podstawie AI utworzy konkretne i możliwe do oceny cele misji.
        </p>
      </header>

      <div>
        <label
          htmlFor="personalization-goal"
          className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-800"
        >
          <FaCheckCircle className="text-green-600" />

          Główny cel rozmowy
          <span className="text-red-600">*</span>
        </label>

        <textarea
          id="personalization-goal"
          rows={5}
          value={goal}
          disabled={disabled}
          maxLength={
            MAX_GOAL_CHARACTERS
          }
          aria-invalid={Boolean(
            fieldErrors.goal
          )}
          aria-describedby={
            fieldErrors.goal
              ? "personalization-goal-error personalization-goal-help"
              : "personalization-goal-help"
          }
          onChange={(event) =>
            updateGoal(
              event.target.value
            )
          }
          placeholder="Przykład: Chcę przedstawić swoje doświadczenie zawodowe, opisać jeden projekt i zadać dwa pytania dotyczące stanowiska."
          className={`w-full resize-y rounded-2xl border px-4 py-3 text-gray-900 outline-none transition focus:ring-2 disabled:cursor-not-allowed disabled:bg-gray-100 ${
            fieldErrors.goal
              ? "border-red-300 focus:border-red-500 focus:ring-red-100"
              : "border-gray-300 focus:border-primary-500 focus:ring-primary-100"
          }`}
        />

        <div className="mt-2 flex items-start justify-between gap-4">
          <p
            id="personalization-goal-help"
            className="text-xs leading-relaxed text-gray-500"
          >
            Skoncentruj się na tym, co chcesz powiedzieć, uzyskać, wyjaśnić lub
            rozwiązać.
          </p>

          <span className="shrink-0 text-xs text-gray-400">
            {goal.length}/
            {MAX_GOAL_CHARACTERS}
          </span>
        </div>

        {fieldErrors.goal && (
          <p
            id="personalization-goal-error"
            className="mt-2 text-sm font-medium text-red-600"
          >
            {fieldErrors.goal}
          </p>
        )}
      </div>

      <div>
        <p className="mb-3 text-sm font-semibold text-gray-800">
          Przykładowe cele
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          {GOAL_EXAMPLES.map(
            (example) => (
              <button
                key={example}
                type="button"
                disabled={disabled}
                onClick={() =>
                  updateGoal(
                    example
                  )
                }
                className="rounded-2xl border border-gray-200 bg-white p-4 text-left text-sm leading-relaxed text-gray-700 transition hover:border-primary-300 hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {example}
              </button>
            )
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
        <div className="flex items-start gap-3">
          <FaInfoCircle
            className="mt-0.5 shrink-0 text-gray-500"
            aria-hidden="true"
          />

          <p className="text-sm leading-relaxed text-gray-600">
            Po wygenerowaniu misji otrzymasz listę szczegółowych celów. Będzie
            można je przejrzeć przed rozpoczęciem rozmowy.
          </p>
        </div>
      </div>
    </section>
  );
};

export default GoalStep;