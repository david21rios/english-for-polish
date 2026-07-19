// src/components/topics/feedback/MissionCriteriaFeedback.jsx

import {
  FaChartBar
} from "react-icons/fa";

const CRITERIA_CONFIG = [
  {
    key: "taskAchievement",
    label:
      "Realizacja zadania",
    description:
      "Stopień osiągnięcia celu i wykonania wymaganych działań."
  },
  {
    key: "communication",
    label:
      "Skuteczność komunikacji",
    description:
      "Zdolność do przekazania zrozumiałej intencji."
  },
  {
    key: "relevance",
    label:
      "Zgodność z misją",
    description:
      "Trafność odpowiedzi względem scenariusza."
  },
  {
    key: "grammar",
    label: "Gramatyka",
    description:
      "Poprawność struktur odpowiednich dla poziomu CEFR."
  },
  {
    key: "vocabulary",
    label: "Słownictwo",
    description:
      "Zakres i trafność użytego słownictwa."
  },
  {
    key: "coherence",
    label:
      "Spójność wypowiedzi",
    description:
      "Logiczne i zrozumiałe rozwijanie odpowiedzi."
  },
  {
    key: "interaction",
    label: "Interakcja",
    description:
      "Reagowanie na rozmówcę i naturalne podtrzymywanie dialogu."
  }
];

const clampScore = (
  value
) => {
  const numericValue =
    Number(value);

  if (
    !Number.isFinite(
      numericValue
    )
  ) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(
      100,
      Math.round(
        numericValue
      )
    )
  );
};

const normalizeCriterion = (
  value
) => {
  if (
    typeof value === "number" ||
    typeof value === "string"
  ) {
    return {
      score:
        clampScore(value),

      weight: null
    };
  }

  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return {
      score: 0,
      weight: null
    };
  }

  const numericWeight =
    Number(value.weight);

  return {
    score:
      clampScore(
        value.score ??
          value.value ??
          value.rating
      ),

    weight:
      Number.isFinite(
        numericWeight
      )
        ? Math.max(
            0,
            Math.round(
              numericWeight
            )
          )
        : null
  };
};

const getScoreBand = (
  score
) => {
  if (score >= 90) {
    return {
      label: "Doskonały",
      progressClass:
        "bg-green-600",
      textClass:
        "text-green-700"
    };
  }

  if (score >= 75) {
    return {
      label: "Dobry",
      progressClass:
        "bg-green-500",
      textClass:
        "text-green-700"
    };
  }

  if (score >= 60) {
    return {
      label:
        "Akceptowalny",
      progressClass:
        "bg-blue-500",
      textClass:
        "text-blue-700"
    };
  }

  if (score >= 40) {
    return {
      label:
        "Podstawowy",
      progressClass:
        "bg-yellow-500",
      textClass:
        "text-yellow-700"
    };
  }

  return {
    label:
      "Wymaga poprawy",
    progressClass:
      "bg-red-500",
    textClass:
      "text-red-700"
  };
};

const MissionCriteriaFeedback = ({
  criteria = {},
  criteriaScore = null
}) => {
  if (
    !criteria ||
    typeof criteria !== "object" ||
    Array.isArray(criteria)
  ) {
    return null;
  }

  const normalizedCriteria =
    CRITERIA_CONFIG.map(
      (criterionConfig) => ({
        ...criterionConfig,

        ...normalizeCriterion(
          criteria[
            criterionConfig.key
          ]
        )
      })
    );

  const hasCriteria =
    normalizedCriteria.some(
      (criterion) =>
        criterion.score > 0
    );

  if (!hasCriteria) {
    return null;
  }

  const normalizedCriteriaScore =
    Number.isFinite(
      Number(criteriaScore)
    )
      ? clampScore(
          criteriaScore
        )
      : Math.round(
          normalizedCriteria.reduce(
            (
              total,
              criterion
            ) =>
              total +
              criterion.score,
            0
          ) /
            normalizedCriteria.length
        );

  return (
    <section className="mt-5 rounded-2xl border border-gray-100 bg-white p-4 md:mt-8 md:p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <FaChartBar
            className="text-primary-600"
            aria-hidden="true"
          />

          <div>
            <h2 className="text-base font-semibold text-gray-900 md:text-lg">
              Kryteria oceny
            </h2>

            <p className="mt-1 text-xs text-gray-500">
              Wyniki są odnoszone do poziomu CEFR misji.
            </p>
          </div>
        </div>

        <div className="w-fit rounded-2xl bg-primary-50 px-4 py-2 text-center">
          <p className="text-xs font-semibold uppercase text-primary-600">
            Wynik kryteriów
          </p>

          <p className="text-xl font-bold text-primary-700">
            {
              normalizedCriteriaScore
            }
            %
          </p>
        </div>
      </div>

      <div className="space-y-5">
        {normalizedCriteria.map(
          (criterion) => {
            const band =
              getScoreBand(
                criterion.score
              );

            return (
              <article
                key={criterion.key}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-800">
                      {
                        criterion.label
                      }
                    </h3>

                    <p className="mt-1 text-xs leading-relaxed text-gray-500">
                      {
                        criterion.description
                      }
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p
                      className={`font-bold ${band.textClass}`}
                    >
                      {
                        criterion.score
                      }
                      %
                    </p>

                    <p className="text-[10px] text-gray-500">
                      {band.label}
                    </p>
                  </div>
                </div>

                <div
                  className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100"
                  role="progressbar"
                  aria-valuemin="0"
                  aria-valuemax="100"
                  aria-valuenow={
                    criterion.score
                  }
                  aria-label={`${criterion.label}: ${criterion.score}%`}
                >
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${band.progressClass}`}
                    style={{
                      width: `${criterion.score}%`
                    }}
                  />
                </div>

                {criterion.weight !==
                  null && (
                  <p className="mt-1 text-right text-[10px] text-gray-400">
                    Waga:{" "}
                    {
                      criterion.weight
                    }
                    %
                  </p>
                )}
              </article>
            );
          }
        )}
      </div>
    </section>
  );
};

export default MissionCriteriaFeedback;