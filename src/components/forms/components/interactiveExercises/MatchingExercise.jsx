// src/components/forms/components/interactiveExercises/MatchingExercise.jsx

import PropTypes from "prop-types";
import { FaPlus, FaTrash } from "react-icons/fa";

const hasOwn = (source, key) =>
  Object.prototype.hasOwnProperty.call(source || {}, key);

/**
 * Obtiene el primer campo que realmente existe.
 *
 * A diferencia de `valueA || valueB`, conserva valores válidos como:
 * - ""
 * - 0
 * - false
 * - []
 */
const getExistingValue = (
  source = {},
  keys = [],
  fallback = ""
) => {
  for (const key of keys) {
    if (hasOwn(source, key)) {
      return source[key] ?? fallback;
    }
  }

  return fallback;
};

/**
 * Obtiene el primer arreglo existente.
 *
 * No elimina cadenas vacías porque representan pares nuevos
 * que todavía están siendo completados por el docente.
 */
const getExistingArray = (
  source = {},
  keys = [],
  fallback = []
) => {
  for (const key of keys) {
    if (hasOwn(source, key)) {
      return Array.isArray(source[key])
        ? [...source[key]]
        : fallback;
    }
  }

  return fallback;
};

const normalizeStringArray = (items = []) =>
  Array.isArray(items)
    ? items.map((item) =>
        item === null || item === undefined
          ? ""
          : String(item)
      )
    : [];

const normalizeMatches = (value) => {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    return { ...value };
  }

  return {};
};

const normalizeExercise = (exercise = {}) => ({
  ...exercise,

  instructions: String(
    getExistingValue(
      exercise,
      [
        "instructions",
        "instruction",
        "instrucciones"
      ],
      ""
    )
  ),

  leftPairs: normalizeStringArray(
    getExistingArray(
      exercise,
      [
        "leftPairs",
        "leftItems",
        "left_items",
        "pares_izquierda",
        "elementos_izquierda"
      ],
      []
    )
  ),

  rightPairs: normalizeStringArray(
    getExistingArray(
      exercise,
      [
        "rightPairs",
        "rightItems",
        "right_items",
        "pares_derecha",
        "elementos_derecha"
      ],
      []
    )
  ),

  correctMatches: normalizeMatches(
    getExistingValue(
      exercise,
      [
        "correctMatches",
        "correctPairs",
        "correct_pairs",
        "respuestas_correctas",
        "pares_correctos"
      ],
      {}
    )
  )
});

const buildLegacyExercise = (exercise = {}) => ({
  instrucciones: exercise.instructions ?? "",

  pares_izquierda: Array.isArray(exercise.leftPairs)
    ? exercise.leftPairs
    : [],

  pares_derecha: Array.isArray(exercise.rightPairs)
    ? exercise.rightPairs
    : [],

  respuestas_correctas:
    normalizeMatches(exercise.correctMatches)
});

/**
 * Reindexa las claves pair0, pair1, pair2... después
 * de eliminar una fila.
 */
const rebuildMatchesAfterRemoval = ({
  previousMatches = {},
  previousRightPairs = [],
  removedIndex
}) => {
  const nextMatches = {};
  const removedRightValue =
    previousRightPairs[removedIndex] ?? "";

  const previousPairCount =
    Math.max(
      previousRightPairs.length,
      Object.keys(previousMatches).length
    );

  for (
    let previousIndex = 0;
    previousIndex < previousPairCount;
    previousIndex += 1
  ) {
    if (previousIndex === removedIndex) {
      continue;
    }

    const nextIndex =
      previousIndex < removedIndex
        ? previousIndex
        : previousIndex - 1;

    const previousMatch =
      previousMatches[`pair${previousIndex}`] ?? "";

    /*
     * Si una respuesta apuntaba al elemento derecho eliminado,
     * se limpia para evitar una referencia inválida.
     */
    nextMatches[`pair${nextIndex}`] =
      previousMatch === removedRightValue
        ? ""
        : previousMatch;
  }

  return nextMatches;
};

/**
 * Actualiza todas las coincidencias que apuntaban a un valor
 * derecho cuando ese valor es editado.
 */
const replaceRightValueInMatches = (
  matches = {},
  previousValue = "",
  nextValue = ""
) => {
  return Object.entries(matches).reduce(
    (result, [key, value]) => {
      result[key] =
        value === previousValue
          ? nextValue
          : value;

      return result;
    },
    {}
  );
};

