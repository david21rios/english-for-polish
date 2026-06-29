// src/components/interactive/InteractiveQuiz.jsx

import { useEffect, useState } from "react";

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

const getQuestionText = (question = {}) => {
  return question.pregunta || question.question || "";
};

const getCorrectAnswer = (question = {}) => {
  return (
    question.respuesta_correcta ||
    question.answer ||
    question.correctAnswer ||
    ""
  );
};

const getAcceptedAnswers = (question = {}) => {
  const accepted =
    question.respuestas_aceptadas ||
    question.acceptedAnswers ||
    [];

  return Array.isArray(accepted) ? accepted : [];
};

const getOptions = (question = {}) => {
  return question.opciones || question.options || [];
};

const InteractiveQuiz = ({ questions = [], onComplete }) => {
  const [answers, setAnswers] = useState({});
  const [feedback, setFeedback] = useState({});
  const [showHints, setShowHints] = useState({});
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    setAnswers({});
    setFeedback({});
    setShowHints({});
    setCompleted(false);
  }, [questions]);

  useEffect(() => {
    if (completed) return;

    if (
      questions.length > 0 &&
      questions.every((_, index) => feedback[index]?.isCorrect === true)
    ) {
      setCompleted(true);
      onComplete?.();
    }
  }, [feedback, questions, onComplete, completed]);

  const handleAnswer = (questionId, answer) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer
    }));

    setFeedback((prev) => ({
      ...prev,
      [questionId]: undefined
    }));
  };

  const checkAnswer = (questionId) => {
    const question = questions[questionId];

    if (!question) return;

    let correctAnswer = getCorrectAnswer(question);

    const options = getOptions(question);

    if (typeof correctAnswer === "number") {
      correctAnswer = options[correctAnswer] || "";
    }

    const userAnswer = normalizeAnswer(answers[questionId] || "");
    const normalizedCorrectAnswer = normalizeAnswer(correctAnswer);

    const alternativeAnswers = getAcceptedAnswers(question).map(
      normalizeAnswer
    );

    const isCorrect =
      userAnswer === normalizedCorrectAnswer ||
      alternativeAnswers.includes(userAnswer);

    setFeedback((prev) => ({
      ...prev,
      [questionId]: {
        isCorrect,
        correctAnswer,
        message: isCorrect
          ? "¡Correcto! 👏"
          : `Incorrecto. La respuesta correcta es: ${correctAnswer}`
      }
    }));
  };

  const toggleHint = (questionId) => {
    setShowHints((prev) => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  if (!questions.length) {
    return (
      <p className="text-gray-500">
        No hay preguntas disponibles.
      </p>
    );
  }

  return (
    <div className="space-y-5 w-full overflow-hidden">
      {questions.map((question, index) => {
        const questionText = getQuestionText(question);
        const options = getOptions(question);
        const hasOptions = options.length > 0;
        const currentFeedback = feedback[index];

        return (
          <div
            key={index}
            className="w-full overflow-hidden bg-white p-4 rounded-xl shadow border border-gray-100"
          >
            <p className="font-medium mb-4 break-words">
              {index + 1}. {questionText}
            </p>

            {hasOptions ? (
              <div className="space-y-2 mb-3">
                {options.map((option, optionIndex) => {
                  const selected =
                    answers[index] === option;

                  const correct =
                    normalizeAnswer(option) ===
                    normalizeAnswer(
                      currentFeedback?.correctAnswer || ""
                    );

                  const showResult =
                    Boolean(currentFeedback);

                  return (
                    <button
                      key={optionIndex}
                      type="button"
                      onClick={() =>
                        handleAnswer(index, option)
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
                          : showResult && correct
                          ? "bg-green-50 border-green-400 text-green-700"
                          : selected
                          ? "bg-primary-50 border-primary-500"
                          : "bg-white border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3 mb-2 w-full">
                <input
                  type="text"
                  value={answers[index] || ""}
                  onChange={(e) =>
                    handleAnswer(index, e.target.value)
                  }
                  placeholder="Escribe tu respuesta..."
                  className="
                    w-full
                    min-w-0
                    p-3
                    border
                    border-gray-300
                    rounded-lg
                    focus:outline-none
                    focus:ring-2
                    focus:ring-primary-500
                  "
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      checkAnswer(index);
                    }
                  }}
                />

                <button
                  type="button"
                  onClick={() => checkAnswer(index)}
                  className="
                    w-full
                    sm:w-auto
                    shrink-0
                    px-5
                    py-3
                    bg-primary-600
                    text-white
                    rounded-lg
                    hover:bg-primary-700
                    transition
                  "
                >
                  Revisar
                </button>
              </div>
            )}

            {hasOptions && (
              <button
                type="button"
                onClick={() => checkAnswer(index)}
                disabled={!answers[index]}
                className="
                  mt-2
                  px-4
                  py-2
                  bg-primary-600
                  text-white
                  rounded-lg
                  hover:bg-primary-700
                  disabled:opacity-50
                  disabled:cursor-not-allowed
                "
              >
                Revisar
              </button>
            )}

            {question.pista && (
              <button
                type="button"
                onClick={() => toggleHint(index)}
                className="
                  block
                  mt-3
                  text-sm
                  text-primary-600
                  hover:text-primary-700
                "
              >
                {showHints[index]
                  ? "Ocultar pista"
                  : "Ver pista"}
              </button>
            )}

            {showHints[index] && (
              <p className="text-sm text-gray-600 mt-2 break-words">
                Pista: {question.pista}
              </p>
            )}

            {currentFeedback && (
              <p
                className={`mt-3 break-words ${
                  currentFeedback.isCorrect
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {currentFeedback.message}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
};
export default InteractiveQuiz;