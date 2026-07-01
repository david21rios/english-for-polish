// src/components/interactive/InteractiveQuiz.jsx

import { useEffect, useMemo, useState } from "react";

const normalizeAnswer = (text = "") =>
  text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[¿?¡!.,;:]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const getQuestionText = (question = {}) =>
  question.pregunta || question.question || "";

const getCorrectAnswer = (question = {}) =>
  question.respuesta_correcta ||
  question.respuesta ||
  question.answer ||
  question.correctAnswer ||
  "";

const getAcceptedAnswers = (question = {}) => {
  const accepted =
    question.respuestas_aceptadas || question.acceptedAnswers || [];

  return Array.isArray(accepted) ? accepted : [];
};

const getOptions = (question = {}) =>
  question.opciones || question.options || [];

const getHint = (question = {}) =>
  question.pista || question.hint || "";

const InteractiveQuiz = ({
  questions = [],
  normalizeQuestion = null,
  onComplete
}) => {
  const normalizedQuestions = useMemo(() => {
    return questions.map((question) =>
      normalizeQuestion ? normalizeQuestion(question) : question
    );
  }, [questions, normalizeQuestion]);

  const questionsKey = useMemo(() => {
    return normalizedQuestions
      .map((question, index) => {
        const text = getQuestionText(question);
        const answer = getCorrectAnswer(question);
        return `${index}-${text}-${answer}`;
      })
      .join("|");
  }, [normalizedQuestions]);

  const [answers, setAnswers] = useState({});
  const [feedback, setFeedback] = useState({});
  const [showHints, setShowHints] = useState({});
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    setAnswers({});
    setFeedback({});
    setShowHints({});
    setCompleted(false);
  }, [questionsKey]);

  useEffect(() => {
    if (completed) return;

    const allCorrect =
      normalizedQuestions.length > 0 &&
      normalizedQuestions.every(
        (_, index) => feedback[index]?.isCorrect === true
      );

    if (allCorrect) {
      setCompleted(true);

      onComplete?.({
        score: 100,
        totalQuestions: normalizedQuestions.length,
        correctAnswers: normalizedQuestions.length,
        completed: true
      });
    }
  }, [feedback, normalizedQuestions, onComplete, completed]);

  const handleAnswer = (questionId, answer) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const checkAnswer = (questionId) => {
    const question = normalizedQuestions[questionId];

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
        selectedAnswer: answers[questionId] || "",
        message: isCorrect
          ? "Dobrze! Poprawna odpowiedź. 👏"
          : `Niepoprawnie. Poprawna odpowiedź: ${correctAnswer}`
      }
    }));
  };

  const toggleHint = (questionId) => {
    setShowHints((prev) => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  if (!normalizedQuestions.length) {
    return <p className="text-gray-500">Brak pytań do tej części.</p>;
  }

  return (
    <div className="space-y-5 w-full overflow-hidden">
      {normalizedQuestions.map((question, index) => {
        const questionText = getQuestionText(question);
        const options = getOptions(question);
        const hint = getHint(question);
        const hasOptions = options.length > 0;
        const currentFeedback = feedback[index];

        return (
          <div
            key={`${questionsKey}-${index}`}
            className="w-full overflow-hidden bg-white p-4 rounded-xl shadow border border-gray-100"
          >
            <p className="font-medium mb-4 break-words">
              {index + 1}. {questionText}
            </p>

            {hasOptions ? (
              <div className="space-y-2 mb-3">
                {options.map((option, optionIndex) => {
                  const selected = answers[index] === option;

                  const isCorrectOption =
                    normalizeAnswer(option) ===
                    normalizeAnswer(currentFeedback?.correctAnswer || "");

                  const showResult = Boolean(currentFeedback);

                  return (
                    <button
                      key={`${option}-${optionIndex}`}
                      type="button"
                      onClick={() => handleAnswer(index, option)}
                      className={`w-full text-left p-3 rounded-lg border transition break-words ${
                        showResult &&
                        selected &&
                        currentFeedback.isCorrect
                          ? "bg-green-100 border-green-500 text-green-800"
                          : showResult &&
                            selected &&
                            !currentFeedback.isCorrect
                          ? "bg-red-100 border-red-500 text-red-800"
                          : showResult && isCorrectOption
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
                  onChange={(event) =>
                    handleAnswer(index, event.target.value)
                  }
                  placeholder="Wpisz odpowiedź..."
                  className="w-full min-w-0 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      checkAnswer(index);
                    }
                  }}
                />

                <button
                  type="button"
                  onClick={() => checkAnswer(index)}
                  disabled={!answers[index]}
                  className="w-full sm:w-auto shrink-0 px-5 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sprawdź
                </button>
              </div>
            )}

            {hasOptions && (
              <button
                type="button"
                onClick={() => checkAnswer(index)}
                disabled={!answers[index]}
                className="mt-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sprawdź
              </button>
            )}

            {hint && (
              <button
                type="button"
                onClick={() => toggleHint(index)}
                className="block mt-3 text-sm text-primary-600 hover:text-primary-700"
              >
                {showHints[index] ? "Ukryj podpowiedź" : "Pokaż podpowiedź"}
              </button>
            )}

            {showHints[index] && (
              <p className="text-sm text-gray-600 mt-2 break-words">
                Podpowiedź: {hint}
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
                {currentFeedback.message}
              </div>
            )}
          </div>
        );
      })}

      {completed && (
        <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-green-700 font-semibold">
          Świetnie! Wszystkie odpowiedzi są poprawne.
        </div>
      )}
    </div>
  );
};

export default InteractiveQuiz;