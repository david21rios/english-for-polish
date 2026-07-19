// src/components/forms/components/interactiveExercises/OrderExercise.jsx

import PropTypes from "prop-types";
import {
  FaArrowDown,
  FaArrowUp,
  FaPlus,
  FaTrash
} from "react-icons/fa";

const hasOwn = (source, key) =>
  Object.prototype.hasOwnProperty.call(source || {}, key);

/**
 * Conserva valores válidos como:
 * - ""
 * - 0
 * - false
 * - []
 *
 * Esto evita que reaparezcan valores legacy después de borrar un campo.
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
 * Obtiene el primer arreglo realmente presente.
 *
 * No elimina cadenas vacías porque representan elementos nuevos
 * que el docente todavía está editando.
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

const isIndex = (value) =>
  typeof value === "number" ||
  (
    typeof value === "string" &&
    /^\d+$/.test(value.trim())
  );

/**
 * Compara arreglos respetando también valores repetidos.
 */
const haveSameValues = (first = [], second = []) => {
  if (first.length !== second.length) {
    return false;
  }

  const normalize = (items) =>
    items
      .map((item) => String(item))
      .sort()
      .join("\u0000");

  return normalize(first) === normalize(second);
};

/**
 * Convierte índices históricos en valores visibles.
 */
const resolveOrderValuesFromIndexes = (
  rawOrder = [],
  items = []
) => {
  if (
    rawOrder.length !== items.length ||
    !rawOrder.every(isIndex)
  ) {
    return null;
  }

  const values = rawOrder.map((rawIndex) => {
    const index = Number(rawIndex);

    return index >= 0 && index < items.length
      ? items[index]
      : undefined;
  });

  return values.every(
    (value) => value !== undefined
  )
    ? normalizeStringArray(values)
    : null;
};

/**
 * Obtiene la posición de una ocurrencia concreta.
 *
 * Es necesario porque podrían existir dos elementos con el mismo texto.
 */
const findOccurrenceIndex = (
  values = [],
  targetValue = "",
  occurrenceNumber = 0,
  usedIndexes = new Set()
) => {
  let currentOccurrence = 0;

  for (let index = 0; index < values.length; index += 1) {
    if (usedIndexes.has(index)) continue;

    if (String(values[index]) !== String(targetValue)) {
      continue;
    }

    if (currentOccurrence === occurrenceNumber) {
      return index;
    }

    currentOccurrence += 1;
  }

  return -1;
};

/**
 * Convierte el orden basado en valores a índices, respetando duplicados.
 */
const buildCorrectOrderIndexes = (
  items = [],
  correctOrderValues = []
) => {
  const usedIndexes = new Set();

  return correctOrderValues.map((value) => {
    let foundIndex = -1;

    for (let index = 0; index < items.length; index += 1) {
      if (
        !usedIndexes.has(index) &&
        String(items[index]) === String(value)
      ) {
        foundIndex = index;
        break;
      }
    }

    if (foundIndex >= 0) {
      usedIndexes.add(foundIndex);
      return foundIndex;
    }

    return value;
  });
};

const normalizeExercise = (exercise = {}) => {
  const items = normalizeStringArray(
    getExistingArray(
      exercise,
      ["items", "elementos"],
      []
    )
  );

  const rawCorrectOrderValues = normalizeStringArray(
    getExistingArray(
      exercise,
      [
        "correctOrderValues",
        "correct_order_values",
        "correctOrderText",
        "correct_order_text"
      ],
      []
    )
  );

  const rawCorrectOrder = getExistingArray(
    exercise,
    [
      "correctOrder",
      "correct_order",
      "orden_correcto"
    ],
    []
  );

  let correctOrderValues = [];

  if (
    rawCorrectOrderValues.length === items.length &&
    haveSameValues(rawCorrectOrderValues, items)
  ) {
    correctOrderValues = rawCorrectOrderValues;
  } else {
    const valuesFromIndexes =
      resolveOrderValuesFromIndexes(
        rawCorrectOrder,
        items
      );

    if (valuesFromIndexes) {
      correctOrderValues = valuesFromIndexes;
    } else if (
      rawCorrectOrder.length === items.length &&
      haveSameValues(rawCorrectOrder, items)
    ) {
      correctOrderValues =
        normalizeStringArray(rawCorrectOrder);
    } else {
      correctOrderValues = [...items];
    }
  }

  return {
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

    items,
    correctOrderValues
  };
};

