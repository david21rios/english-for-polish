// src/components/interactive/InteractiveQuiz.jsx

import { useEffect, useMemo, useState } from "react";

const CONTRACTION_REPLACEMENTS = [
  [/\bi'm\b/g, "i am"],
  [/\byou're\b/g, "you are"],
  [/\bhe's\b/g, "he is"],
  [/\bshe's\b/g, "she is"],
  [/\bit's\b/g, "it is"],
  [/\bwe're\b/g, "we are"],
  [/\bthey're\b/g, "they are"],

  [/\bi've\b/g, "i have"],
  [/\byou've\b/g, "you have"],
  [/\bwe've\b/g, "we have"],
  [/\bthey've\b/g, "they have"],

  [/\bi'll\b/g, "i will"],
  [/\byou'll\b/g, "you will"],
  [/\bhe'll\b/g, "he will"],
  [/\bshe'll\b/g, "she will"],
  [/\bit'll\b/g, "it will"],
  [/\bwe'll\b/g, "we will"],
  [/\bthey'll\b/g, "they will"],

  [/\bi'd\b/g, "i would"],
  [/\byou'd\b/g, "you would"],
  [/\bhe'd\b/g, "he would"],
  [/\bshe'd\b/g, "she would"],
  [/\bwe'd\b/g, "we would"],
  [/\bthey'd\b/g, "they would"],

  [/\bdon't\b/g, "do not"],
  [/\bdoesn't\b/g, "does not"],
  [/\bdidn't\b/g, "did not"],
  [/\bisn't\b/g, "is not"],
  [/\baren't\b/g, "are not"],
  [/\bwasn't\b/g, "was not"],
  [/\bweren't\b/g, "were not"],
  [/\bcan't\b/g, "cannot"],
  [/\bcouldn't\b/g, "could not"],
  [/\bshouldn't\b/g, "should not"],
  [/\bwouldn't\b/g, "would not"],
  [/\bwon't\b/g, "will not"],
  [/\bhaven't\b/g, "have not"],
  [/\bhasn't\b/g, "has not"],
  [/\bhadn't\b/g, "had not"]
];

const expandContractions = (text = "") => {
  return CONTRACTION_REPLACEMENTS.reduce(
    (normalizedText, [pattern, replacement]) =>
      normalizedText.replace(pattern, replacement),
    text
  );
};

const normalizeAnswer = (text = "") => {
  const baseText = text
    .toString()
    .toLowerCase()
    .replace(/[’‘`´]/g, "'")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const expandedText = expandContractions(baseText);

  return expandedText
    .replace(/[¿?¡!.,;:"]/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

const toArray = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (value) return [value];
  return [];
};

const normalizeQuizQuestion = (question = {}) => ({
  id: question.id || "",
  type:
    question.type ||
    question.tipo ||
    "multiple_choice",

  question:
    question.question ||
    question.pregunta ||
    "",

  options: toArray(
    question.options ||
    question.opciones
  ),

  correctAnswer:
    question.correctAnswer ??
    question.correct_answer ??
    question.respuesta_correcta ??
    question.respuesta ??
    question.answer ??
    "",

  acceptedAnswers: toArray(
    question.acceptedAnswers ||
    question.respuestas_aceptadas
  ),

  hint:
    question.hint ||
    question.pista ||
    "",

  feedback:
    question.feedback ||
    question.retroalimentacion ||
    ""
});

const normalizeStoredObject = (value) => {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return {};
  }

  return value;
};

const InteractiveQuiz = ({
  questions = [],
  normalizeQuestion = null,
  initialResult = null,
  onProgress = null,
  onComplete
}) => {
  const normalizedQuestions = useMemo(() => {
    const rawQuestions = toArray(questions);

    return rawQuestions.map((question) => {
      const normalized = normalizeQuestion
        ? normalizeQuestion(question)
        : question;

      return normalizeQuizQuestion(normalized);
    });
  }, [questions, normalizeQuestion]);

  const questionsKey = useMemo(() => {
    return normalizedQuestions
      .map((question, index) => {
        return [
          index,
          question.id,
          question.question,
          question.correctAnswer
        ].join("-");
      })
      .join("|");
  }, [normalizedQuestions]);

  const initialStateKey = useMemo(() => {
    return JSON.stringify({
      questionsKey,
      answers: initialResult?.answers || {},
      feedback: initialResult?.feedback || {},
      completed: Boolean(initialResult?.completed)
    });
  }, [
    questionsKey,
    initialResult?.answers,
    initialResult?.feedback,
    initialResult?.completed
  ]);

  const [answers, setAnswers] = useState({});
  const [feedback, setFeedback] = useState({});
  const [showHints, setShowHints] = useState({});
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    setAnswers(
      normalizeStoredObject(
        initialResult?.answers
      )
    );

    setFeedback(
      normalizeStoredObject(
        initialResult?.feedback
      )
    );

    setShowHints({});
    setCompleted(
      Boolean(initialResult?.completed)
    );
  }, [initialStateKey, initialResult]);

  const getCorrectAnswer = (question = {}) => {
    if (
      typeof question.correctAnswer ===
      "number"
    ) {
      return (
        question.options?.[
          question.correctAnswer
        ] || ""
      );
    }

    return question.correctAnswer || "";
  };

  const emitProgress = ({
    nextAnswers,
    nextFeedback,
    isCompleted
  }) => {
    const correctAnswers =
      normalizedQuestions.reduce(
        (total, _, index) =>
          total +
          (
            nextFeedback[index]?.isCorrect
              ? 1
              : 0
          ),
        0
      );

    const totalQuestions =
      normalizedQuestions.length;

    const score =
      totalQuestions > 0
        ? Math.round(
            (
              correctAnswers /
              totalQuestions
            ) * 100
          )
        : 0;

    const result = {
      completed: isCompleted,
      score,
      totalQuestions,
      correctAnswers,
      answers: nextAnswers,
      feedback: nextFeedback
    };

    if (isCompleted) {
      onComplete?.(result);
      return;
    }

    onProgress?.(result);
  };

  const handleAnswer = (
    questionId,
    answer
  ) => {
    setAnswers((previousAnswers) => ({
      ...previousAnswers,
      [questionId]: answer
    }));

    /*
     * Al modificar una respuesta ya validada,
     * eliminamos únicamente su feedback anterior.
     * Así debe volver a pulsarse "Sprawdź".
     */
    setFeedback((previousFeedback) => {
      if (!previousFeedback[questionId]) {
        return previousFeedback;
      }

      const nextFeedback = {
        ...previousFeedback
      };

      delete nextFeedback[questionId];

      return nextFeedback;
    });

    setCompleted(false);
  };

  const checkAnswer = (questionId) => {
    const question =
      normalizedQuestions[questionId];

    if (!question) return;

    const selectedAnswer =
      answers[questionId] || "";

    const correctAnswer =
      getCorrectAnswer(question);

    const normalizedUserAnswer =
      normalizeAnswer(selectedAnswer);

    const validAnswers = [
      correctAnswer,
      ...question.acceptedAnswers
    ]
      .map(normalizeAnswer)
      .filter(Boolean);

    const isCorrect =
      normalizedUserAnswer.length > 0 &&
      validAnswers.includes(
        normalizedUserAnswer
      );

    const nextFeedbackEntry = {
      isCorrect,
      correctAnswer,
      selectedAnswer,
      message: isCorrect
        ? (
            question.feedback ||
            "Dobrze! Poprawna odpowiedź. 👏"
          )
        : (
            `Niepoprawnie. Poprawna odpowiedź: ${correctAnswer}`
          )
    };

    const nextFeedback = {
      ...feedback,
      [questionId]:
        nextFeedbackEntry
    };

    const nextAnswers = {
      ...answers,
      [questionId]:
        selectedAnswer
    };

    const allCorrect =
      normalizedQuestions.length > 0 &&
      normalizedQuestions.every(
        (_, index) =>
          nextFeedback[index]?.isCorrect ===
          true
      );

    setFeedback(nextFeedback);
    setAnswers(nextAnswers);
    setCompleted(allCorrect);

    emitProgress({
      nextAnswers,
      nextFeedback,
      isCompleted: allCorrect
    });
  };

  const toggleHint = (questionId) => {
    setShowHints((previousHints) => ({
      ...previousHints,
      [questionId]:
        !previousHints[questionId]
    }));
  };

  if (!normalizedQuestions.length) {
    return (
      <p className="text-gray-500">
        Brak pytań do tej części.
      </p>
    );
  }

  return (
    <div className="space-y-5 w-full overflow-hidden">
      {normalizedQuestions.map(
        (question, index) => {
          const hasOptions =
            question.options.length > 0;

          const currentFeedback =
            feedback[index];

          return (
            <div
              key={`${questionsKey}-${index}`}
              className="w-full overflow-hidden bg-white p-4 rounded-xl shadow border border-gray-100"
            >
              <p className="font-medium mb-4 break-words">
                {index + 1}.{" "}
                {question.question ||
                  "Question unavailable"}
              </p>

              {hasOptions ? (
                <div className="space-y-2 mb-3">
                  {question.options.map(
                    (
                      option,
                      optionIndex
                    ) => {
                      const selected =
                        answers[index] ===
                        option;

                      const isCorrectOption =
                        normalizeAnswer(
                          option
                        ) ===
                        normalizeAnswer(
                          currentFeedback
                            ?.correctAnswer ||
                            ""
                        );

                      const showResult =
                        Boolean(
                          currentFeedback
                        );

                      return (
                        <button
                          key={`${option}-${optionIndex}`}
                          type="button"
                          onClick={() =>
                            handleAnswer(
                              index,
                              option
                            )
                          }
                          className={`w-full text-left p-3 rounded-lg border transition break-words ${
                            showResult &&
                            selected &&
                            currentFeedback.isCorrect
                              ? "bg-green-100 border-green-500 text-green-800"
                              : showResult &&
                                selected &&
                                !currentFeedback.isCorrect
                              ? "bg-red-100 border-red-500 text-red-800"
                              : showResult &&
                                isCorrectOption
                              ? "bg-green-50 border-green-400 text-green-700"
                              : selected
                              ? "bg-primary-50 border-primary-500"
                              : "bg-white border-gray-200 hover:bg-gray-50"
                          }`}
                        >
                          {option ||
                            "Option unavailable"}
                        </button>
                      );
                    }
                  )}
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-3 mb-2 w-full">
                  <input
                    type="text"
                    value={
                      answers[index] || ""
                    }
                    onChange={(event) =>
                      handleAnswer(
                        index,
                        event.target.value
                      )
                    }
                    placeholder="Wpisz odpowiedź..."
                    className="w-full min-w-0 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    onKeyDown={(event) => {
                      if (
                        event.key === "Enter"
                      ) {
                        checkAnswer(index);
                      }
                    }}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      checkAnswer(index)
                    }
                    disabled={
                      !answers[index]?.trim?.()
                    }
                    className="w-full sm:w-auto shrink-0 px-5 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Sprawdź
                  </button>
                </div>
              )}

              {hasOptions && (
                <button
                  type="button"
                  onClick={() =>
                    checkAnswer(index)
                  }
                  disabled={
                    !answers[index]
                  }
                  className="mt-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sprawdź
                </button>
              )}

              {question.hint && (
                <button
                  type="button"
                  onClick={() =>
                    toggleHint(index)
                  }
                  className="block mt-3 text-sm text-primary-600 hover:text-primary-700"
                >
                  {showHints[index]
                    ? "Ukryj podpowiedź"
                    : "Pokaż podpowiedź"}
                </button>
              )}

              {showHints[index] && (
                <p className="text-sm text-gray-600 mt-2 break-words">
                  Podpowiedź:{" "}
                  {question.hint}
                </p>
              )}

              {currentFeedback && (
                <div
                  className={`mt-3 p-3 rounded-lg border break-words ${
                    currentFeedback.isCorrect
                      ? "bg-green-50 border-green-200 text-green-700"
                      : "bg-red-50 border-red-200 text-red-700"
                  }`}
                >
                  {
                    currentFeedback.message
                  }
                </div>
              )}
            </div>
          );
        }
      )}

      {completed && (
        <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-green-700 font-semibold">
          Świetnie! Wszystkie odpowiedzi są
          poprawne.
        </div>
      )}
    </div>
  );
};

export default InteractiveQuiz;