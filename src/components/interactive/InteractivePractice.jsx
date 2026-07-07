//src/components/interactive/InteractivePractice.jsx
import React, { useEffect, useMemo, useState } from "react";

const normalizeAnswer = (text = "") =>
  text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[¿?¡!.,;:]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const normalizeExerciseType = (type = "") => {
  const normalized = type.toString().toLowerCase().trim();

  const map = {
    multiple_choice: "multiple_choice",
    seleccion_multiple: "multiple_choice",
    fill_blank: "fill_blank",
    completar: "fill_blank",
    matching: "matching",
    relacionar: "matching",
    ordering: "ordering",
    ordenar: "ordering"
  };

  return map[normalized] || normalized;
};

const toArray = (value) => {
  if (Array.isArray(value)) {
    return value.filter((item) => item !== null && item !== undefined && item !== "");
  }

  if (value !== null && value !== undefined && value !== "") {
    return [value];
  }

  return [];
};

const shuffleArray = (items = []) => {
  const original = Array.isArray(items) ? [...items].filter(Boolean) : [];
  if (original.length <= 1) return original;

  let shuffled = [...original];

  for (let attempt = 0; attempt < 10; attempt += 1) {
    shuffled = [...original];

    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    if (JSON.stringify(shuffled) !== JSON.stringify(original)) break;
  }

  return shuffled;
};

const normalizeCorrectPairs = (exercise = {}) => {
  const source =
    exercise.correctPairs ||
    exercise.correct_pairs ||
    exercise.pares_correctos ||
    exercise.correctMatches ||
    exercise.respuestas_correctas ||
    {};

  const leftItems = toArray(
    exercise.leftItems ||
      exercise.left_items ||
      exercise.pares_izquierda ||
      exercise.elementos_izquierda
  );

  if (!source || typeof source !== "object") return {};

  return Object.entries(source).reduce((acc, [key, value]) => {
    if (key.startsWith("pair") || key.startsWith("par")) {
      const index = Number(key.replace(/\D/g, ""));
      const leftValue = leftItems[index];

      if (leftValue) {
        acc[leftValue] = value;
      }

      return acc;
    }

    acc[key] = value;
    return acc;
  }, {});
};

const normalizeExercise = (exercise = {}) => {
  const type = normalizeExerciseType(exercise.type || exercise.tipo);

  return {
    ...exercise,
    type,
    question: exercise.question || exercise.pregunta || "",
    instruction:
      exercise.instruction ||
      exercise.instructions ||
      exercise.instrucciones ||
      "",
    options: toArray(exercise.options || exercise.opciones),
    correctAnswer:
      exercise.correctAnswer ||
      exercise.correct_answer ||
      exercise.respuesta_correcta ||
      exercise.answer ||
      "",
    text: exercise.text || exercise.texto || "",
    words: toArray(exercise.words || exercise.palabras),
    correctAnswers: (() => {
      const candidates = [
        exercise.correctAnswers,
        exercise.correct_answers,
        exercise.respuestas,
        exercise.answers,
        exercise.respuestas_correctas
      ];
    
      return (
        candidates.find(
          (item) =>
            item &&
            typeof item === "object" &&
            !Array.isArray(item) &&
            Object.keys(item).length > 0
        ) || {}
      );
    })(),
    acceptedAnswers:
      exercise.acceptedAnswers ||
      exercise.accepted_answers ||
      exercise.respuestas_aceptadas ||
      {},
    leftItems: toArray(
      exercise.leftItems ||
        exercise.left_items ||
        exercise.pares_izquierda ||
        exercise.elementos_izquierda
    ),
    rightItems: toArray(
      exercise.rightItems ||
        exercise.right_items ||
        exercise.pares_derecha ||
        exercise.elementos_derecha
    ),
    correctPairs: normalizeCorrectPairs(exercise),
    items: toArray(exercise.items || exercise.elementos),
    correctOrder: toArray(
      exercise.correctOrder ||
        exercise.correct_order ||
        exercise.orden_correcto
    ),
    correctOrderValues: toArray(
      exercise.correctOrderValues || exercise.correct_order_values
    ),
    correct_order_values: toArray(
      exercise.correct_order_values || exercise.correctOrderValues
    )
  };
};

const sameItemsSet = (a = [], b = []) => {
  const normalizeList = (list) =>
    list.map(normalizeAnswer).sort().join("|");

  return normalizeList(a) === normalizeList(b);
};