const buildPayload = (exercise = {}) => {
  const normalizedExercise =
    normalizeExercise(exercise);

  const items = normalizedExercise.items;
  const correctOrderValues =
    normalizedExercise.correctOrderValues;

  const correctOrder =
    buildCorrectOrderIndexes(
      items,
      correctOrderValues
    );

  return {
    ...normalizedExercise,

    // Modelo canónico.
    items,
    correctOrder,
    correctOrderValues,
    correct_order_values: correctOrderValues,

    // Compatibilidad legacy.
    instrucciones:
      normalizedExercise.instructions ?? "",

    elementos: items,

    orden_correcto: correctOrder
  };
};

/**
 * Obtiene qué ocurrencia de un valor representa un índice concreto.
 *
 * Ejemplo:
 * items = ["Hello", "Hello", "Bye"]
 * index = 1
 * resultado = 1 (segunda ocurrencia de "Hello")
 */
const getOccurrenceNumber = (
  items = [],
  index = 0
) => {
  const targetValue = items[index];
  let occurrence = 0;

  for (
    let currentIndex = 0;
    currentIndex < index;
    currentIndex += 1
  ) {
    if (
      String(items[currentIndex]) ===
      String(targetValue)
    ) {
      occurrence += 1;
    }
  }

  return occurrence;
};

