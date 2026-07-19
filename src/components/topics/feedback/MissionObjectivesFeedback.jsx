// src/components/topics/feedback/MissionObjectivesFeedback.jsx

import {
  FaCheckCircle,
  FaCircle,
  FaExclamationCircle
} from "react-icons/fa";

const normalizeText = (
  value = "",
  maximumLength = 1000
) => {
  return String(value || "")
    .normalize("NFKC")
    .trim()
    .slice(0, maximumLength);
};

const normalizeBoolean = (
  value,
  fallback = false
) => {
  if (
    value === true ||
    value === false
  ) {
    return value;
  }

  return fallback;
};

const normalizeObjective = (
  item = {},
  index = 0
) => {
  if (
    typeof item === "string"
  ) {
    const objective =
      normalizeText(
        item,
        300
      );

    return objective
      ? {
          id:
            `objective_${index + 1}`,

          objective,

          required: true,
          attempted: false,
          completed: false,
          evidence: "",
          confidence: null
        }
      : null;
  }

  if (
    !item ||
    typeof item !== "object" ||
    Array.isArray(item)
  ) {
    return null;
  }

  const objective =
    normalizeText(
      item.objective ||
        item.text ||
        item.title,
      300
    );

  if (!objective) {
    return null;
  }

  const numericConfidence =
    Number(
      item.confidence
    );

  return {
    id:
      normalizeText(
        item.id,
        120
      ) ||
      `objective_${index + 1}`,

    objective,

    required:
      normalizeBoolean(
        item.required,
        true
      ),

    attempted:
      normalizeBoolean(
        item.attempted,
        item.completed === true
      ),

    completed:
      normalizeBoolean(
        item.completed,
        false
      ),

    evidence:
      normalizeText(
        item.evidence,
        600
      ),

    confidence:
      Number.isFinite(
        numericConfidence
      )
        ? Math.max(
            0,
            Math.min(
              100,
              Math.round(
                numericConfidence
              )
            )
          )
        : null
  };
};

const getObjectiveStatus = (
  objective
) => {
  if (
    objective.completed === true
  ) {
    return {
      label: "Zrealizowany",
      icon: FaCheckCircle,
      iconClass:
        "text-green-600",
      containerClass:
        "border-green-100 bg-green-50",
      textClass:
        "text-green-900"
    };
  }

  if (
    objective.attempted === true
  ) {
    return {
      label:
        "Częściowo zrealizowany",

      icon:
        FaExclamationCircle,

      iconClass:
        "text-yellow-600",

      containerClass:
        "border-yellow-100 bg-yellow-50",

      textClass:
        "text-yellow-900"
    };
  }

  return {
    label: "Niezrealizowany",
    icon: FaCircle,
    iconClass:
      "text-gray-400",
    containerClass:
      "border-gray-100 bg-gray-50",
    textClass:
      "text-gray-700"
  };
};

const MissionObjectivesFeedback = ({
  objectives = []
}) => {
  const normalizedObjectives =
    Array.isArray(objectives)
      ? objectives
          .map(
            (
              objective,
              index
            ) =>
              normalizeObjective(
                objective,
                index
              )
          )
          .filter(Boolean)
      : [];

  if (
    normalizedObjectives.length ===
    0
  ) {
    return null;
  }

  const completedCount =
    normalizedObjectives.filter(
      (objective) =>
        objective.completed ===
        true
    ).length;

  return (
    <section className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4 md:mt-8 md:p-6">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-base font-semibold text-blue-900 md:text-lg">
          Cele misji
        </h2>

        <span className="w-fit rounded-full bg-white px-3 py-1 text-xs font-semibold text-blue-700">
          {completedCount}/
          {
            normalizedObjectives.length
          }{" "}
          zrealizowane
        </span>
      </div>

      <ul className="space-y-3">
        {normalizedObjectives.map(
          (objective) => {
            const status =
              getObjectiveStatus(
                objective
              );

            const StatusIcon =
              status.icon;

            return (
              <li
                key={objective.id}
                className={`rounded-xl border p-4 ${status.containerClass}`}
              >
                <div className="flex items-start gap-3">
                  <StatusIcon
                    className={`mt-1 shrink-0 ${status.iconClass}`}
                    aria-hidden="true"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p
                        className={`break-words font-semibold ${status.textClass}`}
                      >
                        {
                          objective.objective
                        }
                      </p>

                      {!objective.required && (
                        <span className="rounded-full bg-white px-2 py-1 text-[10px] font-semibold text-gray-500">
                          Opcjonalny
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-xs font-medium text-gray-500">
                      {status.label}
                    </p>

                    {objective.evidence && (
                      <p className="mt-2 break-words text-sm leading-relaxed text-gray-700">
                        <strong>
                          Dowód:
                        </strong>{" "}
                        {
                          objective.evidence
                        }
                      </p>
                    )}

                    {objective.confidence !==
                      null && (
                      <p className="mt-2 text-xs text-gray-500">
                        Pewność oceny celu:{" "}
                        <span className="font-semibold">
                          {
                            objective.confidence
                          }
                          %
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              </li>
            );
          }
        )}
      </ul>
    </section>
  );
};

export default MissionObjectivesFeedback;