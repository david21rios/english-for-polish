// src/components/forms/components/interactiveExercises/OrderExercise.jsx

import PropTypes from "prop-types";
import { FaArrowDown, FaArrowUp, FaPlus, FaTrash } from "react-icons/fa";

const cleanArray = (items = []) =>
  Array.isArray(items)
    ? items.filter((item) => item !== null && item !== undefined && item !== "")
    : [];

const normalizeExercise = (exercise = {}) => {
  const items = cleanArray(
    Array.isArray(exercise.items) ? exercise.items : exercise.elementos
  );

  const rawCorrectOrderValues = cleanArray(
    exercise.correctOrderValues ||
      exercise.correct_order_values ||
      exercise.correctOrderText ||
      exercise.correct_order_text
  );

  const rawCorrectOrder = cleanArray(
    Array.isArray(exercise.correctOrder)
      ? exercise.correctOrder
      : exercise.orden_correcto
  );

  const isIndex = (value) =>
    typeof value === "number" ||
    (typeof value === "string" && /^\d+$/.test(value.trim()));

  let correctOrderValues = [];

  const sameItemsSet = (a = [], b = []) =>
    a.map(String).sort().join("|") === b.map(String).sort().join("|");

  if (
    rawCorrectOrderValues.length === items.length &&
    sameItemsSet(rawCorrectOrderValues, items)
  ) {
    correctOrderValues = rawCorrectOrderValues.map(String);
  } else if (rawCorrectOrder.length > 0 && rawCorrectOrder.every(isIndex)) {
    correctOrderValues = rawCorrectOrder
      .map((index) => items[Number(index)])
      .filter(Boolean);
  } else if (rawCorrectOrder.length > 0) {
    correctOrderValues = rawCorrectOrder.map(String);
  }
  
  if (correctOrderValues.length !== items.length) {
    correctOrderValues = [...items];
  }

  return {
    ...exercise,
    instructions: exercise.instructions || exercise.instrucciones || "",
    items,
    correctOrderValues
  };
};

const buildPayload = (exercise = {}) => {
  const items = cleanArray(exercise.items);
  const correctOrderValues = cleanArray(exercise.correctOrderValues).map(String);

  const correctOrder = correctOrderValues.map((value) => {
    const index = items.findIndex((item) => item === value);
    return index >= 0 ? index : value;
  });

  return {
    ...exercise,

    items,
    correctOrder,
    correctOrderValues,
    correct_order_values: correctOrderValues,

    // Legacy compatibility
    instrucciones: exercise.instructions || "",
    elementos: items,
    orden_correcto: correctOrder
  };
};

const OrderExercise = ({ exercise, ejercicio, onChange }) => {
  const sourceExercise = exercise || ejercicio || {};
  const normalizedExercise = normalizeExercise(sourceExercise);

  const updateExercise = (updatedExercise) => {
    onChange(buildPayload(normalizeExercise(updatedExercise)));
  };

  const handleChange = (field, value) => {
    updateExercise({
      ...normalizedExercise,
      [field]: value
    });
  };

  const handleAddItem = () => {
    const newItems = [...normalizedExercise.items, ""];
    const newCorrectOrderValues = [...normalizedExercise.correctOrderValues, ""];

    updateExercise({
      ...normalizedExercise,
      items: newItems,
      correctOrderValues: newCorrectOrderValues
    });
  };

  const handleItemChange = (index, value) => {
    const oldValue = normalizedExercise.items[index];
    const newItems = [...normalizedExercise.items];
    newItems[index] = value;

    const newCorrectOrderValues = normalizedExercise.correctOrderValues.map(
      (item) => (item === oldValue ? value : item)
    );

    updateExercise({
      ...normalizedExercise,
      items: newItems,
      correctOrderValues: newCorrectOrderValues
    });
  };

  const handleRemoveItem = (index) => {
    const removedValue = normalizedExercise.items[index];

    updateExercise({
      ...normalizedExercise,
      items: normalizedExercise.items.filter((_, itemIndex) => itemIndex !== index),
      correctOrderValues: normalizedExercise.correctOrderValues.filter(
        (item) => item !== removedValue
      )
    });
  };

  const handleMoveOrder = (orderIndex, direction) => {
    const newCorrectOrderValues = [...normalizedExercise.correctOrderValues];
    const newIndex = direction === "up" ? orderIndex - 1 : orderIndex + 1;

    if (newIndex < 0 || newIndex >= newCorrectOrderValues.length) return;

    [newCorrectOrderValues[orderIndex], newCorrectOrderValues[newIndex]] = [
      newCorrectOrderValues[newIndex],
      newCorrectOrderValues[orderIndex]
    ];

    updateExercise({
      ...normalizedExercise,
      correctOrderValues: newCorrectOrderValues
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
          onChange={(event) => handleChange("instructions", event.target.value)}
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
            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            <FaPlus className="inline mr-2" />
            Dodaj element
          </button>
        </div>

        {normalizedExercise.items.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <input
              type="text"
              value={item}
              onChange={(event) => handleItemChange(index, event.target.value)}
              className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              placeholder={`Element ${index + 1}`}
            />

            <button
              type="button"
              onClick={() => handleRemoveItem(index)}
              className="p-2 text-red-600 hover:text-red-800 rounded-md"
              title="Usuń element"
            >
              <FaTrash />
            </button>
          </div>
        ))}
      </div>

      {normalizedExercise.correctOrderValues.length > 0 && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Poprawna kolejność
          </label>

          <div className="space-y-2 border rounded-md p-4 bg-gray-50">
            {normalizedExercise.correctOrderValues.map((item, orderIndex) => (
              <div
                key={`${item}_${orderIndex}`}
                className="flex items-center gap-2 bg-white p-2 rounded shadow-sm"
              >
                <span className="text-gray-500 w-6 text-center">
                  {orderIndex + 1}.
                </span>

                <span className="flex-1">{item || `Element ${orderIndex + 1}`}</span>

                <button
                  type="button"
                  onClick={() => handleMoveOrder(orderIndex, "up")}
                  disabled={orderIndex === 0}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                  title="Przenieś w górę"
                >
                  <FaArrowUp />
                </button>

                <button
                  type="button"
                  onClick={() => handleMoveOrder(orderIndex, "down")}
                  disabled={orderIndex === normalizedExercise.correctOrderValues.length - 1}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                  title="Przenieś w dół"
                >
                  <FaArrowDown />
                </button>
              </div>
            ))}
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

OrderExercise.defaultProps = {
  exercise: null,
  ejercicio: null
};

export default OrderExercise;