const MatchingExercise = ({
  exercise = null,
  ejercicio = null,
  onChange
}) => {
  /*
   * El modelo canónico tiene prioridad.
   * El modelo legacy se utiliza únicamente como fallback.
   */
  const sourceExercise =
    exercise ?? ejercicio ?? {};

  const normalizedExercise =
    normalizeExercise(sourceExercise);

  const updateExercise = (updatedExercise) => {
    const canonicalExercise =
      normalizeExercise(updatedExercise);

    const legacyExercise =
      buildLegacyExercise(canonicalExercise);

    onChange({
      /*
       * Conserva campos adicionales como id, type y metadata.
       */
      ...sourceExercise,

      /*
       * Modelo canónico.
       */
      ...canonicalExercise,

      /*
       * Compatibilidad legacy sincronizada.
       */
      ...legacyExercise
    });
  };

  const handleChange = (field, value) => {
    updateExercise({
      ...normalizedExercise,
      [field]: value
    });
  };

  const handleAddPair = () => {
    const nextIndex =
      normalizedExercise.leftPairs.length;

    updateExercise({
      ...normalizedExercise,

      leftPairs: [
        ...normalizedExercise.leftPairs,
        ""
      ],

      rightPairs: [
        ...normalizedExercise.rightPairs,
        ""
      ],

      correctMatches: {
        ...normalizedExercise.correctMatches,
        [`pair${nextIndex}`]: ""
      }
    });
  };

  const handleLeftPairChange = (
    index,
    value
  ) => {
    const nextLeftPairs = [
      ...normalizedExercise.leftPairs
    ];

    nextLeftPairs[index] = value;

    updateExercise({
      ...normalizedExercise,
      leftPairs: nextLeftPairs
    });
  };

  const handleRightPairChange = (
    index,
    value
  ) => {
    const previousValue =
      normalizedExercise.rightPairs[index] ?? "";

    const nextRightPairs = [
      ...normalizedExercise.rightPairs
    ];

    nextRightPairs[index] = value;

    const nextCorrectMatches =
      replaceRightValueInMatches(
        normalizedExercise.correctMatches,
        previousValue,
        value
      );

    updateExercise({
      ...normalizedExercise,
      rightPairs: nextRightPairs,
      correctMatches: nextCorrectMatches
    });
  };

  const handleAnswerChange = (
    index,
    rightValue
  ) => {
    updateExercise({
      ...normalizedExercise,

      correctMatches: {
        ...normalizedExercise.correctMatches,
        [`pair${index}`]: rightValue
      }
    });
  };

  const handleRemovePair = (index) => {
    const nextLeftPairs =
      normalizedExercise.leftPairs.filter(
        (_, pairIndex) =>
          pairIndex !== index
      );

    const nextRightPairs =
      normalizedExercise.rightPairs.filter(
        (_, pairIndex) =>
          pairIndex !== index
      );

    const nextCorrectMatches =
      rebuildMatchesAfterRemoval({
        previousMatches:
          normalizedExercise.correctMatches,
        previousRightPairs:
          normalizedExercise.rightPairs,
        removedIndex: index
      });

    updateExercise({
      ...normalizedExercise,
      leftPairs: nextLeftPairs,
      rightPairs: nextRightPairs,
      correctMatches: nextCorrectMatches
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Instrukcja
        </label>

        <textarea
          value={normalizedExercise.instructions}
          onChange={(event) =>
            handleChange(
              "instructions",
              event.target.value
            )
          }
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          rows={2}
          placeholder="Wpisz instrukcję dopasowywania elementów..."
        />
      </div>

      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <label className="block text-sm font-medium text-gray-700">
            Pary do dopasowania
          </label>

          <button
            type="button"
            onClick={handleAddPair}
            className="inline-flex items-center text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            <FaPlus className="mr-2" />
            Dodaj parę
          </button>
        </div>

        {normalizedExercise.leftPairs.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] gap-4">
              <div className="font-medium text-sm text-gray-700 md:text-center">
                Lewa kolumna
              </div>

              <div className="hidden md:block" />

              <div className="font-medium text-sm text-gray-700 md:text-center">
                Prawidłowe dopasowanie
              </div>
            </div>

            {normalizedExercise.leftPairs.map(
              (leftValue, index) => {
                const matchKey = `pair${index}`;
                const selectedMatch =
                  normalizedExercise.correctMatches[
                    matchKey
                  ] ?? "";

                return (
                  <div
                    key={`matching-pair-${index}`}
                    className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] gap-3 md:gap-4 items-center"
                  >
                    <input
                      type="text"
                      value={leftValue}
                      onChange={(event) =>
                        handleLeftPairChange(
                          index,
                          event.target.value
                        )
                      }
                      className="rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      placeholder={`Element lewy ${index + 1}`}
                    />

                    <button
                      type="button"
                      onClick={() =>
                        handleRemovePair(index)
                      }
                      className="p-2 text-red-600 hover:text-red-800 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      aria-label={`Usuń parę ${index + 1}`}
                      title="Usuń parę"
                    >
                      <FaTrash />
                    </button>

                    <select
                      value={selectedMatch}
                      onChange={(event) =>
                        handleAnswerChange(
                          index,
                          event.target.value
                        )
                      }
                      className="rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    >
                      <option value="">
                        Wybierz poprawną parę
                      </option>

                      {normalizedExercise.rightPairs.map(
                        (option, optionIndex) => (
                          <option
                            key={`right-option-${optionIndex}`}
                            value={option}
                            disabled={option.trim() === ""}
                          >
                            {option ||
                              `Element prawy ${
                                optionIndex + 1
                              }`}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                );
              }
            )}
          </>
        ) : (
          <p className="text-sm text-gray-500 italic">
            Nie dodano jeszcze par do dopasowania.
          </p>
        )}
      </div>

      {normalizedExercise.rightPairs.length > 0 && (
        <div className="mt-4 space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Elementy prawej kolumny
          </label>

          {normalizedExercise.rightPairs.map(
            (rightValue, index) => (
              <input
                key={`right-pair-${index}`}
                type="text"
                value={rightValue}
                onChange={(event) =>
                  handleRightPairChange(
                    index,
                    event.target.value
                  )
                }
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                placeholder={`Element prawy ${index + 1}`}
              />
            )
          )}
        </div>
      )}
    </div>
  );
};

MatchingExercise.propTypes = {
  exercise: PropTypes.object,
  ejercicio: PropTypes.object,
  onChange: PropTypes.func.isRequired
};

export default MatchingExercise;