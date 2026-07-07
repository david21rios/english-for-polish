// src/components/test/WritingSection.jsx

import { useMemo } from "react";

const countWords = (text = "") =>
  text.trim().split(/\s+/).filter(Boolean).length;

const WritingSection = ({ questions = [], answers = {}, setAnswers }) => {
  const writingAnswers = answers?.writing || {};

  const handleAnswer = (questionId, text) => {
    setAnswers((prev) => ({
      ...prev,
      writing: {
        ...prev.writing,
        [questionId]: text
      }
    }));
  };

  const normalizedQuestions = useMemo(() => {
    return Array.isArray(questions) ? questions.filter(Boolean) : [];
  }, [questions]);

  if (normalizedQuestions.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-5 rounded-2xl">
        Brak pytań pisemnych dla tej sekcji.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {normalizedQuestions.map((question, index) => {
        const questionId = question.id || `writing_${index}`;
        const currentText = writingAnswers[questionId] || "";
        const wordCount = countWords(currentText);

        const minWords = Number(question.minWords) || 0;
        const maxWords = Number(question.maxWords) || 0;

        const isBelowMinimum =
          currentText.trim() && minWords > 0 && wordCount < minWords;

        const isAboveMaximum =
          currentText.trim() && maxWords > 0 && wordCount > maxWords;

        return (
          <article
            key={questionId}
            className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8"
          >
            <p className="text-sm font-semibold text-primary-600 uppercase tracking-wide mb-2">
              Pytanie {index + 1}
            </p>

            <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
              {question.question || question.prompt || "Brak treści pytania."}
            </h3>

            {question.instructions && (
              <p className="text-gray-600 mb-4 leading-relaxed">
                {question.instructions}
              </p>
            )}

            {question.example && (
              <div className="bg-blue-50 border border-blue-100 text-blue-800 rounded-2xl p-4 text-sm mb-5">
                <strong>Przykład:</strong> {question.example}
              </div>
            )}

            <textarea
              className="w-full p-5 border border-gray-300 rounded-2xl min-h-[180px] resize-y focus:outline-none focus:ring-2 focus:ring-primary-200"
              value={currentText}
              onChange={(event) => handleAnswer(questionId, event.target.value)}
              placeholder="Napisz odpowiedź po angielsku..."
              autoComplete="off"
              spellCheck={false}
            />

            <div className="mt-4 flex flex-col md:flex-row md:justify-between gap-2 text-sm">
              <span
                className={
                  isBelowMinimum || isAboveMaximum
                    ? "text-yellow-700"
                    : "text-gray-500"
                }
              >
                Liczba słów: {wordCount}
                {minWords > 0 && ` · minimum: ${minWords}`}
                {maxWords > 0 && ` · maksimum: ${maxWords}`}
              </span>

              <span className="text-gray-500">
                Odpowiedź zostanie oceniona po zakończeniu testu.
              </span>
            </div>

            {isBelowMinimum && (
              <div className="mt-3 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-2xl p-4 text-sm">
                Odpowiedź zawiera mniej słów niż wymagane minimum.
              </div>
            )}

            {isAboveMaximum && (
              <div className="mt-3 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-2xl p-4 text-sm">
                Odpowiedź przekracza zalecaną maksymalną liczbę słów.
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
};

export default WritingSection;