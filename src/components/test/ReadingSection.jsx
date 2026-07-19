// src/components/test/ReadingSection.jsx

import PropTypes from "prop-types";

import {
  FaBookOpen,
  FaCheckCircle,
  FaExclamationTriangle,
  FaQuestionCircle
} from "react-icons/fa";

const toArray = (value) => {
  if (Array.isArray(value)) {
    return value.filter(
      (item) =>
        item !== null &&
        item !== undefined
    );
  }

  if (
    value !== null &&
    value !== undefined
  ) {
    return [value];
  }

  return [];
};

const normalizeReadingQuestion = (
  question = {},
  textIndex = 0,
  questionIndex = 0
) => ({
  ...question,

  id:
    question.id ||
    `reading_${textIndex}_question_${questionIndex}`,

  question:
    question.question ||
    question.pytanie ||
    "",

  instructions:
    question.instructions ||
    question.instrukcje ||
    "",

  options: toArray(
    question.options ||
    question.answers ||
    question.odpowiedzi
  ).map((option) => String(option)),

  correctAnswer:
    question.correctAnswer ??
    question.correct_answer ??
    question.answer ??
    question.poprawnaOdpowiedz ??
    ""
});

const normalizeReading = (
  reading = {},
  textIndex = 0
) => ({
  ...reading,

  id:
    reading.id ||
    `reading_${textIndex}`,

  title:
    reading.title ||
    reading.tytul ||
    "",

  author:
    reading.author ||
    reading.autor ||
    "",

  instructions:
    reading.instructions ||
    reading.instrukcje ||
    "",

  text:
    reading.text ||
    reading.content ||
    reading.tekst ||
    "",

  questions: toArray(
    reading.questions ||
    reading.pytania
  ).map(
    (question, questionIndex) =>
      normalizeReadingQuestion(
        question,
        textIndex,
        questionIndex
      )
  )
});

