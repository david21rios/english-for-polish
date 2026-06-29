// src/components/test/TestSectionRenderer.jsx

import React from "react";

import ReadingSection from "./ReadingSection";
import TestQuestion from "./TestQuestion";

const TestSectionRenderer = ({
  currentLevel,
  currentSection,
  selectedQuestions,
  answers,
  handleAnswerSelect
}) => {
  const currentQuestions =
    selectedQuestions[currentLevel]?.[currentSection] || [];

  if (!currentQuestions.length) {
    return (
      <div className="text-red-600">
        No questions were found for this section.
      </div>
    );
  }

  if (currentSection === "reading") {
    return (
      <ReadingSection
        questions={currentQuestions}
        selectedAnswers={answers[currentLevel]?.reading || {}}
        onSelectAnswer={handleAnswerSelect}
      />
    );
  }

  return (
    <>
      {currentQuestions.map((question, index) => (
        <TestQuestion
          key={question.id}
          questionData={question}
          index={index}
          type={currentSection}
          selectedAnswer={
            answers[currentLevel]?.[currentSection]?.[question.id]
          }
          onSelectAnswer={handleAnswerSelect}
        />
      ))}
    </>
  );
};

export default TestSectionRenderer;