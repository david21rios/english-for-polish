// src/components/test/MultipleChoiceSection.jsx

import { FaCheckCircle, FaExclamationTriangle, FaListUl } from "react-icons/fa";

const MultipleChoiceSection = ({
  questions = [],
  answers = {},
  setAnswers
}) => {
  const handleAnswer = (questionId, selectedAnswer) => {
    setAnswers((prev) => ({
      ...prev,
      multipleChoice: {
        ...prev.multipleChoice,
        [questionId]: selectedAnswer
      }
    }));
  };

  if (!Array.isArray(questions) || questions.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-5 rounded-2xl flex items-center gap-3">
        <FaExclamationTriangle />
        Brak pytań wielokrotnego wyboru dla tej sekcji.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {questions.map((question, index) => {
        const questionId = question.id || `multiple_choice_${index}`;
        const options = Array.isArray(question.options)
          ? question.options
          : [];

        return (
          <article
            key={questionId}
            className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8"
          >
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-primary-100 text-primary-600 flex items-center justify-center text-xl shrink-0">
                <FaListUl />
              </div>

              <div className="min-w-0">
                <p className="text-sm font-semibold text-primary-600 uppercase tracking-wide">
                  Pytanie {index + 1}
                </p>

                <h3 className="text-xl md:text-2xl font-bold text-gray-900 mt-1 leading-snug break-words">
                  {question.question || "Brak treści pytania."}
                </h3>
              </div>
            </div>

            {options.length === 0 ? (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl flex items-center gap-3">
                <FaExclamationTriangle />
                To pytanie nie ma skonfigurowanych odpowiedzi.
              </div>
            ) : (
              <div className="space-y-3">
                {options.map((option, optionIndex) => {
                  const isSelected =
                    answers?.multipleChoice?.[questionId] === option;

                  const optionLetter = String.fromCharCode(65 + optionIndex);

                  return (
                    <button
                      key={`${questionId}_${optionIndex}`}
                      type="button"
                      onClick={() => handleAnswer(questionId, option)}
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
          </article>
        );
      })}
    </div>
  );
};

export default MultipleChoiceSection;