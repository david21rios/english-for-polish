import React, { useEffect, useState } from "react";

const normalizeAnswer = (text = "") => {
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[¿?¡!.,;:]/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

const shuffleArray = (items = []) => {
  if (!Array.isArray(items)) return [];

  const original = [...items];
  let shuffled = [...original];

  if (shuffled.length <= 1) return shuffled;

  let attempts = 0;

  do {
    shuffled = [...original];

    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    attempts++;
  } while (
    JSON.stringify(shuffled) === JSON.stringify(original) &&
    attempts < 10
  );

  return shuffled;
};

const getCorrectOrder = (exercise = {}) => {
  if (!Array.isArray(exercise.orden_correcto)) return [];

  if (exercise.orden_correcto.every((item) => typeof item === "number")) {
    return exercise.orden_correcto.map((index) => exercise.elementos?.[index]);
  }

  return exercise.orden_correcto;
};

const InteractivePractice = ({ exercises, onComplete }) => {
  const exercisesArray = Array.isArray(exercises)
    ? exercises.filter(Boolean)
    : exercises
    ? [exercises]
    : [];

  const [correctMap, setCorrectMap] = useState({});
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    setCorrectMap({});
    setCompleted(false);
  }, [exercises]);

  useEffect(() => {
    if (completed) return;

    const allCorrect =
      exercisesArray.length > 0 &&
      exercisesArray.every((_, index) => correctMap[index] === true);

    if (allCorrect) {
      setCompleted(true);
      onComplete?.();
    }
  }, [correctMap, exercisesArray.length, onComplete, completed]);

  if (!exercisesArray.length) {
    return <p className="text-gray-500">No hay ejercicios disponibles.</p>;
  }

  return (
    <div className="space-y-6">
      {exercisesArray.map((exercise, index) => (
        <SingleExercise
          key={`${exercise.tipo || "exercise"}-${index}`}
          exercise={exercise}
          onCorrectChange={(isCorrect) => {
            setCorrectMap((prev) => ({
              ...prev,
              [index]: isCorrect
            }));
          }}
        />
      ))}
    </div>
  );
};

