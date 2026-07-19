// src/components/topics/player/MissionObjectives.jsx

import {
  FaLightbulb
} from "react-icons/fa";

const getObjectiveText = (
  objective
) => {
  if (
    typeof objective ===
    "string"
  ) {
    return objective.trim();
  }

  if (
    !objective ||
    typeof objective !==
      "object"
  ) {
    return "";
  }

  return String(
    objective.text ||
      objective.title ||
      objective.objective ||
      ""
  ).trim();
};

const normalizeObjectives = (
  objectives = []
) => {
  if (
    !Array.isArray(
      objectives
    )
  ) {
    return [];
  }

  return objectives
    .map(
      (
        objective,
        index
      ) => {
        const text =
          getObjectiveText(
            objective
          );

        if (!text) {
          return null;
        }

        return {
          id:
            typeof objective ===
              "object"
              ? objective.id ||
                `objective_${index + 1}`
              : `objective_${index + 1}`,

          text,

          required:
            typeof objective ===
              "object"
              ? objective.required !==
                false
              : true
        };
      }
    )
    .filter(Boolean);
};

const MissionObjectives = ({
  scenario = "",
  objectives = []
}) => {
  const normalizedScenario =
    String(
      scenario ||
        "Odpowiadaj naturalnie, zgodnie z przedstawioną sytuacją."
    ).trim();

  const normalizedObjectives =
    normalizeObjectives(
      objectives
    );

  return (
    <>
      <section className="mb-5 rounded-2xl border border-primary-100 bg-primary-50 p-4 md:mb-6 md:p-5">
        <div className="flex items-start gap-3">
          <FaLightbulb
            className="mt-1 shrink-0 text-primary-600"
            aria-hidden="true"
          />

          <div className="min-w-0">
            <h2 className="font-semibold text-gray-900">
              Sytuacja
            </h2>

            <p className="mt-1 break-words text-sm leading-relaxed text-gray-700 md:text-base">
              {normalizedScenario}
            </p>
          </div>
        </div>
      </section>

      {normalizedObjectives.length >
        0 && (
        <section className="mb-5 rounded-2xl border border-gray-100 bg-white p-4 md:mb-6">
          <h2 className="mb-3 font-semibold text-gray-900">
            Cele misji
          </h2>

          <ul className="space-y-2 text-sm text-gray-700">
            {normalizedObjectives.map(
              (objective) => (
                <li
                  key={objective.id}
                  className="flex items-start gap-2"
                >
                  <span
                    className="mt-0.5 text-primary-600"
                    aria-hidden="true"
                  >
                    🎯
                  </span>

                  <span className="break-words">
                    {objective.text}

                    {!objective.required && (
                      <span className="ml-2 text-xs text-gray-500">
                        (opcjonalny)
                      </span>
                    )}
                  </span>
                </li>
              )
            )}
          </ul>

          <p className="mt-3 text-xs leading-relaxed text-gray-500">
            Asystent nie będzie poprawiał Cię podczas rozmowy. Informację
            zwrotną otrzymasz po ukończeniu misji.
          </p>
        </section>
      )}
    </>
  );
};

export default MissionObjectives;