const getCorrectOrder = (exercise = {}) => {
  const items = toArray(exercise.items || exercise.elementos);

  const explicitOrder = toArray(
    exercise.correctOrderValues ||
      exercise.correct_order_values ||
      exercise.correctOrderText ||
      exercise.correct_order_text
  );

  if (
    explicitOrder.length > 0 &&
    explicitOrder.length === items.length &&
    sameItemsSet(explicitOrder, items)
  ) {
    return explicitOrder.map(String);
  }

  const correctOrder = toArray(
    exercise.correctOrder ||
      exercise.correct_order ||
      exercise.orden_correcto
  );

  const isNumericIndex = (item) =>
    typeof item === "number" ||
    (typeof item === "string" && /^\d+$/.test(item.trim()));

  if (correctOrder.length > 0 && correctOrder.every(isNumericIndex)) {
    const ordered = correctOrder
      .map((index) => items[Number(index)])
      .filter((item) => item !== null && item !== undefined && item !== "");

    if (ordered.length === items.length) {
      return ordered;
    }
  }

  if (
    correctOrder.length > 0 &&
    correctOrder.length === items.length &&
    sameItemsSet(correctOrder.map(String), items)
  ) {
    return correctOrder.map(String);
  }

  console.warn("Ordering exercise has no valid correct order:", exercise);
  return [];
};

const calculatePracticeProgress = ({ exercisesArray = [], resultMap = {} }) => {
  const totalExercises = exercisesArray.length;

  const completedExercises = Object.values(resultMap).filter(
    (item) => item?.isCorrect === true
  ).length;

  const attempts = Object.values(resultMap).reduce(
    (total, item) => total + (Number(item?.attempts) || 0),
    0
  );

  const score =
    totalExercises > 0
      ? Math.round((completedExercises / totalExercises) * 100)
      : null;

  return {
    completed: totalExercises > 0 && completedExercises === totalExercises,
    score,
    attempts,
    completedExercises,
    totalExercises,
    correctAnswers: completedExercises,
    totalQuestions: null,
    skill: "practice",
    updatedAt: new Date().toISOString()
  };
};

const InteractivePractice = ({ exercises = [], onComplete }) => {
  const exercisesArray = useMemo(() => {
    const rawExercises = Array.isArray(exercises)
      ? exercises.filter(Boolean)
      : exercises
      ? [exercises]
      : [];

    return rawExercises.map(normalizeExercise);
  }, [exercises]);

  const [resultMap, setResultMap] = useState({});
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    setResultMap({});
    setCompleted(false);
  }, [exercises]);

  useEffect(() => {
    if (completed) return;

    const progress = calculatePracticeProgress({
      exercisesArray,
      resultMap
    });

    if (progress.completed) {
      setCompleted(true);
      onComplete?.(progress);
    }
  }, [resultMap, exercisesArray, completed, onComplete]);

  if (!exercisesArray.length) {
    return <p className="text-gray-500">Brak dostępnych ćwiczeń.</p>;
  }

  return (
    <div className="space-y-6">
      {exercisesArray.map((exercise, index) => (
        <SingleExercise
          key={`${exercise.type || "exercise"}-${index}`}
          exercise={exercise}
          onResultChange={(result) => {
            setResultMap((prev) => ({
              ...prev,
              [index]: result
            }));
          }}
        />
      ))}
    </div>
  );
};

