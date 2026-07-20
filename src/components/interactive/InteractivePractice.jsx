// src/components/interactive/InteractivePractice.jsx

import React, {
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";

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
  const normalized = type
    .toString()
    .toLowerCase()
    .trim();

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
    return value.filter(
      (item) =>
        item !== null &&
        item !== undefined &&
        item !== ""
    );
  }

  if (
    value !== null &&
    value !== undefined &&
    value !== ""
  ) {
    return [value];
  }

  return [];
};

const isPlainObject = (value) =>
  value !== null &&
  typeof value === "object" &&
  !Array.isArray(value);

const shuffleArray = (items = []) => {
  const original = Array.isArray(items)
    ? [...items].filter(Boolean)
    : [];

  if (original.length <= 1) {
    return original;
  }

  let shuffled = [...original];

  for (
    let attempt = 0;
    attempt < 10;
    attempt += 1
  ) {
    shuffled = [...original];

    for (
      let index = shuffled.length - 1;
      index > 0;
      index -= 1
    ) {
      const randomIndex = Math.floor(
        Math.random() * (index + 1)
      );

      [
        shuffled[index],
        shuffled[randomIndex]
      ] = [
        shuffled[randomIndex],
        shuffled[index]
      ];
    }

    if (
      JSON.stringify(shuffled) !==
      JSON.stringify(original)
    ) {
      break;
    }
  }

  return shuffled;
};

const normalizeCorrectPairs = (
  exercise = {}
) => {
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

  if (!isPlainObject(source)) {
    return {};
  }

  return Object.entries(source).reduce(
    (accumulator, [key, value]) => {
      if (
        key.startsWith("pair") ||
        key.startsWith("par")
      ) {
        const index = Number(
          key.replace(/\D/g, "")
        );

        const leftValue =
          leftItems[index];

        if (leftValue) {
          accumulator[leftValue] =
            value;
        }

        return accumulator;
      }

      accumulator[key] = value;

      return accumulator;
    },
    {}
  );
};

const normalizeExercise = (
  exercise = {}
) => {
  const type = normalizeExerciseType(
    exercise.type ||
      exercise.tipo
  );

  const correctAnswer =
    exercise.correctAnswer ??
    exercise.correct_answer ??
    exercise.respuesta_correcta ??
    exercise.answer ??
    "";

  return {
    ...exercise,

    type,

    question:
      exercise.question ||
      exercise.pregunta ||
      "",

    instruction:
      exercise.instruction ||
      exercise.instructions ||
      exercise.instrucciones ||
      "",

    options: toArray(
      exercise.options ||
        exercise.opciones
    ),

    correctAnswer,

    text:
      exercise.text ||
      exercise.texto ||
      "",

    words: toArray(
      exercise.words ||
        exercise.palabras
    ),

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
            isPlainObject(item) &&
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

    correctPairs:
      normalizeCorrectPairs(exercise),

    items: toArray(
      exercise.items ||
        exercise.elementos
    ),

    correctOrder: toArray(
      exercise.correctOrder ||
        exercise.correct_order ||
        exercise.orden_correcto
    ),

    correctOrderValues: toArray(
      exercise.correctOrderValues ||
        exercise.correct_order_values
    )
  };
};

const sameItemsSet = (
  firstList = [],
  secondList = []
) => {
  const normalizeList = (list) =>
    list
      .map(normalizeAnswer)
      .sort()
      .join("|");

  return (
    normalizeList(firstList) ===
    normalizeList(secondList)
  );
};

