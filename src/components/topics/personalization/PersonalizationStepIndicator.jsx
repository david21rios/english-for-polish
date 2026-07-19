// src/components/topics/personalization/PersonalizationStepIndicator.jsx

import {
  FaCheck
} from "react-icons/fa";

const normalizeSteps = (
  steps = []
) => {
  if (!Array.isArray(steps)) {
    return [];
  }

  return steps
    .map((step, index) => {
      if (
        typeof step === "string"
      ) {
        return {
          id: `step_${index + 1}`,
          label: step
        };
      }

      if (
        !step ||
        typeof step !== "object"
      ) {
        return null;
      }

      return {
        id:
          String(
            step.id ||
              `step_${index + 1}`
          ),

        label:
          String(
            step.shortLabel ||
              step.label ||
              step.title ||
              `Krok ${index + 1}`
          )
      };
    })
    .filter(Boolean);
};

const PersonalizationStepIndicator = ({
  steps = [],
  currentStepIndex = 0,
  highestCompletedStepIndex = -1,
  disabled = false,
  onStepSelect
}) => {
  const normalizedSteps =
    normalizeSteps(steps);

  if (
    normalizedSteps.length === 0
  ) {
    return null;
  }

  const handleStepSelect = (
    stepIndex
  ) => {
    if (
      disabled ||
      typeof onStepSelect !==
        "function"
    ) {
      return;
    }

    onStepSelect(stepIndex);
  };

  return (
    <nav
      aria-label="Postęp tworzenia misji"
      className="mb-8"
    >
      <ol className="flex w-full items-start">
        {normalizedSteps.map(
          (step, index) => {
            const active =
              index ===
              currentStepIndex;

            const completed =
              index <=
                highestCompletedStepIndex &&
              index !==
                currentStepIndex;

            const accessible =
              index <=
              Math.max(
                currentStepIndex,
                highestCompletedStepIndex +
                  1
              );

            const clickable =
              accessible &&
              !disabled &&
              typeof onStepSelect ===
                "function";

            return (
              <li
                key={step.id}
                className="relative flex min-w-0 flex-1 flex-col items-center"
              >
                {index <
                  normalizedSteps.length -
                    1 && (
                  <div
                    aria-hidden="true"
                    className="absolute left-1/2 right-[-50%] top-5 px-7"
                  >
                    <div
                      className={`h-0.5 w-full rounded-full transition-colors ${
                        index <
                        currentStepIndex
                          ? "bg-primary-500"
                          : "bg-gray-200"
                      }`}
                    />
                  </div>
                )}

                <button
                  type="button"
                  disabled={
                    !clickable
                  }
                  aria-current={
                    active
                      ? "step"
                      : undefined
                  }
                  aria-label={`Krok ${
                    index + 1
                  }: ${step.label}`}
                  onClick={() =>
                    handleStepSelect(
                      index
                    )
                  }
                  className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 md:h-11 md:w-11 ${
                    completed
                      ? "border-primary-600 bg-primary-600 text-white"
                      : active
                        ? "border-primary-600 bg-primary-600 text-white shadow-md ring-4 ring-primary-100"
                        : accessible
                          ? "border-gray-300 bg-white text-gray-500 hover:border-primary-400"
                          : "cursor-default border-gray-200 bg-white text-gray-400"
                  }`}
                >
                  {completed ? (
                    <FaCheck
                      aria-hidden="true"
                    />
                  ) : (
                    index + 1
                  )}
                </button>

                <span
                  className={`mt-3 max-w-full px-1 text-center text-[11px] font-semibold leading-tight sm:text-xs md:text-sm ${
                    active
                      ? "text-primary-700"
                      : completed
                        ? "text-primary-600"
                        : "text-gray-400"
                  }`}
                >
                  {step.label}
                </span>
              </li>
            );
          }
        )}
      </ol>
    </nav>
  );
};

export default PersonalizationStepIndicator;