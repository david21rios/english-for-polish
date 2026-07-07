// src/components/test/TestSectionRenderer.jsx

import ReadingSection from "./ReadingSection";
import TestQuestion from "./TestQuestion";

const TestSectionRenderer = ({
  currentLevel,
  currentSection,
  selectedQuestions = {},
  answers = {},
  handleAnswerSelect
}) => {
  const currentQuestions =
    selectedQuestions?.[currentLevel]?.[currentSection] || [];

  if (!currentQuestions.length) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700 text-sm">
        Nie znaleziono pytań dla tej sekcji.
      </div>
    );
  }

  if (currentSection === "reading") {
    return (
      <ReadingSection
        questions={currentQuestions}
        selectedAnswers={answers?.[currentLevel]?.reading || {}}
        onSelectAnswer={handleAnswerSelect}
      />
    );
  }

  return (
    <>
      {currentQuestions.map((question, index) => (
        <TestQuestion
          key={question.id || `${currentSection}_${index}`}
          questionData={question}
          index={index}
          type={currentSection}
          selectedAnswer={
            answers?.[currentLevel]?.[currentSection]?.[question.id]
          }
          onSelectAnswer={handleAnswerSelect}
        />
      ))}
    </>
  );
};

export default TestSectionRenderer;