const getCorrectOrder = (
  exercise = {}
) => {
  const items = toArray(
    exercise.items ||
      exercise.elementos
  );

  const explicitOrder = toArray(
    exercise.correctOrderValues ||
      exercise.correct_order_values ||
      exercise.correctOrderText ||
      exercise.correct_order_text
  );

  if (
    explicitOrder.length > 0 &&
    explicitOrder.length ===
      items.length &&
    sameItemsSet(
      explicitOrder,
      items
    )
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
    (
      typeof item === "string" &&
      /^\d+$/.test(item.trim())
    );

  if (
    correctOrder.length > 0 &&
    correctOrder.every(
      isNumericIndex
    )
  ) {
    const ordered = correctOrder
      .map(
        (index) =>
          items[Number(index)]
      )
      .filter(
        (item) =>
          item !== null &&
          item !== undefined &&
          item !== ""
      );

    if (
      ordered.length ===
      items.length
    ) {
      return ordered;
    }
  }

  if (
    correctOrder.length > 0 &&
    correctOrder.length ===
      items.length &&
    sameItemsSet(
      correctOrder.map(String),
      items
    )
  ) {
    return correctOrder.map(String);
  }

  console.warn(
    "Ordering exercise has no valid correct order:",
    exercise
  );

  return [];
};

const calculatePracticeProgress = ({
  exercisesArray = [],
  resultMap = {}
}) => {
  const totalExercises =
    exercisesArray.length;

  const completedExercises =
    Object.values(resultMap).filter(
      (result) =>
        result?.isCorrect === true
    ).length;

  const attempts =
    Object.values(resultMap).reduce(
      (total, result) =>
        total +
        (
          Number(
            result?.attempts
          ) || 0
        ),
      0
    );

  const score =
    totalExercises > 0
      ? Math.round(
          (
            completedExercises /
            totalExercises
          ) * 100
        )
      : null;

  return {
    completed:
      totalExercises > 0 &&
      completedExercises ===
        totalExercises,

    score,
    attempts,
    completedExercises,
    totalExercises,
    correctAnswers:
      completedExercises,
    totalQuestions: null,
    skill: "practice",
    updatedAt:
      new Date().toISOString()
  };
};

const getInitialUserResponse = (
  exercise
) => {
  if (!exercise) {
    return "";
  }

  switch (exercise.type) {
    case "ordering":
      return shuffleArray(
        exercise.items || []
      );

    case "fill_blank":
    case "matching":
      return {};

    default:
      return "";
  }
};

const InteractivePractice = ({
  exercises = [],
  initialResult = null,
  onProgress = null,
  onComplete
}) => {
  const exercisesArray =
    useMemo(() => {
      const rawExercises =
        Array.isArray(exercises)
          ? exercises.filter(Boolean)
          : exercises
          ? [exercises]
          : [];

      return rawExercises.map(
        normalizeExercise
      );
    }, [exercises]);

  const initialExerciseResults =
    isPlainObject(
      initialResult?.exerciseResults
    )
      ? initialResult.exerciseResults
      : {};

  const [resultMap, setResultMap] =
    useState(
      initialExerciseResults
    );

  const [completed, setCompleted] =
    useState(
      Boolean(
        initialResult?.completed
      )
    );

  /*
   * Impide que el resultado que vuelve desde
   * Firestore reinicie el ejercicio mientras
   * el estudiante está trabajando.
   */
  const hasLocalChangesRef =
    useRef(false);

  const hydratingRef =
    useRef(false);

  const completionNotifiedRef =
    useRef(
      Boolean(
        initialResult?.completed
      )
    );

  const onProgressRef =
    useRef(onProgress);

  const onCompleteRef =
    useRef(onComplete);

  useEffect(() => {
    onProgressRef.current =
      onProgress;
  }, [onProgress]);

  useEffect(() => {
    onCompleteRef.current =
      onComplete;
  }, [onComplete]);

  const externalResultKey =
    useMemo(
      () =>
        JSON.stringify({
          exerciseResults:
            initialExerciseResults,
          completed: Boolean(
            initialResult?.completed
          )
        }),
      [
        initialExerciseResults,
        initialResult?.completed
      ]
    );

  useEffect(() => {
    /*
     * Solo hidratamos mientras todavía no
     * existen cambios locales. Después de
     * responder un ejercicio, los cambios
     * devueltos por Firestore son solamente
     * un eco del estado que ya tenemos.
     */
    if (
      hasLocalChangesRef.current
    ) {
      return;
    }

    hydratingRef.current = true;

    setResultMap(
      initialExerciseResults
    );

    const restoredCompleted =
      Boolean(
        initialResult?.completed
      );

    setCompleted(
      restoredCompleted
    );

    completionNotifiedRef.current =
      restoredCompleted;
  }, [externalResultKey]);

  useEffect(() => {
    if (hydratingRef.current) {
      hydratingRef.current = false;
      return;
    }

    if (
      !hasLocalChangesRef.current ||
      Object.keys(resultMap).length === 0
    ) {
      return;
    }

    const progress =
      calculatePracticeProgress({
        exercisesArray,
        resultMap
      });

    const result = {
      ...progress,
      exerciseResults:
        resultMap
    };

    if (progress.completed) {
      setCompleted(true);

      if (
        !completionNotifiedRef.current
      ) {
        completionNotifiedRef.current =
          true;

        onCompleteRef.current?.(
          result
        );
      }

      return;
    }

    setCompleted(false);

    completionNotifiedRef.current =
      false;

    onProgressRef.current?.(
      result
    );
  }, [
    resultMap,
    exercisesArray
  ]);

  const handleResultChange = (
    exerciseIndex,
    result
  ) => {
    hasLocalChangesRef.current =
      true;

    setResultMap(
      (previousResults) => ({
        ...previousResults,
        [exerciseIndex]: result
      })
    );
  };

  if (!exercisesArray.length) {
    return (
      <p className="text-gray-500">
        Brak dostępnych ćwiczeń.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {exercisesArray.map(
        (exercise, index) => (
          <SingleExercise
            key={
              exercise.id ||
              `${exercise.type}-${index}`
            }
            exercise={exercise}
            initialResult={
              initialExerciseResults[
                index
              ] || null
            }
            onResultChange={(
              result
            ) =>
              handleResultChange(
                index,
                result
              )
            }
          />
        )
      )}

      {completed && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 font-semibold text-green-700">
          Świetnie! Wszystkie ćwiczenia
          zostały wykonane poprawnie.
        </div>
      )}
    </div>
  );
};

const SingleExercise = ({
  exercise,
  initialResult = null,
  onResultChange
}) => {
  const [userResponse, setUserResponse] =
    useState(() =>
      initialResult?.userResponse ??
      getInitialUserResponse(
        exercise
      )
    );

  const [feedback, setFeedback] =
    useState(
      initialResult?.feedback ||
        null
    );

  const [
    fieldFeedback,
    setFieldFeedback
  ] = useState(
    initialResult?.fieldFeedback ||
      {}
  );

  const [
    matchingFeedback,
    setMatchingFeedback
  ] = useState(
    initialResult?.matchingFeedback ||
      {}
  );

  const [
    orderingFeedback,
    setOrderingFeedback
  ] = useState(
    initialResult?.orderingFeedback ||
      {}
  );

  const [
    matchedPairs,
    setMatchedPairs
  ] = useState(
    initialResult?.matchedPairs ||
      {}
  );

  const [
    selectedLeft,
    setSelectedLeft
  ] = useState(null);

  const [
    draggedIndex,
    setDraggedIndex
  ] = useState(null);

  const [
    displayRightItems,
    setDisplayRightItems
  ] = useState(() =>
    initialResult
      ?.displayRightItems ||
    shuffleArray(
      exercise?.rightItems ||
        []
    )
  );

  const [attempts, setAttempts] =
    useState(
      Number(
        initialResult?.attempts
      ) || 0
    );

  /*
   * Después de la primera interacción, no
   * volvemos a hidratar desde initialResult.
   * Esto elimina el ciclo de titileo.
   */
  const hasInteractedRef =
    useRef(false);

  const initialResultKey =
    useMemo(
      () =>
        JSON.stringify(
          initialResult || null
        ),
      [initialResult]
    );

  useEffect(() => {
    if (
      hasInteractedRef.current
    ) {
      return;
    }

    if (initialResult) {
      setUserResponse(
        initialResult
          .userResponse ??
          getInitialUserResponse(
            exercise
          )
      );

      setFeedback(
        initialResult.feedback ||
          null
      );

      setFieldFeedback(
        initialResult
          .fieldFeedback ||
          {}
      );

      setMatchingFeedback(
        initialResult
          .matchingFeedback ||
          {}
      );

      setOrderingFeedback(
        initialResult
          .orderingFeedback ||
          {}
      );

      setMatchedPairs(
        initialResult
          .matchedPairs ||
          {}
      );

      setDisplayRightItems(
        initialResult
          .displayRightItems ||
          shuffleArray(
            exercise?.rightItems ||
              []
          )
      );

      setAttempts(
        Number(
          initialResult.attempts
        ) || 0
      );

      setSelectedLeft(null);
      setDraggedIndex(null);

      return;
    }

    setUserResponse(
      getInitialUserResponse(
        exercise
      )
    );

    setFeedback(null);
    setFieldFeedback({});
    setMatchingFeedback({});
    setOrderingFeedback({});
    setMatchedPairs({});

    setDisplayRightItems(
      shuffleArray(
        exercise?.rightItems ||
          []
      )
    );

    setAttempts(0);
    setSelectedLeft(null);
    setDraggedIndex(null);
  }, [
    exercise,
    initialResultKey
  ]);

  if (
    !exercise ||
    !exercise.type
  ) {
    return null;
  }

  const markInteraction = () => {
    hasInteractedRef.current =
      true;
  };

  const clearValidation = () => {
    markInteraction();

    setFeedback(null);
  };

  const getAcceptedAnswers = (
    key,
    correctValue
  ) => {
    const accepted =
      exercise
        .acceptedAnswers?.[key];

    if (Array.isArray(accepted)) {
      return [
        correctValue,
        ...accepted
      ].map(normalizeAnswer);
    }

    return [
      correctValue
    ].map(normalizeAnswer);
  };

  const emitResult = ({
    isCorrect,
    nextAttempts,
    nextFeedback,
    nextFieldFeedback,
    nextMatchingFeedback,
    nextOrderingFeedback
  }) => {
    onResultChange?.({
      isCorrect,
      attempts:
        nextAttempts,

      userResponse,

      feedback:
        nextFeedback,

      fieldFeedback:
        nextFieldFeedback,

      matchingFeedback:
        nextMatchingFeedback,

      orderingFeedback:
        nextOrderingFeedback,

      matchedPairs,
      displayRightItems,

      updatedAt:
        new Date().toISOString()
    });
  };

  const checkAnswer = () => {
    markInteraction();

    let isCorrect = false;
    let customMessage = "";

    const nextAttempts =
      attempts + 1;

    let nextFieldFeedback = {
      ...fieldFeedback
    };

    let nextMatchingFeedback = {
      ...matchingFeedback
    };

    let nextOrderingFeedback = {
      ...orderingFeedback
    };

    switch (exercise.type) {
      case "multiple_choice": {
        let correctAnswer =
          exercise.correctAnswer;

        if (
          typeof correctAnswer ===
          "number"
        ) {
          correctAnswer =
            exercise.options?.[
              correctAnswer
            ];
        }

        isCorrect =
          normalizeAnswer(
            userResponse
          ) ===
          normalizeAnswer(
            correctAnswer
          );

        customMessage = isCorrect
          ? "Dobrze! Poprawna odpowiedź."
          : `Sprawdź odpowiedź. Poprawna odpowiedź: ${correctAnswer}`;

        break;
      }

      case "fill_blank": {
        const results = {};

        const textParts =
          exercise.text.split(
            /_{2,}/g
          );

        const blankCount =
          Math.max(
            textParts.length - 1,
            0
          );

        for (
          let index = 0;
          index < blankCount;
          index += 1
        ) {
          const blankKey =
            `blank${index}`;

          const alternativeKey =
            String(index);

          const expected =
            exercise
              .correctAnswers?.[
                blankKey
              ] ??
            exercise
              .correctAnswers?.[
                alternativeKey
              ] ??
            exercise.words?.[
              index
            ] ??
            "";

          const user =
            userResponse?.[
              blankKey
            ] ??
            userResponse?.[
              alternativeKey
            ] ??
            "";

          const answerKey =
            exercise
              .correctAnswers?.[
                blankKey
              ] !== undefined
              ? blankKey
              : alternativeKey;

          const acceptedAnswers =
            getAcceptedAnswers(
              answerKey,
              expected
            );

          results[blankKey] =
            acceptedAnswers.includes(
              normalizeAnswer(user)
            );
        }

        nextFieldFeedback =
          results;

        isCorrect =
          Object.keys(
            results
          ).length > 0 &&
          Object.values(
            results
          ).every(Boolean);

        customMessage = isCorrect
          ? "Dobrze! Wszystkie luki są uzupełnione poprawnie."
          : "Sprawdź pola oznaczone na czerwono i spróbuj ponownie.";

        break;
      }

      case "matching": {
        const results = {};

        exercise.leftItems.forEach(
          (item, index) => {
            const expected =
              exercise
                .correctPairs?.[
                  item
                ];

            const selected =
              matchedPairs[
                `item-${index}`
              ];

            results[index] =
              normalizeAnswer(
                selected
              ) ===
              normalizeAnswer(
                expected
              );
          }
        );

        nextMatchingFeedback =
          results;

        isCorrect =
          Object.keys(
            results
          ).length > 0 &&
          Object.values(
            results
          ).every(Boolean);

        customMessage = isCorrect
          ? "Dobrze! Wszystkie pary są poprawne."
          : "Sprawdź relacje oznaczone na czerwono i spróbuj ponownie.";

        break;
      }

      case "ordering": {
        const results = {};

        const correctOrder =
          getCorrectOrder(
            exercise
          );

        if (
          Array.isArray(
            userResponse
          ) &&
          correctOrder.length > 0
        ) {
          userResponse.forEach(
            (item, index) => {
              results[index] =
                normalizeAnswer(
                  item
                ) ===
                normalizeAnswer(
                  correctOrder[index]
                );
            }
          );
        }

        nextOrderingFeedback =
          results;

        isCorrect =
          Object.keys(
            results
          ).length > 0 &&
          Object.values(
            results
          ).every(Boolean);

        customMessage = isCorrect
          ? "Dobrze! Kolejność jest poprawna."
          : "Sprawdź kolejność. Elementy na czerwono są w złej pozycji.";

        break;
      }

      default:
        return;
    }

    const nextFeedback = {
      isCorrect,
      message: customMessage
    };

    setAttempts(
      nextAttempts
    );

    setFeedback(
      nextFeedback
    );

    setFieldFeedback(
      nextFieldFeedback
    );

    setMatchingFeedback(
      nextMatchingFeedback
    );

    setOrderingFeedback(
      nextOrderingFeedback
    );

    emitResult({
      isCorrect,
      nextAttempts,
      nextFeedback,
      nextFieldFeedback,
      nextMatchingFeedback,
      nextOrderingFeedback
    });
  };

  const renderMultipleChoice = () => (
    <div className="space-y-3">
      <p className="font-medium mb-4">
        {exercise.question}
      </p>

      {(exercise.options || []).map(
        (option, index) => {
          const isSelected =
            userResponse ===
            option;

          let correctAnswer =
            exercise.correctAnswer;

          if (
            typeof correctAnswer ===
            "number"
          ) {
            correctAnswer =
              exercise.options?.[
                correctAnswer
              ];
          }

          const isCorrectOption =
            normalizeAnswer(option) ===
            normalizeAnswer(
              correctAnswer
            );

          const optionClass =
            feedback
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
              key={`${option}-${index}`}
              type="button"
              className={`w-full text-left p-4 rounded-lg border-2 transition-all ${optionClass}`}
              onClick={() => {
                markInteraction();

                setUserResponse(
                  option
                );

                setFeedback(null);
              }}
            >
              {option}
            </button>
          );
        }
      )}
    </div>
  );

  const renderFillInBlank = () => {
    if (!exercise.text) {
      return null;
    }

    const textParts =
      exercise.text.split(
        /_{2,}/g
      );

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
              {
                exercise.instruction
              }
            </p>
          )}

          {exercise.words.length >
            0 && (
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Słowa pomocnicze:
              </p>

              <div className="flex flex-wrap gap-2">
                {exercise.words.map(
                  (
                    word,
                    index
                  ) => (
                    <span
                      key={`${word}-${index}`}
                      className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full font-medium text-sm"
                    >
                      {word}
                    </span>
                  )
                )}
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-2 leading-10">
            {textParts.map(
              (part, index) => {
                const blankKey =
                  `blank${index}`;

                const alternativeKey =
                  String(index);

                const answerKey =
                  exercise
                    .correctAnswers?.[
                      blankKey
                    ] !== undefined
                    ? blankKey
                    : exercise
                        .correctAnswers?.[
                          alternativeKey
                        ] !== undefined
                    ? alternativeKey
                    : blankKey;

                const state =
                  fieldFeedback[
                    blankKey
                  ] ??
                  fieldFeedback[
                    answerKey
                  ];

                return (
                  <React.Fragment
                    key={index}
                  >
                    <span className="text-gray-700 text-lg">
                      {part}
                    </span>

                    {index <
                      textParts.length -
                        1 && (
                      <span className="inline-block min-w-[140px]">
                        <input
                          type="text"
                          value={
                            userResponse?.[
                              answerKey
                            ] || ""
                          }
                          onChange={(
                            event
                          ) => {
                            markInteraction();

                            const value =
                              event.target
                                .value;

                            setUserResponse(
                              (
                                previous
                              ) => ({
                                ...previous,
                                [answerKey]:
                                  value
                              })
                            );

                            setFieldFeedback(
                              (
                                previous
                              ) => ({
                                ...previous,
                                [blankKey]:
                                  undefined,
                                [answerKey]:
                                  undefined
                              })
                            );

                            setFeedback(
                              null
                            );
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
              }
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderMatching = () => {
    const leftItems =
      exercise.leftItems || [];

    const rightItems =
      displayRightItems;

    if (
      !leftItems.length ||
      !rightItems.length
    ) {
      return (
        <p className="text-gray-500">
          To ćwiczenie nie ma dostępnych par.
        </p>
      );
    }

    return (
      <div className="space-y-4">
        {exercise.question && (
          <p className="font-medium">
            {exercise.question}
          </p>
        )}

        {exercise.instruction && (
          <p className="text-gray-700">
            {
              exercise.instruction
            }
          </p>
        )}

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            {leftItems.map(
              (item, index) => {
                const selected =
                  matchedPairs[
                    `item-${index}`
                  ];

                const state =
                  matchingFeedback[
                    index
                  ];

                const leftClass =
                  state === true
                    ? "bg-green-100 border-green-500 text-green-800"
                    : state === false
                    ? "bg-red-100 border-red-500 text-red-800"
                    : selected
                    ? "bg-blue-50 border-blue-500 text-blue-800"
                    : selectedLeft ===
                      index
                    ? "bg-primary-50 border-primary-500"
                    : "hover:bg-gray-50 border-gray-200";

                return (
                  <button
                    key={`${item}-${index}`}
                    type="button"
                    className={`w-full text-left p-3 rounded-lg border-2 transition-all ${leftClass}`}
                    onClick={() => {
                      markInteraction();

                      setSelectedLeft(
                        selectedLeft ===
                          index
                          ? null
                          : index
                      );

                      setFeedback(
                        null
                      );
                    }}
                  >
                    <div className="font-semibold">
                      {item}
                    </div>

                    {selected && (
                      <div className="text-sm mt-1 opacity-80">
                        🔗 {selected}
                      </div>
                    )}
                  </button>
                );
              }
            )}
          </div>

          <div className="space-y-2">
            {rightItems.map(
              (item, index) => {
                const alreadySelected =
                  Object.entries(
                    matchedPairs
                  ).some(
                    ([
                      key,
                      value
                    ]) =>
                      key !==
                        `item-${selectedLeft}` &&
                      value ===
                        item
                  );

                return (
                  <button
                    key={`${item}-${index}`}
                    type="button"
                    className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                      alreadySelected
                        ? "bg-gray-100 border-gray-300 text-gray-500"
                        : selectedLeft !==
                          null
                        ? "bg-white border-gray-300 hover:bg-primary-50 hover:border-primary-400"
                        : "bg-white border-gray-200 hover:bg-gray-50"
                    }`}
                    onClick={() => {
                      if (
                        selectedLeft ===
                          null ||
                        alreadySelected
                      ) {
                        return;
                      }

                      markInteraction();

                      const targetIndex =
                        selectedLeft;

                      setMatchedPairs(
                        (
                          previous
                        ) => ({
                          ...previous,
                          [`item-${targetIndex}`]:
                            item
                        })
                      );

                      setMatchingFeedback(
                        (
                          previous
                        ) => ({
                          ...previous,
                          [targetIndex]:
                            undefined
                        })
                      );

                      setSelectedLeft(
                        null
                      );

                      setFeedback(
                        null
                      );
                    }}
                  >
                    {item}
                  </button>
                );
              }
            )}
          </div>
        </div>

        <button
          type="button"
          disabled={
            Object.keys(
              matchedPairs
            ).length === 0
          }
          className={`text-sm font-medium ${
            Object.keys(
              matchedPairs
            ).length === 0
              ? "text-gray-400 cursor-not-allowed"
              : "text-red-600 hover:text-red-700"
          }`}
          onClick={() => {
            if (
              Object.keys(
                matchedPairs
              ).length === 0
            ) {
              return;
            }

            markInteraction();

            setMatchedPairs({});
            setMatchingFeedback({});
            setSelectedLeft(null);
            setFeedback(null);
          }}
        >
          Wyczyść połączenia
        </button>
      </div>
    );
  };

  const renderOrdering = () => {
    if (
      !Array.isArray(
        userResponse
      )
    ) {
      return null;
    }

    const updateOrder = (
      nextOrder
    ) => {
      markInteraction();

      setUserResponse(
        nextOrder
      );

      setOrderingFeedback({});
      setFeedback(null);
    };

    return (
      <div className="space-y-4">
        {exercise.question && (
          <p className="font-medium">
            {exercise.question}
          </p>
        )}

        {exercise.instruction && (
          <p className="text-gray-700">
            {
              exercise.instruction
            }
          </p>
        )}

        <div className="space-y-3">
          {userResponse.map(
            (item, index) => {
              const state =
                orderingFeedback[
                  index
                ];

              const itemClass =
                state === true
                  ? "border-green-500 bg-green-50 text-green-800"
                  : state === false
                  ? "border-red-500 bg-red-50 text-red-800"
                  : draggedIndex ===
                    index
                  ? "border-primary-500"
                  : "border-gray-200";

              return (
                <div
                  key={`${item}-${index}`}
                  draggable
                  className={`p-4 rounded-lg shadow-sm cursor-move border-2 hover:shadow-md transition-all ${itemClass}`}
                  onDragStart={(
                    event
                  ) => {
                    markInteraction();

                    setDraggedIndex(
                      index
                    );

                    event.dataTransfer.setData(
                      "text/plain",
                      index.toString()
                    );
                  }}
                  onDragEnd={() =>
                    setDraggedIndex(
                      null
                    )
                  }
                  onDragOver={(
                    event
                  ) =>
                    event.preventDefault()
                  }
                  onDrop={(
                    event
                  ) => {
                    event.preventDefault();

                    const fromIndex =
                      Number.parseInt(
                        event.dataTransfer.getData(
                          "text/plain"
                        ),
                        10
                      );

                    if (
                      fromIndex ===
                        index ||
                      Number.isNaN(
                        fromIndex
                      )
                    ) {
                      return;
                    }

                    const nextOrder = [
                      ...userResponse
                    ];

                    const [
                      movedItem
                    ] =
                      nextOrder.splice(
                        fromIndex,
                        1
                      );

                    nextOrder.splice(
                      index,
                      0,
                      movedItem
                    );

                    updateOrder(
                      nextOrder
                    );
                  }}
                >
                  <div className="flex justify-between items-center gap-4">
                    <span>
                      {item}
                    </span>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={
                          index === 0
                        }
                        className="text-gray-400 hover:text-gray-700 disabled:opacity-40"
                        onClick={() => {
                          if (
                            index <= 0
                          ) {
                            return;
                          }

                          const nextOrder = [
                            ...userResponse
                          ];

                          [
                            nextOrder[
                              index
                            ],
                            nextOrder[
                              index -
                                1
                            ]
                          ] = [
                            nextOrder[
                              index -
                                1
                            ],
                            nextOrder[
                              index
                            ]
                          ];

                          updateOrder(
                            nextOrder
                          );
                        }}
                      >
                        ↑
                      </button>

                      <button
                        type="button"
                        disabled={
                          index ===
                          userResponse.length -
                            1
                        }
                        className="text-gray-400 hover:text-gray-700 disabled:opacity-40"
                        onClick={() => {
                          if (
                            index >=
                            userResponse.length -
                              1
                          ) {
                            return;
                          }

                          const nextOrder = [
                            ...userResponse
                          ];

                          [
                            nextOrder[
                              index
                            ],
                            nextOrder[
                              index +
                                1
                            ]
                          ] = [
                            nextOrder[
                              index +
                                1
                            ],
                            nextOrder[
                              index
                            ]
                          ];

                          updateOrder(
                            nextOrder
                          );
                        }}
                      >
                        ↓
                      </button>
                    </div>
                  </div>
                </div>
              );
            }
          )}
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

            <p className="text-red-600">
              {exercise.type}
            </p>
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
          <p className="font-medium">
            {feedback.message}
          </p>

          <div className="mt-2 text-sm opacity-80">
            Próby: {attempts}
          </div>
        </div>
      )}
    </div>
  );
};

export default InteractivePractice;