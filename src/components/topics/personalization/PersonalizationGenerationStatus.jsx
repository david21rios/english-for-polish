// src/components/topics/personalization/PersonalizationGenerationStatus.jsx

import {
  useEffect,
  useMemo,
  useState
} from "react";

import {
  FaCheckCircle,
  FaMagic,
  FaRobot,
  FaSpinner
} from "react-icons/fa";

const DEFAULT_GENERATION_STEPS = [
  {
    id:
      "scenario",

    label:
      "Tworzę realistyczny scenariusz"
  },

  {
    id:
      "level",

    label:
      "Dostosowuję język do poziomu CEFR"
  },

  {
    id:
      "npc",

    label:
      "Przygotowuję rolę i styl rozmówcy AI"
  },

  {
    id:
      "objectives",

    label:
      "Tworzę cele i kryteria sukcesu"
  },

  {
    id:
      "validation",

    label:
      "Sprawdzam poprawność i bezpieczeństwo misji"
  }
];

const PersonalizationGenerationStatus = ({
  visible = false,
  steps =
    DEFAULT_GENERATION_STEPS,
  title =
    "AI tworzy Twoją misję",
  description =
    "To może potrwać kilka sekund.",
  progressInterval = 850
}) => {
  const normalizedSteps =
    useMemo(() => {
      if (!Array.isArray(steps)) {
        return DEFAULT_GENERATION_STEPS;
      }

      const validSteps =
        steps
          .map(
            (
              step,
              index
            ) => {
              if (
                typeof step ===
                "string"
              ) {
                return {
                  id:
                    `step_${index + 1}`,

                  label:
                    step
                };
              }

              if (
                !step ||
                typeof step !==
                  "object"
              ) {
                return null;
              }

              const label =
                String(
                  step.label ||
                    step.title ||
                    ""
                ).trim();

              if (!label) {
                return null;
              }

              return {
                id:
                  String(
                    step.id ||
                      `step_${index + 1}`
                  ).trim(),

                label
              };
            }
          )
          .filter(Boolean);

      return validSteps.length >
        0
        ? validSteps
        : DEFAULT_GENERATION_STEPS;
    }, [steps]);

  const [
    activeStepIndex,
    setActiveStepIndex
  ] = useState(0);

  useEffect(() => {
    if (!visible) {
      setActiveStepIndex(0);
      return undefined;
    }

    const intervalId =
      window.setInterval(
        () => {
          setActiveStepIndex(
            (currentIndex) =>
              Math.min(
                currentIndex +
                  1,
                normalizedSteps.length -
                  1
              )
          );
        },
        Math.max(
          300,
          Number(
            progressInterval
          ) || 850
        )
      );

    return () =>
      window.clearInterval(
        intervalId
      );
  }, [
    normalizedSteps.length,
    progressInterval,
    visible
  ]);

  if (!visible) {
    return null;
  }

  const progressPercentage =
    normalizedSteps.length >
    1
      ? Math.round(
          (
            activeStepIndex /
            (
              normalizedSteps.length -
              1
            )
          ) *
            90
        )
      : 50;

  return (
    <section
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="rounded-3xl border border-primary-100 bg-white p-5 text-center shadow-lg md:p-8"
    >
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary-100 text-3xl text-primary-600">
        <FaRobot className="animate-pulse" />
      </div>

      <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-primary-600">
        Generator misji AI
      </p>

      <h2 className="mt-2 text-2xl font-bold text-gray-900 md:text-3xl">
        {title}
      </h2>

      <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-gray-600 md:text-base">
        {description}
      </p>

      <div className="mx-auto mt-6 max-w-2xl">
        <div
          className="h-3 overflow-hidden rounded-full bg-gray-100"
          role="progressbar"
          aria-valuemin="0"
          aria-valuemax="100"
          aria-valuenow={
            progressPercentage
          }
          aria-label="Postęp tworzenia misji"
        >
          <div
            className="h-3 rounded-full bg-primary-600 transition-all duration-500"
            style={{
              width:
                `${progressPercentage}%`
            }}
          />
        </div>

        <p className="mt-2 text-xs font-medium text-gray-500">
          {progressPercentage}%
        </p>
      </div>

      <div className="mx-auto mt-6 max-w-2xl space-y-3 text-left">
        {normalizedSteps.map(
          (
            step,
            index
          ) => {
            const completed =
              index <
              activeStepIndex;

            const active =
              index ===
              activeStepIndex;

            return (
              <article
                key={step.id}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-all ${
                  completed
                    ? "border-green-100 bg-green-50"
                    : active
                      ? "border-primary-200 bg-primary-50"
                      : "border-gray-100 bg-gray-50"
                }`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    completed
                      ? "bg-green-600 text-white"
                      : active
                        ? "bg-primary-600 text-white"
                        : "bg-gray-200 text-gray-500"
                  }`}
                  aria-hidden="true"
                >
                  {completed ? (
                    <FaCheckCircle />
                  ) : active ? (
                    <FaSpinner className="animate-spin" />
                  ) : (
                    index + 1
                  )}
                </div>

                <p
                  className={`text-sm font-medium ${
                    completed
                      ? "text-green-800"
                      : active
                        ? "text-primary-800"
                        : "text-gray-500"
                  }`}
                >
                  {step.label}
                </p>
              </article>
            );
          }
        )}
      </div>

      <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-yellow-50 px-4 py-2 text-xs font-medium text-yellow-800">
        <FaMagic />

        Nie zamykaj tej strony podczas generowania.
      </div>
    </section>
  );
};

export default PersonalizationGenerationStatus;