const OrderExercise = ({
  exercise = null,
  ejercicio = null,
  onChange
}) => {
  /*
   * El modelo canónico tiene prioridad.
   * El modelo legacy se usa únicamente como fallback.
   */
  const sourceExercise =
    exercise ?? ejercicio ?? {};

  const normalizedExercise =
    normalizeExercise(sourceExercise);

  const updateExercise = (updatedExercise) => {
    const payload = buildPayload({
      ...sourceExercise,
      ...updatedExercise
    });

    onChange(payload);
  };

  const handleChange = (field, value) => {
    updateExercise({
      ...normalizedExercise,
      [field]: value
    });
  };

  const handleAddItem = () => {
    updateExercise({
      ...normalizedExercise,

      items: [
        ...normalizedExercise.items,
        ""
      ],

      correctOrderValues: [
        ...normalizedExercise.correctOrderValues,
        ""
      ]
    });
  };

  const handleItemChange = (index, value) => {
    const previousValue =
      normalizedExercise.items[index] ?? "";

    const occurrenceNumber =
      getOccurrenceNumber(
        normalizedExercise.items,
        index
      );

    const nextItems = [
      ...normalizedExercise.items
    ];

    nextItems[index] = value;

    const nextCorrectOrderValues = [
      ...normalizedExercise.correctOrderValues
    ];

    const orderIndex = findOccurrenceIndex(
      nextCorrectOrderValues,
      previousValue,
      occurrenceNumber
    );

    if (orderIndex >= 0) {
      nextCorrectOrderValues[orderIndex] = value;
    }

    updateExercise({
      ...normalizedExercise,
      items: nextItems,
      correctOrderValues:
        nextCorrectOrderValues
    });
  };

  const handleRemoveItem = (index) => {
    const removedValue =
      normalizedExercise.items[index] ?? "";

    const occurrenceNumber =
      getOccurrenceNumber(
        normalizedExercise.items,
        index
      );

    const nextItems =
      normalizedExercise.items.filter(
        (_, itemIndex) => itemIndex !== index
      );

    const nextCorrectOrderValues = [
      ...normalizedExercise.correctOrderValues
    ];

    const orderIndex = findOccurrenceIndex(
      nextCorrectOrderValues,
      removedValue,
      occurrenceNumber
    );

    if (orderIndex >= 0) {
      nextCorrectOrderValues.splice(
        orderIndex,
        1
      );
    }

    updateExercise({
      ...normalizedExercise,
      items: nextItems,
      correctOrderValues:
        nextCorrectOrderValues
    });
  };

  const handleMoveOrder = (
    orderIndex,
    direction
  ) => {
    const nextCorrectOrderValues = [
      ...normalizedExercise.correctOrderValues
    ];

    const targetIndex =
      direction === "up"
        ? orderIndex - 1
        : orderIndex + 1;

    if (
      targetIndex < 0 ||
      targetIndex >=
        nextCorrectOrderValues.length
    ) {
      return;
    }

    [
      nextCorrectOrderValues[orderIndex],
      nextCorrectOrderValues[targetIndex]
    ] = [
      nextCorrectOrderValues[targetIndex],
      nextCorrectOrderValues[orderIndex]
    ];

    updateExercise({
      ...normalizedExercise,
      correctOrderValues:
        nextCorrectOrderValues
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
          placeholder="Wpisz instrukcję porządkowania elementów..."
        />
      </div>

      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <label className="block text-sm font-medium text-gray-700">
            Elementy do uporządkowania
          </label>

          <button
            type="button"
            onClick={handleAddItem}
            className="inline-flex items-center text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            <FaPlus className="mr-2" />
            Dodaj element
          </button>
        </div>

        {normalizedExercise.items.length > 0 ? (
          normalizedExercise.items.map(
            (item, index) => (
              <div
                key={`order-item-${index}`}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={item}
                  onChange={(event) =>
                    handleItemChange(
                      index,
                      event.target.value
                    )
                  }
                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  placeholder={`Element ${index + 1}`}
                />

                <button
                  type="button"
                  onClick={() =>
                    handleRemoveItem(index)
                  }
                  className="p-2 text-red-600 hover:text-red-800 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  aria-label={`Usuń element ${index + 1}`}
                  title="Usuń element"
                >
                  <FaTrash />
                </button>
              </div>
            )
          )
        ) : (
          <p className="text-sm text-gray-500 italic">
            Nie dodano jeszcze elementów.
          </p>
        )}
      </div>

      {normalizedExercise.correctOrderValues
        .length > 0 && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Poprawna kolejność
          </label>

          <div className="space-y-2 border rounded-md p-4 bg-gray-50">
            {normalizedExercise.correctOrderValues.map(
              (item, orderIndex) => (
                <div
                  key={`correct-order-${orderIndex}`}
                  className="flex items-center gap-2 bg-white p-2 rounded shadow-sm"
                >
                  <span className="text-gray-500 w-6 text-center">
                    {orderIndex + 1}.
                  </span>

                  <span className="flex-1 break-words">
                    {item ||
                      `Element ${orderIndex + 1}`}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      handleMoveOrder(
                        orderIndex,
                        "up"
                      )
                    }
                    disabled={orderIndex === 0}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Przenieś w górę"
                    aria-label={`Przenieś element ${
                      orderIndex + 1
                    } w górę`}
                  >
                    <FaArrowUp />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleMoveOrder(
                        orderIndex,
                        "down"
                      )
                    }
                    disabled={
                      orderIndex ===
                      normalizedExercise
                        .correctOrderValues
                        .length -
                        1
                    }
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Przenieś w dół"
                    aria-label={`Przenieś element ${
                      orderIndex + 1
                    } w dół`}
                  >
                    <FaArrowDown />
                  </button>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
};

OrderExercise.propTypes = {
  exercise: PropTypes.object,
  ejercicio: PropTypes.object,
  onChange: PropTypes.func.isRequired
};

export default OrderExercise;