const SingleExercise = ({ exercise, onCorrectChange }) => {
  const initializeUserResponse = () => {
    if (!exercise) return "";

    switch (exercise.tipo?.toLowerCase()) {
      case "ordering":
      case "ordenar":
        return shuffleArray(exercise.elementos || []);

      case "fill_blank":
      case "completar":
      case "matching":
      case "relacionar":
        return {};

      default:
        return "";
    }
  };

  const [userResponse, setUserResponse] = useState(initializeUserResponse());
  const [feedback, setFeedback] = useState(null);
  const [fieldFeedback, setFieldFeedback] = useState({});
  const [matchingFeedback, setMatchingFeedback] = useState({});
  const [orderingFeedback, setOrderingFeedback] = useState({});
  const [matchedPairs, setMatchedPairs] = useState({});
  const [selectedLeft, setSelectedLeft] = useState(null);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [displayRightItems, setDisplayRightItems] = useState([]);

  useEffect(() => {
    const rightItems =
      exercise?.pares_derecha ||
      exercise?.elementos_derecha ||
      [];

    setUserResponse(initializeUserResponse());
    setDisplayRightItems(shuffleArray(rightItems));
    setFeedback(null);
    setFieldFeedback({});
    setMatchingFeedback({});
    setOrderingFeedback({});
    setMatchedPairs({});
    setSelectedLeft(null);
    setDraggedIndex(null);
    onCorrectChange?.(false);
  }, [exercise]);

  if (!exercise || !exercise.tipo) {
    console.error("Ejercicio inválido:", exercise);
    return null;
  }

  const getAcceptedAnswers = (key, correctValue) => {
    const accepted = exercise.respuestas_aceptadas?.[key];

    if (Array.isArray(accepted)) {
      return [correctValue, ...accepted].map(normalizeAnswer);
    }

    return [correctValue].map(normalizeAnswer);
  };

  const resetGeneralFeedback = () => {
    setFeedback(null);
    onCorrectChange?.(false);
  };

  const checkAnswer = () => {
    let isCorrect = false;
    let customMessage = "";

    switch (exercise.tipo.toLowerCase()) {
      case "multiple_choice":
      case "seleccion_multiple": {
        let correctAnswer = exercise.respuesta_correcta;

        if (typeof correctAnswer === "number") {
          correctAnswer = exercise.opciones?.[correctAnswer];
        }

        isCorrect =
          normalizeAnswer(userResponse) === normalizeAnswer(correctAnswer);

        customMessage = isCorrect
          ? "¡Correcto! Muy bien."
          : `Revisa tu respuesta. La opción correcta es: ${correctAnswer}`;

        break;
      }

      case "fill_blank":
      case "completar": {
        const results = {};

        Object.entries(
          exercise.respuestas ||
            exercise.respuestas_correctas ||
            {}
        ).forEach(([key, value]) => {
          const user = normalizeAnswer(userResponse[key] || "");
          const acceptedAnswers = getAcceptedAnswers(key, value);

          results[key] = acceptedAnswers.includes(user);
        });

        setFieldFeedback(results);

        isCorrect =
          Object.keys(results).length > 0 &&
          Object.values(results).every(Boolean);

        customMessage = isCorrect
          ? "¡Correcto! Completaste todos los espacios."
          : "Revisa los espacios marcados en rojo y vuelve a intentarlo.";

        break;
      }

      case "matching":
      case "relacionar": {
        const results = {};
        const leftItems =
          exercise.pares_izquierda ||
          exercise.elementos_izquierda ||
          [];

        leftItems.forEach((_, index) => {
          let expected = exercise.respuestas_correctas?.[`par${index}`];

          if (!expected && exercise.pares_correctos) {
            expected = exercise.pares_correctos[leftItems[index]];
          }

          const selected = matchedPairs[`item-${index}`];

          results[index] =
            normalizeAnswer(selected) === normalizeAnswer(expected);
        });

        setMatchingFeedback(results);

        isCorrect =
          Object.keys(results).length > 0 &&
          Object.values(results).every(Boolean);

        customMessage = isCorrect
          ? "¡Correcto! Todas las relaciones están bien."
          : "Revisa las relaciones marcadas en rojo y vuelve a intentarlo.";

        break;
      }

      case "ordering":
      case "ordenar": {
        const results = {};
        const correctOrder = getCorrectOrder(exercise);

        if (
          Array.isArray(userResponse) &&
          Array.isArray(correctOrder) &&
          correctOrder.length > 0
        ) {
          userResponse.forEach((item, index) => {
            results[index] =
              normalizeAnswer(item) === normalizeAnswer(correctOrder[index]);
          });

          setOrderingFeedback(results);

          isCorrect =
            Object.keys(results).length > 0 &&
            Object.values(results).every(Boolean);
        }

        customMessage = isCorrect
          ? "¡Correcto! El orden está bien."
          : "Revisa el orden. Los elementos en rojo están en una posición incorrecta.";

        break;
      }

      default:
        console.error("Tipo de ejercicio no soportado:", exercise.tipo);
        return;
    }

    setFeedback({
      isCorrect,
      message: customMessage
    });

    onCorrectChange?.(isCorrect);
  };

  const renderMultipleChoice = () => (
    <div className="space-y-3">
      <p className="font-medium mb-4">{exercise.pregunta}</p>

      {(exercise.opciones || []).map((opcion, index) => {
        const isSelected = userResponse === opcion;
        let correctAnswer = exercise.respuesta_correcta;

        if (typeof correctAnswer === "number") {
          correctAnswer = exercise.opciones?.[correctAnswer];
        }

        const isCorrectOption =
          normalizeAnswer(opcion) === normalizeAnswer(correctAnswer);

        const optionClass = feedback
          ? isCorrectOption
            ? "bg-green-100 border-green-500 text-green-800"
            : isSelected
            ? "bg-red-100 border-red-500 text-red-800"
            : "hover:bg-gray-50 border-gray-200"
          : isSelected
          ? "bg-primary-50 border-primary-500"
          : "hover:bg-gray-50 border-gray-200";

        return (
          <button
            key={index}
            type="button"
            className={`w-full text-left p-4 rounded-lg border-2 transition-all ${optionClass}`}
            onClick={() => {
              setUserResponse(opcion);
              resetGeneralFeedback();
            }}
          >
            {opcion}
          </button>
        );
      })}
    </div>
  );

  const renderFillInBlank = () => {
    if (!exercise.texto) return null;

    const textParts = exercise.texto.split(/_{2,}/g);

    return (
      <div className="space-y-4">
        {exercise.pregunta && (
          <h3 className="font-medium text-lg text-gray-900 mb-2">
            {exercise.pregunta}
          </h3>
        )}

        <div className="bg-gray-50 p-4 rounded-lg">
          {exercise.instrucciones && (
            <p className="font-medium mb-4 text-gray-700">
              {exercise.instrucciones}
            </p>
          )}

          {Array.isArray(exercise.palabras) && exercise.palabras.length > 0 && (
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Palabras de ayuda:
              </p>

              <div className="flex flex-wrap gap-2">
                {exercise.palabras.map((palabra, index) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full font-medium text-sm"
                  >
                    {palabra}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-2 leading-10">
            {textParts.map((part, index) => {
              const blankKey = `blank${index}`;
              const state = fieldFeedback[blankKey];

              return (
                <React.Fragment key={index}>
                  <span className="text-gray-700 text-lg">{part}</span>

                  {index < textParts.length - 1 && (
                    <span className="inline-block min-w-[140px]">
                      <input
                        type="text"
                        value={userResponse[blankKey] || ""}
                        onChange={(e) => {
                          setUserResponse((prev) => ({
                            ...prev,
                            [blankKey]: e.target.value
                          }));

                          setFieldFeedback((prev) => ({
                            ...prev,
                            [blankKey]: undefined
                          }));

                          resetGeneralFeedback();
                        }}
                        className={`w-full px-3 py-1 border-b-2 focus:outline-none text-center ${
                          state === true
                            ? "border-green-500 bg-green-50 text-green-800"
                            : state === false
                            ? "border-red-500 bg-red-50 text-red-800"
                            : "border-gray-300 focus:border-primary-500"
                        }`}
                        placeholder="Escribe aquí"
                      />
                    </span>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderMatching = () => {
    const leftItems =
      exercise.pares_izquierda ||
      exercise.elementos_izquierda ||
      [];

    const rightItems = displayRightItems;

    if (!leftItems.length || !rightItems.length) {
      return (
        <p className="text-gray-500">
          Este ejercicio de relacionar no tiene pares disponibles.
        </p>
      );
    }

    return (
      <div className="space-y-4">
        {exercise.pregunta && (
          <p className="font-medium">{exercise.pregunta}</p>
        )}

        {exercise.instrucciones && (
          <p className="text-gray-700">{exercise.instrucciones}</p>
        )}

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            {leftItems.map((item, index) => {
              const selected = matchedPairs[`item-${index}`];
              const state = matchingFeedback[index];

              const leftClass =
                state === true
                  ? "bg-green-100 border-green-500 text-green-800"
                  : state === false
                  ? "bg-red-100 border-red-500 text-red-800"
                  : selected
                  ? "bg-blue-50 border-blue-500 text-blue-800"
                  : selectedLeft === index
                  ? "bg-primary-50 border-primary-500"
                  : "hover:bg-gray-50 border-gray-200";

              return (
                <button
                  key={index}
                  type="button"
                  className={`w-full text-left p-3 rounded-lg border-2 transition-all ${leftClass}`}
                  onClick={() => {
                    setSelectedLeft(selectedLeft === index ? null : index);
                    resetGeneralFeedback();
                  }}
                >
                  <div className="font-semibold">{item}</div>

                  {selected && (
                    <div className="text-sm mt-1 opacity-80">
                      🔗 {selected}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="space-y-2">
            {rightItems.map((item, index) => {
              const alreadySelectedByAnother = Object.entries(matchedPairs).some(
                ([key, value]) => key !== `item-${selectedLeft}` && value === item
              );

              return (
                <button
                  key={`${item}-${index}`}
                  type="button"
                  className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                    alreadySelectedByAnother
                      ? "bg-gray-100 border-gray-300 text-gray-500"
                      : selectedLeft !== null
                      ? "bg-white border-gray-300 hover:bg-primary-50 hover:border-primary-400"
                      : "bg-white border-gray-200 hover:bg-gray-50"
                  }`}
                  onClick={() => {
                    if (selectedLeft === null || alreadySelectedByAnother) {
                      return;
                    }

                    setMatchedPairs((prev) => ({
                      ...prev,
                      [`item-${selectedLeft}`]: item
                    }));

                    setMatchingFeedback((prev) => ({
                      ...prev,
                      [selectedLeft]: undefined
                    }));

                    setSelectedLeft(null);
                    resetGeneralFeedback();
                  }}
                >
                  {item}
                </button>
              );
            })}
          </div>
        </div>

        {Object.keys(matchedPairs).length > 0 && (
          <button
            type="button"
            className="text-sm text-red-600 hover:text-red-700 font-medium"
            onClick={() => {
              setMatchedPairs({});
              setMatchingFeedback({});
              setSelectedLeft(null);
              resetGeneralFeedback();
            }}
          >
            Reiniciar relaciones
          </button>
        )}
      </div>
    );
  };

  const renderOrdering = () => {
    if (!Array.isArray(userResponse)) return null;

    return (
      <div className="space-y-4">
        {exercise.pregunta && (
          <p className="font-medium">{exercise.pregunta}</p>
        )}

        {exercise.instrucciones && (
          <p className="text-gray-700">{exercise.instrucciones}</p>
        )}

        <div className="space-y-3">
          {userResponse.map((item, index) => {
            const state = orderingFeedback[index];

            const itemClass =
              state === true
                ? "border-green-500 bg-green-50 text-green-800"
                : state === false
                ? "border-red-500 bg-red-50 text-red-800"
                : draggedIndex === index
                ? "border-primary-500"
                : "border-gray-200";

            return (
              <div
                key={`${item}-${index}`}
                draggable
                className={`p-4 rounded-lg shadow-sm cursor-move border-2 hover:shadow-md transition-all ${itemClass}`}
                onDragStart={(e) => {
                  setDraggedIndex(index);
                  e.dataTransfer.setData("text/plain", index.toString());
                }}
                onDragEnd={() => setDraggedIndex(null)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();

                  const fromIndex = parseInt(
                    e.dataTransfer.getData("text/plain"),
                    10
                  );

                  if (fromIndex === index) return;

                  const newOrder = [...userResponse];
                  const [movedItem] = newOrder.splice(fromIndex, 1);
                  newOrder.splice(index, 0, movedItem);

                  setUserResponse(newOrder);
                  setOrderingFeedback({});
                  resetGeneralFeedback();
                }}
              >
                <div className="flex justify-between items-center gap-4">
                  <span>{item}</span>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (index <= 0) return;

                        const newOrder = [...userResponse];

                        [newOrder[index], newOrder[index - 1]] = [
                          newOrder[index - 1],
                          newOrder[index]
                        ];

                        setUserResponse(newOrder);
                        setOrderingFeedback({});
                        resetGeneralFeedback();
                      }}
                      className="text-gray-400 hover:text-gray-700"
                      disabled={index === 0}
                    >
                      ↑
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (index >= userResponse.length - 1) return;

                        const newOrder = [...userResponse];

                        [newOrder[index], newOrder[index + 1]] = [
                          newOrder[index + 1],
                          newOrder[index]
                        ];

                        setUserResponse(newOrder);
                        setOrderingFeedback({});
                        resetGeneralFeedback();
                      }}
                      className="text-gray-400 hover:text-gray-700"
                      disabled={index === userResponse.length - 1}
                    >
                      ↓
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderExerciseContent = () => {
    switch (exercise.tipo.toLowerCase()) {
      case "multiple_choice":
      case "seleccion_multiple":
        return renderMultipleChoice();

      case "fill_blank":
      case "completar":
        return renderFillInBlank();

      case "matching":
      case "relacionar":
        return renderMatching();

      case "ordering":
      case "ordenar":
        return renderOrdering();

      default:
        console.error("Tipo de ejercicio no soportado:", exercise.tipo);
        return null;
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      {renderExerciseContent()}

      <button
        type="button"
        onClick={checkAnswer}
        className="mt-6 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
      >
        Verificar respuesta
      </button>

      {feedback && (
        <div
          className={`mt-4 p-4 rounded-lg ${
            feedback.isCorrect
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {feedback.message}
        </div>
      )}
    </div>
  );
};

export default InteractivePractice;