const ReadingOptionButton = ({
  questionId,
  option,
  optionIndex,
  isSelected,
  onSelect
}) => {
  const optionLetter =
    String.fromCharCode(
      65 + optionIndex
    );

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={isSelected}
      aria-label={`Odpowiedź ${optionLetter}: ${option}`}
      data-question-id={questionId}
      className={`flex w-full items-start gap-4 rounded-2xl border px-5 py-4 text-left transition-all focus:outline-none focus:ring-2 focus:ring-primary-300 ${
        isSelected
          ? "border-primary-600 bg-primary-600 text-white shadow-md"
          : "border-gray-100 bg-gray-50 text-gray-800 hover:border-primary-200 hover:bg-primary-50"
      }`}
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-bold ${
          isSelected
            ? "bg-white text-primary-600"
            : "border border-gray-200 bg-white text-gray-600"
        }`}
      >
        {optionLetter}
      </span>

      <span className="min-w-0 break-words leading-relaxed">
        {option ||
          "Odpowiedź jest niedostępna."}
      </span>

      {isSelected && (
        <FaCheckCircle className="ml-auto mt-1 shrink-0" />
      )}
    </button>
  );
};

ReadingOptionButton.propTypes = {
  questionId: PropTypes.string.isRequired,
  option: PropTypes.string.isRequired,
  optionIndex: PropTypes.number.isRequired,
  isSelected: PropTypes.bool.isRequired,
  onSelect: PropTypes.func.isRequired
};

const ReadingQuestion = ({
  question,
  textIndex,
  questionIndex,
  selectedAnswer,
  onSelectAnswer
}) => {
  const options =
    Array.isArray(question.options)
      ? question.options
      : [];

  return (
    <section
      className="rounded-2xl border border-gray-100 bg-white p-5"
      aria-labelledby={`reading-question-${question.id}`}
    >
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
          <FaQuestionCircle />
        </div>

        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary-600">
            Pytanie {textIndex + 1}.
            {questionIndex + 1}
          </p>

          <h4
            id={`reading-question-${question.id}`}
            className="mt-1 break-words font-bold leading-relaxed text-gray-900"
          >
            {question.question ||
              "Pytanie jest niedostępne."}
          </h4>

          {question.instructions && (
            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              {question.instructions}
            </p>
          )}
        </div>
      </div>

      {options.length === 0 ? (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <FaExclamationTriangle className="mt-1 shrink-0" />

          <span>
            To pytanie nie ma dostępnych odpowiedzi.
          </span>
        </div>
      ) : (
        <div className="space-y-3">
          {options.map(
            (option, optionIndex) => (
              <ReadingOptionButton
                key={`${question.id}_${optionIndex}`}
                questionId={
                  question.id
                }
                option={option}
                optionIndex={
                  optionIndex
                }
                isSelected={
                  selectedAnswer ===
                  option
                }
                onSelect={() =>
                  onSelectAnswer(
                    question.id,
                    option
                  )
                }
              />
            )
          )}
        </div>
      )}
    </section>
  );
};

ReadingQuestion.propTypes = {
  question: PropTypes.shape({
    id: PropTypes.string.isRequired,
    question: PropTypes.string,
    instructions: PropTypes.string,
    options: PropTypes.arrayOf(
      PropTypes.string
    )
  }).isRequired,

  textIndex: PropTypes.number.isRequired,
  questionIndex: PropTypes.number.isRequired,

  selectedAnswer:
    PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number
    ]),

  onSelectAnswer:
    PropTypes.func.isRequired
};

const ReadingSection = ({
  questions = [],
  selectedAnswers = {},
  onSelectAnswer
}) => {
  const readings = toArray(
    questions
  ).map(normalizeReading);

  const safeSelectedAnswers =
    selectedAnswers &&
    typeof selectedAnswers ===
      "object" &&
    !Array.isArray(
      selectedAnswers
    )
      ? selectedAnswers
      : {};

  if (readings.length === 0) {
    return (
      <div
        role="alert"
        className="flex items-center gap-3 rounded-2xl border border-yellow-200 bg-yellow-50 p-5 text-yellow-800"
      >
        <FaExclamationTriangle />

        <span>
          Brak tekstów do czytania dla tej sekcji.
        </span>
      </div>
    );
  }

  return (
    <section
      className="space-y-8"
      aria-labelledby="reading-section-title"
    >
      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
        <h2
          id="reading-section-title"
          className="text-xl font-bold text-blue-900"
        >
          Ocena czytania
        </h2>

        <p className="mt-2 text-sm leading-relaxed text-blue-800 md:text-base">
          Przeczytaj każdy tekst uważnie, a następnie wybierz jedną poprawną
          odpowiedź do każdego pytania. Odpowiedzi powinny wynikać wyłącznie z
          treści tekstu.
        </p>
      </div>

      {readings.map(
        (
          readingText,
          textIndex
        ) => {
          const readingQuestions =
            Array.isArray(
              readingText.questions
            )
              ? readingText.questions
              : [];

          return (
            <article
              key={readingText.id}
              className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm md:p-8"
              aria-labelledby={`reading-title-${readingText.id}`}
            >
              <header className="mb-6 flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-100 text-xl text-primary-600">
                  <FaBookOpen />
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-semibold uppercase tracking-wide text-primary-600">
                    Tekst {textIndex + 1}
                  </p>

                  <h3
                    id={`reading-title-${readingText.id}`}
                    className="mt-1 break-words text-2xl font-bold text-gray-900"
                  >
                    {readingText.title ||
                      "Przeczytaj uważnie"}
                  </h3>

                  {readingText.author && (
                    <p className="mt-2 text-sm text-gray-500">
                      Autor:{" "}
                      <span className="font-medium">
                        {readingText.author}
                      </span>
                    </p>
                  )}

                  {readingText.instructions && (
                    <p className="mt-3 leading-relaxed text-gray-600">
                      {
                        readingText.instructions
                      }
                    </p>
                  )}
                </div>
              </header>

              <div className="mb-8 rounded-2xl border border-gray-100 bg-gray-50 p-5 md:p-7">
                {readingText.text ? (
                  <div className="whitespace-pre-line text-base leading-8 text-gray-800 md:text-lg">
                    {readingText.text}
                  </div>
                ) : (
                  <div
                    role="alert"
                    className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700"
                  >
                    <FaExclamationTriangle />

                    Tekst do czytania jest niedostępny.
                  </div>
                )}
              </div>

              <div className="mb-5 flex flex-col gap-2 border-b border-gray-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h4 className="font-bold text-gray-900">
                    Pytania do tekstu
                  </h4>

                  <p className="mt-1 text-sm text-gray-500">
                    Wybierz jedną odpowiedź do każdego pytania.
                  </p>
                </div>

                <span className="inline-flex w-fit rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
                  {readingQuestions.length}{" "}
                  {readingQuestions.length ===
                  1
                    ? "pytanie"
                    : "pytań"}
                </span>
              </div>

              {readingQuestions.length ===
              0 ? (
                <div
                  role="alert"
                  className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700"
                >
                  <FaExclamationTriangle />

                  Ten tekst nie zawiera pytań.
                </div>
              ) : (
                <div className="space-y-6">
                  {readingQuestions.map(
                    (
                      question,
                      questionIndex
                    ) => (
                      <ReadingQuestion
                        key={
                          question.id
                        }
                        question={
                          question
                        }
                        textIndex={
                          textIndex
                        }
                        questionIndex={
                          questionIndex
                        }
                        selectedAnswer={
                          safeSelectedAnswers[
                            question.id
                          ]
                        }
                        onSelectAnswer={
                          onSelectAnswer
                        }
                      />
                    )
                  )}
                </div>
              )}
            </article>
          );
        }
      )}
    </section>
  );
};

ReadingSection.propTypes = {
  questions: PropTypes.arrayOf(
    PropTypes.object
  ),

  selectedAnswers:
    PropTypes.object,

  onSelectAnswer:
    PropTypes.func.isRequired
};

export default ReadingSection;