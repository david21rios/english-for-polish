// src/components/test/TestSectionRenderer.jsx

import PropTypes from "prop-types";

import ReadingSection from "./ReadingSection";
import TestQuestion from "./TestQuestion";

const SUPPORTED_SECTIONS = new Set([
  "multipleChoice",
  "writing",
  "reading"
]);

const getSectionQuestions = ({
  selectedQuestions,
  currentLevel,
  currentSection
}) => {
  const questions =
    selectedQuestions?.[currentLevel]?.[currentSection];

  return Array.isArray(questions)
    ? questions.filter(Boolean)
    : [];
};

const getSectionAnswers = ({
  answers,
  currentLevel,
  currentSection
}) => {
  const sectionAnswers =
    answers?.[currentLevel]?.[currentSection];

  return sectionAnswers &&
    typeof sectionAnswers === "object" &&
    !Array.isArray(sectionAnswers)
    ? sectionAnswers
    : {};
};

const TestSectionRenderer = ({
  currentLevel,
  currentSection,
  selectedQuestions = {},
  answers = {},
  handleAnswerSelect
}) => {
  if (!SUPPORTED_SECTIONS.has(currentSection)) {
    return (
      <div
        role="alert"
        className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
      >
        Nieobsługiwana sekcja testu.
      </div>
    );
  }

  const currentQuestions = getSectionQuestions({
    selectedQuestions,
    currentLevel,
    currentSection
  });

  const currentAnswers = getSectionAnswers({
    answers,
    currentLevel,
    currentSection
  });

  if (currentQuestions.length === 0) {
    return (
      <div
        role="alert"
        className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800"
      >
        Nie znaleziono pytań dla tej sekcji.
      </div>
    );
  }

  if (currentSection === "reading") {
    return (
      <ReadingSection
        questions={currentQuestions}
        selectedAnswers={currentAnswers}
        onSelectAnswer={handleAnswerSelect}
      />
    );
  }

  return (
    <div className="space-y-6">
      {currentQuestions.map((question, index) => {
        const questionId =
          question?.id || `${currentSection}_${index}`;

        return (
          <TestQuestion
            key={questionId}
            questionData={{
              ...question,
              id: questionId
            }}
            index={index}
            type={currentSection}
            selectedAnswer={currentAnswers[questionId] ?? ""}
            onSelectAnswer={handleAnswerSelect}
          />
        );
      })}
    </div>
  );
};

TestSectionRenderer.propTypes = {
  currentLevel: PropTypes.oneOf([
    "A1",
    "A2",
    "B1",
    "B2",
    "C1",
    "C2"
  ]).isRequired,

  currentSection: PropTypes.oneOf([
    "multipleChoice",
    "writing",
    "reading"
  ]).isRequired,

  selectedQuestions: PropTypes.object,
  answers: PropTypes.object,
  handleAnswerSelect: PropTypes.func.isRequired
};

export default TestSectionRenderer;