const SingleExercise = ({ exercise, onResultChange }) => {
  const initializeUserResponse = () => {
    if (!exercise) return "";

    switch (exercise.type) {
      case "ordering":
        return shuffleArray(exercise.items || []);

      case "fill_blank":
      case "matching":
        return {};

      default:
        return "";
    }
  };

  const [userResponse, setUserResponse] = useState(initializeUserResponse);
  const [feedback, setFeedback] = useState(null);
  const [fieldFeedback, setFieldFeedback] = useState({});
  const [matchingFeedback, setMatchingFeedback] = useState({});
  const [orderingFeedback, setOrderingFeedback] = useState({});
  const [matchedPairs, setMatchedPairs] = useState({});
  const [selectedLeft, setSelectedLeft] = useState(null);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [displayRightItems, setDisplayRightItems] = useState([]);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    setUserResponse(initializeUserResponse());
    setDisplayRightItems(shuffleArray(exercise?.rightItems || []));
    setFeedback(null);
    setFieldFeedback({});
    setMatchingFeedback({});
    setOrderingFeedback({});
    setMatchedPairs({});
    setSelectedLeft(null);
    setDraggedIndex(null);
    setAttempts(0);

    onResultChange?.({
      isCorrect: false,
      attempts: 0,
      updatedAt: new Date().toISOString()
    });
  }, [exercise]);

  if (!exercise || !exercise.type) return null;

  const getAcceptedAnswers = (key, correctValue) => {
    const accepted = exercise.acceptedAnswers?.[key];

    if (Array.isArray(accepted)) {
      return [correctValue, ...accepted].map(normalizeAnswer);
    }

    return [correctValue].map(normalizeAnswer);
  };

  const resetGeneralFeedback = () => {
    setFeedback(null);

    onResultChange?.({
      isCorrect: false,
      attempts,
      updatedAt: new Date().toISOString()
    });
  };

  const notifyResult = ({ isCorrect, nextAttempts }) => {
    onResultChange?.({
      isCorrect,
      attempts: nextAttempts,
      updatedAt: new Date().toISOString()
    });
  };

  const checkAnswer = () => {
    let isCorrect = false;
    let customMessage = "";

    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);

    switch (exercise.type) {
      case "multiple_choice": {
        let correctAnswer = exercise.correctAnswer;

        if (typeof correctAnswer === "number") {
          correctAnswer = exercise.options?.[correctAnswer];
        }

        isCorrect =
          normalizeAnswer(userResponse) === normalizeAnswer(correctAnswer);

        customMessage = isCorrect
          ? "Dobrze! Poprawna odpowiedź."
          : `Sprawdź odpowiedź. Poprawna odpowiedź: ${correctAnswer}`;

        break;
      }

      case "fill_blank": {
        const results = {};
        const textParts = exercise.text.split(/_{2,}/g);
        const blankCount = Math.max(textParts.length - 1, 0);
            
        for (let index = 0; index < blankCount; index += 1) {
          const blankKey = `blank${index}`;
          const alternativeKey = String(index);
        
          const expected =
            exercise.correctAnswers?.[blankKey] ??
            exercise.correctAnswers?.[alternativeKey] ??
            exercise.words?.[index] ??
            "";
        
          const user =
            userResponse[blankKey] ??
            userResponse[alternativeKey] ??
            "";
        
          const acceptedAnswers = getAcceptedAnswers(
            exercise.correctAnswers?.[blankKey] !== undefined ? blankKey : alternativeKey,
            expected
          );
        
          results[blankKey] = acceptedAnswers.includes(normalizeAnswer(user));
        }
      
        setFieldFeedback(results);
      
        isCorrect =
          Object.keys(results).length > 0 &&
          Object.values(results).every(Boolean);
      
        customMessage = isCorrect
          ? "Dobrze! Wszystkie luki są uzupełnione poprawnie."
          : "Sprawdź pola oznaczone na czerwono i spróbuj ponownie.";
      
        break;
      }

      case "matching": {
        const results = {};

        exercise.leftItems.forEach((item, index) => {
          const expected = exercise.correctPairs?.[item];
          const selected = matchedPairs[`item-${index}`];

          results[index] =
            normalizeAnswer(selected) === normalizeAnswer(expected);
        });

        setMatchingFeedback(results);

        isCorrect =
          Object.keys(results).length > 0 &&
          Object.values(results).every(Boolean);

        customMessage = isCorrect
          ? "Dobrze! Wszystkie pary są poprawne."
          : "Sprawdź relacje oznaczone na czerwono i spróbuj ponownie.";

        break;
      }

      case "ordering": {
        const results = {};
        const correctOrder = getCorrectOrder(exercise);

        if (Array.isArray(userResponse) && correctOrder.length > 0) {
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
          ? "Dobrze! Kolejność jest poprawna."
          : "Sprawdź kolejność. Elementy na czerwono są w złej pozycji.";

        break;
      }

      default:
        return;
    }

    setFeedback({
      isCorrect,
      message: customMessage
    });

    notifyResult({
      isCorrect,
      nextAttempts
    });
  };

  const renderMultipleChoice = () => (
    <div className="space-y-3">
      <p className="font-medium mb-4">{exercise.question}</p>

      {(exercise.options || []).map((option, index) => {
        const isSelected = userResponse === option;
        let correctAnswer = exercise.correctAnswer;

        if (typeof correctAnswer === "number") {
          correctAnswer = exercise.options?.[correctAnswer];
        }

        const isCorrectOption =
          normalizeAnswer(option) === normalizeAnswer(correctAnswer);

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
              setUserResponse(option);
              resetGeneralFeedback();
            }}
          >
            {option}
          </button>
        );
      })}
    </div>
  );

  const renderFillInBlank = () => {
    if (!exercise.text) return null;

    const textParts = exercise.text.split(/_{2,}/g);

    return (
      <div className="space-y-4">
        {exercise.question && (
          <h3 className="font-medium text-lg text-gray-900 mb-2">
            {exercise.question}
          </h3>
        )}

        <div className="bg-gray-50 p-4 rounded-lg">
          {exercise.instruction && (
            <p className="font-medium mb-4 text-gray-700">
              {exercise.instruction}
            </p>
          )}

          {exercise.words.length > 0 && (
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Słowa pomocnicze:</p>

              <div className="flex flex-wrap gap-2">
                {exercise.words.map((word, index) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full font-medium text-sm"
                  >
                    {word}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-2 leading-10">
            {textParts.map((part, index) => {
              const blankKey = `blank${index}`;
              const alternativeKey = String(index);
              const answerKey =
                exercise.correctAnswers?.[blankKey] !== undefined
                  ? blankKey
                  : exercise.correctAnswers?.[alternativeKey] !== undefined
                  ? alternativeKey
                  : blankKey;
              const state = fieldFeedback[answerKey];

              return (
                <React.Fragment key={index}>
                  <span className="text-gray-700 text-lg">{part}</span>

                  {index < textParts.length - 1 && (
                    <span className="inline-block min-w-[140px]">
                      <input
                        type="text"
                        value={userResponse[answerKey] || ""}
                        onChange={(event) => {
                          setUserResponse((prev) => ({
                            ...prev,
                            [answerKey]: event.target.value
                          }));

                          setFieldFeedback((prev) => ({
                            ...prev,
                            [answerKey]: undefined
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
                        placeholder="Wpisz tutaj"
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
    const leftItems = exercise.leftItems || [];
    const rightItems = displayRightItems;

    if (!leftItems.length || !rightItems.length) {
      return <p className="text-gray-500">To ćwiczenie nie ma dostępnych par.</p>;
    }

    return (
      <div className="space-y-4">
        {exercise.question && <p className="font-medium">{exercise.question}</p>}

        {exercise.instruction && (
          <p className="text-gray-700">{exercise.instruction}</p>
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
                    <div className="text-sm mt-1 opacity-80">🔗 {selected}</div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="space-y-2">
            {rightItems.map((item, index) => {
              const alreadySelectedByAnother = Object.entries(
                matchedPairs
              ).some(
                ([key, value]) =>
                  key !== `item-${selectedLeft}` && value === item
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
                    if (selectedLeft === null || alreadySelectedByAnother) return;

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

          <button
            type="button"
            disabled={Object.keys(matchedPairs).length === 0}
            className={`text-sm font-medium ${
              Object.keys(matchedPairs).length === 0
                ? "text-gray-400 cursor-not-allowed"
                : "text-red-600 hover:text-red-700"
            }`}
            onClick={() => {
              if (Object.keys(matchedPairs).length === 0) return;
            
              setMatchedPairs({});
              setMatchingFeedback({});
              setSelectedLeft(null);
              resetGeneralFeedback();
            }}
          >
            Wyczyść połączenia
          </button>
      </div>
    );
  };

  const renderOrdering = () => {
    if (!Array.isArray(userResponse)) return null;

    return (
      <div className="space-y-4">
        {exercise.question && <p className="font-medium">{exercise.question}</p>}

        {exercise.instruction && (
          <p className="text-gray-700">{exercise.instruction}</p>
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
                onDragStart={(event) => {
                  setDraggedIndex(index);
                  event.dataTransfer.setData("text/plain", index.toString());
                }}
                onDragEnd={() => setDraggedIndex(null)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();

                  const fromIndex = parseInt(
                    event.dataTransfer.getData("text/plain"),
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
                      disabled={index === 0}
                      className="text-gray-400 hover:text-gray-700"
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
                    >
                      ↑
                    </button>

                    <button
                      type="button"
                      disabled={index === userResponse.length - 1}
                      className="text-gray-400 hover:text-gray-700"
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
    switch (exercise.type) {
      case "multiple_choice":
        return renderMultipleChoice();

      case "fill_blank":
        return renderFillInBlank();

      case "matching":
        return renderMatching();

      case "ordering":
        return renderOrdering();

      default:
        return (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700 font-medium">
              Nieobsługiwany typ ćwiczenia:
            </p>
            <p className="text-red-600">{exercise.type}</p>
          </div>
        );
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
        Sprawdź odpowiedź
      </button>

      {feedback && (
        <div
          className={`mt-4 p-4 rounded-lg ${
            feedback.isCorrect
              ? "bg-green-100 text-green-800 border border-green-300"
              : "bg-red-100 text-red-800 border border-red-300"
          }`}
        >
          <p className="font-medium">{feedback.message}</p>

          <div className="mt-2 text-sm opacity-80">Próby: {attempts}</div>
        </div>
      )}
    </div>
  );
};

export default InteractivePractice;