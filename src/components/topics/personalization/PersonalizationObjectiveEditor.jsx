// src/components/topics/personalization/PersonalizationObjectiveEditor.jsx

import {
  FaCheckCircle,
  FaPlus,
  FaTrash
} from "react-icons/fa";

const MAX_OBJECTIVES = 8;
const MAX_OBJECTIVE_CHARACTERS = 300;

const normalizeObjectives = (
  objectives = []
) => {
  if (!Array.isArray(objectives)) {
    return [];
  }

  return objectives
    .map((objective, index) => {
      if (
        typeof objective ===
        "string"
      ) {
        return {
          id:
            `objective_${index + 1}`,

          text:
            objective,

          required: true,

          source:
            "student"
        };
      }

      if (
        !objective ||
        typeof objective !==
          "object"
      ) {
        return null;
      }

      return {
        id:
          String(
            objective.id ||
              `objective_${index + 1}`
          ).trim(),

        text:
          String(
            objective.text ||
              objective.title ||
              objective.objective ||
              ""
          ),

        required:
          objective.required !==
          false,

        source:
          String(
            objective.source ||
              "student"
          ).trim()
      };
    })
    .filter(Boolean)
    .slice(0, MAX_OBJECTIVES);
};

const createObjective = (
  index
) => {
  return {
    id:
      `objective_${Date.now()}_${index}`,

    text: "",

    required: true,

    source:
      "student"
  };
};

const PersonalizationObjectiveEditor = ({
  objectives = [],
  disabled = false,
  errors = {},
  onChange
}) => {
  const normalizedObjectives =
    normalizeObjectives(
      objectives
    );

  const updateObjectives = (
    nextObjectives
  ) => {
    if (
      disabled ||
      typeof onChange !==
        "function"
    ) {
      return;
    }

    onChange(
      nextObjectives.slice(
        0,
        MAX_OBJECTIVES
      )
    );
  };

  const handleAddObjective =
    () => {
      if (
        normalizedObjectives.length >=
        MAX_OBJECTIVES
      ) {
        return;
      }

      updateObjectives([
        ...normalizedObjectives,
        createObjective(
          normalizedObjectives.length +
            1
        )
      ]);
    };

  const handleUpdateObjective = (
    objectiveId,
    field,
    value
  ) => {
    updateObjectives(
      normalizedObjectives.map(
        (objective) =>
          objective.id ===
          objectiveId
            ? {
                ...objective,
                [field]:
                  value
              }
            : objective
      )
    );
  };

  const handleDeleteObjective = (
    objectiveId
  ) => {
    updateObjectives(
      normalizedObjectives.filter(
        (objective) =>
          objective.id !==
          objectiveId
      )
    );
  };

  return (
    <section
      aria-labelledby="personalization-objectives-title"
      className="rounded-2xl border border-gray-100 bg-gray-50 p-4 md:p-5"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3
            id="personalization-objectives-title"
            className="flex items-center gap-2 font-semibold text-gray-900"
          >
            <FaCheckCircle className="text-green-600" />

            Własne cele misji
          </h3>

          <p className="mt-1 text-xs leading-relaxed text-gray-500">
            Możesz dodać własne cele. Jeżeli lista pozostanie pusta, AI utworzy
            cele automatycznie na podstawie sytuacji i głównego celu rozmowy.
          </p>
        </div>

        <span className="w-fit rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-600">
          {normalizedObjectives.length}/
          {MAX_OBJECTIVES}
        </span>
      </div>

      {normalizedObjectives.length ===
      0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-gray-300 bg-white p-5 text-center">
          <p className="text-sm text-gray-500">
            Nie dodano własnych celów.
          </p>

          <p className="mt-1 text-xs text-gray-400">
            AI utworzy je automatycznie.
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {normalizedObjectives.map(
            (
              objective,
              index
            ) => {
              const fieldKey =
                `objectives.${index}`;

              const fieldError =
                errors[fieldKey] ||
                errors[
                  objective.id
                ] ||
                "";

              return (
                <article
                  key={objective.id}
                  className="rounded-xl border border-gray-200 bg-white p-4"
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
                      {index + 1}
                    </span>

                    <div className="min-w-0 flex-1">
                      <label
                        htmlFor={`personalization-objective-${objective.id}`}
                        className="sr-only"
                      >
                        Cel misji{" "}
                        {index + 1}
                      </label>

                      <textarea
                        id={`personalization-objective-${objective.id}`}
                        rows={2}
                        value={
                          objective.text
                        }
                        disabled={disabled}
                        maxLength={
                          MAX_OBJECTIVE_CHARACTERS
                        }
                        aria-invalid={Boolean(
                          fieldError
                        )}
                        onChange={(event) =>
                          handleUpdateObjective(
                            objective.id,
                            "text",
                            event.target
                              .value
                          )
                        }
                        placeholder="Przykład: Przedstaw swoje doświadczenie zawodowe."
                        className={`w-full resize-y rounded-xl border px-3 py-2 text-sm text-gray-900 outline-none transition focus:ring-2 disabled:cursor-not-allowed disabled:bg-gray-100 ${
                          fieldError
                            ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                            : "border-gray-300 focus:border-primary-500 focus:ring-primary-100"
                        }`}
                      />

                      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-gray-600">
                          <input
                            type="checkbox"
                            checked={
                              objective.required !==
                              false
                            }
                            disabled={
                              disabled
                            }
                            onChange={(event) =>
                              handleUpdateObjective(
                                objective.id,
                                "required",
                                event.target
                                  .checked
                              )
                            }
                            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />

                          Cel obowiązkowy
                        </label>

                        <span className="text-xs text-gray-400">
                          {
                            objective.text
                              .length
                          }
                          /
                          {
                            MAX_OBJECTIVE_CHARACTERS
                          }
                        </span>
                      </div>

                      {fieldError && (
                        <p className="mt-2 text-sm font-medium text-red-600">
                          {fieldError}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        handleDeleteObjective(
                          objective.id
                        )
                      }
                      disabled={disabled}
                      className="shrink-0 rounded-lg p-2 text-red-500 transition hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label={`Usuń cel ${
                        index + 1
                      }`}
                    >
                      <FaTrash />
                    </button>
                  </div>
                </article>
              );
            }
          )}
        </div>
      )}

      <button
        type="button"
        onClick={
          handleAddObjective
        }
        disabled={
          disabled ||
          normalizedObjectives.length >=
            MAX_OBJECTIVES
        }
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-primary-200 bg-primary-50 px-4 py-3 text-sm font-semibold text-primary-700 transition hover:bg-primary-100 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <FaPlus />

        Dodaj cel misji
      </button>
    </section>
  );
};

export default PersonalizationObjectiveEditor;