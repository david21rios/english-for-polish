// src/components/test/ReadingSection.jsx

import {
  FaBookOpen,
  FaCheckCircle,
  FaExclamationTriangle
} from "react-icons/fa";

const toArray = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (value) return [value];
  return [];
};

const normalizeReadingQuestion = (question = {}) => ({
  id: question.id || "",
  question: question.question || "",
  options: toArray(question.options),
  correctAnswer:
    question.correctAnswer ||
    question.correct_answer ||
    question.answer ||
    ""
});

const normalizeReading = (reading = {}) => ({
  id: reading.id || "",
  title: reading.title || "",
  author: reading.author || "",
  text: reading.text || "",
  questions: toArray(reading.questions).map(normalizeReadingQuestion)
});

const ReadingSection = ({
  questions = [],
  selectedAnswers = {},
  onSelectAnswer
}) => {
  const readings = toArray(questions).map(normalizeReading);

  if (readings.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-5 rounded-2xl flex items-center gap-3">
        <FaExclamationTriangle />
        Brak tekstów do czytania dla tej sekcji.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {readings.map((readingText, textIndex) => {
        const readingQuestions = readingText.questions;

        return (
          <article
            key={readingText.id || `reading_${textIndex}`}
            className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-primary-100 text-primary-600 flex items-center justify-center text-xl">
                <FaBookOpen />
              </div>

              <div>
                <p className="text-sm font-semibold text-primary-600 uppercase tracking-wide">
                  Tekst {textIndex + 1}
                </p>

                <h3 className="text-2xl font-bold text-gray-900">
                  Przeczytaj uważnie
                </h3>
              </div>
            </div>

            {readingText.title && (
              <h4 className="text-xl font-bold text-gray-900 mb-4">
                {readingText.title}
              </h4>
            )}

            <div className="mb-8 p-6 bg-gray-50 border border-gray-100 rounded-2xl">
              <p className="text-lg leading-relaxed text-gray-800 whitespace-pre-line">
                {readingText.text || "Tekst do czytania jest niedostępny."}
              </p>
            </div>

            {readingQuestions.length === 0 ? (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl flex items-center gap-3">
                <FaExclamationTriangle />
                Ten tekst nie zawiera pytań.
              </div>
            ) : (
              <div className="space-y-6">
                {readingQuestions.map((question, qIndex) => {
                  const questionOptions = question.options;

                  const questionId =
                    question.id || `reading_question_${textIndex}_${qIndex}`;

                  return (
                    <div
                      key={questionId}
                      className="bg-white border border-gray-100 rounded-2xl p-5"
                    >
                      <p className="font-bold text-gray-900 mb-4">
                        {textIndex + 1}.{qIndex + 1}{" "}
                        {question.question || "Pytanie jest niedostępne."}
                      </p>

                      {questionOptions.length === 0 ? (
                        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl text-sm">
                          To pytanie nie ma dostępnych odpowiedzi.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {questionOptions.map((option, optionIndex) => {
                            const isSelected =
                              selectedAnswers?.[questionId] === option;

                            const optionLetter = String.fromCharCode(
                              65 + optionIndex
                            );

                            return (
                              <button
                                key={`${questionId}_${optionIndex}`}
                                type="button"
                                onClick={() =>
                                  onSelectAnswer(questionId, option)
                                }
                                className={`w-full text-left rounded-2xl border px-5 py-4 transition-all flex items-start gap-4 ${
                                  isSelected
                                    ? "bg-primary-600 text-white border-primary-600 shadow-md"
                                    : "bg-gray-50 text-gray-800 border-gray-100 hover:bg-primary-50 hover:border-primary-200"
                                }`}
                              >
                                <span
                                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                                    isSelected
                                      ? "bg-white text-primary-600"
                                      : "bg-white text-gray-600 border border-gray-200"
                                  }`}
                                >
                                  {optionLetter}
                                </span>

                                <span className="leading-relaxed break-words min-w-0">
                                  {option || "Odpowiedź jest niedostępna."}
                                </span>

                                {isSelected && (
                                  <FaCheckCircle className="ml-auto mt-1 shrink-0" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
};

export default ReadingSection;